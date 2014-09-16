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

// TODO: Web2Serial
var web2serial = {
    get_devices: function(callback) {
        $.get("http://0.0.0.0:54321/devices", function( data ) {
            console.log(data);
            var devices = new Array();
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
        var url = "ws://0.0.0.0:54321/device/" + device_hash + "/baudrate/" + baudrate;
        console.log(url);

        socket = new WebSocket(url);
        socket.web2serial 
        return socket;
    },

    jsonify: function(str) {
        return JSON.stringify({ "msg": str });
    }
}
