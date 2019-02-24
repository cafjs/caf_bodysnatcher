if (typeof window !== 'undefined') {
    if (global) {
        global.TWEEN = require('@tweenjs/tween.js');
    }
    var app = require('./app');
    window.addEventListener('DOMContentLoaded', () => {
        app.main();
    });
};
