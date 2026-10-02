"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของหน้าโปรไฟล์ — เชื่อม/ยกเลิกการเชื่อมบัญชี LINE (รับแจ้งเตือนผ่าน LINE OA ของร้าน)
//   1) กด "เชื่อม LINE" → GET /shop/me/line ขอ authorize_url ใหม่ทุกครั้ง (อายุ 10 นาที ห้าม cache)
//      แล้วเปลี่ยนหน้าทั้งหน้าไป LINE (ห้าม fetch/popup — LINE ต้อง redirect กลับผ่าน callback ของ backend)
//   2) backend จัดการ /shop/me/line/callback เอง แล้วส่งกลับมาที่นี่พร้อม ?line=linked|cancelled|error
//   3) อ่าน ?line= ครั้งเดียว แจ้งผล แล้วลบ query ออก (รีเฟรชหน้าจะได้ไม่แจ้งซ้ำ)
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { shopLineService } from "@/services/shopLine";
import { logout } from "@/lib/authClient";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { LineLinkResult } from "@/types/lineLink";
import { LOGIN_PATH } from "@/constants/auth";

const LINE_STATUS_KEY = ["shop", "me", "line"] as const;

export function useProfileViewModel() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const qc = useQueryClient();
  const { user, isLoading: userLoading, isError: userError } = useCurrentUser();

  // ยังไม่ login / session หมด → ไป login แล้วกลับมาที่เดิม (รวม ?line= ถ้ามี — โหมด AUTH_GATE="client" ไม่มี proxy ช่วย)
  useEffect(() => {
    if (!userError) return;
    const qs = params.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    router.replace(`${LOGIN_PATH}?reason=expired&next=${encodeURIComponent(next)}`);
  }, [userError, router, pathname, params]);

  const statusQ = useQuery({
    queryKey: LINE_STATUS_KEY,
    queryFn: shopLineService.status,
    enabled: !!user,
  });

  // ผลลัพธ์จาก backend หลังกลับจาก LINE — ref กัน StrictMode รัน effect ซ้ำแล้วแจ้งเตือน 2 รอบ
  const lineResult = params.get("line") as LineLinkResult | null;
  const handledRef = useRef(false);
  useEffect(() => {
    if (!user || !lineResult || handledRef.current) return;
    handledRef.current = true;
    if (lineResult === "linked") {
      alert.success(t("profile.line.linkedSuccess"));
      qc.invalidateQueries({ queryKey: LINE_STATUS_KEY });
    } else if (lineResult === "error") {
      // reason=login_required = session ตอน callback ไม่ตรง/หมดอายุ → ต้อง login ใหม่แล้วกดเชื่อมอีกรอบ
      alert.error(
        params.get("reason") === "login_required" ? t("profile.line.loginRequired") : t("profile.line.linkFailed"),
      );
    }
    // "cancelled" = ลูกค้ากดยกเลิกเองที่หน้า LINE → ไม่ต้องแจ้งอะไร
    router.replace(pathname);
  }, [user, lineResult, params, t, qc, router, pathname]);

  const connect = useMutation({
    mutationFn: shopLineService.status,
    onSuccess: (s) => {
      if (s.linked) {
        // เชื่อมไว้แล้วจากแท็บอื่น — แค่อัปเดตหน้าจอ
        qc.setQueryData(LINE_STATUS_KEY, s);
        return;
      }
      if (!s.authorize_url) {
        qc.setQueryData(LINE_STATUS_KEY, s);
        alert.error(t("profile.line.unavailable"));
        return;
      }
      window.location.href = s.authorize_url;
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("profile.line.linkFailed")),
  });

  const unlink = useMutation({
    mutationFn: shopLineService.unlink,
    onSuccess: () => {
      alert.success(t("profile.line.unlinkedSuccess"));
      qc.invalidateQueries({ queryKey: LINE_STATUS_KEY });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("profile.line.unlinkFailed")),
  });

  const onUnlink = async () => {
    const ok = await confirmAlert(t("profile.line.unlinkConfirm"), { danger: true });
    if (ok) unlink.mutate();
  };

  const onLogout = async () => {
    await logout();
    qc.clear();
    router.replace(LOGIN_PATH);
  };

  const status = statusQ.data;
  return {
    user,
    isLoading: userLoading || !user || statusQ.isLoading,
    isError: statusQ.isError,
    refetch: () => statusQ.refetch(),

    linked: !!status?.linked,
    // authorize_url null = backend ยังไม่ได้ตั้งค่า LINE Login → ปิดปุ่ม
    canConnect: !!status?.authorize_url,
    connecting: connect.isPending,
    unlinking: unlink.isPending,
    onConnect: () => connect.mutate(),
    onUnlink,
    onLogout,
  };
}
