"use client";
// ─────────────────────────────────────────────────────────────
// กระดิ่งแจ้งเตือนบน Navbar + รายการเต็มในหน้าบัญชี (BACKLOG3-merge D6) · ยกจาก FrontOffice components/customer/CustomerNotifications.tsx
// ข้อมูลจาก useCustomerNotifications (React Query · โหลดใหม่ทุก 60 วิ ตอนแท็บแสดงอยู่) · กดรายการ = อ่าน + ไปหน้าที่เกี่ยวข้อง
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import { notificationHref, type CustomerNotification, type CustomerNotificationType } from "@/services/shopNotifications";
import { useCustomerNotifications } from "@/app/customer/hooks/useCustomerNotifications";

const TYPE_ICON: Record<CustomerNotificationType, { Icon: LucideIcon; cls: string }> = {
  info: { Icon: Info, cls: "bg-sky-50 text-sky-600" },
  success: { Icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-600" },
  warning: { Icon: AlertTriangle, cls: "bg-amber-50 text-amber-600" },
  error: { Icon: XCircle, cls: "bg-red-50 text-red-600" },
};

/** "เมื่อสักครู่" · "5 นาทีที่แล้ว" · "3 ชม.ที่แล้ว" · เกิน 7 วัน = วันที่ */
function timeAgo(iso: string | null, now: number): string {
  if (!iso) return "";
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d <= 7) return `${d} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function NotificationRow({ n, onOpen, compact, now }: { n: CustomerNotification; onOpen: (n: CustomerNotification) => void; compact?: boolean; now: number }) {
  const { Icon, cls } = TYPE_ICON[n.type] ?? TYPE_ICON.info;
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-[#e2d7c7]/30 ${n.read_at ? "" : "bg-[#FAF6F0]"}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cls}`}>
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${n.read_at ? "font-medium text-stone-700" : "font-bold text-[#4A342E]"}`}>{n.title}</span>
          {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="ยังไม่อ่าน" />}
        </span>
        <span className={`block whitespace-pre-line text-xs text-stone-600 ${compact ? "line-clamp-2" : ""}`}>{n.message}</span>
        <span className="mt-0.5 block text-[11px] text-stone-400">{timeAgo(n.visible_at ?? n.created_at, now)}</span>
      </span>
    </button>
  );
}

/** กระดิ่งบน Navbar — ผู้เรียกแสดงเฉพาะตอนล็อกอินแล้ว */
export function NotificationBell({ size = 24 }: { size?: number }) {
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
        aria-label={unread > 0 ? `การแจ้งเตือน (${unread} รายการใหม่)` : "การแจ้งเตือน"}
        aria-expanded={open}
        className="relative flex items-center p-1 !text-white transition hover:!text-[#e2d7c7]"
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
            <span className="text-sm font-bold text-[#4A342E]">การแจ้งเตือน</span>
            {unread > 0 && (
              <button type="button" onClick={() => void markAllRead()} className="text-xs text-[#8C5A3C] hover:underline">
                อ่านทั้งหมด
              </button>
            )}
          </div>
          <div className="max-h-96 divide-y divide-stone-100 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-stone-400">ยังไม่มีการแจ้งเตือน</p>
            ) : (
              items.map((n) => <NotificationRow key={n._id} n={n} onOpen={openItem} compact now={now} />)
            )}
          </div>
          <Link
            href="/customer/account/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-[#e2d7c7] py-2.5 text-center text-xs font-semibold text-[#8C5A3C] hover:bg-[#e2d7c7]/30"
          >
            ดูการแจ้งเตือนทั้งหมด
          </Link>
        </div>
      )}
    </div>
  );
}

/** รายการเต็มสำหรับหน้าการแจ้งเตือน (100 รายการล่าสุด) */
export function NotificationList() {
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
        <span className="text-sm text-stone-500">{unread > 0 ? `ยังไม่อ่าน ${unread} รายการ` : "อ่านครบแล้ว"}</span>
        {unread > 0 && (
          <button type="button" onClick={() => void markAllRead()} className="text-xs font-semibold text-[#8C5A3C] hover:underline">
            ทำเครื่องหมายว่าอ่านทั้งหมด
          </button>
        )}
      </div>
      <div className="divide-y divide-stone-100">
        {isError ? (
          <p className="px-5 py-10 text-center text-sm text-red-600">โหลดการแจ้งเตือนไม่สำเร็จ กรุณารีเฟรชหน้านี้</p>
        ) : !loaded ? (
          <p className="px-5 py-10 text-center text-sm text-stone-400">กำลังโหลด...</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-stone-400">ยังไม่มีการแจ้งเตือน — เมื่อสถานะคำสั่งซื้อเปลี่ยน จะแจ้งให้ทราบที่นี่</p>
        ) : (
          items.map((n) => <NotificationRow key={n._id} n={n} onOpen={openItem} now={now} />)
        )}
      </div>
      {items.length >= 100 && <p className="m-0 border-t border-stone-100 py-2 text-center text-xs text-stone-400">แสดง 100 รายการล่าสุด</p>}
    </div>
  );
}
