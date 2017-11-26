var React = require('react');
var rVR = require('react-vr');
var cE = React.createElement;

class Button extends React.Component {

    constructor(props) {
        super(props);
        var self = this;
        this.state = {entered: false};
        this.styles = rVR.StyleSheet.create({
            button : {
                margin: 10, //0.05,
                height: 100,//0.4,
                opacity:0.5,
                backgroundColor: self.props.backgroundColor
            },
            buttonEntered : {
                margin:10, //0.05,
                height: 100,//0.4,
                backgroundColor: 'black'
            },
            text : {
                fontSize: 40,//0.3,
                textAlign: 'center',
                textAlignVertical: 'center',
                color: self.props.fontColor || 'white'
            }
        });
    }


    render() {
        var style = (this.state.entered ? this.styles.buttonEntered:
                     this.styles.button);
        return cE(rVR.VrButton, {style: style,
                                 onClick: () => this.props.callback(),
                                 onEnter: () => this.setState({entered: true}),
                                 onExit: () => this.setState({entered: false})
                                },
                  cE(rVR.Text, {style: this.styles.text}, this.props.text)
                 );
    }

}

module.exports = Button;
