/**
 * web2serial JavaScript implementation
 *
 * Requires jQuery
 *
 * Usage:
 *
 *     web2serial.get_devices(callback) ... get list of devices
 *
 *     // Get a WebSocket connection to a serial device:
 *     websocket = web2serial.open_connection(device-hash, baudrate)
 *
 * For the WebSocket API see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 *
 * WebSocket has 2 methods:
 * 
 *     void send(in DOMString data);
 *     void close(in optional unsigned long code, in optional DOMString reason);
 *
 * Sending data to the web2serial service requires a JSON object like this:
 * { "msg": "your-bytes-for-the-serial-connection" }. You can use the helper 
 * method `web2serial.jsonify(str)` to build the final JSON string.
 *
 */

var Web2SerialSocket = function(device_hash, baudrate) {
    // you should overwrite this method
    this.onmessage = function(str) {}

    // overwrite these methods if you want
    this.onopen = function(event) {}
    this.onerror = function(event) {}
    this.onclose = function(event) {}

    // use `socket.send(bytestring)` this to send bytes to the serial device
    this.send = function(bytestring) {
        msg = JSON.stringify({ "msg": bytestring });
        console.log(msg);
        this.socket.send(msg);
    }

    // internals
    this.device_hash = device_hash;
    this.baudrate = baudrate;

    this.url = "ws://0.0.0.0:54321/device/" + device_hash + "/baudrate/" + baudrate;
    console.log(this.url);

    this.socket = new WebSocket(this.url);

    var parent = this;

    // Message from web2serial service: unwrap JSON
    this.socket.onmessage = function(event) {
        console.log("websocket message");
        console.log(event);
        o = JSON.parse(event.data);
        if ("error" in o) {
            parent.onerror(o);
        } else if ("msg" in o) {
            parent.onmessage(o.msg);
        } else {
            console.log()
        }
    };

    this.socket.onopen = function(event) {
        console.log(event);
        parent.onopen(event);
    }

    // Handle error event
    this.socket.onerror = function(event) {
        console.log(event);
        parent.onerror(event);
    };

    // Handle close event
    this.socket.onclose = function(event) {
        console.log(event);
        parent.onclose(event);
    };
}

var devices;

var web2serial = {
    get_devices: function(callback) {
        $.get("http://0.0.0.0:54321/devices", function( data ) {
            console.log(data);
            devices = new Array();
            var _devices = JSON.parse(data);
            for (var i=0; i<_devices.length; i++) {
                var device = { 
                    "hash":  _devices[i][0],
                    "device": _devices[i][1],
                    "desc": _devices[i][2],
                    "hwinfo": _devices[i][3],
                }
                devices.push(device);
            }
            callback(devices);
        });
    },

    open_connection: function(device_hash, baudrate) {
        return new Web2SerialSocket(device_hash, baudrate);
    },

    get_device_by_hash: function(device_hash) {
        for (var i=0; i<devices.length; i++) {
            if (devices[i].hash == device_hash)
                return devices[i];
        }
    },

    device_string: function(device_hash) {
        var device = this.get_device_by_hash(device_hash);
        return "Device(" + device.hash + ", " + device.device + ", " + device.desc + ", " + device.hwinfo + ")";
    }
}
