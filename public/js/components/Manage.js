var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');
var objectAssign = require('object-assign');

var Manage = {

    handleStream : function() {
        var streamON =  this.refs.stream.getChecked();
        AppActions.activatePartsStream(this.props.ctx, streamON);
    },

    doCalibrate: function() {
        AppActions.calibrate(this.props.ctx);
    },

    doSnapshot: function() {
        AppActions.snapshot(this.props.ctx);
        AppActions.setLocalState(this.props.ctx, {showSnapshot: true});
    },

    doShowCalibration: function() {
        AppActions.setLocalState(this.props.ctx, {showCalibration: true});
    },

    handleProjectorName: function() {
        var projectorName =  this.refs.projName.getValue();
        AppActions.setLocalState(this.props.ctx,
                                 {localProjector: projectorName});
    },

    doProjectorName: function() {
        var projectorName =  this.refs.projName.getValue();
        if (projectorName) {
            AppActions.setProjectorCA(this.props.ctx, projectorName);
        } else {
            var err = new Error('Missing arguments');
            AppActions.setError(this.props.ctx, err);
        }
    },

    render: function() {
        return  cE(rB.Grid, {fluid: true},
                   cE(rB.Row, null,
                      cE(rB.Col, {sm:3, xs:6},
                        cE(rB.Input, {
                            label: 'Projector Name',
                            type: 'text',
                            ref: 'projName',
                            value: this.props.localProjector,
                            onChange: this.handleProjectorName
                        })
                        ),
                      cE(rB.Col, {sm:2, xs:4},
                         cE(rB.Button, {
                             className: 'lowerInRow',
                            onClick: this.doProjectorName
                        }, "Update")
                       ),

                     cE(rB.Col, {sm:1, xs:2},
                        cE(rB.Input, {
                            className: 'lowerInRow',
                            label: 'Streaming',
                            type: 'checkbox',
                            ref: 'stream',
                            checked: this.props.streamON,
                            onChange: this.handleStream
                            //onClick: this.handleStream
                        })
                       ),
                     cE(rB.Col, {sm:2, xs:6},
                        cE(rB.Button, {
                            className: 'lowerInRow',
                            bsStyle: 'primary',
                            onClick: this.doSnapshot
                        }, "Snapshot")
                       ),
                      cE(rB.Col, {sm:4, xs:6},
                         cE(rB.ButtonGroup, {className: 'lowerInRow'},
                            cE(rB.Button, {
                                bsStyle: (this.props.calibrating ? 'danger' :
                                          'primary'),
                                onClick: this.doCalibrate
                            }, "Calibrate"),
                            cE(rB.Button, {
                                bsStyle: (this.props.calibrating ? 'danger' :
                                          'info'),
                                onClick: this.doShowCalibration
                            }, "Show Calibration")
                           )
                        )
                     )
                  );
    }
};

module.exports = React.createClass(Manage);
