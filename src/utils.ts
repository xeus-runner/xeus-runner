/**
 * Byte-level search for a subarray in a larger typed array without string conversion.
 */
export function indexOfBytes(haystack: Uint8Array, needle: Uint8Array): number {
  if (needle.length === 0) return 0;
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

export function isNode(): boolean {
  const g = globalThis as any;
  return typeof g.process !== 'undefined' && typeof g.process.versions?.node === 'string';
}

const ansiEscapeRegex = /\x1b\[[^m]*m/g;

export function removeAnsiEscapeCodes(text: string): string {
  return text.replace(ansiEscapeRegex, '');
}
