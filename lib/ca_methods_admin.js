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

var appUtils = require('./ca_methods_utils');
var app = require('../public/js/app.js');

var methods = exports.methods = {

    __ca_pulse__ : function(cb) {
        if (this.state.projectorCA) {
            var $$ = this.$.sharing.$;
            var version = $$.toAdminRO && $$.toAdminRO.getVersion();
            if (version !== this.state.lastVersion) {
                this.state.lastVersion = version;
                this.state.calibration =  $$.toAdminRO.get('calibration');
                this.state.parts =  $$.toAdminRO.get('parts');
                this.state.markers = $$.toAdminRO.get('markers');
                this.state.streamON = $$.toAdminRO.get('streamON');
                appUtils.notifyAdminWebApp(this);
            }
        }

        this.$.react.render(app.main, [this.state]);
        cb(null);
    },

    hello : function(key, tokenStr, cb) {
        key && this.$.react.setCacheKey(key);
        this.getState(cb);
    },

    getState : function(cb) {
       this.$.react.coin();
       cb(null, this.state);
   },

    // pass through methods to the projector CA

    setMarker : function(name, location, color, spinning, cb) {
        passThrough(this, 'setMarker', name, location, color, spinning, cb);
    },

    deleteMarker : function(name, cb) {
        passThrough(this, 'deleteMarker', name, cb);
    },

    calibrate: function(cb) {
        passThrough(this, 'calibrate', cb);
    },

    activatePartsStream: function(isON, cb) {
        passThrough(this, 'activatePartsStream', isON, cb);
    },

    // Called by the IoT device
    traceSync : function(cb) {
        cb(null);
    },
    'traceResume' : function(cb) {
        cb(null);
    }
};


var passThrough = function(_self, method /*, var_args*/) {
    var argsArray = Array.prototype.slice.call(arguments);
    var cb = argsArray.pop();
    var self = argsArray.shift();
    var inv = appUtils.invocation.apply(appUtils.invocation, argsArray);
    if (self.state.pubsubTopic) {
        self.$.pubsub.publish(self.state.pubsubTopic, JSON.stringify(inv));
        cb(null);
    } else {
        cb(new Error('pubsubTopic not set'));
    }
};