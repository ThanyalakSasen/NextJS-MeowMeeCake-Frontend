"use client";
// ─────────────────────────────────────────────────────────────
// แชทกับร้านแบบลอยมุมล่างขวา (แบบเว็บทั่วไป) — แทนไอคอนแชทบน Navbar (2026-10-26)
// - ปุ่มกลมมุมล่างขวาทุกหน้าของหน้าร้าน + ตัวเลขข้อความจากร้านที่ยังไม่อ่าน (GET /shop/chat/unread ทุก 20 วิ · เฉพาะที่ login)
// - กดแล้วเปิดหน้าต่างแชท: จอใหญ่ = กล่อง 380px เหนือปุ่ม · มือถือ = เต็มจอ · Esc / ปุ่ม X = ปิด · ลิงก์ "เปิดเต็มจอ" ไป /customer/chat
// - สร้างห้องแชท (และเริ่มดึงข้อความ) เฉพาะตอนเปิดหน้าต่าง — ปิดอยู่ = ไม่ poll ข้อความ
// - ไม่แสดง: หน้า /customer/chat (เป็นแชทเต็มจออยู่แล้ว) · เจ้าของร้าน/พนักงาน (ตอบที่หลังร้าน)
// - guest กดได้ — หน้าต่างชวนเข้าสู่ระบบ (ShopChatPanel)
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Maximize2, MessageCircle, X } from "lucide-react";
import { shopChatService } from "@/services/shopChat";
import { storeInfoService } from "@/services/storeInfo";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { shopChatUnreadKey } from "@/app/customer/lib/shopQueries";
import { storeInfoKey } from "@/app/customer/lib/catalogQueries";
import ShopChatPanel from "./ShopChatPanel";

const HIDDEN_ON = ["/customer/chat"];

export default function ChatWidget() {
  const t = useTranslations("chat");
  const tc = useTranslations("shop.contact");
  const pathname = usePathname() ?? "";
  const { status, user } = useCustomerSession();
  const authed = status === "authenticated";
  const isStaff = !!user?.roleType && user.roleType !== "customer";
  const hidden = isStaff || HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const [open, setOpen] = useState(false);

  const unreadQ = useQuery({
    queryKey: shopChatUnreadKey,
    queryFn: shopChatService.unread,
    enabled: authed && !hidden,
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
  const infoQ = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000, enabled: open });
  const storeName = infoQ.data?.store_name || tc("fallbackStoreName");
  const unread = open ? 0 : unreadQ.data ?? 0;

  // Esc = ปิด · มือถือเปิดเต็มจอ → ล็อกการเลื่อนหน้าข้างหลัง
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const small = window.matchMedia("(max-width: 639px)").matches;
    const prev = document.body.style.overflow;
    if (small) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (hidden) return null;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={t("pageTitle")}
          className="fixed inset-0 z-[65] flex flex-col overflow-hidden bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-5 sm:w-[380px] sm:rounded-2xl sm:border sm:border-[#8C5A3C]/20"
        >
          <div className="flex items-center gap-3 bg-[#4A342E] px-4 py-3 text-white">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <MessageCircle size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-bold !text-white">{storeName}</p>
              <p className="m-0 truncate text-xs !text-white/80">{t("replyHint")}</p>
            </div>
            <Link
              href="/customer/chat"
              onClick={() => setOpen(false)}
              aria-label={t("openFull")}
              title={t("openFull")}
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-lg !text-white transition hover:bg-white/15"
            >
              <Maximize2 size={18} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("widgetClose")}
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/15"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <ShopChatPanel storeName={storeName} compact heightClass="h-[calc(100dvh-10.5rem)] sm:h-[min(26rem,calc(100vh-17rem))]" />
        </div>
      )}

      {/* ปุ่มลอย — มือถือซ่อนตอนเปิดหน้าต่าง (หน้าต่างเต็มจอมีปุ่ม X แล้ว) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("widgetClose") : unread > 0 ? t("navUnread", { n: unread }) : t("nav")}
        title={t("nav")}
        className={`fixed bottom-5 right-5 z-[64] h-14 w-14 items-center justify-center rounded-full bg-[#4A342E] text-white shadow-lg shadow-[#4A342E]/30 transition hover:scale-105 hover:bg-[#8C5A3C] active:scale-95 ${
          open ? "hidden sm:flex" : "flex"
        }`}
      >
        {open ? <X size={24} aria-hidden="true" /> : <MessageCircle size={26} aria-hidden="true" />}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-6 min-w-[1.5rem] rounded-full border-2 border-white bg-red-500 px-1 text-center text-xs font-bold leading-5 text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
