"use strict";

var arUtil = require('./arUtil');
var cvUtil = require('./cvUtil');
var threeUtil = require('./threeUtil');
var async = require('async');

var compose = function(cvState, threeState, arState, state) {


};

exports.init = function(ctx, data) {
    var state =  data || {};
    var threeState;
    var cvState;
    var arState;
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
            threeState = threeUtil.update(threeState, state);
            cvState = cvUtil.update(cvState, state);
        }
    };


    var animate = function() {
        // get 6DoF camera position/rotation
        arState = arUtil.process(arState, state);
        // read input frame and analyze it to find global coordinates
        cvState = cvUtil.process(cvState, state);
        // draw 3-D donuts overlay
        threeState = threeUtil.process(threeState, state);
        // Compose input frame + overlay and write output frame
        compose(cvState, threeState, arState, state);

        window && window.requestAnimationFrame(animate);
    };

    async.series({
        arState : cb => arUtil.init(ctx, data, cb),
        threeState: cb => threeUtil.init(ctx, data, cb),
        cvState: cb => cvUtil.init(ctx, data, cb)
    }, function(err, res) {
        if (err) {
            console.log(err);
            throw err;
        } else {
            arState = res.arState;
            cvState = res.cvState;
            threeState = res.threeState;
            that.mount();
            animate();
            ctx.ar = that;
        }
    });
};
