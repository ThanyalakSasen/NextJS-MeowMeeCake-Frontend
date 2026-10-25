"use client";
// ─────────────────────────────────────────────────────────────
// ShopImage — รูปของหน้าร้าน (สินค้า · แบนเนอร์ · รีวิว) ผ่าน next/image
// รูปจาก R2 (OPTIMIZED_IMAGE_HOSTS) → Next.js ย่อตามขนาดจอ (srcset จาก sizes) + แปลง WebP + แคช
//   เดิมใช้ <img> ดึง JPEG ต้นฉบับ 500–900 KB มาแสดงในการ์ดเล็ก ๆ · R2 ไม่ส่ง cache header (Lighthouse LCP 6–12 วิ)
// รูปอื่น (data: · blob: · backend localhost ตอน dev · /public) → unoptimized = เหมือน <img> เดิม
// ขนาดที่แสดงจริงคุมด้วย className (w-full h-full object-cover) — width/height แค่บอกสัดส่วน + ขนาดสูงสุดของ srcset
// รูปหลักของหน้า (LCP) ส่ง priority → preload (<link rel="preload"> ใน <head>) — browser เริ่มโหลดรูปทันทีที่อ่าน head
//   เดิม loading="eager" + fetchPriority="high" ต้องรอ parse HTML ไปถึง <img> (หน้าหลังร้านมี CSS antd inline ก่อนเนื้อหา)
//   → /owner/products รูปแรกเริ่มโหลดช้า 1.6 วิ (Lighthouse มือถือ LCP 3.6 วิ) · เอกสาร next/image: preload ห้ามใช้คู่ loading/fetchPriority
// ─────────────────────────────────────────────────────────────
import Image from "next/image";
import { IMAGE_QUALITY, isOptimizableImage } from "@/constants/images";

export default function ShopImage({
  src,
  alt,
  sizes,
  className,
  width = 800,
  height = 800,
  priority = false,
  onError,
}: {
  src: string;
  alt: string;
  /** ความกว้างที่แสดงจริงตามจอ เช่น "(min-width: 1024px) 25vw, 50vw" — ใช้เลือกไฟล์ใน srcset */
  sizes: string;
  className?: string;
  width?: number;
  height?: number;
  /** รูปหลักเหนือขอบจอ (LCP) — preload ใน <head> */
  priority?: boolean;
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
      unoptimized={!isOptimizableImage(src)}
      className={className}
      preload={priority}
      loading={priority ? undefined : "lazy"}
      onError={onError}
    />
  );
}
