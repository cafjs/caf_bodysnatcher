var React = require('react');
var rVR = require('react-vr');
var cE = React.createElement;
var mapHuman = require('./mapHuman');

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

class SphereMarker extends React.Component {

    constructor(props) {
        super(props);
        this.state = {entered: false};
    }


    render() {

        var style = STYLES.markerNormal;

        if (this.props.color) {
            style = {color: this.props.color};
        }

        if (this.state.entered) {
            style = STYLES.markerEntered;
        }

        style = Object.assign({}, style); // clone

        var pos = mapHuman.partToPos[this.props.part];
        var t  = [pos[0] + this.props.offset[0],
                  pos[1] + this.props.offset[1],
                  Z_OFFSET + this.props.offset[2]];
        style.transform =  [{translate: t}];
        style.position = 'absolute';

        return cE(rVR.VrButton, { onClick: () =>
                                  this.props.callback(this.props.part),
                                  onEnter: () =>
                                  this.setState({entered: true}),
                                  onExit: () =>
                                  this.setState({entered: false})
                                },
                  cE(rVR.Sphere, {
                      style: style, radius: 0.05, lit: true,
                      widthSegments: 10, heightSegments: 8
                  })
                 );
    }
}

module.exports = SphereMarker;
