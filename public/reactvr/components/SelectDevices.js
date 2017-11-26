var React = require('react');
var rVR = require('react-vr');
var cE = React.createElement;
var Button = require('./Button');
var AppActions = require('../actions/AppActions');
var devices = require('./devices');
const DEVICES = devices.DEVICES;

var allDevices = function(ctx) {
    return Object.keys(DEVICES).sort().map((x, i) =>  cE(Button, {
        key: 9232*i,
        text: x,
        fontColor: DEVICES[x].fontColor,
        backgroundColor: DEVICES[x].color,
        callback: () => AppActions.setLocalState(ctx, {selectedDevice: x})
    }));
};

class SelectDevices extends React.Component {

    constructor() {
        super();
    }

    render() {
        return cE(rVR.View, { style: { flexDirection: 'column',
                                       width: 175,
                                       alignItems: 'stretch',
                                       backgroundColor:'grey',
                                       justifyContent: 'space-between',
                                       opacity: 0.9,
                                       height: 720
                                     }
                            },
                  [ cE(rVR.Text, {key: 66336, style: { margin: 10,
                                                       fontSize: 50,
                                                       fontWeight: '300',
                                                       textAlign: 'center',
                                                       textAlignVertical:
                                                       'center',
                                                       borderRadius: 0,
                                                       opacity: 1,
                                                       backgroundColor: 'blue'
                                                     }}, 'Devices')
                  ].concat(allDevices(this.props.ctx))
                 );
    }
}

module.exports = SelectDevices;
