// ─────────────────────────────────────────────────────────────
// src/lib/queryClient.ts
// ตั้งค่า React Query กลาง — ViewModel ใช้ useQuery/useMutation ผ่าน client นี้
// ─────────────────────────────────────────────────────────────
import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/types/api";

/** retry เฉพาะ network / 5xx — 4xx (400/401/403/404/409/422) ไม่ retry */
function retryOnlyServerErrors(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  if (isApiError(error)) return error.status === 0 || error.status >= 500;
  return true;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // ถือว่า data สดใน 30 วิ (ลด refetch ซ้ำ)
        gcTime: 5 * 60_000,
        retry: retryOnlyServerErrors,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
