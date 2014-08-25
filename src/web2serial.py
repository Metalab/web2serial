#!/usr/bin/env python
# encoding: utf-8
"""
web2serial.py

Cross-platform web-to-serial proxy

"""

__author__ = "Chris Hager"
__email__ = "chris@bitsworking.com"
__version__ = "0.1"

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

define("port", default=8888, help="run on the given port", type=int)

DEVICE_ID_HASH_LENGTH = 8


def get_com_ports():
    """
    Returns the currently available com ports
    """
    iterator = sorted(serial.tools.list_ports.comports())
    return [(
            hashlib.sha256(deviceid).hexdigest()[:DEVICE_ID_HASH_LENGTH],
            deviceid, desc, hwid
        ) for deviceid, desc, hwid in iterator]


def open_serial_device_by_hash(hash, baudrate):
    logging.info("open serial device by hash: %s" % hash)
    for _hash, _deviceid, _desc, _hwid in get_com_ports():
        if _hash == hash:
            logging.info("serial device found for hash: %s" % _deviceid)
            ser = serial.Serial(_deviceid, int(baudrate))
            return ser

    logging.error("serial device not found for hash %s" % hash)
    return None


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/ping", PingHandler),
            (r"/devices", DevicesHandler),
            (r"/chatsocket", ChatSocketHandler),
            (r"/device/([^/]+)/baudrate/([^/]+)", SerSocketHandler),
        ]

        settings = dict(
            cookie_secret="asdasdas87D*A8a7sd8T@*2",
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            xsrf_cookies=True,
        )
        tornado.web.Application.__init__(self, handlers, **settings)


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html", messages=ChatSocketHandler.cache)


class PingHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("pong")

class DevicesHandler(tornado.web.RequestHandler):
    def get(self):
        self.write(json.dumps(get_com_ports()))


class SerSocketHandler(tornado.web.RequestHandler):
    def __init__(self):
        self.alive = True
        self.ser = None

    def get(self, hash, baudrate):
        self.write("hash=%s, baudrate=%s" % (hash, baudrate))

    def open(self, hash, baudrate):
        """ Open serial device with baudrate """
        logging.info("WebSocket opened - hash=%s, baudrate=%s" % (hash, baudrate))

        self.ser = open_serial_device_by_hash(hash, baudrate)
        logging.info("WebSocket - Serial device opened")

        self.alive = True
        self.thread_read = threading.Thread(target=self.reader)
        self.thread_read.setDaemon(True)
        self.thread_read.setName('serial->socket')
        self.thread_read.start()

    def on_message(self, message):
        """ Web -> Serial """
        data = serial.to_bytes(message)
        logging.info("got message. writing '%s' to serial device", repr(data))
        try:
            self.ser.write(data)
        except socket.error, msg:
            # probably got disconnected
            logger.error(msg)

    def on_close(self):
        logging.info("WebSocket closed. Closing serial...")
        self.alive = False
        self.ser.close()
        self.thread_read.join()
        logging.info("Serial closed, reader thread quit.")

    def reader(self):
        """
        loop forever and copy serial->socket
        (via http://sourceforge.net/p/pyserial/code/HEAD/tree/trunk/pyserial/examples/tcp_serial_redirect.py)
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
                    self.write_message(data)
            except socket.error, msg:
                self.log.error('%s' % (msg,))
                # probably got disconnected
                break
        self.alive = False
        self.log.debug('reader thread terminated')


class ChatSocketHandler(tornado.websocket.WebSocketHandler):
    waiters = set()
    cache = []
    cache_size = 200

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}

    def open(self):
        ChatSocketHandler.waiters.add(self)

    def on_close(self):
        ChatSocketHandler.waiters.remove(self)

    @classmethod
    def update_cache(cls, chat):
        cls.cache.append(chat)
        if len(cls.cache) > cls.cache_size:
            cls.cache = cls.cache[-cls.cache_size:]

    @classmethod
    def send_updates(cls, chat):
        logging.info("sending message to %d waiters", len(cls.waiters))
        for waiter in cls.waiters:
            try:
                waiter.write_message(chat)
            except:
                logging.error("Error sending message", exc_info=True)

    def on_message(self, message):
        logging.info("got message %r", message)
        parsed = tornado.escape.json_decode(message)
        chat = {
            "id": str(uuid.uuid4()),
            "body": parsed["body"],
            }
        chat["html"] = tornado.escape.to_basestring(
           self.render_string("message.html", message=chat))

        ChatSocketHandler.update_cache(chat)
        ChatSocketHandler.send_updates(chat)



def main(options, args):
    tornado.options.parse_command_line()

    logging.info("py2serial v%s" % __version__)
    logging.info("Com ports: %s" % get_com_ports())
    logging.info("Starting server on port %s" % options.port)

    app = Application()
    app.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == '__main__':
    usage = """usage: %prog [options] arg

    Example: '%prog abc' or '%prog xyz'"""
    version = "%prog " + __version__
    parser = OptionParser(usage=usage, version=version)

    parser.add_option("-v", "--verbose", default=False,
        action="store_true", dest="verbose")

    parser.add_option("-p", "--port", default=54321, \
          dest="port")

    (options, args) = parser.parse_args()
    # if len(args) == 0:
        # parser.error("Please add at least one argument")

    main(options, args)