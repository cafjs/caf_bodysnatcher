"use strict";

var arUtil = require('./arUtil');
var cvUtil = require('./cvUtil');
var threeUtil = require('./threeUtil');

exports.init = function(ctx, data) {
    var state =  data || {};
    var arState = {};
    var unsubscribe = null;

    var that = {

        mount: function() {
            if (!unsubscribe) {
                unsubscribe = ctx.store.subscribe(that.onChange);
                that.onChange();
            }
        },
        unmount: function() {
            if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
            }
        },
        onChange: function() {
            if (unsubscribe) {
                state = ctx.store.getState();
                that.update();
            }
        },
        update: function() {
            arState = arUtil.update(arState, state);
            arState = cvUtil.update(arState, state);
            arState = threeUtil.update(arState, state);
        }
    };

    // TBD: Will add a timestamp before frame in final WebXR spec
    var animate = function(frame) {
        // get 6DoF camera position/rotation
        arUtil.process(arState, state, frame);
        // read & analyze input frame to find global coordinates
        cvUtil.process(arState, state, frame);
        // draw 3-D donuts overlay
        threeUtil.process(arState, state, frame);

        if (state.touched) {
            var msg = document.getElementById('message');
            msg.innerHTML = state.touched.__meta__.name;
            msg.style.color = state.touched.__meta__.color;
        }

        if (state.sensorInfo && state.sensorInfo.msg) {
            var sensor = document.getElementById('sensor');
            sensor.innerHTML = state.sensorInfo.msg;
            sensor.style.color = state.sensorInfo.color;
            sensor.style['border-width'] = '5px';
        }

        if (!state.touched && !state.sensorInfo) {
            // cleanup
            sensor = document.getElementById('sensor');
            sensor.style['border-width'] = '0px';
            sensor.innerHTML = '';
            msg = document.getElementById('message');
            msg.innerHTML = '';
        }

        arState.arSession && arState.arSession.requestFrame(animate);
    };

    arUtil.init(ctx, data, function(err, res) {
        if (err) {
            console.log(err);
            throw err;
        } else {
            arState = res;
            that.mount();
            var el = document.getElementById('target');
            el.addEventListener('touchstart', function(ev) {
                if (ev.touches && ev.touches.length > 0) {
                    var point = {
                        x : 2*(ev.touches[0].clientX / window.innerWidth) -1,
                        y: 1 - 2*(ev.touches[0].clientY / window.innerHeight)
                    };
                    arState.touch = point;
                }
            }, false);
            arState.arSession && arState.arSession.requestFrame(animate);
            ctx.ar = that;
        }
    });
};
