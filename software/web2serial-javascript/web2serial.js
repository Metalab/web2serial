/**
 * web2serial JavaScript Client
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

var Device = function(hash, device, desc, hwinfo) {
    this.hash = hash;
    this.device = device;
    this.desc = desc;
    this.hwinfo = hwinfo;
}

var Web2SerialSocket = function(device_hash, baudrate) {
    // you should overwrite this method to receive data
    this.onmessage = function(str) {};

    // overwrite these methods if you want
    this.onopen = function(event) {};
    this.onerror = function(event) {};
    this.onclose = function(event) {};

    // use `socket.send(bytestring)` to send bytes to the serial device
    this.send = function(bytestring) {
        msg = JSON.stringify({ "msg": bytestring });
        console.log(msg);
        this.socket.send(msg);
    }

    // internals
    this.device = web2serial.device_by_hash(device_hash);
    this.baudrate = baudrate;
    this.str = "Device(" + this.device.hash + ", " + this.device.device + ", " + this.device.desc + ", " + this.device.hwinfo + ")";

    this.url = "ws://0.0.0.0:54321/device/" + this.device.hash + "/baudrate/" + baudrate;
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
            console.log("onmessage - did not know what to do:");
            console.log(o);
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
    is_alive: function(callback) {
        // returns whether daemon is running on this client computer
        jqxhr = $.get("http://0.0.0.0:54321/ping", function( data ) {
            callback(true);
        }).error(function(e) { 
            console.log(e); 
            callback(false);
        });
    },

    get_devices: function(callback) {
        $.get("http://0.0.0.0:54321/devices", function( data ) {
            console.log(data);
            devices = new Array();
            var _devices = JSON.parse(data);
            for (var i=0; i<_devices.length; i++) {
                devices.push(new Device(_devices[i][0], _devices[i][1], _devices[i][2], _devices[i][3]));
            }
            callback(devices);
        });
    },

    open_connection: function(device_hash, baudrate) {
        return new Web2SerialSocket(device_hash, baudrate);
    },

    device_by_hash: function(device_hash) {
        for (var i=0; i<devices.length; i++) {
            if (devices[i].hash == device_hash)
                return devices[i];
        }
    },
}
