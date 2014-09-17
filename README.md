web2serial
==========

Proxy from web to serial, to flash devices and other fun things.


Directories
-----------

* `software/web2serial-core`: Python web2serial service which handles serial and websocket connections
* `software/web2serial-javascript`: JavaScript API client for websites to talk with a users `web2serial-core` service


Getting web2serial up and running
---------------------------------

Just install the dependencies [tornado](https://github.com/tornadoweb/tornado) and [pyserial](http://pythonhosted.org/pyserial/), get a copy of the code and run it.

    # Install Python modules tornado and py2serial
    $ sudo easy_install tornado
    $ sudo easy_install py2serial
    
    # Download and start web2serial
    $ git clone https://github.com/Metalab/web2serial.git
    $ cd web2serial/web2serial-core/
    $ python web2serial.py

Now you can access the built-in web interface at http://0.0.0.0:54321 and talk with your serial devices. Furthermore
we have a JavaScript API client with which you can develop your own apps. Take a look at the minimal JavaScript demo 
in `software/web2serial-javascript/minimal-demo/demo.html`.


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
