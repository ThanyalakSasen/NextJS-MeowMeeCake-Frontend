"use client";
// โลโก้ร้านในหน้าร้าน (BACKLOG3-merge D9) — แทน FrontOffice StoreLogo (zustand store) ด้วย React Query cache เดียวทั้งหน้า
// GET /catalog/store-logo → { url, updated_at } · src คิดใน storeLogoSrc (โหลดไม่ได้ = โลโก้เริ่มต้น)
import { useQuery } from "@tanstack/react-query";
// import ตรงไฟล์ ไม่ผ่าน barrel @/components/base (ดึง antd ทั้งชุดมาด้วย)
import { Logo } from "@/components/base/Logo";
import { storeInfoService } from "@/services/storeInfo";
import { storeLogoKey } from "@/app/customer/lib/catalogQueries";
import { storeLogoSrc } from "@/app/customer/lib/storeFormat";

export default function StoreLogo({ size }: { size: number }) {
  const q = useQuery({ queryKey: storeLogoKey, queryFn: storeInfoService.logo, staleTime: 10 * 60_000, retry: false });
  return <Logo size={size} src={storeLogoSrc(q.data)} />;
}
