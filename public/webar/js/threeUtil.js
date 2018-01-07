"use strict";

var AppActions = require('./actions/AppActions');

var THREE = require('three');

var raycaster = new THREE.Raycaster();
var touch = new THREE.Vector2();


// total diameter is 2*(TORUS_RADIOUS+TORUS_TUBE_DIAMETER)
var TORUS_RADIUS = 0.025; // in meters
var TORUS_TUBE_DIAMETER= 0.015;
var ABSOLUTE_PART = -1;
var MAX_CHANCES = 2;
var SPEED = 0.03;
var UPDATE_EVERY = 120;

var syncDonuts = function(group, markers) {

    var newDonut = function(name, spinning, color, location) {
        var geometry = new THREE.TorusGeometry(TORUS_RADIUS,
                                               TORUS_TUBE_DIAMETER, 16, 64);
        var material = new THREE.MeshLambertMaterial({ color: color });
        var donut =  new THREE.Mesh(geometry, material);
        donut['__meta__'] = {name: name, spinning: spinning, color:color,
                             location: location, missing: 0};
        return donut;
    };

    var all = {};
    var toRemove = [];
    group.traverse(function (obj) {
        if ((obj instanceof THREE.Mesh) && obj.__meta__ ) {
            var name = obj.__meta__.name;
            var desired = markers[name];
            if (desired && (desired.color == obj.__meta__.color)) {
                all[name] = obj;
                obj.__meta__.spinning = desired.spinning;
                obj.__meta__.location = desired.location;
            } else {
                toRemove.push(obj);
            }
        }
    });

    toRemove.forEach(x => group.remove(x));

    Object.keys(markers).forEach(function(x) {
        if (!all[x]) {
            var desired = markers[x];
            group.add(newDonut(x, desired.spinning, desired.color,
                               desired.location));
        }
    });
};

var updatePosition = function(group, parts) {
    group.traverse(function (obj) {
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
            } else if (loc.part === ABSOLUTE_PART) {
                obj.__meta__.missing = 0;
                obj.position.set(loc.offset[0], loc.offset[1],
                                 loc.offset[2]);
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

var update = exports.update = function(arState, gState) {
    var group = arState.group;
    try {
        gState.markers && group && syncDonuts(group, gState.markers);
        group && updatePosition(group, gState.parts || {});
    } catch(err) {
        console.log(err);
    }
    return arState;
};

exports.process = function(arState, gState, frame) {

    var renderer = arState.renderer;
    var camera = arState.camera;
    var session = arState.arSession;
    var scene = new THREE.Scene();
    var coordMapping = arState.coordMapping;
    var group = arState.group;
    var counter = arState.counter;

    // add  donuts to 'group' here
    if (group && group.visible) {
        group.traverse(function (obj) {
            if ((obj instanceof THREE.Mesh) && obj.__meta__  &&
                obj.__meta__.spinning) {
                obj.rotation.y -= SPEED;
            }
        });

        if (counter % UPDATE_EVERY === 0) {
            update(arState, gState);
        }
    }
    // end update donuts

    renderer.autoClear = false;
    renderer.setSize(session.baseLayer.framebufferWidth,
                     session.baseLayer.framebufferHeight, false);
    renderer.clear();


    var view = frame.views && ( frame.views.length > 0) && frame.views[0];

    if (view && coordMapping) {
        var coord = frame.getCoordinateSystem(window
                                              .XRCoordinateSystem.HEAD_MODEL);
        // TBD: Will change to 'Device'  in final WebXR spec
        var pose = frame.getDisplayPose(coord);

        camera.matrixAutoUpdate = false;
        camera.projectionMatrix.fromArray(view.projectionMatrix);
        camera.matrix.fromArray(pose.poseModelMatrix);
        camera.updateMatrixWorld(true);

        scene.add(camera);

        // group maps from external global coordinates to current global coords.
        group.matrixAutoUpdate = false;
        group.matrix.fromArray(coordMapping);
        group.updateMatrixWorld(true);

        scene.add(group);

        renderer.clearDepth();
        var viewport = view.getViewport(session.baseLayer);
        renderer.setViewport(viewport.x, viewport.y, viewport.width,
                             viewport.height);

        if (arState.touch) {
            touch.x = arState.touch.x;
            touch.y = arState.touch.y;

            raycaster.setFromCamera(touch, camera);

            var touched = raycaster
                    .intersectObjects(group.children
                                      .filter(obj =>
                                              (obj instanceof THREE.Mesh))
                                     );
            if (touched.length > 0) {
                // Pick only the closest
                AppActions.arTouched(arState.ctx, touched[0].object);
            }
        }

        renderer.render(scene, camera);
    } else {
        // Manage console log ...
        if (counter % UPDATE_EVERY === 0) {
            console.log('Error: no view or mapping, skipping rendering');
        }
    }

    delete arState.touch; // only process once (or ignore...)
};
