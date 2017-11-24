var React = require('react');
var rVR = require('react-vr');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');

var Splash = require('./Splash');
var Markers = require('./Markers');
var InfoPanel = require('./InfoPanel');
var HumanModel = require('./HumanModel');
var AppStatus = require('./AppStatus');
var Controller = require('./Controller');

var __BodySnatcherVR = function(ctx) {

    return class BodySnatcherVR extends React.Component {

        constructor() {
            super();
            this.state = ctx.store.getState();
            this.startRotation = this.startRotation.bind(this);
            this.stopRotation = this.stopRotation.bind(this);
            this._onChange = this._onChange.bind(this);
        }

        componentDidMount() {
            if (!this.unsubscribe) {
                this.unsubscribe = ctx.store.subscribe(this._onChange);
                this._onChange();
            }
        }

        componentWillUnmount() {
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }

            this.stopRotation();
        }

        _onChange() {
            if (this.unsubscribe) {
                this.setState(ctx.store.getState());
            }
        }

        startRotation() {
            if (this.state && this.state.doRotate) {
                var now = Date.now();
                var delta = now - this.state.lastUpdate;
                AppActions.setLocalState(ctx, {
                    rotation: this.state.rotation + delta / 15,
                    lastUpdate: now
                });
                this.frameHandle = requestAnimationFrame(this.startRotation);
            }
        }

        stopRotation() {
            if (this.frameHandle) {
                cancelAnimationFrame(this.frameHandle);
                this.frameHandle = null;
            }
        }

        render() {
            this.state = this.state || {};
            if (this.state.doRotate) {
                if (!this.frameHandle) {
                    setTimeout(this.startRotation, 0);
                }
            } else {
                setTimeout(this.stopRotation, 0);
            }
            if (this.state.loading) {
                return cE(Splash, null);
            } else {
                return cE(rVR.View, null,
                          cE(AppStatus, {
                              isClosed: this.state.isClosed
                          }),
                          cE(Controller, {
                              selectedDevice: this.state.selectedDevice
                          }),
                          cE(rVR.AmbientLight, {intensity: 0.6}),
                          cE(rVR.DirectionalLight, {position:[0,1,1]}),
                          cE(rVR.Pano, {source: rVR.asset('chess-world.jpg')}),
                          cE(InfoPanel, {
                              ctx: ctx,
                              deviceInfo: this.state.deviceInfo,
                              markers: this.state.markers
                          }),
                          cE(Markers, {
                              ctx: ctx,
                              offset: [0, -1, -3],
                              markers: this.state.markers,
                              selectedDevice: this.state.selectedDevice
                          }),
                          cE(HumanModel, {rotation: this.state.rotation})
                         );
            }
        }
    };

};

module.exports = __BodySnatcherVR;
