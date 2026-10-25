"use client";
// ─────────────────────────────────────────────────────────────
// กล่องข้อความแชทกับลูกค้า (หลังร้าน)
//   ซ้าย: รายการห้อง (ข้อความล่าสุดก่อน · ทั้งหมด / ยังไม่ตอบ / ยังไม่อ่าน · ค้นหาชื่อ/เบอร์/อีเมล) — ดึงใหม่ทุก 10 วิ
//   ขวา: ข้อความ (ดึงใหม่ทุก 4 วิ) + ข้อมูลลูกค้า/คำสั่งซื้อล่าสุด + ช่องตอบ (เฉพาะสิทธิ์ chat.create)
//     - กดคำสั่งซื้อล่าสุดของลูกค้า = แนบการ์ดไปกับข้อความถัดไป · การ์ดในข้อความกดแล้วเปิดคำสั่งซื้อในหลังร้าน
//     - ปุ่ม "ตอบเร็ว" = เลือกข้อความสำเร็จรูปเติมลงช่องตอบ (แก้ก่อนส่งได้) · จัดการรายการได้เมื่อมีสิทธิ์ chat.update
//   จอแคบ: แสดงทีละฝั่ง (เลือกห้อง → ข้อความ · ปุ่มย้อนกลับ)
//   เปิดห้อง = อ่านแล้ว · ลูกค้าไม่เห็นชื่อพนักงานที่ตอบ (หลังร้านเห็น)
// ─────────────────────────────────────────────────────────────
import { Fragment, useDeferredValue, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, MessageCircle, Paperclip, Phone, Receipt, Search, Send, X, Zap } from "lucide-react";
import {
  adminChatService,
  ADMIN_CHAT_QUICK_REPLIES_KEY,
  ADMIN_CHAT_UNREAD_KEY,
  CHAT_TEXT_MAX,
  type ChatListFilter,
  type ChatOrderCard,
  type ChatRef,
} from "@/services/chat";
import { usePermission } from "@/context/PermissionsContext";
import { useChatThread } from "@/hooks/useChatThread";
import { chatDayKey, chatDayLabel, chatListTime, chatTime } from "@/lib/chatFormat";
import { formatDate } from "@/i18n/format";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import QuickRepliesDialog from "./QuickRepliesDialog";

const FILTERS: ChatListFilter[] = ["all", "unanswered", "unread"];
const LIST_KEY = ["admin", "chats", "list"] as const;

const baht = (n: number) => `฿${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
const orderHref = (kind: ChatRef["kind"], id: string) =>
  kind === "order" ? `/owner/orders/manageOrders?id=${encodeURIComponent(id)}` : `/owner/orders/preOrderRound?tab=orders&id=${encodeURIComponent(id)}`;

export default function ChatInbox() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/owner/chat";
  const router = useRouter();
  const selected = searchParams.get("c");
  const select = (id: string | null) => router.replace(id ? `${pathname}?c=${id}` : pathname, { scroll: false });

  const [filter, setFilter] = useState<ChatListFilter>("all");
  const [search, setSearch] = useState("");
  const q = useDeferredValue(search.trim());
  const listQ = useQuery({
    queryKey: [...LIST_KEY, filter, q],
    queryFn: () => adminChatService.list({ filter, q: q || undefined, limit: 50 }),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
  const rows = listQ.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-brown-900">{t("title")}</h1>
      <div className="grid h-[calc(100dvh-13rem)] min-h-[480px] grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* รายการห้อง */}
        <aside className={`${selected ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r border-gray-200`}>
          <div className="flex flex-col gap-2 border-b border-gray-200 p-3">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search")}
                aria-label={t("search")}
                className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-brown-500"
              />
            </label>
            <div className="flex gap-1" role="tablist">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                    filter === f ? "bg-brown-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t(`filter.${f}`)}
                </button>
              ))}
            </div>
          </div>
          <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0">
            {listQ.isLoading ? (
              <li className="p-6 text-center text-sm text-gray-500">{t("loading")}</li>
            ) : listQ.isError ? (
              <li className="p-6 text-center text-sm text-red-600">{t("loadFailed")}</li>
            ) : rows.length === 0 ? (
              <li className="p-6 text-center text-sm text-gray-500">{q || filter !== "all" ? t("emptyFiltered") : t("empty")}</li>
            ) : (
              rows.map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    onClick={() => select(c._id)}
                    className={`flex w-full items-start gap-3 border-b border-gray-100 px-3 py-3 text-left transition hover:bg-gray-50 ${
                      selected === c._id ? "bg-brown-50" : ""
                    }`}
                  >
                    <Avatar name={c.customer.name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${c.unread_shop > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                          {c.customer.name}
                        </span>
                        {c.last_message_at && <span className="shrink-0 text-[11px] text-gray-500">{chatListTime(c.last_message_at, locale)}</span>}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-xs ${c.unread_shop > 0 ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                          {c.last_sender === "shop" ? `${t("you")}: ` : ""}
                          {c.last_message_text}
                        </span>
                        {c.unread_shop > 0 ? (
                          <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                            {c.unread_shop > 99 ? "99+" : c.unread_shop}
                          </span>
                        ) : c.last_sender === "customer" ? (
                          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">{t("waiting")}</span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        {/* ห้องที่เลือก */}
        <section className={`${selected ? "flex" : "hidden lg:flex"} min-h-0 flex-col`}>
          {selected ? (
            <Conversation key={selected} id={selected} onBack={() => select(null)} />
          ) : (
            <div className="m-auto flex flex-col items-center gap-2 p-6 text-center text-gray-500">
              <MessageCircle className="h-10 w-10 text-gray-300" aria-hidden="true" />
              <p className="m-0 text-sm">{t("pickConversation")}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brown-100 text-sm font-bold text-brown-800" aria-hidden="true">
      {name.trim().charAt(0) || "?"}
    </span>
  );
}

/** การ์ดคำสั่งซื้อในข้อความ — กดแล้วเปิดคำสั่งซื้อ/พรีออเดอร์นั้นในหลังร้าน */
function OrderCard({ card }: { card: ChatOrderCard }) {
  const t = useTranslations("chat");
  const te = useTranslations("enums");
  const locale = useLocale();
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-brown-600">
        <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
        {card.kind === "order" ? t("cardOrder") : t("cardPreorder")}
      </span>
      <span className="block text-sm font-bold text-gray-900">{card.no}</span>
      {card.missing ? (
        <span className="block text-xs text-gray-500">{t("cardMissing")}</span>
      ) : (
        <span className="block text-xs text-gray-600">
          {card.order_status && te(`orderStatus.${card.order_status}` as "orderStatus.pending")}
          {card.payment_status && ` · ${te(`paymentStatus.${card.payment_status}` as "paymentStatus.pending")}`}
          {card.total_amount != null && ` · ${baht(card.total_amount)}`}
          {card.created_at && ` · ${formatDate(card.created_at, locale)}`}
        </span>
      )}
    </>
  );
  const cls = "block w-64 max-w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left";
  return card.missing ? <span className={cls}>{body}</span> : <Link href={orderHref(card.kind, card.id)} className={`${cls} hover:bg-gray-50`}>{body}</Link>;
}

function Conversation({ id, onBack }: { id: string; onBack: () => void }) {
  const t = useTranslations("chat");
  const te = useTranslations("enums");
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("chat");
  const detailQ = useQuery({ queryKey: ["admin", "chats", id, "detail"], queryFn: () => adminChatService.get(id), refetchInterval: 30_000 });
  const thread = useChatThread({ queryKey: ["admin", "chats", id], load: (p) => adminChatService.messages(id, p), enabled: true });
  const [text, setText] = useState("");
  const [pendingRef, setPendingRef] = useState<ChatRef | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const lastId = thread.messages.at(-1)?._id;
  const lastCustomerId = [...thread.messages].reverse().find((m) => m.sender === "customer")?._id;

  const refreshCounts = () => {
    void qc.invalidateQueries({ queryKey: LIST_KEY });
    void qc.invalidateQueries({ queryKey: ADMIN_CHAT_UNREAD_KEY });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  // เปิดห้อง / มีข้อความลูกค้าใหม่เข้ามาระหว่างเปิด → อ่านแล้ว (ล้างตัวเลขในรายการ + บนเมนู)
  useEffect(() => {
    if (!lastCustomerId) return;
    void adminChatService.read(id).then(() => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
      void qc.invalidateQueries({ queryKey: ADMIN_CHAT_UNREAD_KEY });
    });
  }, [id, lastCustomerId, qc]);

  const quickQ = useQuery({ queryKey: ADMIN_CHAT_QUICK_REPLIES_KEY, queryFn: adminChatService.quickReplies, enabled: perm.create, staleTime: 60_000 });

  const send = useMutation({
    mutationFn: ({ body, ref }: { body: string; ref: ChatRef | null }) => adminChatService.send(id, body, ref),
    onSuccess: (m) => {
      thread.append(m);
      setText("");
      setPendingRef(null);
      refreshCounts();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("sendFailed")),
  });
  const canSend = (!!text.trim() || !!pendingRef) && !send.isPending;
  const submit = () => {
    if (canSend) send.mutate({ body: text.trim(), ref: pendingRef });
  };

  const insertQuick = (value: string) => {
    setText((cur) => (cur.trim() ? `${cur.replace(/\s+$/, "")}\n${value}` : value));
    setQuickOpen(false);
    requestAnimationFrame(() => textRef.current?.focus());
  };

  const loadOlder = async () => {
    const el = scrollRef.current;
    const fromBottom = el ? el.scrollHeight - el.scrollTop : 0;
    await thread.loadOlder();
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - fromBottom;
    });
  };

  const d = detailQ.data;
  return (
    <>
      {/* หัวห้อง: ลูกค้า + ติดต่อ + คำสั่งซื้อล่าสุด (กด = แนบการ์ด) */}
      <header className="flex flex-col gap-2 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label={t("back")} className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <Avatar name={d?.customer.name ?? ""} />
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm font-bold text-gray-900">{d?.customer.name ?? t("loading")}</p>
            <p className="m-0 flex flex-wrap gap-x-3 text-xs text-gray-500">
              {d?.customer.phone && (
                <a href={`tel:${d.customer.phone}`} className="inline-flex items-center gap-1 hover:text-brown-700">
                  <Phone className="h-3 w-3" aria-hidden="true" /> {d.customer.phone}
                </a>
              )}
              {d?.customer.email && (
                <a href={`mailto:${d.customer.email}`} className="inline-flex items-center gap-1 break-all hover:text-brown-700">
                  <Mail className="h-3 w-3" aria-hidden="true" /> {d.customer.email}
                </a>
              )}
            </p>
          </div>
        </div>
        {d && d.recent_orders.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <span className="shrink-0 text-[11px] font-semibold text-gray-500">{t("recentOrders")}</span>
            {d.recent_orders.map((o) => {
              const label = (
                <>
                  <span className="font-semibold">{o.no}</span> · {te(`orderStatus.${o.order_status}` as "orderStatus.pending")} · {baht(o.total_amount)}
                </>
              );
              return perm.create ? (
                <button
                  key={o._id}
                  type="button"
                  title={t("attachThis")}
                  onClick={() => setPendingRef({ kind: o.kind, id: o._id, no: o.no })}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-700 hover:border-brown-300 hover:bg-brown-50"
                >
                  <Paperclip className="h-3 w-3 text-brown-600" aria-hidden="true" />
                  {label}
                </button>
              ) : (
                <Link key={o._id} href={orderHref(o.kind, o._id)} className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-100">
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-gray-50 px-4 py-4">
        {thread.isLoading ? (
          <p className="m-auto text-sm text-gray-500">{t("loading")}</p>
        ) : thread.isError ? (
          <div className="m-auto space-y-2 text-center">
            <p className="m-0 text-sm text-red-600">{t("loadFailed")}</p>
            <button type="button" onClick={thread.retry} className="text-sm font-semibold text-brown-700 underline">
              {t("retry")}
            </button>
          </div>
        ) : (
          <>
            {thread.hasMore && (
              <button
                type="button"
                onClick={() => void loadOlder()}
                disabled={thread.loadingOlder}
                className="mx-auto mb-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-100 disabled:opacity-60"
              >
                {thread.loadingOlder ? t("loading") : t("loadOlder")}
              </button>
            )}
            {thread.messages.map((m, i) => {
              const fromShop = m.sender === "shop";
              const newDay = i === 0 || chatDayKey(thread.messages[i - 1].created_at) !== chatDayKey(m.created_at);
              return (
                <Fragment key={m._id}>
                  {newDay && (
                    <p className="m-0 my-1 self-center rounded-full bg-black/5 px-3 py-0.5 text-[11px] text-gray-500">
                      {chatDayLabel(m.created_at, locale, { today: t("today"), yesterday: t("yesterday") })}
                    </p>
                  )}
                  <div className={`flex max-w-[75%] flex-col gap-0.5 ${fromShop ? "items-end self-end" : "items-start self-start"}`}>
                    {m.card && <OrderCard card={m.card} />}
                    {m.text && (
                      <p
                        className={`m-0 whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          fromShop ? "rounded-br-md bg-brown-800 text-white" : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
                        }`}
                      >
                        {m.text}
                      </p>
                    )}
                    <span className="px-1 text-[10px] text-gray-500">
                      {fromShop && m.sender_name ? `${m.sender_name} · ` : ""}
                      {chatTime(m.created_at, locale)}
                    </span>
                  </div>
                </Fragment>
              );
            })}
          </>
        )}
      </div>

      {perm.create ? (
        <div className="relative border-t border-gray-200">
          {/* ข้อความตอบเร็ว — เลือกแล้วเติมลงช่องตอบ */}
          {quickOpen && (
            <div className="absolute bottom-full left-3 z-10 mb-2 flex max-h-72 w-[min(22rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                <p className="m-0 text-xs font-bold text-gray-700">{t("quickTitle")}</p>
                <button type="button" onClick={() => setQuickOpen(false)} aria-label={t("close")} className="rounded p-1 text-gray-500 hover:bg-gray-100">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-1">
                {quickQ.isLoading ? (
                  <li className="p-3 text-xs text-gray-500">{t("loading")}</li>
                ) : (quickQ.data ?? []).length === 0 ? (
                  <li className="p-3 text-xs text-gray-500">{t("quickEmpty")}</li>
                ) : (
                  quickQ.data!.map((r) => (
                    <li key={r._id}>
                      <button type="button" onClick={() => insertQuick(r.text)} className="w-full rounded-lg px-2.5 py-2 text-left hover:bg-gray-50">
                        {r.title && <span className="block text-xs font-semibold text-brown-700">{r.title}</span>}
                        <span className="line-clamp-2 block text-xs text-gray-700">{r.text}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
              {perm.update && (
                <button
                  type="button"
                  onClick={() => {
                    setQuickOpen(false);
                    setManageOpen(true);
                  }}
                  className="border-t border-gray-100 px-3 py-2 text-left text-xs font-semibold text-brown-700 hover:bg-gray-50"
                >
                  {t("quickManage")}
                </button>
              )}
            </div>
          )}

          {pendingRef && (
            <div className="flex items-center gap-2 border-b border-gray-100 bg-brown-50 px-3 py-2">
              <Receipt className="h-4 w-4 shrink-0 text-brown-600" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-xs text-gray-700">
                {t("attaching")} <strong>{pendingRef.no}</strong>
              </span>
              <button type="button" onClick={() => setPendingRef(null)} aria-label={t("removeAttach")} className="rounded p-1 text-gray-500 hover:bg-brown-100">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          <form
            className="flex items-end gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <button
              type="button"
              onClick={() => setQuickOpen((v) => !v)}
              aria-expanded={quickOpen}
              title={t("quickTitle")}
              className={`flex h-[44px] shrink-0 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition ${
                quickOpen ? "border-brown-400 bg-brown-50 text-brown-800" : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("quickButton")}</span>
            </button>
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={Math.min(5, Math.max(1, text.split("\n").length))}
              maxLength={CHAT_TEXT_MAX}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              className="max-h-36 min-h-[44px] min-w-0 flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brown-500"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label={t("send")}
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg bg-brown-800 text-white transition hover:bg-brown-700 disabled:opacity-40"
            >
              <Send className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      ) : (
        <p className="m-0 border-t border-gray-200 p-3 text-center text-xs text-gray-500">{t("noReplyPermission")}</p>
      )}

      {manageOpen && <QuickRepliesDialog onClose={() => setManageOpen(false)} />}
    </>
  );
}
