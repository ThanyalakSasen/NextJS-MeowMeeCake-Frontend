// ─────────────────────────────────────────────────────────────
// thumbSrc — URL รูปย่อผ่าน image optimizer ของ Next (WebP ขนาดพอดีที่แสดง) สำหรับคอมโพเนนต์ที่ต้องการ src
// เป็น string (เช่น antd <Image> ที่มี preview) · host ที่ไม่อนุญาต (src/constants/images.ts) คืน src เดิม
// เดิมหน้ารายงานความคิดเห็นโหลดรูปต้นฉบับจาก R2 (สูงสุด ~700 KB/รูป รวม 2.7 MB) มาแสดง 48px
// ─────────────────────────────────────────────────────────────
import { getImageProps } from "next/image";
import { IMAGE_QUALITY, isOptimizableImage } from "@/constants/images";

/** size = ขนาดที่แสดง (px) — ได้ไฟล์ 2 เท่าสำหรับจอความละเอียดสูง */
export function thumbSrc(src: string, size: number): string {
  if (!isOptimizableImage(src)) return src;
  return getImageProps({ src, alt: "", width: size, height: size, quality: IMAGE_QUALITY }).props.src;
}
