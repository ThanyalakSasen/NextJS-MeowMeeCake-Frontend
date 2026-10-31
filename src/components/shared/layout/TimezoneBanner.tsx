"use client";

// ─────────────────────────────────────────────────────────────
// TimezoneBanner — แถบเตือนเมื่อเครื่องไม่ได้ตั้งเวลาไทย (UTC+7) — เอกสารบั๊กข้อ 11
// หน้าหลังร้านคิด "วันนี้"/ช่วงวันที่จากนาฬิกาเครื่อง (dayjs) แต่ server คิดเป็นเวลาไทย
// เครื่องตั้งโซนอื่น = ช่วงวันที่เพี้ยน และ query key ฝั่ง server/client ไม่ตรงกัน (ดึงซ้ำ)
// เทียบ offset ไม่ใช่ชื่อโซน — โซนอื่นที่ UTC+7 เหมือนกัน (เช่น Asia/Ho_Chi_Minh) วันที่ตรงกันอยู่แล้ว · ไทยไม่มี DST
// เช็กหลัง hydrate เท่านั้น (server ไม่รู้โซนของเครื่อง) · ปิดแถบได้ จำไว้ต่อแท็บ (sessionStorage)
// ─────────────────────────────────────────────────────────────
import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/base";

const THAI_OFFSET_MINUTES = -420;
const DISMISS_KEY = "mmc:tz-banner-dismissed";

const noopSubscribe = () => () => {};

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function TimezoneBanner() {
  const t = useTranslations("common");
  // null = ยังไม่ hydrate (ฝั่ง server) · ค่า offset ต่อจากนั้น
  const offset = useSyncExternalStore(noopSubscribe, () => new Date().getTimezoneOffset(), () => null);
  const storedDismissed = useSyncExternalStore(noopSubscribe, readDismissed, () => false);
  const [dismissed, setDismissed] = useState(false);

  if (offset == null || offset === THAI_OFFSET_MINUTES || dismissed || storedDismissed) return null;

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hours = -offset / 60;
  const utc = `UTC${hours >= 0 ? "+" : "−"}${Math.abs(hours)}`;

  return (
    <div role="alert" className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
      <p className="m-0 flex-1">{t("timezoneWarning", { zone: zone ? `${zone} (${utc})` : utc })}</p>
      <Button
        size="small"
        type="text"
        onClick={() => {
          setDismissed(true);
          try {
            window.sessionStorage.setItem(DISMISS_KEY, "1");
          } catch {
            // เก็บไม่ได้ (private mode) — ปิดแค่ครั้งนี้
          }
        }}
      >
        {t("timezoneDismiss")}
      </Button>
    </div>
  );
}
