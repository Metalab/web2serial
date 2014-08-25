#!/usr/bin/env python
# encoding: utf-8
"""
web2serial.py

Cross-platform web-to-serial proxy

"""

__author__ = "Chris Hager"
__email__ = "chris@bitsworking.com"
__version__ = "0.1"

import sys
import os
import yaml
from optparse import OptionParser
from pprint import pprint

CONFIG_FILE = "config.yaml"


def main(options, args):
    config = yaml.load(open(CONFIG_FILE))
    pprint(config)


if __name__ == '__main__':
    usage = """usage: %prog [options] arg

    Example: '%prog abc' or '%prog xyz'"""
    version = "%prog " + __version__
    parser = OptionParser(usage=usage, version=version)
    parser.add_option("-v", "--verbose", default=False,
        action="store_true", dest="verbose")

    (options, args) = parser.parse_args()
    if len(args) == 0:
        parser.error("Please add at least one argument")

    main(options, args)