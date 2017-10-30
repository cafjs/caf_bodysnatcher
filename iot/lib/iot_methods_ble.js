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

"use strict";

var myUtils = require('caf_iot').caf_components.myUtils;

/** Timeout to show up advertisement after activation (in loop invocations) */
var PROCESSING_TICKS = 20;

/*
 *  Helper methods to manage bluetooth devices.
 *
*/
exports.setup = function(self, cb) {
    self.scratch.devices = {};
    // {counter: number, isDelete: boolean}
    self.scratch.processing = {};
    cb(null);
};

var toDeviceInfo = function(self) {
    var all =  self.scratch.devices || {};
    var result = {};
    Object.keys(all).forEach(function(x) {
        var ad = myUtils.deepClone(all[x].advertisement);
        delete ad.serviceSolicitationUuids;
        delete ad.solicitationServiceUuids;
        delete ad.serviceUuids;
        result[x] = {uuid: all[x].uuid, advertisement: ad};
    });
    return result;
};

var filterActive = function(deviceInfo) {
    var result = {};
    Object.keys(deviceInfo).forEach(function(x) {
        var value = deviceInfo[x].advertisement;
        if (value && value.serviceData && (value.serviceData.length >=1) &&
            value.serviceData[0].data) {
            result[x] = deviceInfo[x];
        };
    });
    return result;
};

var diffDevices = function(active, markers, processing) {
    var result = {add: [], delete: []};
    // added
    Object.keys(markers).forEach(function(x) {
        if (!active[x] && (!processing[x]  || processing[x].isDelete)) {
            result.add.push(x);
            processing[x] = {counter: PROCESSING_TICKS, isDelete: false};
        }
    });

    // deleted after activation
    Object.keys(active).forEach(function(x) {
        if (!markers[x] && !(processing[x] && processing[x].isDelete)) {
            result.delete.push(x);
            processing[x] = {counter: PROCESSING_TICKS, isDelete: true};
        }
    });

    // deleted before activation
    Object.keys(processing).forEach(function(x) {
        if (!markers[x] && !processing[x].isDelete) {
            result.delete.push(x);
            processing[x] = {counter: PROCESSING_TICKS, isDelete: true};
        }
    });

    return result;
};

var decrementProcessing = function(processing) {
    Object.keys(processing).forEach(function(x) {
        var count = processing[x].counter;
        count = count - 1;
        if (count <= 0) {
            delete processing[x];
        } else {
            processing[x] = {counter: count, isDelete: processing[x].isDelete};
        }
    });
};

var evalDiff = function(self, diff) {
    diff.add.forEach(function(x) {
        self.changeDeviceState(x, true);
    });
    diff.delete.forEach(function(x) {
        self.changeDeviceState(x, false);
    });
};

exports.loop = function(self, cb) {

    var deviceInfo = toDeviceInfo(self);
    var activeDeviceInfo = filterActive(deviceInfo);
    self.toCloud.set('deviceInfo', deviceInfo);
    // type of markers is {name:{location:{}, color: string, spinning: boolean}}
    var markers = self.fromCloud.get('markers') || {};
    var diff = diffDevices(activeDeviceInfo, markers, self.scratch.processing);
    decrementProcessing(self.scratch.processing);
    evalDiff(self, diff);
    if ((Object.keys(markers).length > 0) ||
        (Object.keys(self.scratch.processing).length > 0)) {
        self.findServices(cb);
    } else {
        cb(null);
    }
};


exports.methods = {
    findServices: function(cb) {
        var now = (new Date()).getTime();
        this.$.log && this.$.log.trace(now + ': findService()');
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

    changeDeviceState: function(deviceName, isStart, cb) {
        this.$.log && this.$.log.debug('Change device ' + deviceName + ' to '
                                       + isStart);
        var device = this.scratch.devices[deviceName];
        if (device) {
            device.pending = {isStart: isStart};
            this.$.gatt.findCharacteristics(this.$.props.gattServiceID,
                                            device, '__iot_foundCharact__');
        } else {
            this.$.log && this.$.log.debug('changeDeviceState: Ignoring ' +
                                           ' unknown device ' + deviceName);
        }
        cb && cb(null); // allow sync calls
    },

    __iot_foundCharact__: function(_service, device, chArray, cb) {
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
        if (charact && device.pending) {
            this.__iot_changeState__(device, charact, device.pending.isStart,
                                     cb);
        } else {
            this.$.log && this.$.log.debug('Ignore charact for device ' +
                                           device.uuid);
            cb(null);
        }
    },

    __iot_changeState__: function(device, charact, isStart, cb) {
        var buf = new Buffer(isStart ? 'on' : 'off');
        this.$.log && this.$.log.debug('New state is ' +
                                       (isStart ? 'on' : 'off'));
        this.$.gatt.write(charact, buf);
        this.$.gatt.disconnect(device, 300);
        delete device.pending;
        cb(null);
    }

};
