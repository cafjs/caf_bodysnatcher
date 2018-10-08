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

var partToPos = exports.partToPos = {
    head: [0, 1.75],
    neck: [0, 1.63],
    shoulderRight: [-0.25, 1.57],
    shoulderLeft: [0.25, 1.57],
    handLeft: [0.9, 1.57],
    forearmLeft: [0.74, 1.57],
    elbowLeft: [0.62, 1.57],
    lowerArmLeft: [0.51, 1.57],
    upperArmLeft: [0.4, 1.57],
    torsoRight: [-0.084, 1.37],
    torsoLeft: [0.084, 1.37],
    hipRight: [-0.084, 1.10],
    hipLeft: [0.084, 1.1],
    upperLegRight: [-0.12, 0.84],
    upperLegLeft: [0.12, 0.84],
    kneeRight: [-0.12, 0.56],
    kneeLeft: [0.12, 0.56],
    lowerLegRight: [-0.15, 0.31],
    lowerLegLeft: [0.15, 0.31],
    footRight: [-0.15, 0.06],
    footLeft: [0.15, 0.06],
    upperArmRight: [-0.4, 1.57],
    lowerArmRight: [-0.51, 1.57],
    elbowRight: [-0.62, 1.57],
    forearmRight: [-0.74, 1.57],
    handRight: [-0.9, 1.57]
};

var idToPart = {};

Object.keys(partToId).forEach(function(x) {
    idToPart[partToId[x]] = x;
});

exports.idToPart = idToPart;
