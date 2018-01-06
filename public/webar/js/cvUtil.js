"use strict";

var nj = require('numjs');
var cv = require('../opencv');

var UPDATE_EVERY = 30;

var FAR_PLANE= 1000;
var NEAR_PLANE= 0.01;
var MAX_SNAP = 10;
var THRESHOLD_ERROR = 10;

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

var norm2 = function(x) {
    var res = x.multiply(x).dot(nj.ones([x.shape[1],1]));
    return res.reshape(res.size); // flat, one row
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

var meanCoordMap  = function(all) {

    var result = nj.zeros(16, 'float32');
    all.forEach(function(x) {
        var p = nj.array(x, 'float32');
        result = result.add(x);
    });
    return result.divide(all.length).tolist();
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


exports.update = function(arState, gState) {

    return arState;
};




var extractCameraFrame = function(arState) {
/*
 * At this point there is no standard way to get hold of the camera frame
* in webXR.
*
*   This is a hack that relies on digging on the webxr polyfill from
* Mozilla.
*
* It does not work on ARKit, because it uses a Metal layer for the
* frame.
*/
    var extractWebGL = function(gl) {
        //webgl buffer is RGB, bottom to top, left to right
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
        var flipDst = new cv.Mat(result.height, result.width, cv.CV_8UC1);
        cv.flip(dst, flipDst, 0);
        src.delete();
        dst.delete();
        result.img = flipDst;
        return result;
    };

    var extractWebRTC = function(video) {
        // canvas is RGBA, top to bottom, left to right
        var result = {width: video.clientWidth,
                      height: video.clientHeight};
        var canv = document.createElement('canvas');
        canv.width = video.clientWidth;
        canv.height = video.clientHeight;
        var ctx = canv.getContext('2d');
        ctx.drawImage(video, 0, 0);
        var src = new cv.Mat(result.height, result.width, cv.CV_8UC4);
        var dst = new cv.Mat(result.height, result.width, cv.CV_8UC1);
        src.data.set(ctx.getImageData(0, 0, result.width,
                                      result.height).data);
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        src.delete();
        console.log('dst: size ' + JSON.stringify(result));
        console.log(dst.matSize);
        result.img = dst;
        return result;

    };

    // TBD: not in webXR standard...
    var reality = arState.arSession.reality;
    if (reality._elContext) {
        //Using ARCore
        return extractWebGL(reality._elContext);
    } else if (reality._videoEl) {
        // Using WebRTC
        return extractWebRTC(reality._videoEl);
    } else {
        console.log('Not supported reality (like ARKit)');
        return null;
    }
};


var sanityCheck = function(arState, p3D, actualP2D, sizeChess, frame) {
    var coordMap = nj.array(arState.coordMapping, 'float32').reshape(4, 4)
            .transpose();
    var view = nj.array(arState.viewMatrix, 'float32').reshape(4, 4)
            .transpose();
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

//    var points = cv.matFromArray(sizeChess.width*sizeChess.height, 1,
//                                 cv.CV_32FC2,
//                                 Array.prototype.concat.apply([], backProj));
//    cv.drawChessboardCorners(frame.img, sizeChess, points, true);

//    points.delete();
    return avgError;
};

exports.process = function(arState, gState, frame) {

    var counter = arState.counter;
    var coordMapping = arState.coordMapping;

    arState.nSnapshots = (arState.nSnapshots||0);

    // Refresh browser to trigger calibration
    if ((counter % UPDATE_EVERY === 0) && (arState.nSnapshots < MAX_SNAP) &&
        (coordMapping === null) &&
        gState.calibration && Array.isArray(gState.calibration.points2D)) {
        var t1 = (new Date()).getTime();
        var fr = extractCameraFrame(arState);
        if (fr !== null) {
            var dst = fr.img;
            var width = fr.width;
            var height = fr.height;
            console.log('Height: ' + height + ' Width: ' + width);
            var size2D = gState.calibration.points2D;

            var nPoints = size2D[1] * size2D[0];
            var points = new cv.Mat(nPoints, 1, cv.CV_32FC2);

            var sizeChess = {width: size2D[1], height: size2D[0]};

            var patternFound = cv.findChessboardCorners(dst, sizeChess, points);

            if (patternFound) {
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
                                              empty, rVec, tVec, false, 1000,
                                              3.0, 0.99, inliers,
                                              cv.SOLVEPNP_ITERATIVE);
                console.log(found);
                console.log(points);
                console.log(p2DMat.data32F);
                console.log('rotation: ' + rVec.data64F);
                console.log('translation: ' + tVec.data64F);
                console.log('inliers: ' + JSON.stringify(inliers.size()));

                var viewMatrix = openGLViewMat(rVec, tVec);

                var newCoordMapping = computeCoordMap(arState.poseModelMatrix,
                                                       viewMatrix);
                console.log(newCoordMapping);
                arState.coordMapping = newCoordMapping;

                var averageError = sanityCheck(arState, p3D, pointsArray,
                                               sizeChess, fr);
                if (averageError < THRESHOLD_ERROR) {
                    arState.nSnapshots = arState.nSnapshots + 1;
                    arState.tempCoord.push(newCoordMapping);
                    if (arState.nSnapshots === MAX_SNAP) {
                        arState.coordMapping = meanCoordMap(arState.tempCoord);
                        console.log(JSON.stringify(arState.tempCoord));
                        console.log(JSON.stringify(arState.coordMapping));
                    }
                } else {
                    console.log('Ignoring bad frame.');
                }
                if (arState.nSnapshots !== MAX_SNAP) {
                    arState.coordMapping = null;
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

//            cv.imshow("canvasOutput", dst);
            dst.delete();
            points.delete();
        }
        var t2 = (new Date()).getTime();
        console.log(t2-t1);
    }
};
