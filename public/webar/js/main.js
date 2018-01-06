if (typeof window !== 'undefined') {
    var app = require('./app');
    // use app.js directly for server side rendering
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            app.main();
        }, 1000);
    });
};
