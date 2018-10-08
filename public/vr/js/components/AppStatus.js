var React = require('react');
var cE = React.createElement;
var aframeR = require('aframe-react');
var Entity = aframeR.Entity;


class AppStatus extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (this.props.isClosed ?
                cE(Entity, {},
                   cE(Entity, {
                       geometry : {primitive: 'box', width: 3.8, height: 0.8,
                                   depth:0.1},
                       material: {color: 'yellow'},
                       position: {x: 0, y: 2, z: -2.75}

                   }),
                   cE(Entity, {
                       text: {
                           value: 'Please reload',
                           align: 'center',
                           wrapCount: 15.0,
                           color: 'red',
                           width: 5.0
                       },
                       position:{x: 0, y: 2, z: -2.7}
                   })
                  ) :
                cE(Entity, null));
    }
}

module.exports = AppStatus;
