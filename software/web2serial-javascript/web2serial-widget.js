var TIMEOUT_IS_ALIVE_POLL = 1000000;

var Web2SerialWidget = function(elementId, userOptions) {
    // Default options
    var options = {
        autoConnect: true,  // if only 1 device

        baudrate: 9600,
        onopen: function(device_hash, socket) { console.log("web2serial-widget: onopen(" + device_hash + ")"); },
        onclose: function(event) { console.log("web2serial-widget: onclose(" + event + ")"); },
        onerror: function(event) { console.log("web2serial-widget: onerror(" + event + ")"); },
        onmessage: function(data) { console.log("web2serial-widget: onmessage(" + data + ")"); },
    };

    // Overwrite default options with user supplied options
    for (var attrname in userOptions) { options[attrname] = userOptions[attrname]; }

    // states
    var STATE_DISCONNECTED = "disconnected";
    var STATE_CONNECTING = "connecting";
    var STATE_CONNECTED = "connected";
    var STATE_ERROR = "error";

    // current state
    var state = STATE_DISCONNECTED;
    var state_info = "";

    var socket;
    var devices_last;

    var el = $("#" + elementId);
    el.html("");
    el.append("<div id='web2serial-core-status'></div>");
    el.append("<div id='web2serial-devices'></div>");
    el.append("<div id='web2serial-status'></div>");
    el.append("<div id='web2serial-messages'></div>");

    var el_core_status = el.find("#web2serial-core-status");
    var el_status = el.find("#web2serial-status");
    var el_devices = el.find("#web2serial-devices");
    var el_messages = el.find("#web2serial-messages");

    // Update UI and start web2serial interaction with checking if core is running (is_alive())
    set_state(STATE_DISCONNECTED);
    is_alive();

    function set_state(newState, newStateInfo) {
        state = newState;
        state_info = newStateInfo;
        el_status.html(state);
        if (state_info) el_status.append( + " " + state_info);

        if (state == STATE_DISCONNECTED) {
            el_status.removeClass().addClass("disconnected");
        } else if (state == STATE_CONNECTED) {
            el_status.removeClass().addClass("connected");        
        } else if (state == STATE_ERROR) {
            el_status.removeClass().addClass("error");        
        } 
    }

    function is_alive() {
        web2serial.is_alive(function(alive) {
            if (alive) {
                el_core_status.html("web2serial is up and running");
                el_core_status.removeClass().addClass("success");
                refresh_devices();
            } else {
                el_core_status.html("error: web2serial down");
                el_core_status.removeClass().addClass("error");
            }
            setTimeout(is_alive, TIMEOUT_IS_ALIVE_POLL);
        });
    }

    function refresh_devices() {
        web2serial.get_devices(function(device_list) {
            if (JSON.stringify(device_list) == devices_last) {
                return;
            }
            devices_last = JSON.stringify(device_list);

            el_devices.html("");
            for (var i=0; i<device_list.length; i++) {
                el_devices.append('<input type="radio" name="device" value="' + device_list[i].hash + '" id="' + device_list[i].hash + '" /> <label for="' + device_list[i].hash + '">' + device_list[i].device + " (" + device_list[i].desc + ", " + device_list[i].hwinfo + ')</label><br>');
            }

            el_devices.find("input").change(function() {
                connect(this.id);
            })

            if (device_list.length == 0) {
                el_devices.html("no devices found");
            }

            if (device_list.length == 1) {
                el_devices.find("#" + device_list[0].hash).prop('checked', true);
                if (options.autoConnect) {
                    connect(device_list[0].hash);
                }
            }
        }, true);
    }

    function connect(device_hash) {
        set_state(STATE_CONNECTING);

        // Open the WebSocket
        socket = web2serial.open_connection(device_hash, options.baudrate);

        // set WebSocket event handlers
        socket.onopen = function(event) {
            set_state(STATE_CONNECTED);
            options.onopen(device_hash, this);
        };

        socket.onclose = function(event) {
            set_state(STATE_DISCONNECTED);
            el_devices.find("input").prop('checked', false);
            options.onclose(event);
        };    

        socket.onerror = function(event) {
            set_state(STATE_ERROR);
            options.onerror(event);
        };

        socket.onmessage = function(data) {
            options.onmessage(data);
        };
    }
}
