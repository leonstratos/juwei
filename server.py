#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys

PORT = 8000

class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

try:
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, MyHTTPRequestHandler)
    print(f"Server running at http://localhost:{PORT}")
    print("Press Ctrl+C to stop the server")
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped")
    sys.exit(0)
except OSError as e:
    if e.errno == 48:  # Address already in use
        print(f"Port {PORT} is already in use. Trying port {PORT+1}...")
        PORT += 1
        server_address = ('', PORT)
        httpd = HTTPServer(server_address, MyHTTPRequestHandler)
        print(f"Server running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever()
