var AppConstants = require('../constants/AppConstants');
var redux = require('redux');
const PENDING = '???';
const DEVICES = require('./devices').DEVICES;

var patchSensorInfo = function(state) {
    var formatNumber = function(x) {
        if (x === PENDING) {
            return x;
        } else {
            return ((!x || Number.isInteger(x)) ? x : (Math.floor(x*100)/100));
        }
    };

    if (state.sensorInfo && state.sensorInfo.name && state.deviceInfo) {
        var name = state.sensorInfo.name;
        if (state.deviceInfo[name] && state.deviceInfo[name].advertisement
            && state.deviceInfo[name].advertisement.serviceData) {
            var data = state.deviceInfo[name].advertisement.serviceData;
            data = (data[0] && data[0].data && data[0].data[0]);
            data = (!data && (typeof data !== 'number') ? PENDING : data);
            var msg = DEVICES[name].type + ': ' + formatNumber(data) + ' ' +
                    DEVICES[name].unit;
            state.sensorInfo = Object.assign({}, state.sensorInfo, {msg: msg});
        }
    }
    return state;
};

var AppReducer = function(state, action) {
    if (typeof state === 'undefined') {
        return  {markers: {}, loading: true, calibration: null,
                 rotation: 0, doRotate: false, lastUpdate: Date.now(),
                 selectedDevice: null, deviceInfo: {}, touched: null,
                 sensorInfo: null, isAdmin: false, isClosed: false
                };
    } else {
        switch(action.type) {
        case AppConstants.APP_UPDATE:
        case AppConstants.APP_NOTIFICATION:
            return patchSensorInfo(Object.assign({}, state, action.state));
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
