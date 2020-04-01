// Modifications copyright 2020 Caf.js Labs and contributors
/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

"use strict";

var threeUtil = require('./threeUtil');

var React = require('react');
var ReactDOM = require('react-dom');
var ReactServer = require('react-dom/server');
var AppSession = require('./session/AppSession');
var MyApp = require('./components/MyApp');
var redux = require('redux');
var AppReducer = require('./reducers/AppReducer');
var AppActions = require('./actions/AppActions');

var cE = React.createElement;

var main = exports.main = function(data) {
    var ctx =  {
        store: redux.createStore(AppReducer)
    };
    if (typeof window !== 'undefined') {
        AppSession.connect(ctx, function(err, data) {
            err && console.log('Cannot connect:' + err);
            if (data.isAdmin) {
                ReactDOM.render(cE(MyApp, {ctx: ctx}),
                                document.getElementById('content'));
            } else {
                threeUtil.init(ctx, data);
            }
        });
    } else {
        if (data.isAdmin) {
            // server side rendering
            AppActions.initServer(ctx, data);
            return ReactServer.renderToString(cE(MyApp, {ctx: ctx}));
        }
    }
};
