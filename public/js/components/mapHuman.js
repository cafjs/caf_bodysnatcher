"use strict";

var partToId = exports.partToId = {
        head: 38,
        neck: 9,
        shoulderRight: 12,
        shoulderLeft: 11,
        handLeft: 29,
        forearmLeft: 37,
        elbowLeft: 36,
        lowerArmLeft: 35,
        upperArmLeft: 34,
        torsoRight: 0,
        torsoLeft: 1,
        hipRight: 2,
        hipLeft: 3,
        upperLegRight: 18,
        upperLegLeft: 19,
        kneeRight: 20,
        kneeLeft: 21,
        lowerLegRight: 22,
        lowerLegLeft: 23,
        footRight: 26,
        footLeft: 27,
        upperArmRight: 30,
        lowerArmRight: 31,
        elbowRight: 32,
        forearmRight: 33,
        handRight: 28
};


var idToPart = {};

Object.keys(partToId).forEach(function(x) {
    idToPart[partToId[x]] = x;
});

exports.idToPart = idToPart;
