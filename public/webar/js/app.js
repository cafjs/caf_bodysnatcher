"use strict";

var myAR = require('./myAR');

var redux = require('redux');
var AppReducer = require('./reducers/AppReducer');
var AppActions = require('./actions/AppActions');
var AppSession = require('./session/AppSession');


var main = exports.main = function(data) {

    if (typeof window !== 'undefined') {

        var ctx =  {
            store: redux.createStore(AppReducer)
        };

        AppSession.connect(ctx, function(err, data) {
            if (err) {
                console.log('Cannot connect:' + err);
            } else {
               myAR.init(ctx, data);
            }
        });

    }
};
