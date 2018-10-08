var React = require('react');
var cE = React.createElement;
var mapHuman = require('./mapHuman');
var aframeR = require('aframe-react');
var Entity = aframeR.Entity;

const Z_OFFSET = 0.1;

const STYLES = {
    markerNormal : {
        opacity:0.2,
        color: 'blue',
        transparent: true
    },
    markerEntered : {
        opacity: 1.0,
        color: 'black',
        transparent: false
    }
};

class SphereMarker extends React.Component {

    constructor(props) {
        super(props);
        this.state = {entered: false};
    }

    handleClick() {
        this.props.callback(this.props.part);
    }

    handleMouseenter() {
        this.setState({entered: true});
    }

    handleMouseleave() {
        this.setState({entered: false});
    }

    render() {

        var style = STYLES.markerNormal;

        if (this.props.color) {
            style = {
                color: this.props.color,
                opacity:1.0,
                transparent: false
            };
        }

        if (this.state.entered) {
            style = STYLES.markerEntered;
        }

        var pos = mapHuman.partToPos[this.props.part];
        var t  = [pos[0] + this.props.offset[0],
                  pos[1] + this.props.offset[1],
                  Z_OFFSET + this.props.offset[2]];
        var position = {x: t[0], y: t[1], z: t[2]};

        return cE(Entity, {
            geometry : {
                primitive: 'sphere',
                radius: 0.05
            },
            material: style,
            position: position,
            events: {
                click: this.handleClick.bind(this),
                mouseenter: this.handleMouseenter.bind(this),
                mouseleave: this.handleMouseleave.bind(this)
            }
        });
    }
}

module.exports = SphereMarker;
