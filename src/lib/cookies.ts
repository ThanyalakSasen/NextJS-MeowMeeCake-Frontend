// ─────────────────────────────────────────────────────────────
// src/lib/cookies.ts
// อ่าน/เขียน cookie ฝั่ง client (กัน SSR — guard typeof document)
// ─────────────────────────────────────────────────────────────

export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function writeCookie(
  name: string,
  value: string,
  opts: { maxAgeSeconds?: number; path?: string } = {},
): void {
  if (typeof document === "undefined") return;
  const parts = [`${name}=${encodeURIComponent(value)}`, `path=${opts.path ?? "/"}`, "samesite=lax"];
  if (opts.maxAgeSeconds != null) parts.push(`max-age=${opts.maxAgeSeconds}`);
  document.cookie = parts.join("; ");
}
