/**
 * Reference implementation of web2serial.js, which you can
 * use to build for custom web2serial apps.
 *
 * For the API documentation take a look at `web2serial.js`:
 * https://github.com/Metalab/web2serial/blob/master/software/web2serial-javascript/web2serial.js
 */

// Web2SerialSocket
var socket;

// ...
var selected_device_hash = false;
var selected_file_url = false;

// Stuff to do when website is loaded
$(function() {
    // Catch form input when user presses enter
    $("#inputform").submit(function() {
        send();
        return false;
    });

    // Choose File input handler
    document.getElementById("input-file").addEventListener("change", function(event) {
        // Remember selected file
        selected_file_url = URL.createObjectURL(event.target.files[0]);

        // Enable upload?
        if (selected_device_hash && selected_file_url) {
            $("#input-upload").removeAttr("disabled");
        }
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
            if (device_list[i].desc == "Arduino Leonardo") {
                $("#devices-list").append("<div class='device'><button type='button' id='device-" + device_list[i].hash + "' class='btn btn-default' onclick=\"select_device('" + device_list[i].hash + "')\" title='click to connect'>" + device_list[i].device + " (" + device_list[i].desc + ", " + device_list[i].hwinfo + ")</button></div>");
            }
        }

        if (device_list.length == 1) {
            select_device(device_list[0].hash);
        }
    }, true);
}

function upload() {
    // Create a Web2Serial WebSocket Connection
    socket = web2serial.open_connection(selected_device_hash, 9600);

    // Set event handlers
    socket.onmessage = function(data) {
        // Handle incoming bytes from the serial device
        add_response(data);
    };

    socket.onopen = function(event) {
        // Connection to serial device has been successfully established
        updateui_connection_established(this.device, this.baudrate);

        magicUpload(parseInt($("#input-sector").val()), selected_file_url, this, function() {
            // All done
            add_message("Upload complete", "info");
            socket.close();
        });

        // socket.send("MAGIC_PING");
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

function select_device(device_hash) {
    selected_device_hash = device_hash;

    $(".device button").each(function() { $(this).removeClass().addClass("btn btn-default"); });
    $("#device-" + device_hash).removeClass().addClass("btn btn-success");

    if (selected_device_hash && selected_file_url) {
        $("#input-upload").removeAttr("disabled");
    }
}

// Helper to add messages to the html document
function add_message(str, alert_role) {
    $("#messages").html("<div class='alert alert-" + alert_role + "' role='alert'>" + str + "</div>" + $("#messages").html());
}

function add_response(str) {
    $("#messages").html("<pre>" + str + " (" + str.length + " bytes)</pre>" + $("#messages").html());
}

// UI Update Helpers
function updateui_connection_established(device, baudrate) {
    add_message("opened: " + device.str + ", " + baudrate + " baud", "success");
    $("#device-" + device.hash).removeClass().addClass("btn btn-success");
    $("#input-sector").select();
}

function updateui_connection_error(device, error_string) {
    add_message("error: " + error_string, "danger");
    $("#device-" + device.hash).removeClass().addClass("btn btn-danger");
}

function updateui_connection_closed(device) {
    $("#input").attr("disabled", "disabled");
    $("#input-btn").attr("disabled", "disabled");
    add_message("closed: " + device.str, "danger");
}







