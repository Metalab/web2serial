web2serial
==========

Proxy from web to serial, to flash devices and other fun things.


Authors & Contributors
======================

metachris, overflo


License
=======

LGPLv3 (see `LICENSE`).


web2serial library
==================

Dependencies: [tornado](https://github.com/tornadoweb/tornado)

Port Number: 54321

REST Interface

    GET /ping         Heartbeat, Check if exists
    GET /devices      Returns list of devices

    SCK /device/<device-id>/open/<baudrate>    Websocket Address for opening a device by id (with baudrate)


jQuery GET example (http://api.jquery.com/jquery.get/):

    var jqxhr = $.get("/ping", function() {
        alert( "success" );
    })
    .done(function() {
        alert( "second success" );
    })
    .fail(function() {
        alert( "error" );
    })
    .always(function() {
        alert( "finished" );
    });


Websocket JavaScript Example:

    var ws = new WebSocket("ws://localhost:8888/websocket");
    ws.onopen = function() {
       ws.send("Hello, world");
    };
    ws.onmessage = function (evt) {
       alert(evt.data);
    };
