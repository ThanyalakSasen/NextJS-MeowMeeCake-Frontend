"use client";
// ─────────────────────────────────────────────────────────────
// กระดิ่งแจ้งเตือนบน Navbar + รายการเต็มในหน้าบัญชี (BACKLOG3-merge D6) · ยกจาก FrontOffice components/customer/CustomerNotifications.tsx
// ข้อมูลจาก useCustomerNotifications (React Query · โหลดใหม่ทุก 60 วิ ตอนแท็บแสดงอยู่) · กดรายการ = อ่าน + ไปหน้าที่เกี่ยวข้อง
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { notificationHref, type CustomerNotification } from "@/services/shopNotifications";
import { useCustomerNotifications } from "@/app/customer/hooks/useCustomerNotifications";
import { NotificationRow, useNow } from "@/components/shared/notifications";
import { CopyCodeButton } from "./CouponTicket";

/** แถวเดียวกับกระดิ่งหลังร้าน (shared/notifications) — แปลงฟิลด์ของแจ้งเตือนลูกค้า (read_at · visible_at) */
/** แจ้งเตือนคูปอง/โค้ดส่วนลดใหม่ (coupon_code) — แสดงรหัส + ปุ่มคัดลอกใต้ข้อความ (กดคัดลอกไม่เปิดลิงก์ของแถว) */
function CustomerRow({ n, onOpen, compact, now }: { n: CustomerNotification; onOpen: (n: CustomerNotification) => void; compact?: boolean; now: number }) {
  const t = useTranslations("shop.coupons");
  const row = (
    <NotificationRow
      type={n.type}
      title={n.title}
      message={n.message}
      unread={!n.read_at}
      at={n.visible_at ?? n.created_at}
      now={now}
      compact={compact}
      onClick={() => onOpen(n)}
    />
  );
  if (!n.coupon_code) return row;
  return (
    <div>
      {row}
      <div className={`flex flex-wrap items-center gap-2 pb-3 ${compact ? "px-4" : "px-5"}`}>
        <span className="text-xs text-stone-500">{t("codeHeading")}</span>
        <span className="rounded-lg border border-dashed border-[#8C5A3C]/40 bg-[#FAF6F0] px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-[#4A342E]">
          {n.coupon_code}
        </span>
        <CopyCodeButton code={n.coupon_code} />
      </div>
    </div>
  );
}

/** กระดิ่งบน Navbar — ผู้เรียกแสดงเฉพาะตอนล็อกอินแล้ว */
export function NotificationBell({ size = 24 }: { size?: number }) {
  const t = useTranslations("shop.notifications");
  const router = useRouter();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { items, unread, refresh, markRead, markAllRead } = useCustomerNotifications(8);

  // คลิกนอกกล่อง / กด Esc → ปิด
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openItem = (n: CustomerNotification) => {
    if (!n.read_at) void markRead(n._id);
    setOpen(false);
    const href = notificationHref(n);
    if (href) router.push(href);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) void refresh();
          setOpen((v) => !v);
        }}
        aria-label={unread > 0 ? t("bellWithCount", { n: unread }) : t("title")}
        aria-expanded={open}
        // ขนาดเดียวกับปุ่มอื่นใน Navbar (navButtonOnDark) — 44×44
        className="relative flex h-[44px] min-w-[44px] items-center justify-center rounded-xl px-[10px] !text-white transition hover:bg-white/10"
      >
        <Bell size={size} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1 h-[1.15rem] min-w-[1.15rem] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-[1.15rem] !text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#e2d7c7] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#e2d7c7] px-4 py-2.5">
            <span className="text-sm font-bold text-[#4A342E]">{t("title")}</span>
            {unread > 0 && (
              <button type="button" onClick={() => void markAllRead()} className="text-xs text-[#8C5A3C] hover:underline">
                {t("readAll")}
              </button>
            )}
          </div>
          <div className="max-h-96 divide-y divide-stone-100 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-stone-500">{t("empty")}</p>
            ) : (
              items.map((n) => <CustomerRow key={n._id} n={n} onOpen={openItem} compact now={now} />)
            )}
          </div>
          <Link
            href="/customer/account/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-[#e2d7c7] py-2.5 text-center text-xs font-semibold text-[#8C5A3C] hover:bg-[#e2d7c7]/30"
          >
            {t("viewAll")}
          </Link>
        </div>
      )}
    </div>
  );
}

/** รายการเต็มสำหรับหน้าการแจ้งเตือน (100 รายการล่าสุด) */
export function NotificationList() {
  const t = useTranslations("shop.notifications");
  const tc = useTranslations("shop.common");
  const router = useRouter();
  const now = useNow();
  const { items, unread, loaded, isError, markRead, markAllRead } = useCustomerNotifications(100);

  const openItem = (n: CustomerNotification) => {
    if (!n.read_at) void markRead(n._id);
    const href = notificationHref(n);
    if (href) router.push(href);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
        <span className="text-sm text-stone-500">{unread > 0 ? t("unreadCount", { n: unread }) : t("allRead")}</span>
        {unread > 0 && (
          <button type="button" onClick={() => void markAllRead()} className="text-xs font-semibold text-[#8C5A3C] hover:underline">
            {t("markAllRead")}
          </button>
        )}
      </div>
      <div className="divide-y divide-stone-100">
        {isError ? (
          <p className="px-5 py-10 text-center text-sm text-red-600">{t("loadFailed")}</p>
        ) : !loaded ? (
          <p className="px-5 py-10 text-center text-sm text-stone-500">{tc("loadingDots")}</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-stone-500">{t("emptyLong")}</p>
        ) : (
          items.map((n) => <CustomerRow key={n._id} n={n} onOpen={openItem} now={now} />)
        )}
      </div>
      {items.length >= 100 && <p className="m-0 border-t border-stone-100 py-2 text-center text-xs text-stone-500">{t("latest100")}</p>}
    </div>
  );
}
