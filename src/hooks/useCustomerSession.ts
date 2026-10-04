"use client";

// ─────────────────────────────────────────────────────────────
// src/hooks/useCustomerSession.ts
// ผู้ใช้ปัจจุบันของ "หน้าร้าน" — guest เปิดดูได้ (ไม่เด้งไป login เมื่อยังไม่ login)
// แทน useSession() ของ next-auth ที่ FrontOffice เดิมใช้ — ค่าที่คืนเลียนรูปแบบเดิม (status) ให้ย้ายหน้ามาง่าย
// ต่างจาก useCurrentUser (หลังร้าน) ที่ 401 = session หมดอายุ → เด้ง login
// ─────────────────────────────────────────────────────────────
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { meOptional, logout } from "@/lib/authClient";
import type { CurrentUser } from "@/types/auth";

export const CUSTOMER_SESSION_KEY = ["auth", "me", "optional"] as const;

export type CustomerSessionStatus = "loading" | "authenticated" | "unauthenticated";

export function useCustomerSession() {
  const qc = useQueryClient();
  const q = useQuery<CurrentUser | null>({
    queryKey: CUSTOMER_SESSION_KEY,
    queryFn: meOptional,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const user = q.data ?? null;
  const status: CustomerSessionStatus = q.isLoading ? "loading" : user ? "authenticated" : "unauthenticated";

  return {
    user,
    status,
    refetch: q.refetch,
    /** ออกจากระบบแล้วล้างข้อมูลผู้ใช้ทั้งหมดใน cache (ตะกร้า/คำสั่งซื้อ ฯลฯ) */
    signOut: async () => {
      await logout();
      qc.clear();
    },
  };
}
