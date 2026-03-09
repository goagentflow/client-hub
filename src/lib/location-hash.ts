const MAGIC_VERIFY_HASH_RE = /^#verify=([a-f0-9]{64})$/i;

export function extractMagicVerifyToken(hash: string): string | null {
  const match = MAGIC_VERIFY_HASH_RE.exec(hash);
  return match ? match[1] : null;
}

export function sanitizeSensitiveHash(hash: string): string {
  return MAGIC_VERIFY_HASH_RE.test(hash) ? "" : hash;
}
