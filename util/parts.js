#!/usr/bin/env node

var caf_core = require('caf_core');
var caf_comp = caf_core.caf_components;
var async = caf_comp.async;
var myUtils = caf_comp.myUtils;
var caf_cli = caf_core.caf_cli;
var srpClient = require('caf_srp').client;

var URL = 'http://root-bodysnatcher.vcap.me/#from=foo-device2&ca=foo-device2';

console.log(process.argv[2]);

var isON = (process.argv[2] == 'true');

var spec = {
    log: function(x) { console.error(x);},
    securityClient: srpClient,
    accountsURL: 'http://root-accounts.vcap.me',
    password: 'pleasechange',
    from: 'foo-device2',
//        durationInSec: 1000000,
    appLocalName: 'bodysnatcher',
    appPublisher: 'root',
    unrestrictedToken: false
};

var s = new caf_cli.Session(URL, null, spec);

s.onopen = function() {
    s.activatePartsStream(isON, function(err, state) {
        if (err) {
            console.log(myUtils.errToPrettyStr(err));
        } else {
            console.log(state);
        }
        s.close();
    });
};

s.onclose = function(err) {
    if (err) {
        console.log(myUtils.errToPrettyStr(err));
        process.exit(1);
    }
    console.log('Done OK');
};
