/*
 from https://github.com/parshap/node-libs-react-native/globals.js

(The MIT License)

Copyright (c) 2012 Tobias Koppers

*/

global.Buffer = require('buffer').Buffer;
global.process = require('process');

// Needed so that 'stream-http' chooses the right default protocol.
global.location = {
  protocol: 'file:',
};

// Some modules expect userAgent to be a string
global.navigator.userAgent = 'React Native';
