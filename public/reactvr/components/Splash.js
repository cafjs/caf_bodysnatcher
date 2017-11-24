var React = require('react');
var rVR = require('react-vr');
var cE = React.createElement;

class Splash extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return cE(rVR.View, null,
                  cE(rVR.Pano, {source: rVR.asset('chess-world.jpg')}),
                  cE(rVR.Text, {style: {
                      fontSize: 0.8,
                      layoutOrigin: [0.5, 0.5],
                      paddingLeft: 0.2,
                      paddingRight: 0.2,
                      textAlign: 'center',
                      textAlignVertical: 'center',
                      backgroundColor: 'red',
                      transform: [{translate: [0, 0, -4]}]
                  }}, 'Connecting...')
                 );
    }
}

module.exports = Splash;
