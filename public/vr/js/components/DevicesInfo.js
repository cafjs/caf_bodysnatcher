var React = require('react');
var cE = React.createElement;
var aframeR = require('aframe-react');
var Entity = aframeR.Entity;

var AppActions = require('../actions/AppActions');
const DEVICES = require('./devices').DEVICES;
const PENDING = '???';

var formatNumber = function(x) {
    if (x === PENDING) {
        return x;
    } else {
        return ((!x || Number.isInteger(x)) ? x : (Math.floor(x*100)/100));
    }
};

var allData = function(ctx, deviceInfo, markers) {
    var all = Object.keys(deviceInfo)
            .filter(x => deviceInfo[x].advertisement &&
                    deviceInfo[x].advertisement.serviceData &&
                    markers[x])
            .sort();
    var result = all.map(function(x, i) {
        var data = deviceInfo[x].advertisement.serviceData;
        data = (data[0] && data[0].data && data[0].data[0]);
        data = (!data && (typeof data !== 'number') ? PENDING : data);
        return cE(Entity, {
            key: 923127*i,
            width: 0.45,
            height: 0.3,
            primitive: 'a-ui-button',
            disabled: true,
            'text-value':  DEVICES[x].type + ': ' + formatNumber(data) +
                DEVICES[x].unit,
            color: DEVICES[x].color,
            'font-color': DEVICES[x].fontColor
        }

                 );
    });
    return result;
};

class DevicesInfo extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidUpdate() {
        if (this.elRef) {
            var container =  this.elRef.components["ui-scroll-pane"] &&
                    this.elRef.components["ui-scroll-pane"].container;
            if (container && container.yoga_node) {
                container.childNodes.forEach(function(child){
                    if (child.yoga_node) {
                        container.yoga_node.removeChild(child.yoga_node);
                        delete child.yoga_node;
                    }
                });
                delete container.yoga_node;
                this.elRef.components["ui-scroll-pane"].updateContent();
            }
        }
    }

    update(el) {
        this.elRef = el;
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
                      position: {x: 1.35, y: 1.5, z: -3.005},
                      rotation: {x: 0, y: 330, z: 0}
                  }),
                  cE(Entity, {
                      primitive: 'a-ui-scroll-pane',
                      width: 0.5,
                      height: 2.2,
                      position: {x: 1.35, y: 1.5, z: -3},
                      rotation: {x: 0, y: 330, z: 0},
                      _ref: this.update.bind(this)
                      /*,
                      'ui-yoga': {
                          justifyContent: 'space-around',
                          flexDirection: 'column',
                          alignContent: 'auto',
                          flexWrap: 'wrap'
                      }*/
                  }, cE(Entity, {
                      class: 'container'
                  }, [
                      cE(Entity, {
                          key: 8000732,
                          primitive: 'a-text',
                          width: 0.5,
                          height: 0.3,
                          text: {
                              baseline: 'center',
                              anchor: 'center',
                              align: 'center',
                              wrapCount: 8.0,
                              value: 'Data',
                              color: 'black'
                          }
                      })
                  ].concat(allData(this.props.ctx, this.props.deviceInfo,
                                   this.props.markers))
                       )
                    )
                 );
    }
}

module.exports = DevicesInfo;
