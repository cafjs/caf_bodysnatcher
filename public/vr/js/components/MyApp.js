
var React = require('react');
var aframe = require('aframe');
var aframeR = require('aframe-react');

// relies on globals, i.e., `window.UI` and `window.Yoga`
require('aframe-material-collection/dist/aframe-yoga-layout.js');
require('aframe-material-collection/dist/aframe-material-collection.js');

var Entity = aframeR.Entity;
var Scene = aframeR.Scene;

var cE = React.createElement;
var AppActions = require('../actions/AppActions');
var AppStatus = require('./AppStatus');
var InfoPanel = require('./InfoPanel');
var Markers = require('./Markers');

const DEVICES = require('./devices').DEVICES;
const DEFAULT_COLOR = 'blue';


class MyApp extends React.Component {

    constructor(props) {
        super(props);
        this.state = this.props.ctx.store.getState();
    }

    componentDidMount() {
        if (!this.unsubscribe) {
            this.unsubscribe = this.props.ctx.store
                .subscribe(this._onChange.bind(this));
            this._onChange();
        }
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    _onChange() {
        if (this.unsubscribe) {
            this.setState(this.props.ctx.store.getState());
        }
    }

    enterVR(ev) {
        console.log('enter VR');
        //ev.currentTarget.removeAttribute('cursor');
    }

    exitVR(ev) {
        console.log('exit VR');
        //ev.currentTarget.setAttribute('cursor', 'rayOrigin' , 'mouse');
    }

    render() {
        this.state = this.state || {};
        var dev = this.state.selectedDevice;
        var newColor = (dev && DEVICES[dev] && DEVICES[dev].color) ||
                DEFAULT_COLOR;
        return cE(Scene, {
            cursor: 'rayOrigin: mouse',
            renderer: 'antialias: true',
            events : {
                'enter-vr': this.enterVR.bind(this),
                'exit-vr': this.exitVR.bind(this)
            }},
                  cE('a-assets', null,
                     cE('img', {
                         id: 'backgroundImg',
                         src: '../../../static_assets/chess-world.jpg'
                     }),
                     cE('a-asset-item', {
                         id: 'human-obj',
                         src: '../../../static_assets/char1.obj'
                     }),
                     cE('a-asset-item', {
                         id: 'human-mtl',
                         src: '../../../static_assets/char1.mtl'
                     })
                    ),
                  cE(AppStatus, {
                          isClosed: this.state.isClosed
                      }),
                  cE(Entity, {
                      'obj-model': 'obj: #human-obj; mtl: #human-mtl',
                      position: {x: 0, y: 0.5, z: -3.0},
                      scale: '0.1 0.1 0.1'
                  }),
                  cE(Entity, {
                      primitive: 'a-sky',
                      'phi-start': 90,
                      src: '#backgroundImg'
                  }),
                  cE(Entity, {
                      light: 'type: ambient; intensity: 0.4'
                  }),
                  cE(Entity, {
                      light: 'type: directional; intensity:0.6',
                      position: '0 1 1'
                  }),
                  cE(InfoPanel, {
                      ctx: this.props.ctx,
                      deviceInfo: this.state.deviceInfo,
                      markers: this.state.markers
                  }),
                  cE(Markers, {
                      ctx: this.props.ctx,
                      offset: [0, 0.5, -3.0],
                      markers: this.state.markers,
                      selectedDevice: this.state.selectedDevice
                  }),
                  cE(Entity, {
                      'laser-controls' : 'hand: right',
                      raycaster: 'far: 10; showLine: true',
                      line:'color: ' + newColor + '; opacity: 0.75'
                  }),
                  cE(Entity, {
                      primitive: 'a-camera',
                      position: {x: 0, y: 1.5, z: -1.0}
                  })
                 );
    }
};

module.exports = MyApp;
