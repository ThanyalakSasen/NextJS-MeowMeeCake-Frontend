import { NextIntlClientProvider } from "next-intl";
import { AntdProviders } from "@/components/providers/AntdProviders";

// /profile ใช้ antd (ปุ่ม/แท็ก) + ข้อความหลาย namespace — root layout ไม่มีทั้งสองอย่างแล้ว
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider>
      <AntdProviders>{children}</AntdProviders>
    </NextIntlClientProvider>
  );
}
