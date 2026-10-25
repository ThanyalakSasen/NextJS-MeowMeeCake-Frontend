"use client";
// กระดิ่งหลังร้าน — หน้าตาเดียวกับกระดิ่งฝั่งลูกค้า (components/customer/CustomerNotifications · แถวจาก shared/notifications)
// ไอคอนเส้น + ตัวเลขที่ยังไม่อ่าน · กดรายการ = อ่าน + ไปหน้าที่เกี่ยวข้อง · สีไอคอนเข้มเพราะแถบบนหลังร้านพื้นอ่อน
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationRow, useNow } from "@/components/shared/notifications";
import type { NotificationDTO } from "@/types/notification";

export function NotificationDropdown() {
  const t = useTranslations("shop.notifications");
  const router = useRouter();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, refresh, markRead, markAllRead } = useNotifications(8);

  // คลิกนอกกล่อง / กด Esc → ปิด
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openItem = (n: NotificationDTO) => {
    if (!n.is_read) void markRead(n._id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) refresh();
          setOpen((v) => !v);
        }}
        aria-label={unreadCount > 0 ? t("bellWithCount", { n: unreadCount }) : t("title")}
        aria-expanded={open}
        className="relative flex h-[44px] min-w-[44px] items-center justify-center rounded-xl px-[10px] text-brown-800 transition hover:bg-brown-50"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1 h-[1.15rem] min-w-[1.15rem] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-[1.15rem] text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#e2d7c7] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#e2d7c7] px-4 py-2.5">
            <span className="text-sm font-bold text-[#4A342E]">{t("title")}</span>
            {unreadCount > 0 && (
              <button type="button" onClick={() => void markAllRead()} className="text-xs text-[#8C5A3C] hover:underline">
                {t("readAll")}
              </button>
            )}
          </div>
          <div className="max-h-96 divide-y divide-stone-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-stone-500">{t("empty")}</p>
            ) : (
              notifications.map((n) => (
                <NotificationRow
                  key={n._id}
                  type={n.type}
                  title={n.title}
                  message={n.message}
                  unread={!n.is_read}
                  at={n.created_at}
                  now={now}
                  compact
                  onClick={() => openItem(n)}
                />
              ))
            )}
          </div>
          <Link
            href="/owner/notificationsHistory"
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
