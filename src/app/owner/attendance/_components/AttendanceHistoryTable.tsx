"use client";
// ตารางประวัติการเข้างานของตัวเอง
import { useTranslations, useLocale } from "next-intl";
import { Tag } from "@/components/base";
import { DataTable, type Column } from "@/components/shared/data";
import { formatDate, formatNumber } from "@/i18n/format";
import { ATTENDANCE_STATUS_CONFIG } from "@/constants/enumConfig";
import type { Attendance } from "@/types/attendance";

const tag = (locale: string) => (locale === "th" ? "th-TH" : "en-US");

function hoursBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const h = (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
  return h >= 0 ? h : null;
}

export function AttendanceHistoryTable({
  rows,
  loading,
}: {
  rows: Attendance[];
  loading: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const timeOf = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString(tag(locale), { hour: "2-digit", minute: "2-digit" }) : "—";

  const columns: Column<Attendance>[] = [
    { key: "date", title: t("attendance.colDate"), render: (r) => formatDate(r.work_date, locale) },
    { key: "in", title: t("attendance.colIn"), align: "center", render: (r) => timeOf(r.check_in_at) },
    { key: "out", title: t("attendance.colOut"), align: "center", render: (r) => timeOf(r.check_out_at) },
    {
      key: "hours",
      title: t("attendance.colHours"),
      align: "center",
      render: (r) => {
        const h = hoursBetween(r.check_in_at, r.check_out_at);
        return h == null ? "—" : `${formatNumber(h, locale, { maximumFractionDigits: 1 })} ${t("attendance.hoursUnit")}`;
      },
    },
    {
      key: "status",
      title: t("attendance.colStatus"),
      render: (r) => (
        <Tag color={ATTENDANCE_STATUS_CONFIG[r.status].antColor}>{t(`enums.attendanceStatus.${r.status}`)}</Tag>
      ),
    },
  ];

  return <DataTable columns={columns} rows={rows} loading={loading} emptyText={t("attendance.empty")} />;
}
