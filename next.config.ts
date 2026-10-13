import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl แบบไม่มี i18n routing — locale อ่านจาก cookie ใน src/i18n/request.ts
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // เปิด React Compiler ให้ตรงกับต้นทาง (D3) — ต้องมี babel-plugin-react-compiler ใน devDependencies
  // + react-compiler-runtime ใน dependencies: ตั้งแต่ Next 16.3 ตั้ง target ตามเวอร์ชัน React ที่ติดตั้ง (18)
  //   โค้ดที่คอมไพล์แล้วจึง import "react-compiler-runtime" (React 19 ไม่ต้องใช้ — ลบได้ตอนย้ายไป React 19)
  reactCompiler: true,

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
