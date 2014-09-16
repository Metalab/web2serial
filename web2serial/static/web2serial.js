var devices = new Array();
var baudrate = 9600;
var socket;

$(document).ready(function() {
    $("#inputform").live("submit", function() {
        return sendMessage();
    });

    refresh_device_list();
});

function sendMessage() {
    var msg = $("#input").val();
    var message = { "msg": msg };
    console.log(message);

    socket.send(JSON.stringify(message));

    // Empty input field and set focus
    $("#input").val("").select();

    // Add send message to messages list
    $("#messages").html("< " + msg + "<br>" + $("#messages").html());

    // Announce that form submission has already been handled (avoids redirect)
    return false;
}

function setBaudrate() {
    br = parseInt(window.prompt("Set Baudrate:", baudrate));
    if (!isNaN(br)) {
        baudrate = br;
        $("#baudrate").html(baudrate);
    }
}

function device_list_clear() {
    $(".device-item").each(function( index, el ) {
        el.remove();
    });
}

function device_list_update() {
    for (var i=0; i<devices.length; i++) {
        var item = $("<a href=\"javascript:openDevice('" + devices[i].hash + "')\" class='list-group-item device-item'><b>" + devices[i].device + "</b>, " + devices[i].desc + ", " + devices[i].hwinfo + " <span class='pull-right glyphicon glyphicon-comment'></span></a>");
        $("#device-list").append(item);
    }
}

function refresh_device_list() {
    device_list_clear();

    $.get("/devices", function( data ) {
        devices = new Array();
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
        device_list_update();
    });
}

function openDevice(hash) {
    var device;
    for (var i=0; i<devices.length; i++) {
        if (devices[i].hash == hash) {
            device = devices[i];
            break;
        }
    }

    console.log("device: " + device);

    var url = "ws://" + location.host + "/device/" + hash + "/baudrate/" + baudrate;
    console.log(url);

    socket = new WebSocket(url);
    socket.onmessage = function(event) {
        console.log(event.data);
        $("#messages").html("> " + event.data + "<br>" + $("#messages").html());
    }

    $("#device-name").html(device.device);
    $("#device-infos").html(device.desc + ", " + device.hwinfo);
    $("#messages").html("");
    $("#comm").show();
    $("#comm").find("input[type=text]").val("").select();
}
