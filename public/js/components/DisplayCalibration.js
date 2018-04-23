var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');
var objectAssign = require('object-assign');

var DisplayCalibration = {

    doDismiss: function(ev) {
        AppActions.setLocalState(this.props.ctx, {showCalibration: false});
    },

    render: function() {
        return cE(rB.Modal,{show: (this.props.showCalibration ? true : false),
                            onHide: this.doDismiss,
                            animation: false},
                  cE(rB.Modal.Header, {
                      className : "bg-warning text-warning",
                      closeButton: true},
                     cE(rB.Modal.Title, null, "Calibration")
                    ),
                  cE(rB.ModalBody, null,
                     cE('p', null, this.props.calibration &&
                        this.props.calibration.nInliers &&
                        '#Inliers: ' + this.props.calibration.nInliers
                       ),
                     cE('p', null, this.props.calibration &&
                        this.props.calibration.points3D &&
                        'Points3D: ' +
                        JSON.stringify(this.props.calibration.points3D)
                       ),
                     cE('p', null, this.props.calibration &&
                        this.props.calibration.viewMat &&
                        'ViewMat: ' +
                        JSON.stringify(this.props.calibration.viewMat)
                       ),
                     cE('p', null, this.props.calibration &&
                        this.props.calibration.projMat &&
                        'ProjMat: ' +
                        JSON.stringify(this.props.calibration.projMat)
                       )
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.Button, {onClick: this.doDismiss}, "Continue")
                    )
                 );
    }
};

module.exports = React.createClass(DisplayCalibration);
