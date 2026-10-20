import { NextIntlClientProvider } from "next-intl";

// หน้า login วาดพื้นหลังเต็มจอเอง (LoginForm — หน้าตาแบบ FrontOffice) จึงไม่ครอบ AuthLayout แล้ว
// ข้อความครบทุก namespace (root layout ส่งแค่ alert/common) · ไม่ใช้ antd
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
