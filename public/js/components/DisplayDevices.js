"use strict";

var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');

var Human = require('./Human.js');
var mapHuman = require('./mapHuman.js');

var DisplayDevices = {

    onClick: function(e) {
        var self = this;

        var findDeviceName = function(id) {
            var result = null;
            var devices = self.props.devices || {};
            Object.keys(devices).forEach(function(x) {
                var device = devices[x];
                var partId = device.location.part;
                if (partId === id) {
                    result = x;
                }
            });
            return result;
        };

        var partId = mapHuman.partToId[e.currentTarget.id];
        var deviceSelected = findDeviceName(partId);
        if (deviceSelected) {
            if (deviceSelected === this.props.deviceSelected) {
                AppActions.setLocalState(this.props.ctx,
                                         {deviceSelected: null});
            } else {
                AppActions.setLocalState(this.props.ctx, {
                    deviceSelected: deviceSelected,
                    overlayTarget: e.currentTarget
                });
            }
        }
    },

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
        allProps.onClick = this.onClick;
        var deviceInfoSelected = this.props.deviceInfo &&
                this.props.deviceSelected &&
                this.props.deviceInfo[this.props.deviceSelected];

        var activateOverlay = this.props.deviceSelected && this.props.devices &&
                this.props.devices[this.props.deviceSelected];
        return  cE('div', {className: 'container-fluid'},
                   cE(rB.Overlay, {
                       show: !!activateOverlay,
                       target: this.props.overlayTarget,
                       placement: 'top',
                       container: this,
                       containerPadding: 20
                   },
                      cE(rB.Popover, {title: 'Device: ' +
                                      this.props.deviceSelected,
                                      id: 'popover-device'},
                         JSON.stringify(deviceInfoSelected &&
                                        deviceInfoSelected.advertisement)
                        )
                     ),
                   cE(Human, allProps)
                  );
    }
};

module.exports = React.createClass(DisplayDevices);
