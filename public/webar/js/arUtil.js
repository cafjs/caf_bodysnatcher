"use strict";

exports.init = async function(ctx, localState, data) {
    var arState = {};
    arState.counter = 0;

    var waitForClick = () => {
        return new Promise((resolve, reject) => {
            var btn = document.getElementById('enter-ar');
            var onEnterAR = async function() {
                console.log('clicked!');
                try {
                    document.body.webkitRequestFullscreen();
                    arState.canvas = document.createElement('canvas');
                    arState.canvas.setAttribute('id', 'webxr-canvas');
                    arState.ctx = arState.canvas.getContext('xrpresent');
                    arState.session =  await arState.device.requestSession({
                        outputContext: arState.ctx,
                        environmentIntegration: true
                    });
                    arState.frameOfRef = await arState.session
                        .requestFrameOfReference('eye-level');

                    document.body.appendChild(arState.canvas);

                    var canvasOutput = document.createElement('canvas');
                    canvasOutput.width = '100%';
                    canvasOutput.height = '100%';
                    canvasOutput.style = 'display:none';
                    canvasOutput.setAttribute('id', 'canvasOutput');
                    canvasOutput.setAttribute('z-index', '20');
                    document.body.appendChild(canvasOutput);

                    btn.classList.remove('btn-enter');
                    btn.classList.add('btn-done');
                    resolve(arState);
                } catch (err) {
                    reject(err);
                }
            };
            btn.addEventListener('click', onEnterAR, {once: true});
        });
    };

    if (window && window.navigator.xr && window.XRSession) {
        arState.device = await window.navigator.xr.requestDevice();
        await waitForClick();
        console.log('Done arUtil init');
        localState.ar = arState;
    } else {
        throw new Error('Unsupported');
    }

    return arState;
};

exports.update = function(localState, gState) {
    return localState;
};

exports.process = function(localState, gState, frame) {
    var arState = localState.ar;
    arState.counter = arState.counter + 1;
    var pose = frame.getDevicePose(arState.frameOfRef);
    if (pose) {
        arState.poseModelMatrix = pose.poseModelMatrix;
        for (let view of frame.views) {
            // pick the last view, assumed just one for AR...
            arState.projectionMatrix = view.projectionMatrix;
            arState.viewMatrix = pose.getViewMatrix(view);// ~poseModelMatrix^-1
        }
    } else {
        // reuse the previous pose
        console.log('.');
    }
};
