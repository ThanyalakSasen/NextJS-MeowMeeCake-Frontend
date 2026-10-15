"use client";
// ─────────────────────────────────────────────────────────────
// ShopImage — รูปของหน้าร้าน (สินค้า · แบนเนอร์ · รีวิว) ผ่าน next/image
// รูปจาก R2 (OPTIMIZED_IMAGE_HOSTS) → Next.js ย่อตามขนาดจอ (srcset จาก sizes) + แปลง WebP + แคช
//   เดิมใช้ <img> ดึง JPEG ต้นฉบับ 500–900 KB มาแสดงในการ์ดเล็ก ๆ · R2 ไม่ส่ง cache header (Lighthouse LCP 6–12 วิ)
// รูปอื่น (data: · blob: · backend localhost ตอน dev · /public) → unoptimized = เหมือน <img> เดิม
// ขนาดที่แสดงจริงคุมด้วย className (w-full h-full object-cover) — width/height แค่บอกสัดส่วน + ขนาดสูงสุดของ srcset
// รูปหลักของหน้า (LCP) ส่ง priority → loading="eager" + fetchPriority="high"
// ─────────────────────────────────────────────────────────────
import Image from "next/image";
import { IMAGE_QUALITY, OPTIMIZED_IMAGE_HOSTS } from "@/constants/images";

function isOptimizable(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true; // ไฟล์ใน public/ ของ frontend
  try {
    const u = new URL(src);
    return u.protocol === "https:" && OPTIMIZED_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

export default function ShopImage({
  src,
  alt,
  sizes,
  className,
  width = 800,
  height = 800,
  priority = false,
  eager = false,
  onError,
}: {
  src: string;
  alt: string;
  /** ความกว้างที่แสดงจริงตามจอ เช่น "(min-width: 1024px) 25vw, 50vw" — ใช้เลือกไฟล์ใน srcset */
  sizes: string;
  className?: string;
  width?: number;
  height?: number;
  /** รูปหลักเหนือขอบจอ (LCP) — โหลดทันทีด้วยความสำคัญสูง */
  priority?: boolean;
  /** โหลดทันทีแต่ความสำคัญปกติ — รูปที่ซ่อนอยู่ในสไลด์ (เลื่อนมาแล้วต้องขึ้นเลย ไม่ใช่เพิ่งเริ่มโหลด) */
  eager?: boolean;
  onError?: () => void;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      quality={IMAGE_QUALITY}
      unoptimized={!isOptimizable(src)}
      className={className}
      loading={priority || eager ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      onError={onError}
    />
  );
}
