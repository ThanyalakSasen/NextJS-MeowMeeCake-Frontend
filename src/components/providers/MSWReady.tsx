"use client";

// ─────────────────────────────────────────────────────────────
// src/components/providers/MSWReady.tsx
// เมื่อ NEXT_PUBLIC_API_MOCK=1 → รอ MSW worker start ให้เสร็จก่อน mount แอป
// (กัน request แรก ๆ หลุดออกไปก่อน mock จะพร้อม)
// เมื่อ mock ปิด → render children ทันที (import msw ไม่ถูกดึงเข้า bundle)
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";

const MOCK_ENABLED = process.env.NEXT_PUBLIC_API_MOCK === "1";

export function MSWReady({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!MOCK_ENABLED);

  useEffect(() => {
    if (!MOCK_ENABLED) return;
    let active = true;
    import("@/mocks/browser")
      .then(({ startMockWorker }) => startMockWorker())
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
