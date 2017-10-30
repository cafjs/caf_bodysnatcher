#!/bin/bash

#At console, press ctrl-c twice for each device

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
pushd $DIR
cp ./service.js /tmp
sed -i s/White/white/g /tmp/service.js
#Puck.js a43f
../node_modules/.bin/espruino -p ec:e0:a7:d1:a4:3f -w /tmp/service.js -e "save()"

cp ./service.js /tmp
sed -i s/White/red/g /tmp/service.js
#Puck.js b8f1
../node_modules/.bin/espruino -p fb:29:7d:8e:b8:f1 -w /tmp/service.js -e "save()"

cp ./service.js /tmp
sed -i s/White/yellow/g /tmp/service.js
#Puck.js 7025
../node_modules/.bin/espruino -p fb:6b:81:7a:70:25 -w /tmp/service.js -e "save()"

cp ./service.js /tmp
sed -i s/White/green/g /tmp/service.js
#Puck.js eeb2
../node_modules/.bin/espruino -p f0:b4:da:e2:ee:b2 -w /tmp/service.js -e "save()"

popd
