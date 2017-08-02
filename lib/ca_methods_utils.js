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

var caf = require('caf_core');
var json_rpc = caf.caf_transport.json_rpc;

var APP_SESSION = exports.APP_SESSION = 'default';
var IOT_SESSION = exports.IOT_SESSION = 'iot';

var TO_ADMIN = exports.TO_ADMIN = 'toAdmin';

var LISTENER_SUFFIX = exports.LISTENER_SUFFIX = '-handleListener';

var isAdmin = exports.isAdmin = function(self) {
    var name = json_rpc.splitName(self.__ca_getName__())[1];
    return (name === self.$.props.adminCA);
};

var toAdminMap  = exports.toAdminMap = function(self) {
    var name = self.__ca_getName__();
    return caf.joinName(caf.splitName(name)[0], self.state.projectorCA,
                        TO_ADMIN);
};

var pubsubTopic = exports.pubsubTopic = function(self) {
    if (!self.state.projectorCA) {
        return null;
    } else {
        var name = json_rpc.joinName(
            json_rpc.splitName(self.__ca_getName__())[0],
            self.state.projectorCA);
        return self.$.pubsub.FORUM_PREFIX + name + LISTENER_SUFFIX;
    }
};

var adminName = exports.adminName = function(self) {
    return json_rpc.joinName(json_rpc.splitName(self.__ca_getName__())[0],
                             self.$.props.adminCA);
};

var owner = exports.owner = function(self) {
    return json_rpc.splitName(self.__ca_getName__())[0];
};

var caName = exports.caName = function(self) {
    return json_rpc.splitName(self.__ca_getName__())[1];
};

var notifyIoT = exports.notifyIoT = function(self) {
    var $$ = self.$.sharing.$;
    var notif = {fromCloud: $$.fromCloud.dump()};
    self.$.session.notify([notif], IOT_SESSION);
};

var notifyWebApp = exports.notifyWebApp = function(self) {
    var msg = {
        markers: self.state.markers,
        parts: self.state.parts,
        calibration: self.state.calibration,
        calibrating: self.state.calibrating
    };
    self.$.session.notify([msg], APP_SESSION);
};

var notifyAdminWebApp = exports.notifyAdminWebApp = function(self) {
    var msg = {
        markers: self.state.markers,
        calibration: self.state.calibration,
        streamON: self.state.streamON,
        parts: self.state.parts
    };
    self.$.session.notify([msg], APP_SESSION);
};

var invocation = exports.invocation = function(methodName /*, var_args*/) {
    var argsArray = Array.prototype.slice.call(arguments);
    argsArray.unshift(null); //sessionId
    argsArray.unshift(null); //from
    argsArray.unshift(null); //to
    return json_rpc.notification.apply(json_rpc.notification, argsArray);
};