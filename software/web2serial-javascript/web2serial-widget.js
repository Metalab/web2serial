/**
 * web2serial-widget.js: Widget for web2serial which makes it easy to choose a device
 * and exchange data with serial devices. Recommended approach to use web2serial as
 * a developer.
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
 *     Take a look at the example implementation at
 *     https://github.com/Metalab/web2serial/blob/master/examples/websites-widget/minimal/index.html
 */

var TIMEOUT_POLL_DEVICES = 1000;

var defaultOptions = {
    // Automatically connect if only 1 serial device is found
    autoConnect: true,

    // Hide all devices with "n/a" as description
    hideUndefinedDevices: false,

    // Baudrate
    baudrate: 11400,

    // Event handlers
    onopen: function(socket) { console.log("web2serial-widget: onopen(..)", socket); },
    onclose: function(event) { console.log("web2serial-widget: onclose(..)", event); },
    onerror: function(event) { console.log("web2serial-widget: onerror(..)", event); },
    onmessage: function(data) { console.log("web2serial-widget: onmessage(" + data + ")"); },
};

var Web2SerialWidget = function(elementId, userOptions) {
    // Set options: userOptions if specified, else default options
    var options = $.extend({}, defaultOptions, userOptions || {});

    // states
    var STATE_DISCONNECTED = "disconnected";
    var STATE_CONNECTING = "connecting";
    var STATE_CONNECTED = "connected";
    var STATE_ERROR = "error";

    // current state
    var state = STATE_DISCONNECTED;
    var state_info = "";

    this.socket = undefined;
    var devices_last;
    var device_hash_connected;  // hash of last connected device

    var el = $("#" + elementId);
    el.append("<div id='web2serial-core-status'></div>");
    el.append("<div id='web2serial-devices'></div>");
    el.append("<div id='web2serial-status'></div>");

    var el_core_status = el.find("#web2serial-core-status");
    var el_status = el.find("#web2serial-status");
    var el_devices = el.find("#web2serial-devices");

    var parent = this;

    // Update UI and start web2serial interaction with checking if core is running (is_alive())
    set_state(STATE_DISCONNECTED);
    is_alive();

    // setBaudRate(baudrate) changes the baudrate. If a serial device is connected,
    // the connection will be closed and a new connection with the new baudrate
    // will be established.
    this.setBaudRate = function(baudRate) {
        options.baudrate = parseInt(baudRate);
        console.log("baudrate set to " + options.baudrate);

        if (state == STATE_CONNECTED) {
            if (this.socket) this.socket.close();
            this.connect(device_hash_connected);
        }
    }

    // Internal: Widget UI state update
    function set_state(newState, newStateInfo) {
        state = newState;
        state_info = newStateInfo;
        el_status.html(state);
        if (state_info) el_status.append(" " + state_info);

        if (state == STATE_DISCONNECTED) {
            el_status.removeClass().addClass("disconnected");
        } else if (state == STATE_CONNECTED) {
            el_status.removeClass().addClass("connected");        
        } else if (state == STATE_ERROR) {
            el_status.removeClass().addClass("error");        
        } 
    }

    // Check whether web2serial-core.py is running on the client computer
    function is_alive() {
        web2serial.is_alive(function(alive) {
            if (alive) {
                el_core_status.html("<a href='https://github.com/Metalab/web2serial'>web2serial</a> is up and running");
                el_core_status.removeClass().addClass("success");
                refresh_devices();
            } else {
                el_core_status.html("error: <a href='https://github.com/Metalab/web2serial'>web2serial</a> down");
                el_core_status.removeClass().addClass("error");
            }
            setTimeout(is_alive, TIMEOUT_POLL_DEVICES);
        });
    }

    // Get a list of connected serial devices
    function refresh_devices() {
        web2serial.get_devices(function(device_list) {
            // Only do things if list of devices has changed since last time
            if (JSON.stringify(device_list) == devices_last) {
                return;
            }

            // Remember received list of devices
            devices_last = JSON.stringify(device_list);

            // Update UI with found devices
            el_devices.html("");
            for (var i=0; i<device_list.length; i++) {
                el_devices.append('<input type="radio" name="device" value="' + device_list[i].hash + '" id="' + device_list[i].hash + '" /> <label for="' + device_list[i].hash + '">' + device_list[i].device + " (" + device_list[i].desc + ", " + device_list[i].hwinfo + ')</label><br>');
            }

            // Set click handlers to connect to the serial device
            el_devices.find("input").change(function() {
                parent.connect(this.id);
            });

            // No serial devices found...
            if (device_list.length == 0) {
                el_devices.html("no devices found");
            }

            // If only one device, and autoConnect, then autoconnect... derp
            if (device_list.length == 1 && options.autoConnect) {
                el_devices.find("#" + device_list[0].hash).prop('checked', true);
                connect(device_list[0].hash);
            }
        }, options.hideUndefinedDevices);
    }

    // Establish a connection to a specific serial device
    this.connect = function(device_hash) {
        set_state(STATE_CONNECTING);

        // Create the Web2SerialSocket
        this.socket = web2serial.open_connection(device_hash, options.baudrate);

        // Set Web2SerialSocket event handlers
        this.socket.onopen = function(event) {
            device_hash_connected = device_hash;
            set_state(STATE_CONNECTED, "(" + options.baudrate + " baud)");
            el_devices.find("#" + device_hash).prop('checked', true);

            options.onopen(parent.socket);
        };

        this.socket.onclose = function(event) {
            // console.log("web2serial socket onclose", event);
            set_state(STATE_DISCONNECTED);
            el_devices.find("input").prop('checked', false);

            options.onclose(event);
        };    

        this.socket.onerror = function(event) {
            set_state(STATE_ERROR);

            options.onerror(event);
        };

        this.socket.onmessage = function(data) {
            options.onmessage(data);
        };
    }
}
