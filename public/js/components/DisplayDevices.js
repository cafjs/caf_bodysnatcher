"use strict";

var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;

var Human = require('./Human.js');
var mapHuman = require('./mapHuman.js');

var DisplayDevices = {

    render: function() {
        var devices = this.props.devices || {};
        var allProps = {};
        Object.keys(devices).forEach(function(x) {
            // {location: locationType, color: string, spinning: boolean}
            // locationType is {part: int, offset: [x:int, y: int, z: int]}
            var device = devices[x];
            var partId = device.location.part;
            if (mapHuman.idToPart[partId]) {
                allProps[mapHuman.idToPart[partId] + 'Visible'] =
                    {visibility: 'visible'};
                allProps[mapHuman.idToPart[partId] + 'Fill'] = device.color;
            }
        });
        return  cE(Human, allProps);
    }
};

module.exports = React.createClass(DisplayDevices);
