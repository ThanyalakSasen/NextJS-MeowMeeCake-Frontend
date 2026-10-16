import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import OwnerLayout from "@/components/shared/layout/OwnerLayout";
import { AntdProviders } from "@/components/providers/AntdProviders";

// หลังร้าน — ข้อความทุก namespace ยกเว้น shop.* (ของหน้าร้าน ~73 KB · หลังร้านไม่ใช้) + antd
// root layout ส่งข้อความแค่ alert/common และไม่มี antd (หน้าร้านสาธารณะไม่ต้องโหลด)
// ข้อความถูก serialize ไปกับ HTML ทุกหน้า — ยิ่งเล็ก browser ยิ่ง parse เร็ว (Lighthouse TBT)
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { shop: _shop, ...messages } = await getMessages();
  void _shop;
  return (
    <NextIntlClientProvider messages={messages}>
      <AntdProviders>
        <OwnerLayout>{children}</OwnerLayout>
      </AntdProviders>
    </NextIntlClientProvider>
  );
}
