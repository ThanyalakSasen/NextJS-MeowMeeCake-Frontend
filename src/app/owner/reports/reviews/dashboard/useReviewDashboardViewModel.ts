"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "แดชบอร์ดความคิดเห็น" — สรุปรีวิวตามช่วงเวลา (หน้า /owner/reports/reviews เป็นหน้าจัดการรายรีวิว)
// โหลดทุกรีวิวในช่วงที่เลือก (GET /admin/reviews?since&until ทีละ 100) แล้วสรุปฝั่ง client — reviewStats.ts
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { reviewsService } from "@/services/reviews";
import { LIST_ALL } from "@/lib/http";
import { getRangeStartEnd, type PeriodType } from "@/utils/period";
import { toReviewRow } from "../reviewRow";
import { computeReviewStats } from "./reviewStats";

export function useReviewDashboardViewModel() {
  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
  const range = useMemo(() => getRangeStartEnd(period, selectedDate), [period, selectedDate]);

  // until ของ backend เป็น $lt → ส่งต้นช่วงถัดไป (ครอบมิลลิวินาทีสุดท้ายของ endOf)
  const since = range[0].toISOString();
  const until = range[1].add(1, "millisecond").toISOString();
  const q = useQuery({
    queryKey: ["reviews", "admin", "dashboard", since, until],
    queryFn: () => reviewsService.listAll({ since, until, sort: "newest" }),
  });

  const stats = useMemo(
    () => (q.data ? computeReviewStats(q.data.data.map(toReviewRow), range, period) : null),
    [q.data, range, period],
  );

  return {
    period,
    setPeriod,
    selectedDate,
    setSelectedDate,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    isError: q.isError,
    refetch: () => q.refetch(),
    stats,
    /** จำนวนรีวิวทั้งช่วงจาก backend — มากกว่า stats.total = เกินเพดาน LIST_ALL (สรุปจากรีวิวล่าสุดเท่านั้น) */
    truncated: !!q.data?.summary && q.data.summary.count > (stats?.total ?? 0) && (stats?.total ?? 0) >= LIST_ALL,
  };
}
