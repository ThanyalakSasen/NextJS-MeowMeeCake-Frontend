// ─────────────────────────────────────────────────────────────
// ลิงก์ที่หลังร้านกรอกเอง แล้วหน้าร้านเอาไปใส่ href (เช่น ลิงก์แบนเนอร์) — รับแค่ https:// · http:// · path ในเว็บ ("/...")
// กัน javascript:/data: (สคริปต์ทำงานในเครื่องลูกค้า) และ "www.x.com" ที่ไม่มี protocol (กลายเป็นลิงก์ภายในเว็บ → 404)
// "//host" = protocol-relative ไปเว็บอื่น ไม่นับเป็น path ในเว็บ — ต้องพิมพ์ https:// ให้ชัด
// ─────────────────────────────────────────────────────────────
export function isSafeLink(raw: string | null | undefined): boolean {
  const v = raw?.trim() ?? "";
  if (!v) return false;
  if (v.startsWith("/")) return !v.startsWith("//") && !v.startsWith("/\\");
  try {
    const u = new URL(v);
    return (u.protocol === "https:" || u.protocol === "http:") && !!u.hostname;
  } catch {
    return false;
  }
}
