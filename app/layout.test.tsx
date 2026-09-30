import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it('keeps a site without a public domain out of search results', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
  vi.resetModules();
  const { metadata } = await import('./layout');
  expect(metadata.robots).toMatchObject({ index: false, follow: false });
  expect(metadata.alternates).toBeUndefined();
});

it('uses the public domain as the canonical home URL', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://buyorrent.co.ke/');
  vi.resetModules();
  const { metadata } = await import('./layout');
  expect(metadata.alternates).toEqual({ canonical: 'https://buyorrent.co.ke/' });
  expect(metadata.robots).toMatchObject({ index: true, follow: true });
});
