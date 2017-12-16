"use strict";

var nj = require('numjs');

var cv = require('../opencv');

var FRAME_RATIO = 120;
var VIDEO_WIDTH = 1280;
var VIDEO_HEIGHT = 720;
var F_X = 0.9 * 1280;
var F_Y = F_X;
var C_X = VIDEO_WIDTH/2;
var C_Y = VIDEO_HEIGHT/2;

var FAR_PLANE= 1000;
var NEAR_PLANE= 0.01;


var openGLProjMat = function() {
    return nj.array([
        [2* F_X / VIDEO_WIDTH, 0, 2 * (C_X/VIDEO_WIDTH) - 1, 0],
        [0, 2 * F_Y / VIDEO_HEIGHT, 2*(C_Y/VIDEO_HEIGHT) - 1, 0],
        [0, 0, -(FAR_PLANE + NEAR_PLANE) / (FAR_PLANE - NEAR_PLANE),
         -2 * FAR_PLANE * NEAR_PLANE / (FAR_PLANE - NEAR_PLANE)],
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

exports.init = function(ctx, data, cb) {
    var newState = {ctx: ctx, counter: 0, frameRatio: FRAME_RATIO};
    var video = document.getElementById("videoInput");
    newState.video = video;
    var canvas = document.getElementById('canvasTemp');
    newState.canvas = canvas;
    newState.canvasCtx = canvas.getContext('2d');
    newState.width = canvas.width;
    newState.height = canvas.height;
    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia ||
        navigator.oGetUserMedia;

    var videoError = function(e) {
        cb(new Error('Cannot load video ' + e));
    };

    if (navigator.getUserMedia) {
        navigator.getUserMedia({video: {facingMode: "environment",
                                        width: VIDEO_WIDTH, height: VIDEO_HEIGHT
                                       }},
                               function(stream) {
                                   video.srcObject = stream;

                                   cb(null, newState);
                               }, videoError);
    } else {
        cb(new Error('getUserMedia not supported'));
    }
};

exports.update = function(myState, gState) {
    return myState;
};

exports.process = function(myState, gState) {
    var t1 = (new Date()).getTime();
    var counter = (myState.counter + 1) % myState.frameRatio;
    myState.canvasCtx.drawImage(myState.video, 0, 0, myState.width,
                                myState.height);
    // TODO: this is expensive, need to turn it off/on with UI
    if ((counter === 0) && gState.calibration &&
        Array.isArray(gState.calibration.points2D)) {
        var points2D = gState.calibration.points2D;
        var src = new cv.Mat(myState.height, myState.width, cv.CV_8UC4);
        var dst = new cv.Mat(myState.height, myState.width, cv.CV_8UC1);
        src.data.set(myState.canvasCtx.getImageData(0, 0, myState.width,
                                                    myState.height).data);
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        var nPoints = points2D[1] * points2D[0];
        var points = new cv.Mat(nPoints, 1, cv.CV_32FC2);

        var sizeChess = {width: points2D[1], height: points2D[0]};

        var patternFound =
                cv.findChessboardCorners(dst, sizeChess, points);

        if (patternFound) {
            cv.cornerSubPix(dst, points, {height: 11, width: 11},
                            {height: -1, width: -1}, {
                                type: cv.TERM_CRITERIA_EPS +
                                    cv.TERM_CRITERIA_MAX_ITER,
                                maxCount: 30,
                                epsilon: 0.001
                            });
            cv.drawChessboardCorners(dst, sizeChess, points, true);
            var cameraMatrix = cv.matFromArray(3, 3, cv.CV_64F,
                                               [F_X, 0, C_X,
                                                0, F_Y, C_Y,
                                                0, 0, 1]);

            var pointsArray = points.data32F;
            // Check scan direction
            pointsArray = orderCorners(pointsArray, points2D);
            var p2DMat = cv.matFromArray(nPoints, 1, cv.CV_32FC2, pointsArray);
            var p3D = Array.prototype.concat.apply([],
                                                   gState.calibration.points3D);
            var p3DMat = cv.matFromArray(nPoints, 1, cv.CV_32FC3, p3D);

            // Find mapping
            var rVec = new cv.Mat(3, 1, cv.CV_64F);
            var tVec = new cv.Mat(3, 1, cv.CV_64F);
            var inliers = new cv.Mat(nPoints, 1, cv.CV_32S);
            var empty = cv.Mat.zeros(4, 1, cv.CV_64F);
            var found = cv.solvePnPRansac(p3DMat, p2DMat, cameraMatrix,
                                          empty, rVec, tVec, false, 1000, 2.0,
                                          0.99, inliers, cv.SOLVEPNP_ITERATIVE);
            console.log(found);
            console.log(points);
            console.log(p2DMat.data32F);
            console.log('rotation: ' + rVec.data64F);
            console.log('translation: ' + tVec.data64F);
            console.log('inliers: ' + JSON.stringify(inliers.size()));
            console.log(nj.array(rVec.data64F, 'float64').tolist());

            var result = {
                rotation: nj.array(rVec.data64F, 'float64').tolist(),
                translation: nj.array(tVec.data64F, 'float64').tolist(),
                projectionMatrix: openGLProjMat(),
                viewMatrix:  openGLViewMat(rVec, tVec)
            };

            console.log(JSON.stringify(result));
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

        cv.imshow("canvasOutput", dst);
        src.delete();
        dst.delete();
        points.delete();
    }
    var t2 = (new Date()).getTime();
//    console.log(t2-t1);
    return Object.assign({}, myState, {counter: counter});
};
