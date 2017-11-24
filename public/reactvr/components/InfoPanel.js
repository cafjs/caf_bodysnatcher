var React = require('react');
var rVR = require('react-vr');
var cE = React.createElement;
var SelectDevices = require('./SelectDevices');
var DevicesInfo = require('./DevicesInfo');

class InfoPanel extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return cE(rVR.CylindricalPanel, {
            layer: {width: 920, height: 720},
            style: {transform: [{translate: [0, 0, -1]}]}
        },
                  cE(rVR.View, {
                      style: {
                          flex:1,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          width:920
                      }
                  },
                     cE(SelectDevices, {ctx: this.props.ctx}),
                     cE(DevicesInfo, {
                         ctx: this.props.ctx,
                         deviceInfo: this.props.deviceInfo,
                         markers: this.props.markers
                     })
                    )
                 );
    }
}

module.exports = InfoPanel;
