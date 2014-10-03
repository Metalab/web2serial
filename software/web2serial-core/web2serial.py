#!/usr/bin/env python
# encoding: utf-8
"""
web2serial.py

    Proxy from web to serial and vice versa, to flash devices and other fun things.

    https://github.com/Metalab/web2serial

 Developed in cooperation of

     Hackerspaceshop (hackerspaceshop.com)
     Bits Working (bitsworking.com)
     Community at Metalab Hackerspace Vienna (metalab.at)

License

    LGPLv3 (see `LICENSE`)
"""

__author__ = "Chris Hager"
__email__ = "chris@bitsworking.com"
__version__ = "0.3.1"

import sys
import os
from optparse import OptionParser
from pprint import pprint
from time import sleep

import logging
import os.path
import uuid
import json
import threading
import hashlib

import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
from tornado.options import define, options

import serial
import serial.tools.list_ports

# Port for the web interface
PORT_WEB = 54321

SERIAL_SEND_TIMEOUT = 0.001  # Todo: better name (sleep() after sending a message)
SERIAL_READWRITE_TIMEOUT = 1

# Length of the device id hash
DEVICE_ID_HASH_LENGTH = 8

# Cache for last received ping (global - does not associate session with pings)
last_ping = None
connections = {
    # 'hash': web2SerialSocket
}

# Tornado Web Application Description
class Application(tornado.web.Application):
    def __init__(self):
        # URLs
        handlers = [
            (r"/", MainHandler),
            (r"/ping", PingHandler),
            (r"/devices", DevicesHandler),
            (r"/device/([^/]+)/baudrate/([^/]+)", SerSocketHandler),
        ]

        # Settings
        settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
        )

        # Init Web Application
        tornado.web.Application.__init__(self, handlers, **settings)


# Tools
def get_com_ports():
    """ Returns the available com ports with hash """
    iterator = sorted(serial.tools.list_ports.comports())
    return [(
            hashlib.sha256(deviceid).hexdigest()[:DEVICE_ID_HASH_LENGTH],
            deviceid, desc, hwid
        ) for deviceid, desc, hwid in iterator]


def open_serial_device_by_hash(hash, baudrate):
    """ Opens a serial device and returns the serial.Serial(...) connection """
    logging.info("open serial device by hash: %s" % hash)
    for _hash, _deviceid, _desc, _hwid in get_com_ports():
        if _hash == hash:
            logging.info("serial device found for hash: %s" % _deviceid)
            ser = serial.Serial(_deviceid, int(baudrate),
                timeout=SERIAL_READWRITE_TIMEOUT,
                writeTimeout=SERIAL_READWRITE_TIMEOUT)
            return ser
    raise LookupError("serial device not found for hash '%s'" % hash)


# Handlers
class SharedRequestHandler(tornado.web.RequestHandler):
    def options(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header('Access-Control-Allow-Methods', "GET, POST, OPTIONS")
        self.set_header('Access-Control-Allow-Headers', "X-Requested-With")


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html", devices=get_com_ports())


class PingHandler(SharedRequestHandler):
    def get(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.write("pong")


class DevicesHandler(SharedRequestHandler):
    def get(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.write(json.dumps(get_com_ports()))


class SerSocketHandler(tornado.websocket.WebSocketHandler):
    """
    Handler for both the websocket and the serial connection.
    """
    alive = True
    ser = None
    device_hash = None

    def check_origin(self, origin):
        return True

    def open(self, hash, baudrate):
        """
        Websocket initiated a connection. Open serial device with baudrate and start reader thread.
        """
        global connections
        logging.info("Opening serial socket (hash=%s, baudrate=%s)" % (hash, baudrate))
        self.device_hash = hash

        # Check if serial device is already opened
        if hash in connections:
            err = "Device '%s' already opened" % hash
            logging.error(err)
            self.write_message(json.dumps({ "error": str(err) }))
            self.close()
            return

        try:
            self.ser = connections[hash] = open_serial_device_by_hash(hash, baudrate)
            connections[hash] = self.ser
            logging.info("Serial device successfullyh opened (hash=%s, baudrate=%s)" % (hash, baudrate))

        except Exception as e:
            logging.exception(e)
            message_for_websocket = { "error": str(e) }
            self.write_message(json.dumps(message_for_websocket))
            self.close()
            return

        # Start the thread which reads for serial input
        self.alive = True
        self.thread_read = threading.Thread(target=self.reader)
        self.thread_read.setDaemon(True)
        self.thread_read.setName('serial->socket')
        self.thread_read.start()

    def on_message(self, message):
        """
        JSON message from the websocket is unpacked, and the byte message sent to the serial connection.
        """
        logging.info("msg from websocket: %s (len=%s)" % (repr(message), len(message)))

        # Unpack
        j = json.loads(message)
        data = bytearray(j["msg"], "raw_unicode_escape");
        logging.info("web -> serial: %s (len=%s)" % (repr(data), len(data)))

        # Send data to serial
        try:
            self.ser.write(data)
            sleep(SERIAL_SEND_TIMEOUT)
        except Exception as e:
            # probably got disconnected
            logging.error(e)
            message_for_websocket = { "error": repr(e) }
            self.write_message(json.dumps(message_for_websocket))
            # self.close()
            raise

    def on_close(self):
        """ Close serial and quit reader thread """
        global connections
        logging.info("Closing serial connection...")
        self.alive = False

        if self.ser is not None:
            self.ser.close()

        if self.device_hash in connections:
            del connections[self.device_hash]

        logging.info("Serial closed, waiting for reader thread to quit...")
        self.thread_read.join()
        logging.info("Serial closed, reader thread quit.")

    def reader(self):
        """
        Thread which reads on the serial connection. If data is received, forwards
        it to websocket.
        """
        logging.debug('reader thread started')
        while self.alive:
            try:
                data = self.ser.read(1)              # read one, blocking
                n = self.ser.inWaiting()             # look if there is more
                if n:
                    data = data + self.ser.read(n)   # and get as much as possible
                if data:
                    # escape outgoing data when needed (Telnet IAC (0xff) character)
                    # data = serial.to_bytes(self.rfc2217.escape(data))
                    message = { "msg": data }
                    logging.info("message from serial to websocket: %s (len=%s)" % (repr(message), len(message)))
                    self.write_message(json.dumps(message, encoding="raw_unicode_escape"))

            except serial.SerialException as e:
                logging.error("%s", str(e))
                # message_for_websocket = { "error": str(e) }
                # if self.alive:
                #    self.write_message(json.dumps(message_for_websocket))
                self.close()
                raise


            except Exception as e:
                # probably got disconnected
                logging.error('%s' % (e,))
                message_for_websocket = { "error": str(e) }
                if self.alive:
                    self.write_message(json.dumps(message_for_websocket))
                # self.close()
                raise

        self.alive = False
        logging.debug('reader thread terminated')


# Get web2serial-core up and running
def start(port):
    # Have tornado parse command line arguments
    tornado.options.parse_command_line()

    # Initial output
    logging.info("web2serial.py v%s" % __version__)
    logging.info("Com ports: %s" % get_com_ports())
    logging.info("Listening on http://0.0.0.0:%s" % port)

    # Start of tornado web application, and ioloop blocking method
    app = Application()
    app.listen(port)
    tornado.ioloop.IOLoop.instance().start()


# If run from command line:
if __name__ == '__main__':
    usage = """usage: %prog [options] arg

    Example: '%prog abc' or '%prog xyz'"""
    version = "%prog " + __version__
    parser = OptionParser(usage=usage, version=version)

    #parser.add_option("-v", "--verbose", default=False,
    #    action="store_true", dest="verbose")

    parser.add_option("-p", "--port", default=PORT_WEB, dest="port")

    (options, args) = parser.parse_args()
    start(options.port)
