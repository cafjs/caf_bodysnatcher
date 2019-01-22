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

                    /* DO I NEED MIRRORING? */
                    arState.canvas = document.createElement('canvas');
                    arState.canvas.setAttribute('id', 'webxr-canvas');
                    arState.ctx = arState.canvas.getContext('xrpresent');

                    var reqTarget = (navigator.xr.requestSession &&
                                     navigator.xr) ||
                            // TO DELETE WHEN CANARY UPGRADES
                            arState.device;


                    arState.session =  await reqTarget.requestSession({
                        mode: 'immersive-ar',
                        environmentIntegration: true,// TO DELETE WITH UPGRADE
                        /* DO I NEED MIRRORING? */
                        outputContext: arState.ctx
                    });
                    arState.frameOfRef = await arState.session
                        .requestReferenceSpace({type: 'stationary',
                                                subtype: 'eye-level'});
                    /* DO I NEED MIRRORING? */
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
        // TO DELETE WHEN CANARY UPGRADES
        if (window.navigator.xr.requestDevice) {
            arState.device = await window.navigator.xr.requestDevice();
        }

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
                                               // TO DELETE WHEN CANARY UPGRADES
    frame.getViewerPose =  frame.getViewerPose || frame.getDevicePose; //new API
    var pose = frame.getViewerPose(arState.frameOfRef);
    if (pose) {
                                  // TO DELETE WHEN CANARY UPGRADES
        arState.poseModelMatrix = pose.poseModelMatrix || pose.transform.matrix;
        for (let view of frame.views) {
            // pick the last view, assumed just one for AR...
            arState.projectionMatrix = view.projectionMatrix;
            arState.viewMatrix = view.viewMatrix;// ~poseModelMatrix^-1
            if (!arState.viewMatrix) { // TO DELETE WHEN CANARY UPGRADES
                // old compatibility mode
                arState.viewMatrix = pose.getViewMatrix &&
                    pose.getViewMatrix(view);
            }
        }
    } else {
        // reuse the previous pose
        console.log('.');
    }
};
