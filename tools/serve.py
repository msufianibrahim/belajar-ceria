# Static file server for the Playwright tests: python -m http.server, but with a longer
# connection queue. Its default of 5 is refused outright on Windows when parallel test
# browsers load all the app's modules at once (macOS/Linux just make them wait).
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Server(ThreadingHTTPServer):
    request_queue_size = 128


port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
Server(('127.0.0.1', port), partial(SimpleHTTPRequestHandler, directory='.')).serve_forever()
