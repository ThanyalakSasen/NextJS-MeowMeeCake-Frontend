"use client";

// ─────────────────────────────────────────────────────────────
// src/hooks/useCurrentUser.ts
// ผู้ใช้ที่ login อยู่ตอนนี้ — GET /auth/me ผ่าน react-query
// revalidate อัตโนมัติเมื่อกลับมาโฟกัสแท็บ · isError = session ใช้ไม่ได้แล้ว
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { me } from "@/lib/authClient";
import type { CurrentUser } from "@/types/auth";

export const CURRENT_USER_KEY = ["auth", "me"] as const;

export function useCurrentUser() {
  const q = useQuery<CurrentUser>({
    queryKey: CURRENT_USER_KEY,
    queryFn: me,
    retry: false,           // 401 = ไม่ต้องลองซ้ำ
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  return {
    user: q.data ?? null,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  };
}
