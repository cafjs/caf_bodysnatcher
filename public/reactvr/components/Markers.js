var React = require('react');
var rVR = require('react-vr');
var cE = React.createElement;

var mapHuman = require('./mapHuman');
var devices = require('./devices');
const DEVICES = devices.DEVICES;

var AppActions = require('../actions/AppActions');
var SphereMarker = require('./SphereMarker');

const Z_OFFSET = 0.1;

const STYLES = {
    markerNormal : {
        opacity:0.2,
        color: 'blue'
    },
    markerEntered : {
        color: 'black'
    }
};


// return map from marked 'part name' to 'color'
var markerColors = function(markers) {
    var color = {};
    Object.keys(markers).forEach(function(x) {
        var m = markers[x];
        color[mapHuman.idToPart[m.location.part]] = m.color;
        });
    return color;
};

// return map from marked 'part name' to 'name' of marker
var markerNames = function(markers) {
    var names = {};
    Object.keys(markers).forEach(function(x) {
        var m = markers[x];
        names[mapHuman.idToPart[m.location.part]] = x;
        });
    return names;
};

class Markers extends React.Component {

    constructor(props) {
        super(props);
        this.doClick = this.doClick.bind(this);
    }

    doClick(part) {
        var names = markerNames(this.props.markers);
        var doDelete = () => names[part] &&
                AppActions.deleteMarker(this.props.ctx, names[part]);

        var selectedDevice = this.props.selectedDevice;
        if (selectedDevice) {
            if (selectedDevice === devices.DELETE) {
                doDelete();
            } else {
                if (names[part] !== selectedDevice) {
                    doDelete();
                    AppActions.setMarker(this.props.ctx, selectedDevice,
                                         {part: mapHuman.partToId[part],
                                          offset: [0,0,0]},
                                         DEVICES[selectedDevice].color,
                                         true);
                }
            }

            AppActions.setLocalState(this.props.ctx, { selectedDevice: null });
        }
    }

    render() {
        var color = markerColors(this.props.markers);
        var parts = Object.keys(mapHuman.partToId);
        return cE(rVR.View, {style: {position: 'absolute'}},
                  parts.map((part, i) => cE(SphereMarker,
                                            {key: 44367*i + 91,
                                             part: part,
                                             offset: this.props.offset,
                                             callback: this.doClick,
                                             color: color[part]
                                            }))
                 );
    }
}


module.exports = Markers;
