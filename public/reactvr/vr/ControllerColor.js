var rVRWeb = require('react-vr-web');

class ControllerColor extends rVRWeb.Module {
    constructor() {
        super('ControllerColor');
    }

    init(cnt) {
        this.cnt = cnt;
    }

    changeControllerColor(color) {
        this.cnt.setColor(color);
    }
};


module.exports = ControllerColor;
