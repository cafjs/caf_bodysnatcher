"use strict";

var THREE = require('three');

var COLORS= {
    yellow: new THREE.Color( 0xffff00),
    red: new THREE.Color(0xff0000),
    green: new THREE.Color(0x00ff00),
    blue: new THREE.Color(0x0000ff)
};

exports.init = function(ctx, data, cb) {
    cb(null, {ctx: ctx});
};

exports.update = function(myState, gState) {
    return myState;
};

exports.process = function(myState, gState) {
    return myState;
};
