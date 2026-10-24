"use client";
// ─────────────────────────────────────────────────────────────
// NotificationRow — แถวแจ้งเตือน 1 รายการ (ไอคอนตามประเภท · หัวข้อ · ข้อความ · เวลาที่ผ่านมา · จุดแดงยังไม่อ่าน)
// ใช้ร่วมกันทั้งกระดิ่งฝั่งลูกค้า (CustomerNotifications) และหลังร้าน (NotificationDropdown) ให้หน้าตาเหมือนกัน
// ข้อความ (เมื่อสักครู่ · n นาทีที่แล้ว …) ใช้ชุด shop.notifications ชุดเดียวกันทั้งสองฝั่ง
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import type { NotificationType } from "@/types";
import { formatDate } from "@/i18n/format";

const TYPE_ICON: Record<NotificationType, { Icon: LucideIcon; cls: string }> = {
  info: { Icon: Info, cls: "bg-sky-50 text-sky-600" },
  success: { Icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-600" },
  warning: { Icon: AlertTriangle, cls: "bg-amber-50 text-amber-600" },
  error: { Icon: XCircle, cls: "bg-red-50 text-red-600" },
};

type NotifT = ReturnType<typeof useTranslations<"shop.notifications">>;

/** "เมื่อสักครู่" · "5 นาทีที่แล้ว" · "3 ชม.ที่แล้ว" · เกิน 7 วัน = วันที่ */
function timeAgo(iso: string | null | undefined, now: number, t: NotifT, locale: string): string {
  if (!iso) return "";
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return t("justNow");
  if (min < 60) return t("minutesAgo", { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t("hoursAgo", { n: h });
  const d = Math.floor(h / 24);
  if (d <= 7) return t("daysAgo", { n: d });
  return formatDate(iso, locale);
}

/** เวลาปัจจุบัน อัปเดตทุกนาที — ให้ "n นาทีที่แล้ว" เดินเองขณะเปิดค้าง */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function NotificationRow({
  type,
  title,
  message,
  unread,
  at,
  now,
  compact,
  onClick,
}: {
  type: NotificationType;
  title: string;
  message: string;
  unread: boolean;
  /** เวลาที่แจ้ง (ISO) */
  at: string | null | undefined;
  now: number;
  /** ข้อความไม่เกิน 2 บรรทัด (ใน dropdown) */
  compact?: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("shop.notifications");
  const locale = useLocale();
  const { Icon, cls } = TYPE_ICON[type] ?? TYPE_ICON.info;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-[#e2d7c7]/30 ${unread ? "bg-[#FAF6F0]" : ""}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cls}`}>
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${unread ? "font-bold text-[#4A342E]" : "font-medium text-stone-700"}`}>{title}</span>
          {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label={t("unreadDot")} />}
        </span>
        <span className={`block whitespace-pre-line text-xs text-stone-600 ${compact ? "line-clamp-2" : ""}`}>{message}</span>
        <span className="mt-0.5 block text-[11px] text-stone-500">{timeAgo(at, now, t, locale)}</span>
      </span>
    </button>
  );
}
