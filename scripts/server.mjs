/** Loopback-only development server. Serves src/ and watches edits on browser refresh. */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
};
// Also accept the standard --port flag used by preview tools.
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 3000);
const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end('Method not allowed');
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    return response.end('Bad request');
  }
  const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!path.startsWith(resolve(root) + sep) || !types[extname(path)]) {
    response.writeHead(404);
    return response.end('Not found');
  }
  try {
    const content = await readFile(path);
    response.writeHead(200, {
      'Content-Type': types[extname(path)] + '; charset=utf-8',
      'Content-Length': content.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
server.on('error', (error) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `Port ${port} is busy. Stop the old server, or run PORT=3001 npm start.`
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () =>
  console.log(
    `HomeReady is running at http://localhost:${server.address().port}\nEdit src/, save, then refresh the browser. Ctrl+C to stop.`,
  ),
);
