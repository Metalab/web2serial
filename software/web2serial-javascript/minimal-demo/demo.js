var socket;
var baudrate_default = 9600;

// Stuff to do when website is loaded
$(function() {
    // Catch form input when user presses enter
    $("#inputform").submit(function() {
        send();
        return false;
    });

    // Set default baudrate
    $("#input-baudrate").val(baudrate_default);

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

// Helper to add messages to the html document
function add_message(str) {
    $("#messages").html(str + $("#messages").html());
}

// Connect to a specific serial device
function connect(device_hash) {
    // Update UI
    $(".device button").each(function() { $(this).removeClass().addClass("btn btn-default"); });
    $("#input").attr("disabled", "disabled");
    $("#input-btn").attr("disabled", "disabled");

    // Create a Web2Serial WebSocket Connection
    socket = web2serial.open_connection(device_hash, $("#input-baudrate").val());

    // Set handlers
    socket.onmessage = function(data) {
        // Incoming bytes from the serial device
        add_message("<div class='alert alert-info' role='alert'>received: " + data + "</div>");
    };
    socket.onopen = function(event) {
        // Connection has successfully opened
        add_message("<div class='alert alert-success' role='alert'>opened: " + this.device.str + ", " + this.baudrate + " baud</div>");
        $("#device-" + device_hash).removeClass().addClass("btn btn-success");
        $("#input").removeAttr("disabled");
        $("#input-btn").removeAttr("disabled");
        $("#input").select();
    };
    socket.onerror = function(event) {
        // Error handling
        add_message("<div class='alert alert-danger' role='alert'>error: " + JSON.stringify(event) + "</div>");
        $("#device-" + device_hash).removeClass().addClass("btn btn-danger");
    };
    socket.onclose = function(event) {
        // Connection closed
        add_message("<div class='alert alert-info' role='alert'>closed: " + this.device.str + "</div>");
        $("#input").attr("disabled", "disabled");
        $("#input-btn").attr("disabled", "disabled");
    };
}

// Send message from input field to the serial device
function send() {
    var msg = $("#input").val();
    socket.send(msg);
    add_message("<div class='alert alert-info' role='alert'>sent: " + msg + "</div>");
    $("#input").val("").select();
}
