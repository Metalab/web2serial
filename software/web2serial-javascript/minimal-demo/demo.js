var socket;
var baudrate = 9600;

$(function() {
    // When website is loaded, get the list of devices
    web2serial.get_devices(function(device_list) {
        for (var i=0; i<device_list.length; i++) {
            $("#devices").append("<p><button onclick=\"connect('" + device_list[i].hash + "')\">" + JSON.stringify(device_list[i]) + "</button></p>");
        }
    });
});

// Helper to add messages to the html document
function add_message(str) {
    $("#messages").html("<p>" + str + "</p>" + $("#messages").html());
}

// Connect to a specific serial device
function connect(device_hash) {
    socket = web2serial.open_connection(device_hash, baudrate);

    socket.onmessage = function(data) {
        add_message("msg> " + data);
    }

    socket.onopen = function(data) {
        add_message("<b>opened: " + web2serial.device_string(this.device_hash) + "</b>");
    }

    socket.onerror = function(data) {
        add_message("error> " + JSON.stringify(data));
    }

    socket.onclose = function(data) {
        add_message("close>");
    }
}

function send() {
    var msg = $("#text").val();
    socket.send(msg);
    add_message("< " + msg);
}
