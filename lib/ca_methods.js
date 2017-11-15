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
var assert = require('assert');
var caf = require('caf_core');
var json_rpc = caf.caf_transport.json_rpc;
var caf_comp = caf.caf_components;
var myUtils = caf_comp.myUtils;
var appUtils = require('./ca_methods_utils');
var adminMethods = myUtils.onlyFun(require('./ca_methods_admin').methods);

var STALE_COUNTER = 5;


exports.methods = {

    // Called by the framework

    __ca_init__ : function(cb) {
        this.state.markers = {};
        this.state.parts = {};
        this.state.calibration = null;
        this.scratch.snapshot = null; //too big for checkpoint or getState()
        this.state.calibrating = false;
        this.state.isAdmin = appUtils.isAdmin(this);
        this.state.counter = 0;
        this.state.partsCounter = 0;

        this.state.iotMethodsMeta = this.$.iot.iotMethodsMeta();
        this.$.session.limitQueue(1, appUtils.APP_SESSION); // last notification
        this.$.session.limitQueue(1, appUtils.IOT_SESSION); // ditto
        this.state.fullName = this.__ca_getAppName__() + '#' +
            this.__ca_getName__();
        this.state.trace__iot_sync__ = 'traceSync';
        this.state.trace__iot_resume__ = 'traceResume';
        this.state.projectorCA = null;

        if (this.state.isAdmin) {
            myUtils.mixin(this, adminMethods);
            this.state.pubsubTopic = null;
        } else {
            this.state.projectorCA = appUtils.caName(this);
            this.$.sharing.addWritableMap('toAdmin', appUtils.TO_ADMIN);
            this.state.pubsubTopic = appUtils.pubsubTopic(this);
            this.$.pubsub.subscribe(this.state.pubsubTopic, 'handleListener');
            // only 'same owner' CAs authorized
            var rule = this.$.security.newSimpleRule('handleListener',
                                                     this.$.security.SELF);
            this.$.security.addRule(rule);
        }

        cb(null);
    },
    __ca_resume__ : function(cp, cb) {
        // need to recreate, in case the IoT  device implementation changed.
        this.state.iotMethodsMeta = this.$.iot.iotMethodsMeta();

        if (this.state.isAdmin) {
             myUtils.mixin(this, adminMethods);
        }
        cb(null);
    },
    __ca_pulse__ : function(cb) {
        this.$.log && this.$.log.debug('calling PULSE!!!');
        this.state.counter = (this.state.counter || 0) + 1;
        this.state.partsCounter = (this.state.partsCounter || 0);
        if (this.state.counter - this.state.partsCounter > STALE_COUNTER) {
            this.state.parts = {};
            appUtils.notifyWebApp(this);
        }
        cb(null);
    },

    // Called by the web app

    hello : function(key, tokenStr, cb) {
        tokenStr && this.$.iot.registerToken(tokenStr);
        this.getState(cb);
    },

    // location is {part: int, offset: [x:int, y: int, z: int]}
    setMarker : function(name, location, color, spinning, cb) {
        var $$ = this.$.sharing.$;
        this.state.markers[name] = {location: location, color: color,
                                    spinning: spinning};
        appUtils.notifyWebApp(this);
        $$.toAdmin.set('markers', myUtils.deepClone(this.state.markers));
        this.getState(cb);
    },
    deleteMarker : function(name, cb) {
        var $$ = this.$.sharing.$;
        delete this.state.markers[name];
        appUtils.notifyWebApp(this);
        $$.toAdmin.set('markers', myUtils.deepClone(this.state.markers));
        this.getState(cb);
    },

    calibrate: function(cb) {
        var bundle = this.$.iot.newBundle(this.$.props.margin);
        bundle.calibrate(1000, []); //allow time for showing checkerboard
        this.$.iot.sendBundle(bundle);
        this.state.calibrating = true;
        appUtils.notifyIoT(this); // `notify` improves bundle responsiveness.
        appUtils.notifyWebApp(this);
        this.getState(cb);
    },

    snapshot: function(cb) {
        var bundle = this.$.iot.newBundle(this.$.props.margin);
        bundle.snapshot(0, []);
        this.$.iot.sendBundle(bundle);
        appUtils.notifyIoT(this); // `notify` improves bundle responsiveness.
        appUtils.notifyWebApp(this);
        this.getState(cb);
    },

    activatePartsStream: function(isON, cb) {
        var $$ = this.$.sharing.$;
        $$.fromCloud.set('streamON', isON);
        $$.toAdmin.set('streamON', isON);
        appUtils.notifyIoT(this);
        this.getState(cb);
    },

    setDeviceInfo: function(deviceInfo, cb) {
        var $$ = this.$.sharing.$;
        $$.toAdmin.set('deviceInfo', deviceInfo);
        this.state.deviceInfo = deviceInfo;
        appUtils.stopSpinning(this, deviceInfo);
        this.getState(cb);
    },

    setProjectorCA: function(caName, cb) {
        this.state.projectorCA = caName;
        this.$.sharing.addReadOnlyMap('toAdminRO',
                                      appUtils.toAdminMap(this));
        this.state.pubsubTopic = appUtils.pubsubTopic(this);
        this.getState(cb);
    },

    getSnapshot: function(cb) {
        cb(null, {snapshot: this.scratch.snapshot});
    },

    getState : function(cb) {
        cb(null, this.state);
    },

    // Called by the manager
    handleListener: function(topic, request, cb) {
        if (this.state.isAdmin || (topic !== this.state.pubsubTopic)) {
            var error = new Error('Cannot handle request');
            error.topic = topic;
            error.request = request;
            error.caName = this.__ca_getName__();
            cb(error);
        } else {
            json_rpc.call(JSON.parse(request), this, cb);
        }
    },

    // Called by the IoT device

    'traceSync' : function(cb) {
        var $$ = this.$.sharing.$;
        var now = (new Date()).getTime();
        this.$.log.trace(this.state.fullName + ':Syncing!!:' + now);

        var parts = $$.toCloud.get('parts');
        if (parts && !myUtils.deepEqual(parts, this.state.parts)) {
            this.state.parts = myUtils.deepClone(parts);
            this.state.partsCounter = this.state.counter;
            $$.toAdmin.set('parts', parts);
        }

        var newCal = $$.toCloud.get('calibration');
        if (newCal && !myUtils.deepEqual(newCal, this.state.calibration)) {
            this.state.calibration = myUtils.deepClone(newCal);
            this.state.calibrating = false;
            $$.toAdmin.set('calibration', newCal);
        }

        var newSnap = $$.toCloud.get('snapshot');
        if (newSnap &&
            (newSnap.timestamp !== (this.scratch.snapshot &&
                                    this.scratch.snapshot.timestamp))) {
            this.scratch.snapshot = myUtils.deepClone(newSnap);
            $$.toAdmin.set('snapshot', newSnap);
        }

        appUtils.notifyWebApp(this);
        cb(null);
    },
    'traceResume' : function(cb) {
        var now = (new Date()).getTime();
        this.$.log.trace(this.state.fullName + ':Resuming!!:' + now);
        cb(null);
    }
};


caf.init(module);
