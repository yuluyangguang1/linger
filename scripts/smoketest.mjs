// Quick static sanity check. Not shipped; only for dev.
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const ROOT = '/projects/sandbox/linger';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };

const server = http.createServer((req, res) => {
  try {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const fpath = resolve(ROOT, '.' + url);
    if (!fpath.startsWith(ROOT) || !existsSync(fpath)) { res.statusCode = 404; res.end(); return; }
    res.setHeader('Content-Type', MIME[extname(fpath)] || 'application/octet-stream');
    res.end(readFileSync(fpath));
  } catch (e) { res.statusCode = 500; res.end(String(e)); }
});

await new Promise(r => server.listen(8765, '127.0.0.1', r));

const paths = [
  '/index.html', '/src/app.js', '/src/llm-client.js', '/src/local-store.js',
  '/src/onboarding.js', '/src/style.css', '/src/assets/avatars/gf_gentle.jpg',
  '/src/assets/icons/在一起.png'
];

for (const p of paths) {
  const res = await fetch('http://127.0.0.1:8765' + p);
  const body = await res.arrayBuffer();
  console.log(String(res.status).padEnd(4), p, '— size', body.byteLength);
}

const html = readFileSync(ROOT + '/index.html', 'utf-8');
const refs = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g)).map(m => m[1])
  .filter(s => !/^https?:/.test(s) && !/^data:/.test(s) && !/^#/.test(s));
console.log('\n--- references in index.html ---');
for (const ref of refs) {
  const cleaned = ref.split('?')[0];
  const full = resolve(ROOT, cleaned);
  console.log(existsSync(full) ? 'OK  ' : 'MISS', ref);
}

server.close();
