var React = require('react');
var cE = React.createElement;
var aframeR = require('aframe-react');
var Entity = aframeR.Entity;
var SelectDevices = require('./SelectDevices');
var DevicesInfo = require('./DevicesInfo');

class InfoPanel extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return cE(Entity, {},
                  cE(SelectDevices, {ctx: this.props.ctx}),
                  cE(DevicesInfo, {
                      ctx: this.props.ctx,
                      deviceInfo: this.props.deviceInfo,
                      markers: this.props.markers
                  })
                 );
    }
}


module.exports = InfoPanel;
