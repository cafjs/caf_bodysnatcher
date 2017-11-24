var React = require('react');
var rVR = require('react-vr');
var cE = React.createElement;
var Button = require('./Button');
var AppActions = require('../actions/AppActions');
const DEVICES = require('./devices').DEVICES;


var allData = function(ctx, deviceInfo, markers) {
    var all = Object.keys(deviceInfo)
            .filter(x => deviceInfo[x].advertisement &&
                    deviceInfo[x].advertisement.serviceData &&
                    markers[x])
            .sort();
    return all.map((x, i) => cE(rVR.Text, {key: 923127*i, style: {
        margin: 10,
        fontSize: 40,
        fontWeight: '300',
        textAlign: 'center',
        textAlignVertical: 'center',
        borderRadius: 0,
        opacity: 1,
        backgroundColor: DEVICES[x].color
    }}, DEVICES[x].type + ': ' + deviceInfo[x].advertisement.serviceData));
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
