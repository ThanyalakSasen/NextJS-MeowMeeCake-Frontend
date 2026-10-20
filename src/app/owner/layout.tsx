import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { CURRENT_USER_KEY } from "@/constants/auth";
import { currentUserOnServer } from "@/lib/serverAuth";
import OwnerLayout from "@/components/shared/layout/OwnerLayout";
import { AntdProviders } from "@/components/providers/AntdProviders";

// หลังร้าน — ข้อความทุก namespace ยกเว้น shop.* (ของหน้าร้าน ~73 KB · หลังร้านไม่ใช้) + antd
// root layout ส่งข้อความแค่ alert/common และไม่มี antd (หน้าร้านสาธารณะไม่ต้องโหลด)
// ข้อความถูก serialize ไปกับ HTML ทุกหน้า — ยิ่งเล็ก browser ยิ่ง parse เร็ว (Lighthouse TBT)
export default async function Layout({ children }: { children: React.ReactNode }) {
  // ผู้ใช้ปัจจุบันฝั่ง server (src/lib/serverAuth.ts) — ได้ = HTML แรกมีโครงหน้าครบ ไม่ต้องรอ /auth/me ฝั่ง browser
  const [user, all] = await Promise.all([currentUserOnServer(), getMessages()]);
  const qc = new QueryClient();
  if (user) qc.setQueryData(CURRENT_USER_KEY, user);
  const { shop: _shop, ...messages } = all;
  void _shop;
  return (
    <NextIntlClientProvider messages={messages}>
      <HydrationBoundary state={dehydrate(qc)}>
        <AntdProviders>
          <OwnerLayout>{children}</OwnerLayout>
        </AntdProviders>
      </HydrationBoundary>
    </NextIntlClientProvider>
  );
}
