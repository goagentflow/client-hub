/**
 * Simple djb2-style hash function
 *
 * Matches the hash used on static landing pages (goagentflow.com/p/).
 * NOT a cryptographic hash — used for client-side obfuscation only.
 * The same password produces the same hash in both the landing pages and the hub.
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(16);
}
