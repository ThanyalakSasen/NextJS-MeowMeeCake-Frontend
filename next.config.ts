import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { IMAGE_CACHE_TTL_SECONDS, IMAGE_QUALITY, OPTIMIZED_IMAGE_HOSTS } from "./src/constants/images";

// next-intl แบบไม่มี i18n routing — locale อ่านจาก cookie ใน src/i18n/request.ts
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // เปิด React Compiler ให้ตรงกับต้นทาง (D3) — ต้องมี babel-plugin-react-compiler ใน devDependencies
  // + react-compiler-runtime ใน dependencies: ตั้งแต่ Next 16.3 ตั้ง target ตามเวอร์ชัน React ที่ติดตั้ง (18)
  //   โค้ดที่คอมไพล์แล้วจึง import "react-compiler-runtime" (React 19 ไม่ต้องใช้ — ลบได้ตอนย้ายไป React 19)
  reactCompiler: true,

  // รูปหน้าร้านผ่าน next/image (ShopImage) — ย่อ/แปลง WebP/แคชเฉพาะรูปจาก host ที่อนุญาต (src/constants/images.ts)
  // Lighthouse เดิม: JPEG ต้นฉบับ 500–900 KB ต่อรูป · R2 ไม่มี cache header → LCP 6–12 วิ บนมือถือ
  images: {
    remotePatterns: OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname, pathname: "/**", search: "" })),
    qualities: [IMAGE_QUALITY],
    // WebP อย่างเดียว — เปิด AVIF ด้วยจะแคชแยก 2 ชุด = ใช้โควตาแปลงรูปของ Vercel (แพ็กเกจฟรี) เป็น 2 เท่า
    formats: ["image/webp"],
    minimumCacheTTL: IMAGE_CACHE_TTL_SECONDS,
  },

  // API_PROXY_TARGET (เช่น https://meowmeecake-api.onrender.com) = ส่งต่อ /api/* ไป backend ผ่านโดเมนของ frontend เอง
  // ใช้คู่กับ NEXT_PUBLIC_API_BASE_URL=/api ตอน deploy คนละ site (vercel.app ↔ onrender.com): cookie `session`
  // ที่ backend ตั้งจะเป็นของโดเมน frontend (first-party) — ไม่งั้นเป็น third-party cookie ที่ Safari/iPhone ·
  // Chrome โหมดไม่ระบุตัวตน · เบราว์เซอร์ที่บล็อก cookie บุคคลที่สาม ไม่ส่งไปด้วย = login แล้วเด้งกลับ /login
  // ไม่ตั้ง = ไม่ส่งต่อ (dev ยิง backend ตรงตาม NEXT_PUBLIC_API_BASE_URL เหมือนเดิม)
  async rewrites() {
    const target = (process.env.API_PROXY_TARGET ?? "").trim().replace(/\/+$/, "");
    if (!target) return [];
    return [
      { source: "/api/:path*", destination: `${target}/api/:path*` },
      // ไฟล์อัปโหลดแบบ path สัมพัทธ์ของ backend (resolveUploadUrl ต่อกับ origin ว่างเมื่อ base เป็น /api)
      { source: "/uploads/:path*", destination: `${target}/uploads/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);
