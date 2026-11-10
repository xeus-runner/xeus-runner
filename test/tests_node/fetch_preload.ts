import { fetchWithCache, packageUrlRegex } from '../pkg_cache.ts';

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = input.toString();
  if (!packageUrlRegex.test(url)) {
    return originalFetch(input, init);
  }
  const bytes = await fetchWithCache(url, async () => {
    const response = await originalFetch(input, init);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  });
  return new Response(new Uint8Array(bytes));
};
