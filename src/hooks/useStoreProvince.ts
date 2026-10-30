"use client";
// จังหวัดในที่อยู่ร้าน (ใช้แทนคำว่า "จังหวัดร้าน" ในป้าย/ข้อความ) — ยังไม่ได้ตั้งที่อยู่ = DEFAULT_STORE_PROVINCE
// cache ร่วมกับ useLocalOnlyShipping / หน้าติดต่อเรา (key เดียวกัน)
import { useQuery } from "@tanstack/react-query";
import { storeInfoService } from "@/services/storeInfo";
import { DEFAULT_STORE_PROVINCE } from "@/constants/shipping";
import { storeInfoKey } from "@/app/customer/lib/catalogQueries";

export function useStoreProvince(): string {
  const q = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000 });
  return q.data?.address?.province?.trim() || DEFAULT_STORE_PROVINCE;
}
