import fs from 'node:fs/promises';
import path from 'node:path';

const cacheDir = path.resolve(import.meta.dirname, '.pkg_cache');

// Package archives never change for a given filename, so are cached by filename.
export const packageUrlRegex = /\.(tar\.bz2|conda)$/;

export async function fetchWithCache(
  url: string,
  fetchBytes: () => Promise<Uint8Array>,
): Promise<Uint8Array> {
  const file = path.join(cacheDir, url.split('/').pop()!);
  try {
    return await fs.readFile(file);
  } catch {
    const bytes = await fetchBytes();
    const tmp = `${file}.${Math.random().toString(36).slice(2)}`;
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(tmp, bytes);
    await fs.rename(tmp, file);
    return bytes;
  }
}
