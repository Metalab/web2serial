var socket;
var baudrate = 9600;

$(function() {
    // When website is loaded, get the list of devices
    refresh_devices();

    $("#inputform").live("submit", function() {
        return send();
    });
});

function refresh_devices() {
    web2serial.get_devices(function(device_list) {
        $("#devices-list").html("");
        for (var i=0; i<device_list.length; i++) {
            $("#devices-list").append("<div class='device'><button type='button' id='device-" + device_list[i].hash + "' class='btn btn-default' onclick=\"connect('" + device_list[i].hash + "')\">" + device_list[i].device + " (" + device_list[i].desc + ", " + device_list[i].hwinfo + ")</button></div>");
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
    $("#device-" + device_hash).addClass("btn-warning");

    // Create a Web2Serial WebSocket Connection
    socket = web2serial.open_connection(device_hash, baudrate);
    socket.onmessage = function(data) {
        add_message("<div class='alert alert-info' role='alert'>received: " + this.data + "</div>");
    };
    socket.onopen = function(data) {
        add_message("<div class='alert alert-success' role='alert'>opened: " + this.str + ", " + this.baudrate + " baud</div>");
        $("#device-" + device_hash).removeClass().addClass("btn btn-success");
        $("#input").val("").select();
    };
    socket.onerror = function(data) {
        add_message("<div class='alert alert-danger' role='alert'>error: " + JSON.stringify(data) + "</div>");
        $("#device-" + device_hash).removeClass().addClass("btn btn-danger");
    };
    socket.onclose = function(data) {
        add_message("<div class='alert alert-info' role='alert'>closed: " + this.str + "</div>");
    };
}

// Send bytes to the serial device via form
function send() {
    var msg = $("#input").val();
    socket.send(msg);
    add_message("<div class='alert alert-info' role='alert'>sent: " + msg + "</div>");
    $("#input").val("").select();
    return false;
}
