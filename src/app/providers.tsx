"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/queryClient";
import { AuthBootstrap } from "@/components/providers/AuthBootstrap";
import { LazyAlertHost } from "@/components/shared/feedback/LazyAlertHost";

// provider กลางของทุกหน้า — เบาที่สุดเท่าที่ทำได้ (หน้าร้านสาธารณะไม่ใช้ antd)
// antd (theme/locale/dayjs) อยู่ที่ AntdProviders ใน layout ที่ใช้จริง: /owner · /profile · /customer/account
export default function Providers({ children }: { children: React.ReactNode }) {
  // client เดียวตลอด lifetime ของหน้า (อย่าสร้างใหม่ทุก render)
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      {children}
      {/* modal ของ alert.* / confirmAlert / ConfirmDeletePopup ทั้งแอป — โหลด antd เมื่อมี alert ครั้งแรก (src/lib/alert.ts) */}
      <LazyAlertHost />
    </QueryClientProvider>
  );
}
