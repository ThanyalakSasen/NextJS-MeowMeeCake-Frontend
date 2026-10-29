"use client";
// จังหวัดตามที่อยู่ร้าน (ข้อมูลร้าน) — ใช้แทนคำว่า "จังหวัดร้าน" ในข้อความ เช่น "ส่งได้เฉพาะในจังหวัดหนองคาย"
// ร้านยังไม่ได้ตั้งที่อยู่ / โหลดไม่ได้ = ใช้ DEFAULT_STORE_PROVINCE · cache ร่วมกับหน้าร้าน (storeInfoKey)
import { useQuery } from "@tanstack/react-query";
import { storeInfoService } from "@/services/storeInfo";
import { DEFAULT_STORE_PROVINCE } from "@/constants/shipping";
import { storeInfoKey } from "@/app/customer/lib/catalogQueries";

export function useStoreProvince(): string {
  const infoQ = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000 });
  return infoQ.data?.address?.province?.trim() || DEFAULT_STORE_PROVINCE;
}
