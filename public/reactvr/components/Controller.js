var React = require('react');
var rVR = require('react-vr');
var cE = React.createElement;
var ControllerColor = rVR.NativeModules.ControllerColor;

const DEFAULT_COLOR = 'blue';
const DEVICES = require('./devices').DEVICES;

class Controller extends React.Component {

    constructor(props) {
        super(props);
        this.lastColor = null;
    }

    render() {
        var dev = this.props.selectedDevice;
        var newColor = (dev && DEVICES[dev] &&
                        DEVICES[dev].color) || DEFAULT_COLOR;
        if (this.lastColor != newColor) {
            ControllerColor.changeControllerColor(newColor);
            this.lastColor = newColor;
        }
        return cE(rVR.View, null);
    }
}

module.exports = Controller;
