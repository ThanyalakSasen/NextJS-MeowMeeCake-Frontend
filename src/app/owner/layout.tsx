import { NextIntlClientProvider } from "next-intl";
import OwnerLayout from "@/components/shared/layout/OwnerLayout";
import { AntdProviders } from "@/components/providers/AntdProviders";

// หลังร้าน — ข้อความทุก namespace (provider นี้รับ messages ทั้งชุดจาก src/i18n/request.ts เอง)
// + antd · root layout ส่งข้อความแค่ alert/common และไม่มี antd (หน้าร้านสาธารณะไม่ต้องโหลด)
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider>
      <AntdProviders>
        <OwnerLayout>{children}</OwnerLayout>
      </AntdProviders>
    </NextIntlClientProvider>
  );
}
