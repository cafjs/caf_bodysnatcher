#!/usr/bin/env node
var parseArgs = require('minimist');
var PNG = require('pngjs').PNG;
var fs = require('fs');

var cv = require('./opencv');
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


var fec = require('./fec')({});
var fecPromise = (function() {
    return new Promise((resolve, reject) => {
        fec.then(() => {
            resolve('Done');
        });
    });
})();

var NUM_SYMBOLS = 20;
var NUM_DATA = 8;

var N_COLUMNS = 8;
var N_ROWS = 5;

var WIDTH = 2700;
var HEIGHT = 1800;

var WIDTH_PROJECT = 1280;
var HEIGHT_PROJECT = 720;

var SQUARE_PIXELS = 134;
var TOP_PIXELS = SQUARE_PIXELS  + 25;
var LEFT_PIXELS = SQUARE_PIXELS  + 104;

var mkBoard = async function(outFile, project, dataList) {
    var width = WIDTH;
    var height = HEIGHT;
    var margin = 150;
    if (project) {
        width = WIDTH_PROJECT;
        height = HEIGHT_PROJECT;
        margin = 25;
    };

    await cvPromise;
    await fecPromise;


    var cleanup = fec.cwrap('cleanup', null, []);
    var encode = fec.cwrap('encode', 'number', ['number', 'number']);
    var decode = fec.cwrap('decode', 'number', ['number', 'number', 'number',
                                                'number']);

    var data = fec._malloc(NUM_SYMBOLS);
    var erasure = fec._malloc(NUM_SYMBOLS);
    var dataArray = fec.HEAPU8.subarray(data, data + NUM_SYMBOLS);
    var erasureArray = fec.HEAPU8.subarray(erasure, erasure + NUM_SYMBOLS);

    for (let i = 0; i< NUM_DATA; i++) {
        dataArray[i] = (dataList ? dataList[i] : Math.floor(Math.random()*32));
    }
    erasureArray.set([], 0);

    encode(data, NUM_SYMBOLS);

    var id = decode(data, NUM_SYMBOLS, erasure, 0);

    console.log('ID: ' + id);

    var str = dataArray.toString().replace(/,/g, "-");
    console.log(str);

    var dict = new cv.Dictionary(cv.DICT_4X4_50);
    var p = new cv.CharucoBoard(N_COLUMNS, N_ROWS, 0.04, 0.02, dict);
    var iv = new cv.IntVector();

    for (let i=0; i< p.ids.size(); i++) {
        iv.push_back(dataArray[i]);
    }

    var old = p.ids;
    p.ids = iv;
    old.delete();

    var dest = new cv.Mat();
    //    p.draw(new cv.Size(width, height), dest, 150, 1);
    p.draw(new cv.Size(width, height), dest, margin, 1);
    var destColor = new cv.Mat();
    cv.cvtColor(dest, destColor, cv.COLOR_GRAY2RGBA);


    if (project) {
        var strArray = str.split('-');
        for (let i = 0; i<strArray.length; i++) {
             cv.putText(destColor, strArray[i], {x: 25, y: 75 + 30*i},
                        cv.FONT_HERSHEY_PLAIN,
                        2.0, new cv.Scalar(0, 0, 255, 255), 2);
        }
        var idArray  = '' + id;
        for (let i = 0; i<idArray.length; i++) {
            cv.putText(destColor, idArray[i], {x: width - 50, y: 200 + 30*i},
                       cv.FONT_HERSHEY_PLAIN,
                       2.0, new cv.Scalar(0, 0, 255, 255), 2);
        }
        var result = '[';
        var x = LEFT_PIXELS;
        for (let i = 0; i< N_COLUMNS-1; i++) {
            var y = TOP_PIXELS;
            for (let j = 0; j< N_ROWS-1; j++) {
                result = result + '(' + x + ', ' + y + '), '; // inefficient...
                y = y + SQUARE_PIXELS;
            }
            result = result + '\n';
            x = x +  SQUARE_PIXELS;
        }
        console.log(result + ']');
    } else {
        cv.putText(destColor, str, {x: 150, y: height - 80},
                   cv.FONT_HERSHEY_PLAIN,
                   3.0, new cv.Scalar(0, 0, 255, 255), 2);

        cv.putText(destColor, '' + id, {x: width-550, y: height - 80},
                   cv.FONT_HERSHEY_PLAIN,
                   3.0, new cv.Scalar(0, 0, 255, 255), 2);
    }
    var buffer = PNG.sync.write({data: destColor.data, width: width,
                                 height: height, colorType: 6});
    fs.writeFileSync(outFile, buffer);

    fec._free(data);
    fec._free(erasure);
    cleanup();
};


var condInsert = function(target, key, value) {
    if ((target[key] === undefined) ||
        //minimist sets undefined boolean flags to 'false'
        // do not set both a qualified and unqualified value on boolean...
        (target[key] === false)) {
        target[key] = value;
    }
};


var usage = function(x) {
     if (x.indexOf('--') !== 0) {
         return true;
     } else {
         console.log('Invalid ' + x);
         console.log('Usage:  mkBoard.js [--project <bool>] <outputFile>');
         process.exit(1);
         return false;
     }
};


var args = process.argv.slice(2);

var argv = parseArgs(args, {
    string : ['outputFile'],
    boolean: ['project'],
    unknown: usage
});

var options = argv._ || [];
var outF = options.shift();
condInsert(argv, 'outputFile', outF);
if (!argv.outputFile) {
    usage('outputFile');
} else {
    mkBoard(argv.outputFile, argv.project);
}
