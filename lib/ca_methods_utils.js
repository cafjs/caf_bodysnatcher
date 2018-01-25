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

var caf = require('caf_core');
var caf_comp = caf.caf_components;
var myUtils = caf_comp.myUtils;

var json_rpc = caf.caf_transport.json_rpc;

var APP_SESSION = exports.APP_SESSION = 'default';
var VR_SESSION = exports.VR_SESSION = 'vr';
var AR_SESSION = exports.AR_SESSION = 'ar';
var IOT_SESSION = exports.IOT_SESSION = 'iot';

var TO_ADMIN = exports.TO_ADMIN = 'toAdmin';

var LISTENER_SUFFIX = exports.LISTENER_SUFFIX = '-handleListener';

exports.isAdmin = function(self) {
    var name = json_rpc.splitName(self.__ca_getName__())[1];
    return (name === self.$.props.adminCA);
};

exports.toAdminMap = function(self) {
    var name = self.__ca_getName__();
    return caf.joinName(caf.splitName(name)[0], self.state.projectorCA,
                        TO_ADMIN);
};

exports.pubsubTopic = function(self) {
    if (!self.state.projectorCA) {
        return null;
    } else {
        var name = json_rpc.joinName(
            json_rpc.splitName(self.__ca_getName__())[0],
            self.state.projectorCA);
        return self.$.pubsub.FORUM_PREFIX + name + LISTENER_SUFFIX;
    }
};

exports.adminName = function(self) {
    return json_rpc.joinName(json_rpc.splitName(self.__ca_getName__())[0],
                             self.$.props.adminCA);
};

exports.owner = function(self) {
    return json_rpc.splitName(self.__ca_getName__())[0];
};

exports.caName = function(self) {
    return json_rpc.splitName(self.__ca_getName__())[1];
};

exports.notifyIoT = function(self) {
    var $$ = self.$.sharing.$;
    var notif = {fromCloud: $$.fromCloud.dump()};
    self.$.session.notify([notif], IOT_SESSION);
};

var notifyWebApp = exports.notifyWebApp = function(self) {
    var msg = {
        markers: self.state.markers,
        parts: self.state.parts,
        calibration: self.state.calibration,
        calibrating: self.state.calibrating,
        nodisplay: self.state.nodisplay,
        deviceInfo: self.state.deviceInfo
    };
    self.$.session.notify([msg], APP_SESSION);
};

exports.notifyAdminWebApp = function(self) {
    var msg = {
        markers: self.state.markers,
        calibration: self.state.calibration,
        calibrating: self.state.calibrating,
        nodisplay: self.state.nodisplay,
        streamON: self.state.streamON,
        parts: self.state.parts,
        deviceInfo: self.state.deviceInfo
    };
    self.$.session.notify([msg], APP_SESSION);
    self.$.session.notify([msg], VR_SESSION);
    self.$.session.notify([msg], AR_SESSION);
};

exports.invocation = function(methodName /*, var_args*/) {
    var argsArray = Array.prototype.slice.call(arguments);
    argsArray.unshift(null); //sessionId
    argsArray.unshift(null); //from
    argsArray.unshift(null); //to
    return json_rpc.notification.apply(json_rpc.notification, argsArray);
};


exports.stopSpinning = function(self, deviceInfo) {
    var changed = false;
    Object.keys(deviceInfo).forEach(function(x) {
        var value = deviceInfo[x];
        if (value.advertisement && value.advertisement.serviceData &&
            (value.advertisement.serviceData.length > 0) &&
            self.state.markers[x] && self.state.markers[x].spinning) {
            self.state.markers[x].spinning = false;
            changed = true;
        }
    });

    if (changed) {
        notifyWebApp(self);
        var $$ = self.$.sharing.$;
        $$.toAdmin.set('markers', myUtils.deepClone(self.state.markers));
    }
};
