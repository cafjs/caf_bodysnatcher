"use strict";

var React = require('react');
var rB = require('react-bootstrap');
var AppStatus = require('./AppStatus');
var DisplayError = require('./DisplayError');
var Devices = require('./Devices');
var Manage = require('./Manage');
var Parts = require('./Parts');
var DisplayCalibration = require('./DisplayCalibration');
var DisplayDevices = require('./DisplayDevices');

var cE = React.createElement;

var MyApp = {
    getInitialState: function() {
        return this.props.ctx.store.getState();
    },
    componentDidMount: function() {
        if (!this.unsubscribe) {
            this.unsubscribe = this.props.ctx.store
                .subscribe(this._onChange.bind(this));
            this._onChange();
        }
    },
    componentWillUnmount: function() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    },
    _onChange : function() {
        if (this.unsubscribe) {
            this.setState(this.props.ctx.store.getState());
        }
    },
    render: function() {
        return cE('div', {className: 'container-fluid'},
                  cE(DisplayError, {
                      ctx: this.props.ctx,
                      error: this.state.error
                  }),
                  cE(DisplayCalibration, {
                      ctx: this.props.ctx,
                      calibration: this.state.calibration,
                      showCalibration: this.state.showCalibration
                  }),
                  cE(rB.Panel, {
                      header: cE(rB.Grid, {fluid: true},
                                 cE(rB.Row, null,
                                    cE(rB.Col, {sm:1, xs:1},
                                       cE(AppStatus, {
                                           isClosed: this.state.isClosed
                                       })),
                                    cE(rB.Col, {
                                        sm: 5,
                                        xs:10,
                                        className: 'text-right'
                                    }, 'Body Snatcher Admin'),
                                    cE(rB.Col, {
                                        sm: 5,
                                        xs:11,
                                        className: 'text-right'
                                    }, this.state.fullName)
                                   )
                                )
                  },
                     cE(rB.Panel, {header: 'Manage: ' +
                                   (this.state.projectorCA ?
                                    this.state.projectorCA:
                                    'Missing Projector Name')},
                        cE(Manage, {
                            ctx: this.props.ctx,
                            calibration: this.state.calibration,
                            calibrating: this.state.calibrating,
                            localProjector: this.state.localProjector,
                            streamON: this.state.streamON
                        })),
                     cE(rB.Panel, {header: 'Add Device'},
                         cE(Devices, {
                             ctx: this.props.ctx,
                             devices: this.state.markers,
                             localDevices: this.state.localDevices
                         })),
                     cE(rB.Panel, {header: 'Parts'},
                         cE(rB.Grid, {fluid: true},
                            cE(rB.Row, null,
                               cE(rB.Col,{sm:6, xs:6},
                                  cE(DisplayDevices, {
                                      ctx: this.props.ctx,
                                      devices: this.state.markers
                                  })),
                               cE(rB.Col,{sm:6, xs:6},
                                  cE(Parts, {
                                      ctx: this.props.ctx,
                                      parts: this.state.parts
                                  }))
                              )
                           )
                       )
                    )
                 );
    }
};

module.exports = React.createClass(MyApp);
