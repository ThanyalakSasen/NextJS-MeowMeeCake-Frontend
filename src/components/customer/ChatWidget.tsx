"use client";
// ─────────────────────────────────────────────────────────────
// ChatWidget — ปุ่มแชทลอยมุมขวาล่างทุกหน้าของหน้าร้าน (แทนฟอร์ม "ส่งข้อความหาเรา" เดิม)
//   ปุ่ม: จุดแดง = ข้อความจากร้านที่ยังไม่อ่าน (GET /shop/chat/unread ทุก 30 วิ ตอนแท็บเปิดอยู่)
//   กล่องแชท: มือถือเต็มจอ · จอ ≥640 กล่องลอย 380×560 เหนือปุ่ม
//   ยังไม่ล็อกอิน = ปุ่มเข้าสู่ระบบ · ยังไม่เคยแชท = หัวข้อให้กดเริ่ม 2 แบบ (เติมข้อความในช่องพิมพ์)
//   แนบการ์ดคำสั่งซื้อ: ปุ่มใบเสร็จข้างช่องพิมพ์ (เลือกจากคำสั่งซื้อ/พรีออเดอร์ล่าสุด) หรือปุ่มในหน้ารายละเอียดคำสั่งซื้อ
//   เปิดจากที่อื่นได้: ลิงก์ ?chat=1 (แจ้งเตือน "ร้านตอบกลับ") หรือ useChatWidgetStore().setOpen / openWithRef
// ─────────────────────────────────────────────────────────────
import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Receipt, Send, X } from "lucide-react";
import { shopChatService, CHAT_TEXT_MAX, type ChatOrderCard, type ChatRef } from "@/services/chat";
import { storeInfoService } from "@/services/storeInfo";
import { shopOrdersService } from "@/services/shopOrders";
import { shopPreordersService } from "@/services/shopPreorders";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { useChatThread } from "@/hooks/useChatThread";
import { chatDayKey, chatDayLabel, chatTime } from "@/lib/chatFormat";
import { formatDate } from "@/i18n/format";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";
import { LOGIN_PATH } from "@/constants/auth";
import { useChatWidgetStore } from "@/app/customer/store/chatWidgetStore";
import { storeInfoKey } from "@/app/customer/lib/catalogQueries";
import { baht } from "./shopStyles";
import StoreLogo from "./StoreLogo";

const UNREAD_KEY = ["shop", "chat", "unread"] as const;
const THREAD_KEY = ["shop", "chat", "me"] as const;
/** หัวข้อเริ่มแชท (ยังไม่เคยแชท) */
const TOPICS = ["more", "info"] as const;

export default function ChatWidget() {
  const t = useTranslations("shop.chat");
  const { status } = useCustomerSession();
  const authed = status === "authenticated";
  const open = useChatWidgetStore((s) => s.open);
  const setOpen = useChatWidgetStore((s) => s.setOpen);
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/customer";
  const router = useRouter();

  // ?chat=1 (ลิงก์จากแจ้งเตือน) → เปิดกล่องแชท แล้วเอาพารามิเตอร์ออกจาก URL
  const wantOpen = searchParams.get("chat") === "1";
  useEffect(() => {
    if (!wantOpen) return;
    setOpen(true);
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("chat");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [wantOpen, searchParams, pathname, router, setOpen]);

  const unreadQ = useQuery({
    queryKey: UNREAD_KEY,
    queryFn: shopChatService.unread,
    enabled: authed && !open,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const unread = authed ? (unreadQ.data ?? 0) : 0;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={t("title")}
          className="fixed inset-0 z-[55] flex flex-col bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(560px,calc(100vh-8rem))] sm:w-[380px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-[#8C5A3C]/20"
        >
          <ChatHeader onClose={() => setOpen(false)} />
          {status === "loading" ? (
            <div className="flex flex-1 items-center justify-center text-sm text-stone-500">{t("loading")}</div>
          ) : authed ? (
            <ChatBody unread={unread} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <MessageCircle className="h-10 w-10 text-[#8C5A3C]/50" aria-hidden="true" />
              <p className="m-0 text-sm text-stone-600">{t("loginFirst")}</p>
              <Link
                href={`${LOGIN_PATH}?next=${encodeURIComponent(`${pathname}?chat=1`)}`}
                onClick={() => setOpen(false)}
                className="inline-flex h-[44px] items-center justify-center rounded-xl bg-[#4A342E] px-5 text-sm font-bold !text-white hover:bg-[#8C5A3C]"
              >
                {t("login")}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ปุ่มลอย — มือถือซ่อนตอนเปิดกล่อง (กล่องเต็มจอมีปุ่มปิดเอง) */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? t("close") : unread > 0 ? t("openWithUnread", { n: unread }) : t("open")}
        aria-expanded={open}
        className={`fixed bottom-5 right-5 z-40 h-14 w-14 items-center justify-center rounded-full bg-[#4A342E] !text-white shadow-lg shadow-[#4A342E]/30 transition hover:scale-105 hover:bg-[#8C5A3C] ${
          open ? "hidden sm:flex" : "flex"
        }`}
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-7 w-7" aria-hidden="true" />}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[11px] font-bold leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    </>
  );
}

function ChatHeader({ onClose }: { onClose: () => void }) {
  const t = useTranslations("shop.chat");
  const infoQ = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000 });
  return (
    <div className="flex shrink-0 items-center gap-3 bg-[#4A342E] px-4 py-3 text-white">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
        <StoreLogo size={36} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-sm font-bold">{infoQ.data?.store_name || t("storeFallback")}</p>
        <p className="m-0 text-xs text-white/75">{t("subtitle")}</p>
      </div>
      <button type="button" onClick={onClose} aria-label={t("close")} className="rounded-lg p-2 !text-white hover:bg-white/10">
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}

/** การ์ดคำสั่งซื้อในข้อความ — กดแล้วไปหน้ารายละเอียดคำสั่งซื้อของฉัน */
function OrderCard({ card }: { card: ChatOrderCard }) {
  const t = useTranslations("shop.chat");
  const ts = useTranslations("shop");
  const locale = useLocale();
  const href = card.kind === "order" ? `/customer/account/purchases/${card.id}` : `/customer/account/preorders/${card.id}`;
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8C5A3C]">
        <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
        {card.kind === "order" ? t("cardOrder") : t("cardPreorder")}
      </span>
      <span className="block text-sm font-bold text-[#4A342E]">{card.no}</span>
      {card.missing ? (
        <span className="block text-xs text-stone-500">{t("cardMissing")}</span>
      ) : (
        <span className="block text-xs text-stone-600">
          {card.order_status && ts(`orderStatus.${card.order_status as OrderStatus}`)}
          {card.payment_status && ` · ${ts(`paymentStatus.${card.payment_status as PaymentStatus}`)}`}
          {card.total_amount != null && ` · ${baht(card.total_amount)}`}
          {card.created_at && ` · ${formatDate(card.created_at, locale)}`}
        </span>
      )}
    </>
  );
  const cls = "block w-full rounded-xl border border-[#8C5A3C]/20 bg-white px-3 py-2 text-left";
  return card.missing ? <span className={cls}>{body}</span> : <Link href={href} className={`${cls} hover:bg-[#FAF6F0]`}>{body}</Link>;
}

/** เลือกคำสั่งซื้อ/พรีออเดอร์ล่าสุดเพื่อแนบเป็นการ์ด */
function OrderPicker({ onPick, onClose }: { onPick: (ref: ChatRef) => void; onClose: () => void }) {
  const t = useTranslations("shop.chat");
  const ts = useTranslations("shop");
  const locale = useLocale();
  const q = useQuery({
    queryKey: ["shop", "chat", "order-picker"],
    queryFn: async () => {
      const [orders, preorders] = await Promise.all([shopOrdersService.list({ limit: 5 }), shopPreordersService.list({ limit: 5 })]);
      return [
        ...orders.data.map((o) => ({ kind: "order" as const, id: o._id, no: o.order_no, status: o.order_status, total: o.total_amount, at: o.created_at })),
        ...preorders.data.map((p) => ({ kind: "preorder" as const, id: p._id, no: p.preorder_no, status: p.order_status, total: p.total_amount, at: p.created_at })),
      ].sort((a, b) => b.at.localeCompare(a.at));
    },
    staleTime: 30_000,
  });
  return (
    <div className="max-h-56 shrink-0 overflow-y-auto border-t border-stone-200 bg-white">
      <div className="flex items-center justify-between px-3 pt-2">
        <p className="m-0 text-xs font-bold text-[#4A342E]">{t("pickOrder")}</p>
        <button type="button" onClick={onClose} aria-label={t("close")} className="rounded p-1 text-stone-500 hover:bg-stone-100">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {q.isLoading ? (
        <p className="m-0 p-3 text-xs text-stone-500">{t("loading")}</p>
      ) : (q.data ?? []).length === 0 ? (
        <p className="m-0 p-3 text-xs text-stone-500">{t("noOrders")}</p>
      ) : (
        <ul className="m-0 list-none p-1">
          {q.data!.map((o) => (
            <li key={`${o.kind}:${o.id}`}>
              <button
                type="button"
                onClick={() => onPick({ kind: o.kind, id: o.id, no: o.no })}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-[#FAF6F0]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#4A342E]">{o.no}</span>
                  <span className="block text-[11px] text-stone-500">
                    {o.kind === "order" ? t("cardOrder") : t("cardPreorder")} · {ts(`orderStatus.${o.status}`)} · {formatDate(o.at, locale)}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-stone-700">{baht(o.total)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChatBody({ unread }: { unread: number }) {
  const t = useTranslations("shop.chat");
  const locale = useLocale();
  const qc = useQueryClient();
  const thread = useChatThread({ queryKey: THREAD_KEY, load: shopChatService.get, enabled: true });
  const pendingRef = useChatWidgetStore((s) => s.pendingRef);
  const setPendingRef = useChatWidgetStore((s) => s.setPendingRef);
  const [text, setText] = useState("");
  const [picking, setPicking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastId = thread.messages.at(-1)?._id;

  // ข้อความใหม่ (รวมที่เพิ่งส่ง) → เลื่อนลงล่างสุด
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  // เปิดกล่องแล้วมีข้อความจากร้านที่ยังไม่อ่าน → อ่านแล้ว (ล้างจุดแดง)
  const hasShopMessage = thread.messages.some((m) => m.sender === "shop");
  useEffect(() => {
    if (unread > 0 && hasShopMessage) {
      void shopChatService.read().then(() => qc.setQueryData(UNREAD_KEY, 0));
    }
  }, [unread, hasShopMessage, lastId, qc]);

  const send = useMutation({
    mutationFn: ({ body, ref }: { body: string; ref: ChatRef | null }) => shopChatService.send(body, ref),
    onSuccess: (m) => {
      thread.append(m);
      setText("");
      setPendingRef(null);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("sendFailed")),
  });

  const canSend = (!!text.trim() || !!pendingRef) && !send.isPending;
  const submit = () => {
    if (canSend) send.mutate({ body: text.trim(), ref: pendingRef });
  };

  const loadOlder = async () => {
    const el = scrollRef.current;
    const fromBottom = el ? el.scrollHeight - el.scrollTop : 0;
    await thread.loadOlder();
    // คงตำแหน่งที่กำลังอ่านไว้ (ข้อความเก่าต่อหัว)
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - fromBottom;
    });
  };

  return (
    <>
      <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#FAF6F0] px-3 py-4">
        {thread.isLoading ? (
          <p className="m-auto text-sm text-stone-500">{t("loading")}</p>
        ) : thread.isError ? (
          <div className="m-auto space-y-2 text-center">
            <p className="m-0 text-sm text-red-600">{t("loadFailed")}</p>
            <button type="button" onClick={thread.retry} className="text-sm font-semibold text-[#8C5A3C] underline">
              {t("retry")}
            </button>
          </div>
        ) : thread.messages.length === 0 ? (
          <div className="m-auto flex w-full flex-col items-center gap-3 px-2 text-center">
            <MessageCircle className="h-10 w-10 text-[#8C5A3C]/40" aria-hidden="true" />
            <p className="m-0 text-sm font-semibold text-[#4A342E]">{t("welcome")}</p>
            <p className="m-0 text-xs text-stone-500">{t("welcomeHint")}</p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {TOPICS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setText(t(`topics.${k}`) + " ")}
                  className="rounded-full border border-[#8C5A3C]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#4A342E] hover:bg-[#8C5A3C]/10"
                >
                  {t(`topics.${k}`)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {thread.hasMore && (
              <button
                type="button"
                onClick={() => void loadOlder()}
                disabled={thread.loadingOlder}
                className="mx-auto mb-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-50 disabled:opacity-60"
              >
                {thread.loadingOlder ? t("loading") : t("loadOlder")}
              </button>
            )}
            {thread.messages.map((m, i) => {
              const mine = m.sender === "customer";
              const newDay = i === 0 || chatDayKey(thread.messages[i - 1].created_at) !== chatDayKey(m.created_at);
              return (
                <Fragment key={m._id}>
                  {newDay && (
                    <p className="m-0 my-1 self-center rounded-full bg-black/5 px-3 py-0.5 text-[11px] text-stone-500">
                      {chatDayLabel(m.created_at, locale, { today: t("today"), yesterday: t("yesterday") })}
                    </p>
                  )}
                  <div className={`flex max-w-[85%] flex-col gap-0.5 ${mine ? "items-end self-end" : "items-start self-start"}`}>
                    {!mine && <span className="px-1 text-[11px] font-semibold text-[#8C5A3C]">{t("shopLabel")}</span>}
                    {m.card && (
                      <div className="w-60 max-w-full">
                        <OrderCard card={m.card} />
                      </div>
                    )}
                    {m.text && (
                      <p
                        className={`m-0 whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          mine ? "rounded-br-md bg-[#4A342E] text-white" : "rounded-bl-md border border-[#8C5A3C]/15 bg-white text-stone-800"
                        }`}
                      >
                        {m.text}
                      </p>
                    )}
                    <span className="px-1 text-[10px] text-stone-400">{chatTime(m.created_at, locale)}</span>
                  </div>
                </Fragment>
              );
            })}
          </>
        )}
      </div>

      {picking && (
        <OrderPicker
          onClose={() => setPicking(false)}
          onPick={(ref) => {
            setPendingRef(ref);
            setPicking(false);
          }}
        />
      )}

      {/* การ์ดที่รอแนบไปกับข้อความถัดไป */}
      {pendingRef && (
        <div className="flex shrink-0 items-center gap-2 border-t border-stone-200 bg-[#FAF6F0] px-3 py-2">
          <Receipt className="h-4 w-4 shrink-0 text-[#8C5A3C]" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-xs text-[#4A342E]">
            {t("attaching")} <strong>{pendingRef.no}</strong>
          </span>
          <button type="button" onClick={() => setPendingRef(null)} aria-label={t("removeAttach")} className="rounded p-1 text-stone-500 hover:bg-stone-200">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <form
        className="flex shrink-0 items-end gap-2 border-t border-stone-200 bg-white p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <button
          type="button"
          onClick={() => setPicking((v) => !v)}
          aria-label={t("attachOrder")}
          title={t("attachOrder")}
          aria-expanded={picking}
          className={`flex h-[44px] w-[40px] shrink-0 items-center justify-center rounded-xl transition ${
            picking ? "bg-[#8C5A3C]/15 text-[#4A342E]" : "text-[#8C5A3C] hover:bg-[#8C5A3C]/10"
          }`}
        >
          <Receipt className="h-5 w-5" aria-hidden="true" />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter = ส่ง · Shift+Enter = ขึ้นบรรทัดใหม่ (ระหว่างพิมพ์ภาษาไทยด้วย IME ไม่ส่ง)
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          rows={Math.min(4, Math.max(1, text.split("\n").length))}
          maxLength={CHAT_TEXT_MAX}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="max-h-32 min-h-[44px] min-w-0 flex-1 resize-none rounded-xl border border-[#8C5A3C]/25 px-3 py-2.5 text-sm text-[#4A342E] outline-none focus:border-[#8C5A3C] focus:ring-2 focus:ring-[#8C5A3C]/20"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label={t("send")}
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#4A342E] !text-white transition hover:bg-[#8C5A3C] disabled:opacity-40"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
        </button>
      </form>
    </>
  );
}
