import { rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const output = fileURLToPath(new URL('../dist/client/', import.meta.url));
const raw = process.env.NEXT_PUBLIC_SITE_URL;
let siteUrl;
if (raw) {
  const parsed = new URL(raw);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTPS site origin, without a path or query.');
  }
  siteUrl = `${parsed.origin}/`;
}

writeFileSync(`${output}robots.txt`, siteUrl
  ? `User-agent: *\nAllow: /\nSitemap: ${siteUrl}sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');
if (siteUrl) {
  writeFileSync(`${output}sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}</loc></url></urlset>\n`);
} else {
  rmSync(`${output}sitemap.xml`, { force: true });
}
