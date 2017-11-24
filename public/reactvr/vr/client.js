var VRInstance = require('react-vr-web').VRInstance;
var OVRUI = require('ovrui');
var ControllerRayCaster = require('react-vr-controller-raycaster').default;
var THREE = require('three');
var ControllerColor = require('./ControllerColor');

function init(bundle, parent, options) {
    const scene = new THREE.Scene();
    const cnt = new ControllerRayCaster({scene, color: '#ff0000'});
    var cntColor = new ControllerColor();
    cntColor.init(cnt);
    const vr = new VRInstance(bundle, 'BodySnatcherVR', parent, {
        raycasters: [
                cnt,
                new OVRUI.MouseRayCaster(),
            ],
        nativeModules: [cntColor],
        scene: scene,
//        cursorVisibility: 'auto',
        antialias: true,
    // Add custom options here
        ...options,
    });
    vr.render = function() {
        // Any custom behavior you want to perform on each frame goes here
    };
    // Begin the animation loop
    vr.start();
    return vr;
}

window.ReactVR = {init};
