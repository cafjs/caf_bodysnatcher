#!/bin/bash
#build app
echo "browserify  -d public/js/main.js -o public/js/build.js"
browserify  -d public/js/main.js -o public/js/build.js
echo "browserify public/js/main.js | uglifyjs > public/js/build.min.js"
export NODE_ENV=production
browserify public/js/main.js | uglifyjs > public/js/build.min.js

#build iot
pushd iot
if test -f all.tgz; then
    tar xvf all.tgz
fi
rm -f *.tgz
rm -f npm-shrinkwrap.json
npm install --production
npm shrinkwrap
npm pack
cp *.tgz ../public/iot.tgz
popd

#build vr
pushd public/reactvr
yarn install --check-files --production
npm run bundle
popd

#build wear
pushd public/webar
npm install
npm run build
popd
