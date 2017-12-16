"use strict";

exports.init = function(ctx, data, cb) {
    cb(null, {ctx: ctx});
};

exports.update = function(myState, gState) {
    return myState;
};

exports.process = function(myState, gState) {
    return myState;
};
