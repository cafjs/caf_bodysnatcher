if (typeof window !== 'undefined') {
    var app = require('./app');
    window.addEventListener('DOMContentLoaded', () => {
        app.main();
    });
};
