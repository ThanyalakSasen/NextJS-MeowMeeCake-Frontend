"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Attendance — พนักงานที่ login เช็คอิน/เช็คเอาท์ของตัวเอง
// (login-only ไม่ผูก menu_key) · endpoint พิเศษ /attendances/{today,check-in,check-out}
// ─────────────────────────────────────────────────────────────
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { attendancesService } from "@/services/attendances";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { Attendance } from "@/types/attendance";

export function useAttendanceViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const userId = user?.id ?? "";

  const todayQ = useQuery({
    queryKey: ["attendances", "today"],
    queryFn: () => attendancesService.today(),
  });
  const historyQ = useQuery({
    queryKey: ["attendances", "history", userId],
    queryFn: () => attendancesService.list({ user_id: userId, limit: 100 }),
    enabled: !!userId,
  });

  const today = todayQ.data?.data ?? null;
  const history = useMemo<Attendance[]>(
    () =>
      (historyQ.data?.data ?? [])
        .slice()
        .sort((a, b) => b.work_date.localeCompare(a.work_date))
        .slice(0, 30),
    [historyQ.data],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["attendances"] });

  const checkIn = useMutation({
    mutationFn: () => attendancesService.checkIn(),
    onSuccess: () => { alert.success(t("attendance.checkedIn")); invalidate(); },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("attendance.checkInFailed")),
  });
  const checkOut = useMutation({
    mutationFn: () => attendancesService.checkOut(),
    onSuccess: () => { alert.success(t("attendance.checkedOut")); invalidate(); },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("attendance.checkOutFailed")),
  });

  return {
    userName: user?.fullname ?? "",
    today,
    history,
    isLoading: todayQ.isLoading || historyQ.isLoading,
    acting: checkIn.isPending || checkOut.isPending,
    canCheckIn: !today?.check_in_at,
    canCheckOut: !!today?.check_in_at && !today?.check_out_at,
    onCheckIn: () => checkIn.mutate(),
    onCheckOut: () => checkOut.mutate(),
  };
}
