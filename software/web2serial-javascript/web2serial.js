/**
 * web2serial JavaScript implementation
 *
 * Requires jQuery
 *
 * Usage:
 *
 *     web2serial.devices(callback) ... get list of devices
 *
 *     // Opening a connection to a serial device
 *     conn = web2serial.connect(device-hash, baudrate, onmessage-callback)
 *     conn.sendMessage(bytes-for-serial-device)
 *
 */
var web2serial = {
    devices: function(callback) {
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
    }
}