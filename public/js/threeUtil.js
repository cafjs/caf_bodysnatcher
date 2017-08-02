"use strict";

var THREE = require('three');

var COLORS= {
    yellow: new THREE.Color( 0xffff00),
    red: new THREE.Color(0xff0000),
    green: new THREE.Color(0x00ff00),
    blue: new THREE.Color(0x0000ff)
};

var CHECKERBOARD_ID = 'checkerboard';

var MAX_CHANCES = 2;

var SPEED = 0.03;
var IMAGE_WIDTH = 1280.0;
var IMAGE_HEIGHT = 720.0;
var FAR_PLANE= 1000;
var NEAR_PLANE= 0.01;
var DEFAULT_THROW_RATIO=0.47;

exports.init = function(ctx, data) {

    var renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(IMAGE_WIDTH, IMAGE_HEIGHT);
    renderer.setClearColor(0x000000);// Configure renderer clear color
    document.body.appendChild(renderer.domElement);

    var scene = new THREE.Scene();

    // camera params to be replaced with calibration data
    var camera = new THREE.PerspectiveCamera(DEFAULT_THROW_RATIO*IMAGE_WIDTH,
                                             IMAGE_WIDTH/IMAGE_HEIGHT,
                                             NEAR_PLANE, FAR_PLANE );

    var updateCalibration = function(calib) {
        for (var i = 0; i < 16; i++) {
            // calib.view(proj)Mat is column-order
            camera.projectionMatrix.elements[i] = calib.projMat[i];
            camera.matrixWorldInverse.elements[i] = calib.viewMat[i];
        }
        camera.matrixWorld.getInverse(camera.matrixWorldInverse);
        camera.matrixAutoUpdate = false;
    };

    var light = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    scene.add(light);
    var light2 = new THREE.AmbientLight(0xFFFFFF, 0.7);
    scene.add(light2);

    var newDonut = function(name, spinning, color, location) {
        var geometry = new THREE.TorusGeometry(0.05, 0.02, 16, 64);
        var material = new THREE.MeshLambertMaterial({ color: color });
        var donut =  new THREE.Mesh(geometry, material);
        donut['__meta__'] = {name: name, spinning: spinning, color:color,
                             location: location, missing: 0};
        return donut;
    };

    var syncDonuts = function(markers) {
        var all = {};
        scene.traverse(function (obj) {
            if ((obj instanceof THREE.Mesh) && obj.__meta__ ) {
                var name = obj.__meta__.name;
                var desired = markers[name];
                if (desired && (desired.color == obj.__meta__.color)) {
                    all[name] = obj;
                    obj.__meta__.spinning = desired.spinning;
                    obj.__meta__.location = desired.location;
                } else {
                    scene.remove(obj);
                }
            }
        });

        Object.keys(markers).forEach(function(x) {
            if (!all[x]) {
                var desired = markers[x];
                scene.add(newDonut(x, desired.spinning, desired.color,
                                   desired.location));
            }
        });
    };

    var updatePosition = function(parts) {
        scene.traverse(function (obj) {
            if ((obj instanceof THREE.Mesh) && obj.__meta__ ) {
                // location is {part: int, offset: [x:int, y: int, z: int]}
                var loc = obj.__meta__.location;
                if (parts[loc.part]) {
                    obj.__meta__.missing = 0;
                    var x = parts[loc.part][0] + loc.offset[0];
                    var y = parts[loc.part][1] + loc.offset[1];
                    var z = parts[loc.part][2] + loc.offset[2];
                    obj.position.set(x, y, z);
                    if (!obj.__meta__.spinning) {
                        obj.rotation.y = 0.0;
                    }
                    obj.visible = true;
                } else {
                    if (obj.__meta__.missing >= MAX_CHANCES) {
                        obj.visible = false;
                    } else {
                        obj.__meta__.missing = obj.__meta__.missing + 1;
                    }
                }
            }
        });
    };

    var state =  data;
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
            var checkerboard = document &&
                    document.getElementById(CHECKERBOARD_ID);
            if (state.calibrating) {
                scene.visible = false;
                renderer.domElement.setAttribute('style', 'display: none;');
                checkerboard.setAttribute('style', 'display: inline;');
            } else {
                scene.visible = true;
                renderer.domElement.setAttribute('style', 'display: inline;');
                checkerboard.setAttribute('style', 'display: none;');
                state.calibration && updateCalibration(state.calibration);
                state.markers && syncDonuts(state.markers);
                state.parts && updatePosition(state.parts);
            }
        }
    };

    var counter = 0;
    var animate = function() {
        requestAnimationFrame(animate);
        if (scene.visible) {
            scene.traverse(function (obj) {
                if ((obj instanceof THREE.Mesh) && obj.__meta__  &&
                    obj.__meta__.spinning) {
                    obj.rotation.y -= SPEED;
                }
            });
            renderer.render(scene, camera);
            counter = counter + 1;
            if (counter == 120) {
                that.update();
                counter = 0;
            }
        }
    };

    that.mount();
    animate();
    ctx.three = that;
};
