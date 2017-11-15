var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');
var objectAssign = require('object-assign');

var DisplaySnapshot = {

    id: null,

    doDismiss: function(ev) {
        if (this.id) {
            clearInterval(this.id);
            this.id = null;
        }
        AppActions.setLocalState(this.props.ctx, {showSnapshot: false});
    },

    render: function() {
        var self = this;
        var dataURL = null;
        if (this.props.showSnapshot) {
            dataURL = (this.props.snapshot && this.props.snapshot.data ?
                       'data:image/jpeg;charset=utf-8;base64,' +
                       this.props.snapshot.data : null);
            if (!this.id) {
                this.id = setInterval(function() {
                    AppActions.getSnapshot(self.props.ctx);
                }, 2000);
            }
        } else {
            if (this.id) {
                clearInterval(this.id);
                this.id = null;
            }
        }
        return cE(rB.Modal,{show: (this.props.showSnapshot ? true : false),
                            onHide: this.doDismiss,
                            animation: false},
                  cE(rB.Modal.Header, {closeButton: true},
                     cE(rB.Modal.Title, null, "Snapshot")
                    ),
                  cE(rB.ModalBody, null,
                     (dataURL ? cE(rB.Image, {src: dataURL, responsive: true}) :
                      cE('p', null, 'Waiting for image...')
                     )
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.Button, {onClick: this.doDismiss}, "Continue")
                    )
                 );
    }
};

module.exports = React.createClass(DisplaySnapshot);
