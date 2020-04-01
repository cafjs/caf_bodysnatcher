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
var bleUtil = require('./iot_ble_util');

var MAX_RETRIES = 2;
var TIME_BETWEEN_RETRIES = 150;


exports.setup = function(self, cb) {
    self.scratch.devices = {};
    // {counter: number, isDelete: boolean}
    self.scratch.processing = {};
    cb(null);
};

exports.loop = function(self, cb) {
    var deviceInfo = bleUtil.toDeviceInfo(self);
    var activeDeviceInfo = bleUtil.filterActive(deviceInfo);
    self.toCloud.set('deviceInfo', deviceInfo);
    // type of markers is {name:{location:{}, color: string, spinning: boolean}}
    var markers = self.fromCloud.get('markers') || {};
    var diff = bleUtil.diffDevices(activeDeviceInfo, markers,
                                   self.scratch.processing,
                                   self.scratch.devices);
    bleUtil.decrementProcessing(self.scratch.processing);
    bleUtil.evalDiff(self, diff, function(err) {
        if (err) {
            cb(err);
        } else {
            if ((Object.keys(markers).length > 0) ||
                (Object.keys(self.scratch.processing).length > 0))  {
                self.findServices(cb);
            } else {
                self.$.log && self.$.log.trace('Skipping findServices()');
                cb(null);
            }
        }
    });
};


exports.methods = {
    findServices: function(cb) {
        var now = (new Date()).getTime();
        this.$.log && this.$.log.debug(now + ': findServices()');
        this.$.gatt.findServices(this.$.props.gattServiceID,
                                 '__iot_foundService__');
        cb(null);
    },

    __iot_foundService__: function(serviceId, device, cb) {
        if (serviceId === this.$.props.gattServiceID) {
            var deviceName = (device.advertisement &&
                              device.advertisement.localName) || device.uuid;
            this.scratch.devices[deviceName] = device;
        } else {
            this.$.log && this.$.log.debug('Ignoring device with serviceID: ' +
                                           serviceId + ' as opposed to ' +
                                           this.$.props.gattServiceID);
        }
        cb(null);
    },

    sayHi: function(deviceName, cb) {
        this.changeDeviceState(deviceName, 'hi', cb);
    },

    /* `cmd` type is string or boolean, where string is for a custom command,
     * and boolean is just to turn on/off the device.
     */
    changeDeviceState: function(deviceName, cmd, cb) {
        var self = this;
        myUtils.retryWithDelay(function(cb0) {
            self.$.log && self.$.log.debug('Change device ' + deviceName +
                                           ' to ' + cmd);
            var device = self.scratch.devices[deviceName];

            if (device) {
                var handleChF = function(err, data) {
                    if (err) {
                        cb0(err);
                    } else {
                        var device = data.device;
                        var chArray = data.characteristics;
                        self.__iot_changeDeviceState__(device, chArray, cmd,
                                                       cb0);
                    }
                };
                self.$.gatt.findCharacteristics(self.$.props.gattServiceID,
                                                device, handleChF);
            } else {
                self.$.log && self.$.log.debug('changeDeviceState: Ignoring ' +
                                               ' unknown device ' + deviceName);
                cb0(null);
            }
        }, MAX_RETRIES, TIME_BETWEEN_RETRIES, cb);
    },

    __iot_changeDeviceState__: function(device, chArray, cmd, cb) {
        var compare = function(x, y) {
            if (x.length < y.length) {
                return compare(y, x);
            } else {
                return ((x === y) ||
                        (x === '0000' + y + '00001000800000805f9b34fb'));
            }
        };

        var self = this;
        chArray = chArray || [];
        this.$.log && this.$.log.trace('Found characteristics ' + chArray);
        var charact = null;
        chArray.forEach(function(x) {
            if (compare(x.uuid, self.$.props.gattCharactID)) {
                charact = x;
            } else {
                self.$.log && self.$.log.trace('Ignoring characteristic ' +
                                               x.uuid);
            }
        });

        if (charact && ((typeof cmd === 'boolean') ||
                        (typeof cmd === 'string'))) {
            var buf = new Buffer(typeof cmd === 'string' ? cmd :
                                 (cmd ? 'on' : 'off'));
            if (typeof cmd === 'string') {
                this.$.log && this.$.log.debug('Sending command ' + cmd);
            } else {
                this.$.log && this.$.log.debug('New state is ' +
                                               (cmd ? 'on' : 'off'));
            }
            this.$.gatt.write(charact, buf);
        } else {
            this.$.log && this.$.log.debug('Ignore charact for device ' +
                                           device.uuid);
        }
        this.$.gatt.disconnect(device, 100, cb);
    }
};
