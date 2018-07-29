"use strict";

var arUtil = require('./arUtil');
var cvUtil = require('./cvUtil');
var threeUtil = require('./threeUtil');

exports.init = async function(ctx, data) {
    var state =  data || {};
    var localState = {};
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
            arUtil.update(localState, state);
            cvUtil.update(localState, state);
            threeUtil.update(localState, state);
        }
    };


    var update2D = function() {
        if (state.touched) {
            var msg = document.getElementById('message');
            msg.innerHTML = state.touched.__meta__.name;
            msg.style = 'display:block;z-index:25;color:' +
                state.touched.__meta__.color + ';';

        }

        if (state.sensorInfo && state.sensorInfo.msg) {
            var sensor = document.getElementById('sensor');
            sensor.innerHTML = state.sensorInfo.msg;
            sensor.style = 'display:block;z-index:25;border-width:5px;color:' +
                state.sensorInfo.color + ';';
        }

        if (!state.touched && !state.sensorInfo) {
            // cleanup
            sensor = document.getElementById('sensor');
            sensor.innerHTML = '';
            sensor.style = 'display:none';
            msg = document.getElementById('message');
            msg.innerHTML = '';
            msg.style = 'display:none';
        }
    };

    var animate = function(time, frame) {
        // render 3D, do it first to capture the video input
        threeUtil.process(localState, state, frame);
        // get 6DoF camera position/rotation
        arUtil.process(localState, state, frame);
        // read & analyze input frame to find global coordinates
        cvUtil.process(localState, state, frame);
        update2D();
        localState.ar.session.requestAnimationFrame(animate);
    };

    await arUtil.init(ctx, localState, data);
    await cvUtil.init(ctx, localState, data);
    await threeUtil.init(ctx, localState, data);

    that.mount();
    document.body.addEventListener('touchstart', function(ev) {
        if (ev.touches && ev.touches.length > 0) {
            var point = {
                x : 2*(ev.touches[0].clientX / window.innerWidth) -1,
                y: 1 - 2*(ev.touches[0].clientY / window.innerHeight)
            };
            localState.touch = point;
        }
    }, false);

    localState.ctx = ctx;
    localState.ar.session.requestAnimationFrame(animate);
    return that;
};
