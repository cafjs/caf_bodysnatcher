"use strict";

var nj = require('numjs');
var arucoUtil = require('./arucoUtil');

var UPDATE_EVERY = 30;

var FAR_PLANE= 1000;
var NEAR_PLANE= 0.01;
var MAX_SNAP = 10;
var THRESHOLD_ERROR = 2.5;
var SCALE_FACTOR = 4;
var MINIMUM_GL_SIZE = 200;

var cv = require('../opencv');
var cvPromise = (function() {
    return new Promise((resolve, reject) => {
        cv.onRuntimeInitialized = () => {
            console.log('Init cv OK');
            resolve('Done');
        };
        cv.onAbort = (err) => {
            reject(err);
        };
    });
})();


var gl2cvProjMat = function(projMat, width, height) {

    console.log(projMat);

    var fX = projMat[0] * width / 2;
    var fY = Math.abs(projMat[5]*height / 2);
    var cX = (projMat[8] + 1) * width / 2;
    /* TBD: Not clear to me whether Y-axis up in webgl implies:
     *    var cY = (1 - projMat[9]) * height / 2;
     */
    var cY = (projMat[9] + 1) * height / 2;

    console.log('fX:' + fX + ' fY:' + fY + ' cX:' + cX + ' cY:' + cY);
    return cv.matFromArray(3, 3, cv.CV_64F,
                           [fX, 0, cX,
                            0, fY, cY,
                            0,  0,  1]);
};

var openGLProjMat = function(width, height, fX, fY, cX, cY, near, far) {
    return nj.array([
        [2* fX / width, 0, 2 * (cX/width) - 1, 0],
        [0, 2 * fY / height, 2*(cY/height) - 1, 0],
        [0, 0, -(far + near) / (far - near), -2 * far * near / (far - near)],
        [0, 0, -1, 0]
    ], 'float64')
        .transpose() // fortran order, i.e., column major
        .reshape(16)
        .tolist();
};

var openGLViewMat = function(rot, trans) {
    var rotMat = new cv.Mat(3, 3, cv.CV_64F);
    cv.Rodrigues(rot, rotMat);
    var r = nj.array(rotMat.data64F, 'float64').reshape(3, 3);
    var t = nj.array(trans.data64F, 'float64').reshape(3, 1);
    var flipAxis = nj.array([1, 0, 0,
                             0, -1, 0,
                             0, 0, -1], 'float64').reshape(3,3);
    r = nj.dot(flipAxis, r);
    t = nj.dot(flipAxis, t);
    var res = nj.concatenate(r, t);
    res = nj.concatenate(res.T, nj.array([0, 0, 0, 1],
                                         'float64').reshape(4,1)).T;
    rotMat.delete();
    return res
        .transpose() // fortran order, i.e., column major
        .reshape(16)
        .tolist();
};

var computeCoordMap = function(poseMat, viewMat) {

    /*
     * Assuming a similar projection matrix it should hold that:
     *         inverse(poseMat) * (X,Y,Z,1) = viewMat * (X',Y',Z',1)
     *     and therefore:
     *           (X,Y,Z,1) = (poseMat *viewMat)*(X',Y',Z',1) = A * (X',Y',Z',1)
     * and the matrix 'A' maps the model matrix of externally detected objects
     * to our global coordinate system.
     */
    var p = nj.array(poseMat, 'float32').reshape(4, 4).transpose();
    var q = nj.array(viewMat, 'float32').reshape(4, 4).transpose();
    return nj.dot(p, q)
        .transpose() // fortran order, i.e., column major
        .reshape(16)
        .tolist();
};

var norm2 = function(x) {
    var res = x.multiply(x).dot(nj.ones([x.shape[1],1]));
    return res.reshape(res.size); // flat, one row
};

var meanCoordMap  = function(all) {

    var result = nj.zeros(16, 'float32');
    all.forEach(function(x) {
        var p = nj.array(x, 'float32');
        result = result.add(x);
    });
    return result.divide(all.length).tolist();
};

var stDev = function(all) {
    return nj.array(all, 'float32')
        .transpose()
        .tolist()
        .map(x => nj.array(x, 'float32').std())
        .map(x => (x === 0 ? 0.00000001 : x));
};

var medianCoordMap = function(all) {
    var allArray =  nj.array(all, 'float32');
    return allArray
        .transpose()
        .tolist()
        .map(x => x.sort())
        .map(x => x[Math.floor(x.length/2)]);
};

var closestToMedian = function(all) {
    var median = medianCoordMap(all);
    var std = stDev(all);
    var allOne = nj.zeros(all.length, 'float32').add(1).reshape(all.length, 1);
    var medianRow = nj.array(median, 'float32').reshape(1, median.length);
    var stdRow = nj.array(std, 'float32').reshape(1, std.length);
    var allArray = nj.array(all, 'float32');
    allArray = allArray.subtract(allOne.dot(medianRow));
    allArray = allArray.divide(allOne.dot(stdRow)); //convert to z-score
    var normError = norm2(allArray);
    var minVal = nj.min(normError);
    var minIndex = normError.tolist().findIndex(x => (x === minVal));
    return all[minIndex];
};

/*
*  Input: scanning bottom to  top, using the skinny side.
*
* Returns scanned top to bottom, left-to right using the wide side.
*  and serialized as a C array (row-major)
*/
var shortToLongScan = function(corners, size2D) {
    var height =  size2D[0];
    var width =  size2D[1];
    var p = nj.array(corners, 'float32');
    p = p.reshape(width, height, 2);
    return new Float32Array(nj.flip(p, 1)
                            .transpose(1,0,2)
                            .reshape(size2D[0]*size2D[1]*2)
                            .tolist());
};

/*
 * corners is float32Array, e.g., [x0, y0, x1,y1,..]
 * size2D is [chessHeight, chessWidth]
 *
 * It returns a float32Array with the coordinates always in long scan order.
 *
*/
var orderCorners = function(corners, size2D) {
    var height =  size2D[0];
    var width =  size2D[1];
    var p = nj.array(corners, 'float32');
    p = p.reshape(p.size/2, 2);
    var distance = norm2(p.slice(1).subtract(p.slice([-1])));
    var shortScan = distance.slice(height-1).slice([null,null, height]).sum();
    shortScan = shortScan/(width-1);
    var longScan = distance.slice(width-1).slice([null,null, width]).sum();
    longScan = longScan/(height-1);
    if (shortScan > longScan) {
        console.log('Changing scan order');
        // need to change scan order
        return shortToLongScan(corners, size2D);
    } else {
        return corners;
    }

};

var extractCameraFrame = function(localState) {
    var threeState = localState.three;
    var gl = threeState.gl;
    var arState = localState.ar;
    var session = arState.session;

    gl.bindFramebuffer(gl.FRAMEBUFFER, session.baseLayer.framebuffer);


    if (gl.drawingBufferWidth < MINIMUM_GL_SIZE) {
        // not initialized yet
        return null;
    }

    var result = {width: gl.drawingBufferWidth,
                  height: gl.drawingBufferHeight};
    var src = new cv.Mat(result.height, result.width, cv.CV_8UC4);
    gl.pixelStorei(gl.PACK_ALIGNMENT, (src.step[0] & 3) ? 1 : 4);
    if (src.step[0]/src.elemSize() !== result.width) {
        throw new Error('Row padding not supported on webgl context');
    }
    gl.readPixels(0, 0, result.width, result.height,
                  gl.RGBA, gl.UNSIGNED_BYTE, src.data);
    var dst = new cv.Mat(result.height, result.width, cv.CV_8UC1);
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    src.delete();

    var flipDst = new cv.Mat(result.height, result.width, cv.CV_8UC1);
    cv.flip(dst, flipDst, 0);
    dst.delete();
    result.img = flipDst;
    console.log('dst: size ' + JSON.stringify(result));
    console.log(flipDst.matSize);
    var scaledHeight = Math.floor(result.height/SCALE_FACTOR);
    var scaledWidth = Math.floor(result.width/SCALE_FACTOR);
    if ((scaledHeight <  MINIMUM_GL_SIZE) || (scaledHeight < MINIMUM_GL_SIZE)) {
        scaledHeight = result.height;
        scaledWidth = result.width;
    }
    var scaledDst = new cv.Mat(scaledHeight, scaledWidth, cv.CV_8UC1);
    cv.resize(flipDst, scaledDst, {height: scaledHeight, width: scaledWidth});
    result.scaledImg = scaledDst;
    return result;
};


var sanityCheck = function(coordMapping, localState, p3D, actualP2D, sizeChess,
                           frame) {
    var arState = localState.ar;
    var coordMap = nj.array(coordMapping, 'float32').reshape(4, 4)
            .transpose();
    var view = nj.array(arState.viewMatrix, 'float32').reshape(4, 4)
            .transpose();
    console.log('view: ' + JSON.stringify(view.tolist()));
    var proj = nj.array(arState.projectionMatrix, 'float32').reshape(4, 4)
            .transpose();
    var all =  nj.dot(proj, nj.dot(view, coordMap));

    var transformOne = function(p) {
        var pH = nj.array(p.concat([1]), 'float32').reshape(4, 1);
        var newPH = nj.dot(all, pH);
        var persp = newPH.divide(newPH.get(0,2));
        var x = persp.get(0, 0);
        var y = persp.get(0, 1);
        x = x * frame.width/2 + frame.width/2;
        y = frame.height - (y * frame.height/2 + frame.height/2);
        return [x, y];
    };

    var newP3D = nj.array(p3D, 'float32');
    newP3D = newP3D.reshape(newP3D.size/3, 3);

    var backProj = newP3D.tolist().map(transformOne);
//    console.log(JSON.stringify(backProj));
    var orig = nj.array(actualP2D, 'float32');
    orig = orig.reshape(orig.size/2, 2);
    //    console.log(JSON.stringify(orig.tolist()));
    var errDistance = orig.subtract(nj.array(backProj, 'float32'));
    var avgError = nj.sum(norm2(errDistance).sqrt())/errDistance.shape[0];

    console.log('Average reprojection error in pixels: ' + avgError);
//    console.log(JSON.stringify(orig.subtract(nj.array(backProj, 'float32'))
//                               .tolist()));

    var points = cv.matFromArray(sizeChess.width*sizeChess.height, 1,
                                 cv.CV_32FC2,
                                 Array.prototype.concat.apply([], backProj));
    cv.drawChessboardCorners(frame.img, sizeChess, points, true);
    points.delete();

    return avgError;
};


var toggleVideo = exports.toggleVideo = function(isOn, id) {
    var canvas = document.getElementById('canvasOutput');
    var identifier = document.getElementById('identifier');
    if (canvas) {
        canvas.style = (isOn ? 'display:none' : 'display:block');
    }
    if (isOn) {
        if (id) {
            identifier.innerHTML = id;
            identifier.style = 'display:block;z-index:1;';
        }
    } else {
        identifier.style = 'display:none';
    }
};

var distance = function(x0, y0, x1, y1) {
    var x = x0 - x1;
    var y = y0 - y1;
    return Math.sqrt(x*x + y*y);
};

exports.init = async function(ctx, localState, data) {
    var cvState = {
        nSnapshots: 0,
        tempCoord: [],
        coordMapping: null
    };
    toggleVideo(true);
    await cvPromise;
    localState.cv = cvState;
    await arucoUtil.init(ctx, localState, data);
    console.log('cvUtil init done');
    return cvState;
};

exports.update = function(localState, gState) {
    return localState;
};

exports.process = function(localState, gState, frame) {

    var cvState = localState.cv;
    var arState = localState.ar;
    var counter = arState.counter;
    var coordMapping = cvState.coordMapping;

    cvState.nSnapshots = cvState.nSnapshots || 0;

    // Refresh browser to trigger calibration
    if ((counter % UPDATE_EVERY === 0) && (cvState.nSnapshots < MAX_SNAP) &&
        (coordMapping === null) &&
        gState.calibration && Array.isArray(gState.calibration.points2D)) {
        var t1 = (new Date()).getTime();
        var fr = extractCameraFrame(localState);
        if (fr !== null) {
            var dst = fr.img;
            var scaledDst = fr.scaledImg;
            var width = fr.width;
            var height = fr.height;
            console.log('Height: ' + height + ' Width: ' + width);
            var size2D = gState.calibration.points2D;

            var nPoints = size2D[1] * size2D[0];
            var points = new cv.Mat(nPoints, 1, cv.CV_32FC2);

            var sizeChess = {width: size2D[1], height: size2D[0]};

            var patternFound = cv.findChessboardCorners(scaledDst, sizeChess,
                                                        points);
            if (patternFound) {
                toggleVideo(false);
                for (let i = 0; i < points.data32F.length; i++) {
                    points.data32F[i] = SCALE_FACTOR * points.data32F[i];
                }
                cv.cornerSubPix(dst, points, {height: 11, width: 11},
                                {height: -1, width: -1}, {
                                    type: cv.TermCriteria_EPS +
                                        cv.TermCriteria_MAX_ITER,
                                    maxCount: 30,
                                    epsilon: 0.001
                                });
                //cv.drawChessboardCorners(dst, sizeChess, points, true);
                var cameraMatrix = gl2cvProjMat(arState.projectionMatrix, width,
                                                height);

                var pointsArray = points.data32F;
                // Check scan direction
                pointsArray = orderCorners(pointsArray, size2D);
                var p2DMat = cv.matFromArray(nPoints, 1, cv.CV_32FC2,
                                             pointsArray);
                var p3D = Array.prototype.concat.apply([], gState.calibration
                                                       .points3D);
                var p3DMat = cv.matFromArray(nPoints, 1, cv.CV_32FC3, p3D);

                // Find mapping
                var rVec = new cv.Mat(3, 1, cv.CV_64F);
                var tVec = new cv.Mat(3, 1, cv.CV_64F);
                var inliers = new cv.Mat(nPoints, 1, cv.CV_32S);
                var empty = cv.Mat.zeros(4, 1, cv.CV_64F);
                var found = cv.solvePnPRansac(p3DMat, p2DMat, cameraMatrix,
                                              empty, rVec, tVec, false, 200,
                                              2.0, 0.99, inliers,
                                              cv.SOLVEPNP_EPNP);
                console.log(found);
//                console.log(JSON.stringify(p3DMat.data32F));
//                console.log(JSON.stringify(p2DMat.data32F));
                console.log(JSON.stringify(cameraMatrix.data64F));
                console.log('rotation: ' + JSON.stringify(rVec.data64F));
                console.log('translation: ' + JSON.stringify(tVec.data64F));
                console.log('inliers: ' + JSON.stringify(inliers.size()));

                var viewMatrix = openGLViewMat(rVec, tVec);

                var newCoordMapping = computeCoordMap(arState.poseModelMatrix,
                                                       viewMatrix);
                console.log(newCoordMapping);

                var averageError = sanityCheck(newCoordMapping, localState, p3D,
                                               pointsArray, sizeChess, fr);
                var diag = distance(pointsArray[0], pointsArray[1],
                                    pointsArray[2*nPoints-2],
                                    pointsArray[2*nPoints-1]);
                var relError = 100.0*averageError/diag;
                console.log('Diag: ' + diag + ' relError: ' + relError);

                if (relError < THRESHOLD_ERROR) {
                    cvState.nSnapshots = cvState.nSnapshots + 1;
                    if (cvState.nSnapshots === 1) {
                        toggleVideo(false);
                    }
                    if (!cvState.id) {
                        cvState.id = arucoUtil.findId(cv, dst, pointsArray,
                                                      gState.calibration
                                                      .dimAruco);
                    }
                    cvState.tempCoord.push(newCoordMapping);
                    if (cvState.nSnapshots === MAX_SNAP) {
                      //cvState.coordMapping = meanCoordMap(cvState.tempCoord);
                        cvState.coordMapping = closestToMedian(cvState
                                                               .tempCoord);
                        toggleVideo(true, cvState.id);
                        console.log(JSON.stringify(cvState.tempCoord));
                        console.log(JSON.stringify(cvState.coordMapping));
                    }
                } else {
                    console.log('Ignoring bad frame.');
                }
/*
                var result = {
                rotation: nj.array(rVec.data64F, 'float64').tolist(),
                translation: nj.array(tVec.data64F, 'float64').tolist(),
                projectionMatrix: openGLProjMat(),
                viewMatrix:  openGLViewMat(rVec, tVec)
            };

                console.log(JSON.stringify(result));
*/
                p3DMat.delete();
                p2DMat.delete();
                rVec.delete();
                tVec.delete();
                inliers.delete();
                empty.delete();
                cameraMatrix.delete();
            } else {
                console.log('.');
            }

            cv.imshow('canvasOutput', dst); //delete
            dst.delete();
            scaledDst.delete();
            points.delete();
        }
        var t2 = (new Date()).getTime();
        console.log(t2-t1);
    }
};
