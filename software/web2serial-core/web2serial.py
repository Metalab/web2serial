#!/usr/bin/env python
# encoding: utf-8
"""
web2serial.py

Cross-platform web-to-serial proxy

"""

__author__ = "Chris Hager"
__email__ = "chris@bitsworking.com"
__version__ = "0.2"

# CONFIG_FILE = "config.yaml"

import sys
import os
# import yaml
from optparse import OptionParser
from pprint import pprint

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

# Length of the device id hash
DEVICE_ID_HASH_LENGTH = 8


# Tornado Web Application Description
class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/ping", PingHandler),
            (r"/devices", DevicesHandler),
            (r"/device/([^/]+)/baudrate/([^/]+)", SerSocketHandler),
        ]

        settings = dict(
            cookie_secret="asdasdas87D*A8a7sd8T@*2",
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            xsrf_cookies=True,
        )
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
            ser = serial.Serial(_deviceid, int(baudrate))
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

    def check_origin(self, origin):
        return True

    def open(self, hash, baudrate):
        """ 
        Websocket initiated a connection. Open serial device with baudrate and start reader thread. 
        """
        logging.info("Opening serial socket (hash=%s, baudrate=%s)" % (hash, baudrate))
        try:
            self.ser = open_serial_device_by_hash(hash, baudrate)
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
        logging.info("got message '%s' from websocket", repr(message))

        # Unpack
        j = json.loads(message)
        data = str(j["msg"])
        logging.info("web -> serial: %s" % repr(data))

        # Send data to serial
        try:
            self.ser.write(data)
            logging.info("successfully sent to serial connection: '%s'" % repr(data))
        except Exception as e:
            # probably got disconnected
            logging.error(e)
            message_for_websocket = { "error": str(e) }
            self.write_message(json.dumps(message_for_websocket))
            self.close()

    def on_close(self):
        """ Close serial and quit reader thread """
        logging.info("Closing serial connection...")
        self.alive = False
        if self.ser is not None:
            self.ser.close()
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
                    logging.info("message from serial to websocket: %s" % repr(message))
                    self.write_message(json.dumps(message))
            except Exception as e:
                # probably got disconnected
                logging.error('%s' % (e,))
                message_for_websocket = { "error": str(e) }
                self.write_message(json.dumps(message_for_websocket))
                break
                
        self.alive = False
        logging.debug('reader thread terminated')


def start(port):
    # Parse command line arguments
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