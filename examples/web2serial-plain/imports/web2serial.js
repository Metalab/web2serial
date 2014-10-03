/**
 * web2serial.js: JavaScript API client for custom web2serial apps
 *
 * About
 *
 *     You can use web2serial.js to write web apps that exchange data with serial devices.
 *     web2serial.js requires jQuery (tested with jquery-2.1.1).
 *
 *     You can exchange strings, bytes, arraybuffers, etc.
 *
 *     For an usage example see demo.js (live at http://metalab.github.io/web2serial)
 *
 * Developed in cooperation of
 *
 *     Hackerspaceshop (hackerspaceshop.com)
 *     Bits Working (bitsworking.com)
 *     Community at Metalab Hackerspace Vienna (metalab.at)
 *
 * License
 *
 *     LGPLv3 (see `LICENSE`)
 *
 * Documentation
 *
 *     web2serial.js
 *
 *         // Check whether web2serial-core is running
 *         web2serial.is_alive(function(is_alive) {
 *             if (is_alive) { ... } else { ... }
 *         });
 *
 *         // Get a list of available serial devices.
 *         // Optional argument: only_show_devices_with_description (default=false)
 *         web2serial.get_devices(function(device_list) {
 *             ...
 *         }[, only_show_devices_with_description])
 *
 *         // Open a connection to one of the devices
 *         socket = web2serial.open_connection(device_hash, baudrate);
 *
 *     Web2SerialSocket
 *
 *         // methods
 *         socket.send(data) .. send data [string, bytes, arraybuffer, ...] to the serial device
 *         socket.close([code[, reason]]) ..... close the connection with optional code and reason
 *           - default code: 1000
 *           - see https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Close_codes
 *
 *         // event listeners
 *         socket.onmessage(data) .. when a message is received from web2serial-core
 *         socket.onopen(event) .... when a connection has been opened
 *         socket.onerror(event) ... when a connection had an error
 *         socket.onclose(event) ... when a connection has been closed
 */
 // Requires jquery
if ("undefined" == typeof jQuery) throw new Error("web2serial.js requires jQuery");

var VERSION = "1.1";

// Cache of found serial devices
var devices;
var connections = new Array();

// A Device represents an attached serial device on the client
var Device = function(hash, device, desc, hwinfo) {
    this.hash = hash;
    this.device = device;
    this.desc = desc;
    this.hwinfo = hwinfo;
    this.str = "Device(" + this.hash + ", " + this.device + ", " + this.desc + ", " + this.hwinfo + ")";
}

// WebSocket wrapper for communication between JavaScript and the serial device
var Web2SerialSocket = function(device_hash, baudrate) {
    // you should overwrite this method to receive data
    this.onmessage = function(data) {};

    // overwrite these methods if you want
    this.onopen = function(event) {};
    this.onerror = function(event) {};
    this.onclose = function(event) {};

    // use `socket.send(data)` to send bytes to the serial device
    this.send = function(data) {
        msg = JSON.stringify({ "msg": data });
        console.log(msg);
        this.socket.send(msg);
    }

    // use `socket.close()` to close the WebSocket connection
    // code 1000 is normal: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Close_codes
    this.close = function(code, reason) {
        // code and reason are optional WebSocket close arguments
        if (undefined == code) {
            code = 1000;
        }
        this.socket.close(code, reason);
        this.socket = undefined;
    }

    // internals
    this.baudrate = baudrate;
    this.device = web2serial.device_by_hash(device_hash);
    this.url = "ws://localhost:54321/device/" + this.device.hash + "/baudrate/" + baudrate;
    console.log("connect: " + this.url);
    this.socket = new WebSocket(this.url);

    // make `this` accessible for inner class methods
    var parent = this;

    // Handle message from web2serial-core. Parse JSON, check if error, ...
    this.socket.onmessage = function(event) {
        // console.log("websocket message");
        // console.log(event);

        o = JSON.parse(event.data);
        if ("error" in o) {
            parent.onerror(o);
        } else if ("msg" in o) {
            parent.onmessage(o.msg);
        } else {
            console.log("onmessage - did not know what to do:");
            console.log(o);
        }
    };

    // Handle connection-opened event
    this.socket.onopen = function(event) {
        // console.log(event);
        parent.onopen(event);
    };

    // Handle error event
    this.socket.onerror = function(event) {
        // console.log(event);
        parent.onerror(event);
    };

    // Handle close event
    this.socket.onclose = function(event) {
        // console.log(event);
        parent.onclose(event);
    };

    var ping = function() {
        console.log("pinging");
        if (parent.socket) {
            parent.socket.send(JSON.stringify({ "cmd": "ping" }));
            setTimeout(ping, 1000);
        }
    }

    setTimeout(ping, 1000);
}

// web2serial API
var web2serial = {
    is_alive: function(callback) {
        // returns whether daemon is running on this client computer
        $.get("http://localhost:54321/ping", function( data ) {
            callback(true);
        }).error(function(e) {
            console.log(e);
            callback(false);
        });
    },

    /**
     * get_devices(callback, device_name_filter)
     *
     * Gets a list of devices, optional filtering with a regex
     *
     * Params:
     *
     *     device_include_filter`: `false`, or regex which needs to match device to show
     *     device_exclude_filter`: `false`, or regex which excludes the device if matched
     */
    get_devices: function(callback, device_include_filter, device_exclude_filter) {
//        console.log("get_devices", device_include_filter, device_exclude_filter);

        $.get("http://localhost:54321/devices", function( data ) {
            console.log(data);
            devices = new Array();
            var _devices = JSON.parse(data);

            // Add devices to list, with optional filtering
            for (var i=0; i<_devices.length; i++) {
                if (device_include_filter) {
                    if (!_devices[i][1].match(device_include_filter) &&
                        !_devices[i][2].match(device_include_filter) &&
                        !_devices[i][3].match(device_include_filter)) {
                        // We have a filter, but no match.
                        continue;
                    }
                }
                if (device_exclude_filter) {
                    if (_devices[i][1].match(device_exclude_filter) ||
                        _devices[i][2].match(device_exclude_filter) ||
                        _devices[i][3].match(device_exclude_filter)) {
                        // We have a filter for the excludes
                        continue;
                    }
                }
                devices.push(new Device(_devices[i][0], _devices[i][1], _devices[i][2], _devices[i][3]));
            }

            // Start the callback with the final list of devices
            callback(devices);
        });
    },

    open_connection: function(device_hash, baudrate) {
        var socket = new Web2SerialSocket(device_hash, baudrate);
        connections.push(socket);
        return socket;
    },

    device_by_hash: function(device_hash) {
        for (var i=0; i<devices.length; i++) {
            if (devices[i].hash == device_hash)
                return devices[i];
        }
    },

    widget: function(elementId, options) {
        widgetize(elementId, options);
    }
}

// Unload handler to close all connections
$( window ).unload(function() {
    for (var i=0; i<connections.length; i++) {
        connections[i].close();
    }
});
