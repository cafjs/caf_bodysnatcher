require('./globals');
var rVR = require('react-vr');
var myApp = require('./components/MyApp');
var AppSession = require('./session/AppSession');
var redux = require('redux');
var AppReducer = require('./reducers/AppReducer');
var AppActions = require('./actions/AppActions');

var ctx =  {
    store: redux.createStore(AppReducer)
};

rVR.AppRegistry.registerComponent('BodySnatcherVR', () => myApp(ctx));

AppSession.connect(ctx, function(err, data) {
    if (err) {
        console.log('Cannot connect:' + err);
    } else {
        AppActions.setLocalState(ctx, {loading: false});
        console.log('Connected!!');
    }
});


module.exports = myApp;
