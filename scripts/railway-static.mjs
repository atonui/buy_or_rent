import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve(process.env.STATIC_ROOT || 'dist/client');
const port = Number(process.env.PORT || 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
if (!(await stat(root)).isDirectory()) throw new Error(`Static root is not a directory: ${root}`);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.rsc': 'text/x-component',
};

createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
    const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    if (!file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const candidates = extname(file) ? [file] : [file, file + '.html'];
    for (const candidate of candidates) {
      try {
        const data = await readFile(candidate);
        response.writeHead(200, { 'Content-Type': types[extname(candidate)] || 'application/octet-stream' });
        response.end(request.method === 'HEAD' ? undefined : data);
        return;
      } catch (error) {
        if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error;
      }
    }
    response.writeHead(404).end('Not Found');
  } catch (error) {
    console.error(error);
    response.writeHead(500).end('Internal Server Error');
  }
}).listen(port, '0.0.0.0', () => console.log(`Static export listening on 0.0.0.0:${port}`));
