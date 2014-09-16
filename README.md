web2serial
==========

Proxy from web to serial, to flash devices and other fun things.


Directories
-----------

* `software/web2serial-core`: Python web2serial service which handles serial and websocket connections
* `software/web2serial-javascript`: JavaScript API client for websites to talk with a users `web2serial-core` daemon


Getting web2serial up and running
---------------------------------

Just install the dependencies [tornado](https://github.com/tornadoweb/tornado) and [pyserial](http://pythonhosted.org/pyserial/), get a copy of the code and run it.

    # Install Python modules tornado and py2serial
    $ sudo easy_install tornado
    $ sudo easy_install py2serial
    
    # Download and start web2serial
    $ git clone https://github.com/Metalab/web2serial.git
    $ cd web2serial/web2serial
    $ python web2serial.py
    
Now you can access the built-in web interface at http://0.0.0.0:54321 and talk with your serial devices.


REST Interface
--------------

Heartbeat and check if web2serial is running

    GET /ping
    
    Returns 'pong' (200 OK)

Get a device list

    GET /devices

    Returns JSON array of devices (200 OK)    
    [[hash, device string, desc, hwid], ...]

Websocket for web <--> serial communication

    SCK /device/<device-hash>/open/<baudrate>
    
    Websocket address for opening a device by hash with a specific baudrate




JavaScript Websocket Examples
=============================

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


Inspirations

* http://sourceforge.net/p/pyserial/code/HEAD/tree/trunk/pyserial/examples/tcp_serial_redirect.py


TODO
====

* Internal website GUI design
* Wrapper: Service, GUI
* Installer, Uninstaller


Authors & Contributors
======================

metachris, overflo


License
=======

LGPLv3 (see `LICENSE`)
