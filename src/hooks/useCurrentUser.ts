"use client";

// ─────────────────────────────────────────────────────────────
// src/hooks/useCurrentUser.ts
// ผู้ใช้ที่ login อยู่ตอนนี้ — GET /auth/me ผ่าน react-query
// revalidate อัตโนมัติเมื่อกลับมาโฟกัสแท็บ · isError = session ใช้ไม่ได้แล้ว (401 / SESSION_INVALID เท่านั้น)
// error อื่น (เน็ตหลุด / 5xx / timeout ตอน Render ตื่น) ไม่ใช่ session หมด — ลองซ้ำ + คงข้อมูลผู้ใช้เดิมไว้
// เดิมเด้งไป login กับ error ทุกแบบ: สลับแท็บกลับมาตอนเน็ตแกว่ง (รวมกลางการขายที่ POS) ก็โดนเด้ง
// loadFailed = โหลดครั้งแรกไม่สำเร็จด้วย error อื่น (ยังไม่มีข้อมูลผู้ใช้) → ผู้เรียกแสดงปุ่มลองใหม่
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { me } from "@/lib/authClient";
import type { CurrentUser } from "@/types/auth";
import { isApiError } from "@/types/api";

import { CURRENT_USER_KEY } from "@/constants/auth";
export { CURRENT_USER_KEY };

const isSessionError = (e: unknown) => isApiError(e) && (e.status === 401 || e.code === "SESSION_INVALID");

export function useCurrentUser() {
  const q = useQuery<CurrentUser>({
    queryKey: CURRENT_USER_KEY,
    queryFn: me,
    retry: (n, e) => !isSessionError(e) && n < 2, // 401 = ไม่ต้องลองซ้ำ · error อื่นลองอีก 2 ครั้ง
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const sessionInvalid = q.isError && isSessionError(q.error);
  return {
    user: q.data ?? null,
    isLoading: q.isLoading,
    isError: sessionInvalid,
    loadFailed: q.isError && !sessionInvalid && !q.data,
    refetch: q.refetch,
  };
}
