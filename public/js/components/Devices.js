var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');
var objectAssign = require('object-assign');
var mapHuman = require('./mapHuman.js');

var VALID_COLORS = {
    'red': true,
    'yellow': true,
    'green': true,
    'blue': true
};

var Devices = {

     handleName : function() {
        var dev = objectAssign({}, this.props.localDevices, {
            name: this.refs.nameDevice.getValue()
        });
        AppActions.setLocalState(this.props.ctx, {localDevices: dev});
     },

    handlePart : function() {
        var dev = objectAssign({}, this.props.localDevices, {
            part: this.refs.partDevice.getValue()
        });
        AppActions.setLocalState(this.props.ctx, {localDevices: dev});
    },

    handleColor : function() {
        var dev = objectAssign({}, this.props.localDevices, {
            color: this.refs.colorDevice.getValue()
        });
        AppActions.setLocalState(this.props.ctx, {localDevices: dev});
    },


    doAdd: function() {
        if (!VALID_COLORS[this.props.localDevices.color]) {
            var err = new Error('Invalid Color: pick one from ' +
                                JSON.stringify(Object.keys(VALID_COLORS)));
             AppActions.setError(this.props.ctx, err);
        } else if (typeof mapHuman.partToId[this.props.localDevices.part] !== 'number') {
            err = new Error('Invalid Part: pick one from ' +
                            JSON.stringify(Object.keys(mapHuman.partToId)));
            AppActions.setError(this.props.ctx, err);
        } else if (!this.props.localDevices.name) {
            err = new Error('Missing name');
            AppActions.setError(this.props.ctx, err);
        } else {
            AppActions.setMarker(this.props.ctx, this.props.localDevices.name,
                                 {part: mapHuman
                                  .partToId[this.props.localDevices.part],
                                  offset: [0,0,0]},
                                 this.props.localDevices.color, true);
        }
    },

    doDelete: function() {
        if (!this.props.localDevices.name) {
            var err = new Error('Missing name');
            AppActions.setError(this.props.ctx, err);
        } else {
            AppActions.deleteMarker(this.props.ctx,
                                    this.props.localDevices.name);
        }
    },

    render: function() {
        return cE(rB.Grid, {fluid: true},
                  cE(rB.Row, null,
                     cE(rB.Col, {xs:4, sm:3},
                        cE(rB.Input, {
                            label: 'Name',
                            type: 'text',
                            ref: 'nameDevice',
                            value: this.props.localDevices.name,
                            onChange: this.handleName
                        })),
                     cE(rB.Col, {xs:4, sm:3},
                        cE(rB.Input, {
                            label: 'Part',
                            type: 'text',
                            ref: 'partDevice',
                            value: this.props.localDevices.part,
                            onChange: this.handlePart
                        })),
                     cE(rB.Col, {xs:4, sm:2},
                        cE(rB.Input, {
                            label: 'Color',
                            type: 'text',
                            ref: 'colorDevice',
                            value: this.props.localDevices.color,
                            onChange: this.handleColor
                        })),
                     cE(rB.Col, {xs: 4, sm:2},
                        cE(rB.Button, {
                            className: 'lowerInRow',
                            bsStyle: 'primary',
                            onClick: this.doAdd
                        }, "Add")
                       ),
                     cE(rB.Col, {xs: 4, sm: 2},
                        cE(rB.Button, {
                            className: 'lowerInRow',
                            bsStyle: 'danger',
                            onClick: this.doDelete
                        }, "Delete")
                       )
                    )
                 );
    }

};

module.exports = React.createClass(Devices);
