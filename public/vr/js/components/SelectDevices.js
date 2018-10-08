var React = require('react');
var cE = React.createElement;
var aframeR = require('aframe-react');
var Entity = aframeR.Entity;

var AppActions = require('../actions/AppActions');
var devices = require('./devices');
const DEVICES = devices.DEVICES;



var allDevices = function(ctx) {
    return Object.keys(DEVICES).sort().map((x, i) =>  cE(Entity, {
        primitive: 'a-ui-button',
        key: 9232*i,
        width: 0.45,
        height: 0.3,
        'text-value': x,
        'font-color': DEVICES[x].fontColor,
        'ripple-color' : DEVICES[x].fontColor,
        color: DEVICES[x].color,
        events: {
            click: () => AppActions.setLocalState(ctx, {selectedDevice: x})
        }
    }));
};

class SelectDevices extends React.Component {

    constructor() {
        super();
    }

    render() {
        return cE(Entity, {},
                  cE(Entity, {
                      geometry : {
                          primitive: 'plane',
                          width: 0.55,
                          height: 2.2
                      },
                      material: {
                          side: 'double',
                          shader: 'flat',
                          color: '#cfcfcf',
                          transparent: true,
                          opacity: 0.5
                      },
                      position: {x: -1.35, y: 1.5, z: -3.005},
                      rotation: {x: 0, y: 30, z: 0}
                  }),
                  cE(Entity, {
                      primitive: 'a-ui-scroll-pane',
                      width: 0.5,
                      height: 2.2,
                      position: {x: -1.35, y: 1.5, z: -3},
                      rotation: {x: 0, y: 30, z: 0}
                  }, cE(Entity, {
                      class: 'container'
                  }, [
                      cE(Entity, {
                          key: 9000732,
                          primitive: 'a-text',
                          width: 0.5,
                          height: 0.3,
                          text: {
                              baseline: 'center',
                              anchor: 'center',
                              align: 'center',
                              wrapCount: 8.0,
                              value: 'Devices',
                              color: 'black'
                          }
                      })
                  ].concat(allDevices(this.props.ctx))))
                 );
    }
}

module.exports = SelectDevices;
