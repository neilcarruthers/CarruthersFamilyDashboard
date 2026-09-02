#!/usr/bin/env python3
"""
Carruthers Family Dashboard - Local Server & CORS Proxy
Zero external dependencies (uses Python standard library only).
Serves the web dashboard and provides a local proxy for external calendar feeds.
"""

import os
import sys
import json
import urllib.request
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS for local network and web clients
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        
        # Health check endpoint
        if parsed.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "app": "Carruthers Family Dashboard"}).encode('utf-8'))
            return

        # Local proxy for Google Calendar ICS or other external feeds
        if parsed.path == '/api/proxy':
            params = urllib.parse.parse_qs(parsed.query)
            target_url = params.get('url', [None])[0]
            
            if not target_url:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing 'url' query parameter"}).encode('utf-8'))
                return

            try:
                # Disallow non-HTTP protocols for security
                if not (target_url.startswith('http://') or target_url.startswith('https://')):
                    raise ValueError("Only http/https URLs are permitted")

                req = urllib.request.Request(
                    target_url,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': '*/*'
                    }
                )
                with urllib.request.urlopen(req, timeout=12) as response:
                    content_type = response.headers.get('Content-Type', 'text/plain; charset=utf-8')
                    body = response.read()
                    
                    self.send_response(response.status)
                    self.send_header('Content-Type', content_type)
                    self.end_headers()
                    self.wfile.write(body)
                    return
            except Exception as e:
                self.send_response(502)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Proxy fetch failed: {str(e)}"}).encode('utf-8'))
                return

        # Fall back to standard static file serving
        return super().do_GET()

def run(port=PORT):
    server_address = ('', port)
    try:
        httpd = HTTPServer(server_address, DashboardHandler)
        print(f"=======================================================")
        print(f"  Carruthers Family Dashboard is running!")
        print(f"  Local URL:   http://localhost:{port}")
        print(f"  Network URL: http://0.0.0.0:{port}")
        print(f"  Serving directory: {DIRECTORY}")
        print(f"  Press Ctrl+C to stop the server.")
        print(f"=======================================================")
        httpd.serve_forever()
    except OSError as e:
        if port < 8090:
            print(f"Port {port} is in use, trying {port + 1}...")
            run(port + 1)
        else:
            print(f"Error starting server: {e}")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\nShutting down dashboard server. Warm wishes!")
        sys.exit(0)

if __name__ == '__main__':
    run()
