web2serial
==========

Proxy from web to serial, to flash devices and other fun things.


Directories
-----------

* `software/web2serial-core`: Python app which bridges serial and websocket connections
* `software/web2serial-javascript`: JavaScript API client for websites
* `examples/website-widget`: Example of how to use the web2serial widget (`web2serial-widget.js`)
* `examples/websites`: Two examples of using `web2serial.js`: Generic and Magic Shifter
* `examples/arduino`: Arduino projects for serial communication


Getting web2serial-core up and running
--------------------------------------

Simply get a copy of web2serial and install the two dependencies [tornado](https://github.com/tornadoweb/tornado) and [pyserial](http://pythonhosted.org/pyserial/).

    # Install Python modules tornado and py2serial
    $ sudo easy_install tornado
    $ sudo easy_install py2serial
    
    # Download and start web2serial
    $ git clone https://github.com/Metalab/web2serial.git
    $ cd web2serial/web2serial-core/
    $ python web2serial.py


Using web2serial for custom websites
------------------------------------

This repository includes `web2serial.js`, a JavaScript API client which you for
custom projects to communicate with serial devices. T

Perhaps the easiest way is using the `web2serial-widget.js` library. See:

* https://github.com/Metalab/web2serial/blob/master/examples/websites-widget/minimal/index.html
* https://github.com/Metalab/web2serial/blob/master/software/web2serial-javascript/web2serial-widget.js

And this is the underlying `web2serial.js` API client and example implementation:

* https://github.com/Metalab/web2serial/blob/master/software/web2serial-javascript/web2serial.js
* https://github.com/Metalab/web2serial/blob/master/examples/websites/minimal/demo.js

Live demos can be found here:

* http://metalab.github.io/web2serial/examples/websites/minimal
* http://metalab.github.io/web2serial/examples/websites/magicshifter
* http://metalab.github.io/web2serial/examples/website-widget


web2serial-core.py REST Interface
---------------------------------

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

* Overflo (http://www.hackerspaceshop.com)
* Chris Hager (http://www.bitsworking.com)
* wizard23 (http://www.magicshifter.net)
* Community at the Metalab Vienna Hackerspace


License
=======

LGPLv3 (see `LICENSE`)
