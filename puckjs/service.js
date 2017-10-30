var on = false;
var id =  null;
var adId = null;
var counter = 0;
var lastMsg = null;
var NAME = 'White';

var resetServices = function() {
    NRF.setServices({
        0xBCDE : {
            0xABCD : {
                value : "off",
                writable : true,
                readable: true,
                onWrite : function(evt) {
                    serviceA(evt.data);
                }
            },
            0xAAAA : {
                value : [0],
                readable: true,
                notify: true
            }
        }
    }, {advertise: ["BCDE"]});
};

var stopBlinking = function() {
    if (id) {
        clearInterval(id);
        on = false;
        LED1.write(on);
        id = null;
    }
};

var startBlinking = function() {
    if (!id) {
        id = setInterval(function() {
            on = !on;
            LED1.write(on);
        }, 500);
    }
};

var serviceA = function(data) {
    data = String.fromCharCode.apply(null, data);
    lastMsg = data;
    if (data === 'on') {
        stopBlinking();
        stopAdvertising();
        startBlinking();
    } else if (data === 'off') {
        stopBlinking();
        stopAdvertising();
    } else {
        console.log('Ooops: wrong command ' + data);
    }
};

var stopAdvertising = function() {
    if (adId) {
        clearInterval(adId);
        adId = null;
        NRF.setAdvertising({}, {interval:500, name: NAME, showName: true,
                        discoverable: true});
        resetServices();
    }
};

var getValue = function(counter) {
    if (NAME === 'red') {
        return Math.round(E.getTemperature());
    } else if (NAME === 'white') {
        return Math.round(100.0 * Puck.light());
    } else if (NAME === 'green') {
        return Puck.getBatteryPercentage();
    } else {
        return counter;
    }
};

var startAdvertising = function() {
    if (!adId) {
        adId = setInterval(function() {
            counter = (counter + 1) % 256;
            NRF.updateServices({
                0xBCDE : {
                    0xAAAA : {
                        value : [ getValue(counter) ],
                        readable: true,
                        notify: true
                    }
                }
            });
            NRF.setAdvertising({
                0xBCDE: [ getValue(counter) ]
            }, {interval:500, name: NAME, showName: true,
                discoverable: true});
        }, 2000);
    }
};

var clicked = function() {
    if (id || adId) {
        stopBlinking();
        startAdvertising();
    }
};

setWatch(clicked, BTN, { repeat: true, edge: 'rising', debounce: 50 });

resetServices();

NRF.setAdvertising({}, {name: NAME});
NRF.nfcURL("http://www.cafjs.com");
