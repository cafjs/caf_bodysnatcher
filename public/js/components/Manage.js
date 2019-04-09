var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');
var objectAssign = require('object-assign');
var urlParser = require('url');

var Manage = {

    handleStream: function() {
        var streamON =  this.refs.stream.getChecked();
        AppActions.activatePartsStream(this.props.ctx, streamON);
    },

    handleChessBoard: function() {
        var chessboard =  this.refs.chessboard.getChecked();
        AppActions.showChess(this.props.ctx, chessboard);
    },

    handleNodisplay: function() {
        var nodisplay =  this.refs.nodisplay.getChecked();
        AppActions.nodisplay(this.props.ctx, nodisplay);
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

    doResetCalibration: function() {
         AppActions.resetCalibration(this.props.ctx);
    },

    doVR: function() {
        if (window && window.location && window.location.href) {
            var myURL = urlParser.parse(window.location.href);
            myURL.pathname = '/vr/index.html';
            myURL.hash = myURL.hash.replace('session=default', 'session=vr');
            delete myURL.search; // delete cacheKey
            window.open(urlParser.format(myURL), '_blank');
        }
    },

     doAR: function() {
        if (window && window.location && window.location.href) {
            var myURL = urlParser.parse(window.location.href);
            myURL.pathname = '/webar/index.html';
            myURL.hash = myURL.hash.replace('session=default', 'session=ar');
            delete myURL.search; // delete cacheKey
            window.open(urlParser.format(myURL), '_blank');
        }
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
                      cE(rB.Col, {sm:2, xs:6},
                         cE(rB.Button, {
                             className: 'lowerInRow',
                             onClick: this.doProjectorName
                         }, "Update")
                        ),

                      cE(rB.Col, {sm:2, xs:2},
                         cE(rB.Input, {
                             label: 'Streaming',
                             type: 'checkbox',
                             ref: 'stream',
                             checked: this.props.streamON,
                             onChange: this.handleStream
                         })
                        ),
                      cE(rB.Col, {sm:2, xs:2},
                         cE(rB.Input, {
                             label: 'ChessBoard',
                             type: 'checkbox',
                             ref: 'chessboard',
                             checked: this.props.calibrating,
                             onChange: this.handleChessBoard
                         })
                        ),
                      cE(rB.Col, {sm:2, xs:2},
                         cE(rB.Input, {
                             label: 'No Display',
                             type: 'checkbox',
                             ref: 'nodisplay',
                             checked: this.props.nodisplay,
                             onChange: this.handleNodisplay
                         })
                        ),
                      cE(rB.Col, {sm:6, xs:12},
                         cE(rB.ButtonGroup, {className: 'lowerInRow'},
                            cE(rB.Button, {
                                bsStyle: 'primary',
                                onClick: this.doSnapshot
                            }, "Snapshot"),
                            cE(rB.Button, {
                                bsStyle: (this.props.calibrating ? 'danger' :
                                          'info'),
                                onClick: this.doCalibrate
                            }, "Calibrate"),
                            cE(rB.Button, {
                                bsStyle: (this.props.calibrating ? 'danger' :
                                          'primary'),
                                onClick: this.doShowCalibration
                            }, "Show Calibration"),
                            cE(rB.Button, {
                                bsStyle: 'danger' ,
                                onClick: this.doResetCalibration
                            }, "Reset"),
                            cE(rB.Button, {
                                bsStyle: 'info',
                                onClick: this.doVR
                            }, "Show VR"),
                            cE(rB.Button, {
                                bsStyle: 'primary',
                                onClick: this.doAR
                            }, "Show AR")
                           )
                        )
                     )
                  );
    }
};

module.exports = React.createClass(Manage);
