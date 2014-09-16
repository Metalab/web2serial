var socket;

$(function() {
    // When website is loaded, get the list of devices
    web2serial.get_devices(show_devices);
});

function show_devices(device_list) {
    // Callback after web2serial.get_devices
    $("#devices").append(JSON.stringify(device_list));

    // Open WebSocket to last device in the list
    var hash = device_list[device_list.length - 1].hash;
}

function connect_device(device_hash) {
    socket = web2serial.open_connection(device_hash, 9600);

    // Handle received messages from the serial connection
    socket.onmessage = function onmessage(event) {
        console.log("websocket event: " + event.data);
    }

    // Handle error event
    socket.onerror = function(event) {
        console.log("onerror: " + event);
    }

    // Handle close event
    socket.onclose = function(event) {
        console.log("onclose" + event);
    }
}

function send() {
    socket.send(web2serial.jsonify("100 200"));
}
