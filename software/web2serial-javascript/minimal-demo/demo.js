/**
 * Reference implementation of web2serial.js, which you can
 * use to build for custom web2serial apps.
 *
 * For the API documentation take a look at `web2serial.js`:
 * https://github.com/Metalab/web2serial/blob/master/software/web2serial-javascript/web2serial.js
 */

// Web2SerialSocket
var socket;

// Stuff to do when website is loaded
$(function() {
    var a = "\x01";
    console.log("a='" + a + "', len=" + a.length);

    // Catch form input when user presses enter
    $("#inputform").submit(function() {
        send();
        return false;
    });

    // Check whether web2serial-core is running
    web2serial.is_alive(function(is_alive) {
        if (is_alive) {
            $("#alert-running").show();
            refresh_devices();
        } else {
            $("#alert-not-running").show();
        }
    });
});

// Refresh list of devices
function refresh_devices() {
    web2serial.get_devices(function(device_list) {
        $("#devices-list").html("");
        for (var i=0; i<device_list.length; i++) {
            $("#devices-list").append("<div class='device'><button type='button' id='device-" + device_list[i].hash + "' class='btn btn-default' onclick=\"connect('" + device_list[i].hash + "')\" title='click to connect'>" + device_list[i].device + " (" + device_list[i].desc + ", " + device_list[i].hwinfo + ")</button></div>");
        }
    });    
}

// Connect to a specific serial device
function connect(device_hash) {
    updateui_connect(device_hash);

    // Create a Web2Serial WebSocket Connection
    socket = web2serial.open_connection(device_hash, $("#input-baudrate").val());

    // Set event handlers
    socket.onmessage = function(data) {
        // Handle incoming bytes from the serial device
        add_message("received: " + data, "info");
    };

    socket.onopen = function(event) {
        // Connection to serial device has been successfully established
        updateui_connection_established(this.device, this.baudrate);
    };

    socket.onerror = function(event) {
        // Connection had an error
        updateui_connection_error(this.device, JSON.stringify(event));
    };

    socket.onclose = function(event) {
        // Connection was closed
        updateui_connection_closed(this.device);
    };
}

// Send message from input field to the serial device
function send() {
    var msg = $("#input").val();
    socket.send(msg);
    add_message("sent: " + msg, "info");
    $("#input").val("").select();
}

// Send message from input field to the serial device
function send_bytes() {
    socket.send("MAGIC_UPLOAD");
    socket.send("\x01"); // 1 byte
    socket.send("\x03"); // 1 byte
    socket.send("\xff"); // 1 byte
    socket.send("\xbb"); // 1 byte
}

// Helper to add messages to the html document
function add_message(str, alert_role) {
    $("#messages").html("<div class='alert alert-" + alert_role + "' role='alert'>" + str + "</div>" + $("#messages").html());
}

// UI Update Helpers
function updateui_connect(device_hash) {
    $(".device button").each(function() { $(this).removeClass().addClass("btn btn-default"); });
    $("#input").attr("disabled", "disabled");
    $("#input-btn").attr("disabled", "disabled");
}

function updateui_connection_established(device, baudrate) {
    add_message("opened: " + device.str + ", " + baudrate + " baud", "success");
    $("#device-" + device.hash).removeClass().addClass("btn btn-success");
    $("#input").removeAttr("disabled");
    $("#input-btn").removeAttr("disabled");
    $("#input").select();
}

function updateui_connection_error(device, error_string) {
    add_message("error: " + error_string, "danger");
    $("#device-" + device.hash).removeClass().addClass("btn btn-danger");
}

function updateui_connection_closed(device) {
    $("#input").attr("disabled", "disabled");
    $("#input-btn").attr("disabled", "disabled");
    add_message("closed: " + device.str, "info");
}
