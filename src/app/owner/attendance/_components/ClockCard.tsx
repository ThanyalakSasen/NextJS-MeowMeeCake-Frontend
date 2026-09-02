"use client";
// นาฬิกาสด + ปุ่มเช็คอิน/เช็คเอาท์ + เวลาเข้า-ออกของวันนี้
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/solid";
import { Button, Tag } from "@/components/base";
import { formatDate } from "@/i18n/format";
import { ATTENDANCE_STATUS_CONFIG } from "@/constants/enumConfig";
import type { Attendance } from "@/types/attendance";

const tag = (locale: string) => (locale === "th" ? "th-TH" : "en-US");

function timeOf(iso: string | null, locale: string): string {
  return iso
    ? new Date(iso).toLocaleTimeString(tag(locale), { hour: "2-digit", minute: "2-digit" })
    : "—";
}

export function ClockCard({
  today,
  canCheckIn,
  canCheckOut,
  acting,
  onCheckIn,
  onCheckOut,
}: {
  today: Attendance | null;
  canCheckIn: boolean;
  canCheckOut: boolean;
  acting: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clock = now.toLocaleTimeString(tag(locale), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-100 bg-white px-6 py-8 text-center">
      <p className="text-sm text-gray-400">{formatDate(now, locale)}</p>
      <p className="mt-1 text-4xl font-bold tabular-nums text-brown-900">{clock}</p>

      <div className="mt-6 flex items-center gap-6">
        <div>
          <p className="mb-1 text-xs text-gray-400">{t("attendance.checkInTime")}</p>
          <p className="text-lg font-semibold text-green-600">{timeOf(today?.check_in_at ?? null, locale)}</p>
        </div>
        <div className="h-8 w-px bg-gray-100" />
        <div>
          <p className="mb-1 text-xs text-gray-400">{t("attendance.checkOutTime")}</p>
          <p className="text-lg font-semibold text-red-500">{timeOf(today?.check_out_at ?? null, locale)}</p>
        </div>
      </div>

      {today?.status && (
        <Tag color={ATTENDANCE_STATUS_CONFIG[today.status].antColor} className="!mt-3">
          {t(`enums.attendanceStatus.${today.status}`)}
        </Tag>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOnRectangleIcon className="h-5 w-5" />}
          disabled={!canCheckIn || acting}
          loading={acting && canCheckIn}
          onClick={onCheckIn}
        >
          {t("attendance.checkIn")}
        </Button>
        <Button
          size="large"
          icon={<ArrowLeftOnRectangleIcon className="h-5 w-5" />}
          disabled={!canCheckOut || acting}
          loading={acting && canCheckOut}
          onClick={onCheckOut}
        >
          {t("attendance.checkOut")}
        </Button>
      </div>
    </div>
  );
}
