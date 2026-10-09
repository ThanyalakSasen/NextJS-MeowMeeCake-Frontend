import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl แบบไม่มี i18n routing — locale อ่านจาก cookie ใน src/i18n/request.ts
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // เปิด React Compiler ให้ตรงกับต้นทาง (D3) — ต้องมี babel-plugin-react-compiler ใน devDependencies
  // + react-compiler-runtime ใน dependencies: ตั้งแต่ Next 16.3 ตั้ง target ตามเวอร์ชัน React ที่ติดตั้ง (18)
  //   โค้ดที่คอมไพล์แล้วจึง import "react-compiler-runtime" (React 19 ไม่ต้องใช้ — ลบได้ตอนย้ายไป React 19)
  reactCompiler: true,
};

export default withNextIntl(nextConfig);
