var React = require('react');
var rVR = require('react-vr');
var cE = React.createElement;
var Button = require('./Button');
var AppActions = require('../actions/AppActions');
const DEVICES = require('./devices').DEVICES;
const PENDING = '???';

var formatNumber = function(x) {
    if (x === PENDING) {
        return x;
    } else {
        return ((!x || Number.isInteger(x)) ? x : (Math.floor(x*100)/100));
    }
};

var allData = function(ctx, deviceInfo, markers) {
    var all = Object.keys(deviceInfo)
            .filter(x => deviceInfo[x].advertisement &&
                    deviceInfo[x].advertisement.serviceData &&
                    markers[x])
            .sort();
    return all.map(function(x, i) {
        var data = deviceInfo[x].advertisement.serviceData;
        data = (data[0] && data[0].data && data[0].data[0]);
        data = (!data && (typeof data !== 'number') ? PENDING : data);
        return cE(rVR.Text, {key: 923127*i, style: {
            margin: 10,
            fontSize: 40,
            fontWeight: '300',
            textAlign: 'center',
            textAlignVertical: 'center',
            borderRadius: 0,
            opacity: 1,
            backgroundColor: DEVICES[x].color,
            color: DEVICES[x].fontColor
        }}, DEVICES[x].type + ': ' + formatNumber(data) +  DEVICES[x].unit);
    });
};

class DevicesInfo extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return cE(rVR.View, { style: { flexDirection: 'column',
                                       width: 175,
                                       alignItems: 'stretch',
                                       backgroundColor: 'grey',
                                       justifyContent: 'space-between',
                                       opacity: 0.9,
                                       height: 720
                                     }
                            },
                  [ cE(rVR.Text, {key: 9237, style: {
                      margin: 10,
                      fontSize: 60,
                      fontWeight: '300',
                      textAlign: 'center',
                      textAlignVertical: 'center',
                      borderRadius: 0,
                      opacity: 1,
                      backgroundColor: 'blue'
                  }}, 'Data')
                  ].concat(allData(this.props.ctx, this.props.deviceInfo,
                                   this.props.markers))
                 );
    }
}

module.exports = DevicesInfo;
