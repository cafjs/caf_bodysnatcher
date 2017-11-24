var React = require('react');
var rVR = require('react-vr');
var cE = React.createElement;

class HumanModel extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return cE(rVR.Model, {
            source: {obj: rVR.asset('char1.obj'),
                     mtl: rVR.asset('char1.mtl')},
            style: {
                position: 'absolute',
                transform: [
                    {translate: [0, -1, -3]},
                    {scale: 0.1},
                    {rotateY: this.props.rotation / 3}
                ]
            },
            lit: true
        });
    }
}

module.exports = HumanModel;
