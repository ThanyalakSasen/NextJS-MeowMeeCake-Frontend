// ─────────────────────────────────────────────────────────────
// compressImage — ย่อรูปฝั่ง browser ก่อนอัปโหลด
//
// อัปโหลดวิ่งผ่าน Vercel (rewrite /api/* → backend) ซึ่งรับ body ได้ไม่เกิน 4.5 MB ต่อ request
// เกินนั้น Vercel ตอบ 413 ก่อนถึง backend (เพดาน backend 5 MB/ไฟล์) — รูปจากมือถือ/กล้องมัก 5–15 MB
// จึงย่อด้านยาวสุดไม่เกิน MAX_SIDE แล้วเข้ารหัสใหม่ (WebP · Safari ที่ไม่รองรับ → JPEG)
// ไฟล์ที่เล็กพอและไม่ใหญ่เกินขนาดอยู่แล้วส่งตัวเดิม (ไม่เสียคุณภาพ)
// ─────────────────────────────────────────────────────────────

/** ต่ำกว่าเพดาน Vercel (4.5 MB) เผื่อ header/boundary ของ multipart */
export const UPLOAD_SAFE_BYTES = 4 * 1024 * 1024;
/** ด้านยาวสุด — แบนเนอร์เต็มจอ 2x ยังคมพอ */
const MAX_SIDE = 2560;
const QUALITIES = [0.85, 0.75, 0.6];
/** ไฟล์เล็กกว่านี้ส่งตัวเดิมเลย แม้ด้านจะยาวเกิน (ไม่ต้องเสียเวลาเข้ารหัสใหม่) */
const SKIP_BELOW_BYTES = 1024 * 1024;

const RESIZABLE = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File): Promise<File> {
  if (!RESIZABLE.has(file.type) || file.size <= SKIP_BELOW_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // ถอดรหัสไม่ได้ (เช่น AVIF บนเบราว์เซอร์เก่า) — ส่งตัวเดิมให้ backend ตัดสิน
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= UPLOAD_SAFE_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Safari เข้ารหัส WebP ไม่ได้ (toBlob คืน PNG) → ใช้ JPEG แทน · JPEG ไม่มีพื้นโปร่ง จึงลงพื้นขาวไว้ใต้รูป
  let type = "image/webp";
  let blob = await toBlob(canvas, type, QUALITIES[0]);
  if (!blob || blob.type !== type) {
    type = "image/jpeg";
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    blob = await toBlob(canvas, type, QUALITIES[0]);
  }
  for (const q of QUALITIES.slice(1)) {
    if (!blob || blob.size <= UPLOAD_SAFE_BYTES) break;
    blob = await toBlob(canvas, type, q);
  }
  // เข้ารหัสใหม่แล้วใหญ่กว่าเดิม (รูปเล็กที่บีบมาแล้ว) — ใช้ตัวเดิม
  if (!blob || blob.size >= file.size) return file;

  const ext = type === "image/webp" ? ".webp" : ".jpg";
  const name = file.name.replace(/\.[^.]+$/, "") + ext;
  return new File([blob], name, { type, lastModified: file.lastModified });
}
