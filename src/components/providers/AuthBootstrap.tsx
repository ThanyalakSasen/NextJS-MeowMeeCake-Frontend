"use client";

// ─────────────────────────────────────────────────────────────
// src/components/providers/AuthBootstrap.tsx
// ต่อสาย interceptor 401→refresh + ฟัง logout ข้ามแท็บ — mount ครั้งเดียวใน providers
// ไม่ render อะไร
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { installAuthInterceptor, onAuthBroadcast } from "@/lib/authClient";
import { LOGIN_PATH } from "@/constants/auth";

export function AuthBootstrap() {
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    const uninstall = installAuthInterceptor(() => {
      qc.clear();
      router.replace(`${LOGIN_PATH}?reason=expired`);
    });
    const off = onAuthBroadcast((msg) => {
      if (msg.type === "logout") {
        qc.clear();
        router.replace(LOGIN_PATH);
      }
    });
    return () => {
      uninstall();
      off();
    };
  }, [router, qc]);

  return null;
}
