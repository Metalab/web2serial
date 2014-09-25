web2serial
==========

Proxy from web to serial, to flash devices and other fun things.


Directories
-----------

* `software/web2serial-core`: Python app which bridges serial and websocket connections
* `software/web2serial-javascript`: JavaScript API client for websites
* `examples/websites`: 2 examples of using web2serial.js: Minimal and [Magic Shifter](http://www.magicshifter.net) demo
* `examples/arduino`: Arduino test code for serial communication


Getting web2serial up and running
---------------------------------

Simply get a copy of web2serial and install the two dependencies [tornado](https://github.com/tornadoweb/tornado) and [pyserial](http://pythonhosted.org/pyserial/).

    # Install Python modules tornado and py2serial
    $ sudo easy_install tornado
    $ sudo easy_install py2serial
    
    # Download and start web2serial
    $ git clone https://github.com/Metalab/web2serial.git
    $ cd web2serial/web2serial-core/
    $ python web2serial.py

You can now access the built-in web interface at http://0.0.0.0:54321 and talk with your serial devices. Furthermore
we have a JavaScript API client which you can use to your own web2serial apps.

Check out the (minimalistic) live demos: http://metalab.github.io/web2serial/examples


Using web2serial for custom websites
------------------------------------

This repository includes `web2serial.js`, a JavaScript API client which you for
custom projects that communicate with serial devices. Take a look at the
API documentation in the `web2serial.js` as well as at the example implementation:

* https://github.com/Metalab/web2serial/blob/master/software/web2serial-javascript/web2serial.js
* https://github.com/Metalab/web2serial/blob/master/examples/websites/minimal/demo.js


web2serial-core REST Interface
------------------------------

Check if web2serial-core is running

    GET /ping
    
    Returns 'pong' (200 OK)

Get a list of available serial devices

    GET /devices

    Returns JSON array of devices (200 OK)    
    [[hash, device string, desc, hwid], ...]

Open a websocket connection to a specific serial device

    SCK /device/<device-hash>/open/<baudrate>
    
    Websocket address for opening a device by hash with a specific baudrate


Authors & Contributors
======================

metachris, overflo, wizard23


License
=======

LGPLv3 (see `LICENSE`)
