"use client";
// ─────────────────────────────────────────────────────────────
// ล็อกอินอัตโนมัติตอนลูกค้าเปิดหน้าร้านจาก Rich Menu ใน LINE (LIFF · src/lib/liff.ts)
// guest + เปิดในแอป LINE → id_token ของ LIFF → POST /auth/line/liff → cookie `session` → อัปเดต session ในหน้า
// ลองครั้งเดียวต่อการโหลดหน้า — ลูกค้ากดออกจากระบบแล้วไม่ล็อกอินกลับเองจนกว่าจะเปิดใหม่
// ไม่ได้อยู่ในแอป LINE = ไม่ทำอะไร (ไม่โหลด SDK) · พัง = เงียบ ลูกค้ายังกดเข้าสู่ระบบด้วย LINE เองได้
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomerSession, CUSTOMER_SESSION_KEY } from "@/hooks/useCustomerSession";
import { loginWithLiff } from "@/lib/authClient";
import { ensureLiff, isInLineApp, liffIdToken } from "@/lib/liff";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";

let attempted = false;

export default function LiffAutoLogin() {
  const { status } = useCustomerSession();
  const qc = useQueryClient();
  const router = useRouter();

  // init ทันทีที่เปิดในแอป LINE (ไม่รอ session) — liff.init เป็นตัวพาไป path ปลายทางของลิงก์ liff.line.me/<ID>/<path>
  useEffect(() => {
    void ensureLiff();
  }, []);

  useEffect(() => {
    if (status === "loading" || attempted || !isInLineApp()) return;
    attempted = true; // ล็อกอินอยู่แล้วก็ไม่ต้องลองอีกในรอบนี้
    if (status !== "unauthenticated") return;
    void (async () => {
      const idToken = await liffIdToken();
      if (!idToken) return;
      try {
        const user = await loginWithLiff(idToken);
        qc.setQueryData(CUSTOMER_SESSION_KEY, user);
        // ตะกร้า/แจ้งเตือน/ข้อมูลที่ดึงตอนเป็น guest → ดึงใหม่ในนามลูกค้า (cookie ตั้งแล้ว session ดึงซ้ำได้ค่าเดิม)
        await qc.invalidateQueries();
        router.refresh();
      } catch (e) {
        // 400 = สถานะบัญชี (ปิด/ลบ/ล็อก) ข้อความจาก backend ตั้งใจให้ลูกค้าเห็น · 401/อื่น ๆ = เงียบ
        if (isApiError(e) && e.status === 400) alert.error(e.message);
        else console.warn("[liff] auto login failed", e);
      }
    })();
  }, [status, qc, router]);

  return null;
}
