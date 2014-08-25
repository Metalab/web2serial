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

import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
from tornado.options import define, options

import serial
import serial.tools.list_ports

define("port", default=8888, help="run on the given port", type=int)


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/chatsocket", ChatSocketHandler),
        ]

        settings = dict(
            cookie_secret="asdasdas87D*A8a7sd8T@*2",
            template_path=os.path.abspath(os.path.join(os.path.dirname(__file__), "templates")),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            xsrf_cookies=True,
        )
        print settings
        print os.path.dirname(__file__)
        tornado.web.Application.__init__(self, handlers, **settings)


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html", messages=ChatSocketHandler.cache)


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


def get_com_ports():
    """
    Returns the currently available com ports
    """
    return sorted(serial.tools.list_ports.comports())


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