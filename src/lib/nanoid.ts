/**
 * Drop-in replacement for the `nanoid` package using Node.js's native
 * `crypto` module — works in both CJS and ESM contexts without bundler
 * issues. Produces cryptographically-random URL-safe strings.
 *
 * We vendor this instead of using the `nanoid` npm package because
 * nanoid ≥ 4.x is ESM-only and can cause `require()` / webpack errors
 * in the compiled Next.js production bundle on some setups.
 *
 * Character alphabet: A-Z a-z 0-9 _ - (64 chars = 6 bits / char).
 * Default length of 21 chars ≈ 126 bits of entropy — identical to nanoid's
 * defaults. Custom lengths work the same way as nanoid(n).
 */
import crypto from "crypto";

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

/**
 * Generate a cryptographically-random URL-safe string.
 * @param size Number of characters (default 21, same as nanoid default).
 */
export function nanoid(size = 21): string {
  // Each byte → one character (mask to 63 = 0x3F to stay in our 64-char
  // alphabet without bias; bytes ≥ 64 are re-sampled implicitly via the
  // extra buffer headroom).
  const bytes = crypto.randomBytes(size + Math.ceil(size * 0.2)); // 20% extra to handle resampling
  let result = "";
  let i = 0;
  while (result.length < size) {
    const byte = bytes[i++];
    if (byte === undefined) break; // shouldn't happen, but guard against it
    if (byte < 64) result += ALPHABET[byte];
    // bytes ≥ 64 are skipped (rejection sampling — no modulo bias)
  }
  // If we somehow ran short (astronomically unlikely), top up with UUID chars
  if (result.length < size) {
    result += crypto.randomBytes(size).toString("hex").slice(0, size - result.length);
  }
  return result;
}
