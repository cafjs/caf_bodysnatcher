"use strict";

const DELETE = exports.DELETE = 'delete';

const DEVICES = exports.DEVICES = {
    delete: {
        color: 'black',
        type: null,
        fontColor: 'white'
    },
    red: {
        color: 'red',
        type: 'temp',
        unit: 'C',
        fontColor: 'white'
    },
    white: {
        color: 'white',
        type: 'light',
        unit: '%',
        fontColor: 'black'
    },
    yellow: {
        color: 'yellow',
        type: 'count',
        unit: '',
        fontColor: 'black'
    },
    green: {
        color: 'green',
        type: 'battery',
        unit: '%',
        fontColor: 'white'
    }
};
