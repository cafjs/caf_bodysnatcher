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

/*
 *  Helper methods to manage bluetooth devices.
 *
 */

var caf_iot = require('caf_iot');
var myUtils = caf_iot.caf_components.myUtils;
var async = caf_iot.caf_components.async;

/** Timeout to show up advertisement after activation (in loop invocations) */
var PROCESSING_TICKS = 15;

/*
 * Cleanup advertised data to be uploaded to Cloud.
*/
exports.toDeviceInfo = function(self) {
    var all = self.scratch.devices || {};
    var result = {};
    Object.keys(all).forEach(function(x) {
        var ad = myUtils.deepClone(all[x].advertisement);
        if (ad && (typeof ad === 'object')) {
            delete ad.serviceSolicitationUuids;
            delete ad.solicitationServiceUuids;
            delete ad.serviceUuids;
        }
        result[x] = {uuid: all[x].uuid, advertisement: ad};
    });
    return result;
};

/*
 * Select devices that are advertising data.
*/
exports.filterActive = function(deviceInfo) {
    var result = {};
    Object.keys(deviceInfo).forEach(function(x) {
        var value = deviceInfo[x].advertisement;
        if (value && value.serviceData && (value.serviceData.length >=1) &&
            value.serviceData[0].data) {
            result[x] = deviceInfo[x];
        }
    });
    return result;
};

/*
 * Available devices that should be active but are not (ADD), or are active but
 * we are not interested on its advertisements (DELETE).
 */
exports.diffDevices = function(active, markers, processing, devices) {
    var result = {add: [], delete: []};
    // added
    Object.keys(markers).forEach(function(x) {
        if (!active[x] && (!processing[x] || processing[x].isDelete) &&
            devices[x]) { // do not add devices we don't see yet
            result.add.push(x);
            processing[x] = {counter: PROCESSING_TICKS, isDelete: false};
        }
    });

    // deleted after activation
    Object.keys(active).forEach(function(x) {
        if (!markers[x] && !(processing[x] && processing[x].isDelete) &&
            devices[x]) {
            result.delete.push(x);
            processing[x] = {counter: PROCESSING_TICKS, isDelete: true};
        }
    });

    // deleted before activation
    Object.keys(processing).forEach(function(x) {
        if (!markers[x] && !processing[x].isDelete && devices[x]) {
            result.delete.push(x);
            processing[x] = {counter: PROCESSING_TICKS, isDelete: true};
        }
    });

    return result;
};

/*
 * Pending actions eventually timeout, so that they can be repeated.
 */
exports.decrementProcessing = function(processing) {
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

/*
 * Reconciliate state.
*/
exports.evalDiff = function(self, diff, cb) {
    async.series([
        function(cb0) {
            async.eachSeries(diff.add, function(x, cb1) {
                self.changeDeviceState(x, true, cb1);
            }, cb0);
        },
        function(cb0) {
            async.eachSeries(diff.delete, function(x, cb1) {
                self.changeDeviceState(x, false, cb1);
            }, cb0);
        }
    ], cb);
};
