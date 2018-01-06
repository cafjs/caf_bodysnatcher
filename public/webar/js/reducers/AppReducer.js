var AppConstants = require('../constants/AppConstants');
var redux = require('redux');

var AppReducer = function(state, action) {
    if (typeof state === 'undefined') {
        return  {markers: {}, loading: true, calibration: null,
                 rotation: 0, doRotate: false, lastUpdate: Date.now(),
                 selectedDevice: null, deviceInfo: {}, touched: null,
                 isAdmin: false, isClosed: false
                };
    } else {
        switch(action.type) {
        case AppConstants.APP_UPDATE:
        case AppConstants.APP_NOTIFICATION:
            return Object.assign({}, state, action.state);
        case AppConstants.APP_ERROR:
            return Object.assign({}, state, {error: action.error});
        case AppConstants.WS_STATUS:
            return Object.assign({}, state, {isClosed: action.isClosed});
        default:
            return state;
        }
    };
};

module.exports = AppReducer;
