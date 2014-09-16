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
 *     ws_conn = web2serial.open_connection(device-hash, baudrate, onmessage_callback)
 *
 */
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

    open_connection: function(device_hash, baudrate, onmessage_callback) {
        var url = "ws://0.0.0.0:54321/device/" + device_hash + "/baudrate/" + baudrate;
        console.log(url);

        socket = new WebSocket(url);
        socket.onmessage = onmessage_callback;
        return socket;
    }
}