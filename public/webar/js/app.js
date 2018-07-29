"use strict";

var myAR = require('./myAR');

var redux = require('redux');
var AppReducer = require('./reducers/AppReducer');
var AppActions = require('./actions/AppActions');
var AppSession = require('./session/AppSession');

var main = exports.main = async function(data) {
    if (typeof window !== 'undefined') {
        var ctx =  {
            store: redux.createStore(AppReducer)
        };
        try {
            await AppSession.connect(ctx);
            await myAR.init(ctx, data);
        } catch (err) {
            console.log('Got error initializing: ' + err);
        }
    }
};
