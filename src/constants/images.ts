// ─────────────────────────────────────────────────────────────
// src/constants/images.ts — host ของรูปอัปโหลดที่ให้ Next.js ย่อ/แปลงรูป (next/image) ได้
// ใช้ทั้ง next.config.ts (images.remotePatterns) และ ShopImage (ตัดสินว่าจะ optimize หรือปล่อยผ่าน)
//
// ค่าเริ่มต้น = public bucket ของ R2 (S3_PUBLIC_URL_BASE ของ backend) · เปลี่ยน/เพิ่มด้วย env
//   NEXT_PUBLIC_IMAGE_HOSTS=pub-xxx.r2.dev,cdn.example.com   (คั่นด้วยจุลภาค · hostname เท่านั้น)
// ระบุ host ตรงตัวเสมอ ไม่ใช้ wildcard (*.r2.dev) — /_next/image เปิดสาธารณะ ใครก็ขอย่อรูปจาก host ที่อนุญาตได้
// รูปจาก host อื่น (backend localhost ตอน dev · data: · blob:) ShopImage ส่งแบบ unoptimized
// ─────────────────────────────────────────────────────────────
const DEFAULT_IMAGE_HOSTS = ["pub-532ee3faa882438bb6441b549140fa85.r2.dev"];

export const OPTIMIZED_IMAGE_HOSTS: string[] = (
  process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? ""
)
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean)
  .concat(process.env.NEXT_PUBLIC_IMAGE_HOSTS ? [] : DEFAULT_IMAGE_HOSTS);

/**
 * คุณภาพที่อนุญาต (Next 16 บังคับต้องระบุ) — ใช้ค่าเดียว ไม่ให้มีคนขอหลายคุณภาพเปลืองโควตาแปลงรูป
 * 60 (เดิม 75): รูปขนมเป็นภาพถ่ายรายละเอียดเยอะ WebP 640px ที่ 75 = ~116 KB · รูปหลักของหน้าโหลดช้าบนมือถือ (Lighthouse LCP)
 */
export const IMAGE_QUALITY = 60;

/** รูปนี้ให้ Next.js ย่อได้ไหม — ไฟล์ใน public/ หรือ https จาก host ที่อนุญาต (อย่างอื่นส่งแบบ unoptimized) */
export function isOptimizableImage(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const u = new URL(src);
    return (
      u.protocol === "https:" && OPTIMIZED_IMAGE_HOSTS.includes(u.hostname)
    );
  } catch {
    return false;
  }
}

/** ไฟล์อัปโหลดได้ชื่อใหม่ทุกครั้ง (เวลา + สุ่ม) URL เดิมไม่เปลี่ยนเนื้อหา → แคชรูปที่ย่อแล้วนานได้ */
export const IMAGE_CACHE_TTL_SECONDS = 31 * 24 * 60 * 60;
