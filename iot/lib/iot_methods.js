// Modifications copyright 2020 Caf.js Labs and contributors
/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';
var caf_iot = require('caf_iot');
var myUtils = caf_iot.caf_components.myUtils;
var json_rpc = caf_iot.caf_transport.json_rpc;
var iot_methods_ble = require('./iot_methods_ble');

var startPartsStream = function(self) {
    if (self.state.streamON && (self.state.streamID === null)) {
        var partsURL = self.$.props.baseURL + '/parts';
        var partsOptions = self.$.props.partsOptions;
        self.state.streamID = self.$.http.startStream(partsURL, partsOptions,
                                                      '__iot_handleParts__');
        self.$.log && self.$.log.debug('Starting stream ' +
                                       self.state.streamID);
    }
};

var stopPartsStream = function(self) {
    if (self.state.streamID !== null) {
        self.$.log && self.$.log.debug('Stopping stream ' +
                                       self.state.streamID);
        self.$.http.stopStream(self.state.streamID);
        self.state.streamID = null;
    }
};

var isManagerBLE = function(self) {
    // Ignore owner
    var name = json_rpc.splitName(self.__ca_getName__())[1];
    return (name === self.$.props.managerBLE);
};

var methods = exports.methods = {
    '__iot_setup__': function(cb) {
        if (isManagerBLE(this)) {
            iot_methods_ble.setup(this, cb);
        } else {
            // projector
            this.state.streamID = null;
            this.state.lastParts = null;
            cb(null);
        }
    },

    '__iot_loop__': function(cb) {
        var now = (new Date()).getTime();
        this.$.log && this.$.log.debug(now + ' loop:' + this.state.index);
        this.$.log && this.$.log.debug('Time offset ' +
                                       (this.$.cloud.cli && this.$.cloud.cli
                                        .getEstimatedTimeOffset()));
        if (isManagerBLE(this)) {
            iot_methods_ble.loop(this, cb);
        } else {
            this.state.streamON = this.fromCloud.get('streamON');
            if (this.state.streamON) {
                startPartsStream(this);
            } else {
                stopPartsStream(this);
            }
            var parts = this.toCloud.get('parts');
            if (myUtils.deepEqual(parts, this.state.lastParts)) {
                this.toCloud.set('parts', {});
                this.state.lastParts = {};
            } else {
                this.state.lastParts = parts;
            }
            cb(null);
        }
    },

    calibrate: function(nonce, cb) {
        var self = this;
        var calURL = this.$.props.baseURL + '/calibrate';
        var calOptions = this.$.props.calibrationOptions;
        stopPartsStream(this);
        setTimeout(function() {
            self.$.http.dirtyCall(calURL, calOptions, function(err, value) {
                if (err) {
                    cb(err);
                } else {
                    value.nonce = nonce;
                    self.$.log && self.$.log.debug(value);
                    delete value.rotation; // redundant
                    delete value.translation;
                    /*`value` type is {projMat:Array<number>,
                            viewMat:Array<number>,
                            points3D: Array<[number, number,number] }
                     */
                    self.toCloud.set('calibration', value);
                    startPartsStream(self);
                    cb(null);
                }
            });
        }, 1000); // time to reset the parts service after stop

    },

    snapshot: function(cb) {
        var self = this;
        var snapURL = this.$.props.baseURL + '/snapshot';
        var snapOptions = this.$.props.snapshotOptions;
        stopPartsStream(this);
        setTimeout(function() {
            self.$.http.dirtyCall(snapURL, snapOptions, function(err, value) {
                if (err) {
                    cb(err);
                } else {
                    /*`value` type is {width: number, height:number,
                                     data: string }
                     */
                    value.timestamp = (new Date()).getTime();
                    self.toCloud.set('snapshot', value);
                    startPartsStream(self);
                    cb(null);
                }
            });
        }, 1000); // time to reset the parts service after stop
    },

    '__iot_handleParts__': function(parts, cb) {
        // Assumes cloudSync is enabled, and `toCloud` changes are propagated
        //  right away, and without blocking the main loop.

        parts = parts[0]; // no need 2-D projection
        // from assoc-list to map
        var dict = {};
        parts.forEach(function(x) {
            dict[x[0]] = x[1];
        });
        // `dict` type is Object(string, [x:number, y:number, z:number])
        this.toCloud.set('parts', dict);
        cb(null);
    }

};

myUtils.mixin(methods, iot_methods_ble.methods);
