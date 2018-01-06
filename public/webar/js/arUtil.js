"use strict";

var THREE = require('three');

exports.init = function(ctx, data, cb) {


    /*
     * Following webxr-polyfill/examples/common.js
     *  https://github.com/mozilla/webxr-polyfill.git
     */
    var display = null;
    var group = new THREE.Group();
    var light = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    group.add(light);
    var light2 = new THREE.AmbientLight(0xFFFFFF, 0.7);
    group.add(light2);
    group.visible = true;

    var camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000); //to be changed

    var canvas =  document.createElement('canvas');
    var webglCtx = canvas.getContext('webgl');
    var renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	context: webglCtx,
	antialias: false,
	alpha: true
    });

    renderer.setPixelRatio(1);
    renderer.autoClear = false;
    renderer.setClearColor('#000', 0);
    if (typeof navigator.XR === 'undefined') {
	cb(new Error('No WebXR API found'));
    } else {
        var sessionParams = {exclusive: false,
                             type: window.XRSession.AUGMENTATION};

        // TBD: Will change to 'Devices' in final WebXR spec
        navigator.XR.getDisplays().then(displays => {
            displays.some(dis => {
                if (dis.supportsSession(sessionParams)) {
                    display = dis;
                    return true;
                } else {
                    return false;
                }
            });

            if (!display) {
                cb(new Error('Cannot find display'));
            } else {
                 // TBD: Will add an output context in final WebXR spec
                display.requestSession(sessionParams).then(session => {
                    session.depthNear = 0.01;
                    session.depthFar = 1000;
                    session.baseLayer = new window.XRWebGLLayer(session,
                                                                webglCtx);
                    cb(null, {
                        ctx: ctx,
                        coordMapping: null,
                        arSession: session,
                        display: display,
                        camera: camera,
                        group:  group,
                        renderer: renderer,
                        canvas: canvas,
                        webglCtx: webglCtx,
                        counter: 0,
                        nSnapshots: 0,
                        tempCoord: []
                    });
                }).catch(err => cb(err));
            }
        }).catch(err => cb(err));


    }
};

exports.update = function(arState, gState) {
    return arState;
};


var HACK = [ 2.1445069205095586,
             0,
             0,
             0,
             0,
             2.945905004545787,
             0,
             0,
             -0,
             0,
             -1.000010000100001,
             -1,
             0,
             0,
             -0.01000010000100001,
             0 ];

exports.process = function(arState, gState, frame) {
    arState.counter = arState.counter + 1;
    var coord = frame.getCoordinateSystem(window.XRCoordinateSystem.HEAD_MODEL);
    // TBD: Will change to 'Device'  in final WebXR spec
    var pose = frame.getDisplayPose(coord);
    var view = frame.views && (frame.views.length > 0) && frame.views[0];
    if (view && pose) {
//        view.setProjectionMatrix(HACK); // TO DELETE
        arState.poseModelMatrix = pose.poseModelMatrix;
        arState.projectionMatrix = view.projectionMatrix;
        arState.viewMatrix = pose.getViewMatrix(view);
    } else {
         console.log('Error: no view or pose, skipping processing.');
    }
};
