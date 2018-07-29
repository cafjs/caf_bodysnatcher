"use strict";
var assert = require('assert');
var nj = require('numjs');

var fec = require('../fec')({});
var fecPromise = (function() {
    return new Promise((resolve, reject) => {
        fec.then(() => {
            resolve('Done');
        });
    });
})();


var N_COLUMNS = 4;
var N_ROWS = 5;
var NUM_SYMBOLS = N_COLUMNS * N_ROWS;// 20;
var NUM_DATA = 8;

var N_GRID_COLUMNS = 7;
var N_GRID_ROWS = 4;

/* Aruco corners start top left (0) and go clockwise (0..3).
 *
 * The desired ordering of arucos is by rows left-right and then top-down. As
 *  usual, the largest checkerboard size (8 vs 5) is assumed 'horizontal'. Note
 * that, confusingly, the larger checkerboard size for our config also has
 * fewer arucos (4) vs 5 for the vertical...
 *
 * The row/col values correspond to a significant grid point that we use
 * for comparisons. The internal grid is 4x7, i.e., the 28 points that we used
 * to estimate the pose.
 *
 * The 'corner'  field chooses which corner of each aruco we use for the
 * proximity test.
 *
 * The following table was created by visual inspection...
 */
var RECIPE_ORDERING = [
    { corner: 3, row: 0, col: 0}, // 0
    { corner: 3, row: 0, col: 2}, // 1
    { corner: 3, row: 0, col: 4}, // 2
    { corner: 3, row: 0, col: 6}, // 3

    { corner: 2, row: 1, col: 0}, // 4
    { corner: 2, row: 1, col: 2}, // 5
    { corner: 2, row: 1, col: 4}, // 6
    { corner: 2, row: 1, col: 6}, // 7

    { corner: 3, row: 2, col: 0}, // 8
    { corner: 3, row: 2, col: 2}, // 9
    { corner: 3, row: 2, col: 4}, // 10
    { corner: 3, row: 2, col: 6}, // 11

    { corner: 2, row: 3, col: 0}, // 12
    { corner: 2, row: 3, col: 2}, // 13
    { corner: 2, row: 3, col: 4}, // 14
    { corner: 2, row: 3, col: 6}, // 15

    { corner: 0, row: 3, col: 0}, // 16
    { corner: 0, row: 3, col: 2}, // 17
    { corner: 0, row: 3, col: 4}, // 18
    { corner: 0, row: 3, col: 6}  // 19
];


var computeId = function(inData, inErasure) {
    var decode = fec.cwrap('decode', 'number', ['number', 'number', 'number',
                                                'number']);
    var data = fec._malloc(NUM_SYMBOLS);
    var dataArray = fec.HEAPU8.subarray(data, data + NUM_SYMBOLS);
    dataArray.set(inData, 0);

    var erasure = fec._malloc(NUM_SYMBOLS);
    var erasureArray = fec.HEAPU8.subarray(erasure, erasure + NUM_SYMBOLS);
    erasureArray.set(inErasure, 0);

    var id = decode(data, NUM_SYMBOLS, erasure, inErasure.length);
    console.log(id);
    console.log(dataArray.toString());

    fec._free(data);
    fec._free(erasure);

    return (id === -1 ? null : id);
};

var fillSequence = function(arucos, gridPoints) {
    var distance = function(p1, p2) {
        var x = p1[0] - p2[0];
        var y = p1[1] - p2[1];
        return x*x + y*y;
    };

    var findClosest = function(corner, point) {
        var aruco = null;
        var minVal  = 1000000000;
        arucos.forEach(function(x) {
            var c = [x.corners.get(corner, 0), x.corners.get(corner, 1)];
            var d = distance(c, point);
            if (d < minVal) {
                aruco = x;
                minVal = d;
            }
        });
        return {distance: minVal, aruco: aruco};
    };

    var findOrdering = function() {
        return RECIPE_ORDERING.map(function(x, i) {
            var index = x.row * N_GRID_COLUMNS + x.col;
            var point = [gridPoints.get(index, 0), gridPoints.get(index, 1)];
            return findClosest(x.corner, point);
        });
    };

    var filterDuplicates = function(values) {
        var hash = {}; // index-> {distance: number, position: number}
        values.forEach(function(x, i) { // x is {distance: number, aruco: Obj}
            var prev = hash[x.aruco.index];
            if (!prev || (prev.distance > x.distance)) {
                hash[x.aruco.index] = {distance: x.distance, position: i};
            }
        });

        return values.map(function(x, i) {
            var prev = hash[x.aruco.index];
            return ((prev.position !== i) ? {id: null} : x.aruco);
        });
    };

    return filterDuplicates(findOrdering());
};

exports.init = async function(ctx, localState, data) {

    await fecPromise;
    return localState;
};

exports.findId = function(cv, dst, gridPoints, dimAruco) {
    if (dimAruco) {
        assert((dimAruco[0] === N_ROWS) && (dimAruco[1] === N_COLUMNS),
               "Non-supported aruco dimensions " + JSON.stringify(dimAruco));
    }
    var dict = new cv.Dictionary(cv.DICT_4X4_50);
    var corners = new cv.MatVector();
    var ids = new cv.Mat();
    cv.detectMarkers(dst, dict, corners, ids);
    console.log('#arucos detected = ' + corners.size());
    var allArucos =  [];
    for (let i = 0; i< corners.size(); i++) {
        console.log('Aruco ' + i + ' with id ' + ids.data32S[i]);
        var aruco = corners.get(i);
        console.log(' corners: ' + JSON.stringify(aruco.data32F));
        var c = nj.array(aruco.data32F, 'float32');
        c = c.reshape(c.size/2, 2);
        allArucos.push({id: ids.data32S[i], index: i, corners: c});
    }
    corners.delete();
    ids.delete();

    if (allArucos.length === 0) {
        return null;
    } else {
        var p = nj.array(gridPoints, 'float32');
        p = p.reshape(p.size/2, 2);
        var seq = fillSequence(allArucos, p);
        var erasure = [];
        var data = seq.map(function(x, i) {
            if (x.id === null) {
                erasure.push(i);
                return 0;
            } else {
                return x.id;
            }
        });
        return computeId(data, erasure);
    }
};
