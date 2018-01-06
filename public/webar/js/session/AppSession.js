var cli = require('caf_cli');
var AppActions = require('../actions/AppActions');

exports.connect = function(ctx, cb) {

    var session = new cli.Session(window.location.href, null,
                                  {timeoutMsec: 60000});

    session.onopen = function() {
        console.log('open session');
        AppActions.init(ctx, cb);
    };

    session.onmessage = function(msg) {
        //        console.log('message:' + JSON.stringify(msg));
        AppActions.message(ctx, msg);
    };

    session.onclose = function(err) {
        console.log('Closing:' + JSON.stringify(err));
        AppActions.closing(ctx, err);
    };

    ctx.session = session;

    return session;
};
