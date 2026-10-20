import { NextIntlClientProvider } from "next-intl";

// ข้อความครบทุก namespace (root layout ส่งแค่ alert/common) · หน้าสมัครไม่ใช้ antd
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
