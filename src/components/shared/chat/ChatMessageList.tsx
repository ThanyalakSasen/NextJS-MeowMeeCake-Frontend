"use client";
// ─────────────────────────────────────────────────────────────
// รายการข้อความแชท (ฟองข้อความ) — ใช้ทั้งหน้าร้าน (ลูกค้า) และหลังร้าน (พนักงาน)
// viewer = ฝั่งที่กำลังดู: ข้อความของฝั่งตัวเองอยู่ขวา (สีน้ำตาล) · อีกฝั่งอยู่ซ้าย (สีขาว)
// คั่นด้วยวันที่ · ข้อความล่าสุดของฝั่งตัวเองที่อีกฝั่งอ่านแล้วขึ้น "อ่านแล้ว"
// เลื่อนลงล่างสุดเองเมื่อมีข้อความใหม่ — ยกเว้นผู้ใช้เลื่อนขึ้นไปอ่านของเก่าอยู่ (ไม่กระชากจอ)
// ข้อความของฝั่งตัวเอง: ปุ่ม … เปิดเมนู แก้ไข/ลบ (ส่ง onEdit/onDelete มา) · แก้แล้วขึ้น "แก้ไขแล้ว" · ลบแล้วทั้งสองฝั่งเห็น "ข้อความนี้ถูกลบแล้ว"
// แก้ข้อความที่มีคำสั่งซื้อแนบ + ส่ง renderAttachPicker มา (หน้าร้าน) = กด "เปลี่ยน" เลือกคำสั่งซื้ออื่นมาแทนได้
// ─────────────────────────────────────────────────────────────
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MoreHorizontal, Package, Pencil, ReceiptText, Trash2 } from "lucide-react";
import { confirmAlert } from "@/lib/alert";
import { CHAT_MAX_LENGTH } from "./ChatComposer";
import type { ChatAttachRef, ChatAttachment, ChatMessage, ChatSenderType } from "@/types/chat";

const baht = (n: number) => `฿${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function ChatMessageList({
  messages,
  viewer,
  attachmentHref,
  onOpenAttachment,
  hasMore,
  loadingOlder,
  onLoadOlder,
  empty,
  className = "",
  onEdit,
  onDelete,
  renderAttachPicker,
}: {
  messages: ChatMessage[];
  viewer: ChatSenderType;
  /** ลิงก์ไปหน้ารายละเอียดของคำสั่งซื้อที่แนบ (ต่างกันระหว่างหน้าร้าน/หลังร้าน) */
  attachmentHref: (a: ChatAttachment) => string;
  /** ส่งมา = กดการ์ดแล้วเปิดป๊อปอัปแทนการไปหน้าอื่น (หลังร้าน) · ไม่ส่ง = ลิงก์ไป attachmentHref */
  onOpenAttachment?: (a: ChatAttachment) => void;
  hasMore?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  /** แสดงเมื่อยังไม่มีข้อความ */
  empty?: React.ReactNode;
  className?: string;
  /** แก้ข้อความของฝั่งตัวเอง (attach = คำสั่งซื้อใหม่ที่เลือกมาแทน · ไม่เปลี่ยน = undefined) — คืน true = สำเร็จ (ปิดช่องแก้) · ไม่ส่ง = ไม่มีเมนูแก้ไข */
  onEdit?: (m: ChatMessage, body: string, attach?: ChatAttachRef) => Promise<boolean>;
  /** ลบข้อความของฝั่งตัวเอง (ถามยืนยันก่อนเรียก) · ไม่ส่ง = ไม่มีปุ่มลบ */
  onDelete?: (m: ChatMessage) => Promise<boolean>;
  /** ป๊อปอัปเลือกคำสั่งซื้อ (ตอนแก้ข้อความที่มีแนบ) · ไม่ส่ง = เปลี่ยนคำสั่งซื้อที่แนบไม่ได้ (หลังร้าน) */
  renderAttachPicker?: (p: { open: boolean; onClose: () => void; onPick: (a: ChatAttachRef) => void }) => React.ReactNode;
}) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const boxRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const prevFirstRef = useRef<string | null>(null);
  const prevHeightRef = useRef(0);
  /** attach = คำสั่งซื้อใหม่ที่เลือกมาแทน (null = ยังใช้ของเดิม) */
  const [editing, setEditing] = useState<{ id: string; text: string; attach: ChatAttachRef | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);

  // เมนู … เปิดอยู่ — คลิกที่อื่น / กด Esc = ปิด
  useEffect(() => {
    if (!menuId) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuId(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuId]);

  const saveEdit = async (m: ChatMessage) => {
    if (!editing || !onEdit) return;
    const body = editing.text.trim();
    const attach = editing.attach && editing.attach.id !== m.attachment?.ref_id ? editing.attach : undefined;
    if (body === m.body && !attach) return setEditing(null);
    setBusyId(m._id);
    const ok = await onEdit(m, body, attach);
    setBusyId(null);
    if (ok) setEditing(null);
  };
  const askDelete = async (m: ChatMessage) => {
    if (!onDelete) return;
    if (!(await confirmAlert(t("deleteConfirm"), { note: t("deleteNote"), variant: "delete", danger: true }))) return;
    setBusyId(m._id);
    await onDelete(m);
    setBusyId(null);
  };

  // ผู้ใช้อยู่ใกล้ล่างสุด = ติดล่าง (ข้อความใหม่เลื่อนตาม)
  const onScroll = () => {
    const el = boxRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const first = messages[0]?._id ?? null;
    // โหลดของเก่าเพิ่มด้านบน → คงตำแหน่งที่อ่านอยู่
    if (prevFirstRef.current && first !== prevFirstRef.current && !stickRef.current) {
      el.scrollTop += el.scrollHeight - prevHeightRef.current;
    } else if (stickRef.current) {
      el.scrollTop = el.scrollHeight;
    }
    prevFirstRef.current = first;
    prevHeightRef.current = el.scrollHeight;
  }, [messages]);

  const lastReadMine = [...messages].reverse().find((m) => m.sender_type === viewer && m.read_at)?._id;
  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale === "th" ? "th-TH" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div ref={boxRef} onScroll={onScroll} className={`flex flex-col gap-1.5 overflow-y-auto px-3 py-4 sm:px-4 ${className}`} aria-live="polite">
      {hasMore && onLoadOlder && (
        <button
          type="button"
          onClick={onLoadOlder}
          disabled={loadingOlder}
          className="mx-auto mb-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-60"
        >
          {loadingOlder ? t("loadingOlder") : t("loadOlder")}
        </button>
      )}
      {messages.length === 0 && empty}
      {messages.map((m, i) => {
        const mine = m.sender_type === viewer;
        const prev = messages[i - 1];
        const showDay = !prev || !sameDay(prev.created_at, m.created_at);
        const grouped = prev && !showDay && prev.sender_type === m.sender_type;
        const isEditing = editing?.id === m._id;
        const canAct = mine && !m.deleted && !isEditing && (!!onEdit || !!onDelete);
        return (
          <div key={m._id} className="flex flex-col">
            {showDay && (
              <span className="mx-auto my-2 rounded-full bg-stone-100 px-3 py-0.5 text-xs text-stone-600">{day(m.created_at)}</span>
            )}
            <div className={`group flex items-end gap-1.5 ${mine ? "flex-row-reverse" : ""} ${grouped ? "" : "mt-1.5"}`}>
              <div className={`flex max-w-[80%] flex-col gap-1.5 sm:max-w-[70%] ${mine ? "items-end" : "items-start"}`}>
                {m.deleted && (
                  <p className="m-0 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-3.5 py-2 text-sm italic text-stone-500">
                    {t("deletedMessage")}
                  </p>
                )}
                {m.attachment && (
                  <AttachmentCard
                    a={m.attachment}
                    href={attachmentHref(m.attachment)}
                    mine={mine}
                    onOpen={onOpenAttachment ? () => onOpenAttachment(m.attachment!) : undefined}
                  />
                )}
                {isEditing ? (
                  <div className="flex w-72 max-w-full flex-col gap-1.5 rounded-2xl border border-[#8C5A3C]/30 bg-white p-2 shadow-sm">
                    {m.attachment && renderAttachPicker && (
                      <div className="flex items-center gap-2 rounded-xl border border-[#8C5A3C]/20 bg-[#FAF6F0] px-2.5 py-1.5 text-xs">
                        {(editing.attach?.kind ?? m.attachment.kind) === "preorder" ? (
                          <Package size={14} className="shrink-0 text-[#8C5A3C]" aria-hidden="true" />
                        ) : (
                          <ReceiptText size={14} className="shrink-0 text-[#8C5A3C]" aria-hidden="true" />
                        )}
                        <span className="min-w-0 flex-1 truncate text-[#4A342E]">
                          <span className="text-stone-500">{t("attachedLabel")} </span>
                          <span className="font-semibold">{editing.attach?.doc_no ?? m.attachment.doc_no}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setPickerOpen(true)}
                          aria-haspopup="dialog"
                          title={t("changeAttachTitle")}
                          className="shrink-0 rounded-full border border-[#8C5A3C]/30 bg-white px-2.5 py-0.5 font-semibold text-[#8C5A3C] hover:bg-[#FAF6F0]"
                        >
                          {t("changeAttach")}
                        </button>
                      </div>
                    )}
                    <textarea
                      autoFocus
                      rows={3}
                      maxLength={CHAT_MAX_LENGTH}
                      value={editing.text}
                      aria-label={t("editLabel")}
                      onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditing(null);
                        else if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          void saveEdit(m);
                        }
                      }}
                      className="w-full resize-none rounded-xl border-0 bg-transparent p-1.5 text-sm text-[#4A342E] outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50"
                      >
                        {t("cancelEdit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveEdit(m)}
                        disabled={busyId === m._id || (!editing.text.trim() && !m.attachment)}
                        className="rounded-full bg-[#4A342E] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {t("saveEdit")}
                      </button>
                    </div>
                  </div>
                ) : m.body && (
                  <p
                    className={`m-0 whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                      mine ? "rounded-br-md bg-[#4A342E] text-white" : "rounded-bl-md border border-[#8C5A3C]/10 bg-white text-[#4A342E]"
                    }`}
                  >
                    {m.body}
                  </p>
                )}
              </div>
              <span className={`shrink-0 pb-0.5 text-[11px] leading-tight text-stone-500 ${mine ? "text-right" : ""}`}>
                {canAct && (
                  <span
                    ref={menuId === m._id ? menuRef : undefined}
                    className={`relative mb-0.5 flex transition ${mine ? "justify-end" : ""} ${
                      menuId === m._id ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setMenuId(menuId === m._id ? null : m._id)}
                      disabled={busyId === m._id}
                      aria-label={t("moreActions")}
                      title={t("moreActions")}
                      aria-haspopup="menu"
                      aria-expanded={menuId === m._id}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-[#4A342E]"
                    >
                      <MoreHorizontal size={16} aria-hidden="true" />
                    </button>
                    {menuId === m._id && (
                      <span
                        role="menu"
                        className={`absolute bottom-full z-20 mb-1 flex w-36 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white py-1 text-left text-sm shadow-lg ${
                          mine ? "right-0" : "left-0"
                        }`}
                      >
                        {onEdit && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuId(null);
                              setEditing({ id: m._id, text: m.body, attach: null });
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-[#4A342E] hover:bg-stone-50"
                          >
                            <Pencil size={14} aria-hidden="true" />
                            {t("editMessage")}
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuId(null);
                              void askDelete(m);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            {t("deleteMessage")}
                          </button>
                        )}
                      </span>
                    )}
                  </span>
                )}
                {/* สถานะแสดงแค่ 1 อัน: "อ่านแล้ว" ก่อน (ข้อความล่าสุดที่อีกฝั่งอ่าน) ไม่งั้น "แก้ไขแล้ว" */}
                {m._id === lastReadMine ? (
                  <span className="block" title={m.edited_at && !m.deleted ? t("edited") : undefined}>{t("read")}</span>
                ) : (
                  m.edited_at && !m.deleted && <span className="block">{t("edited")}</span>
                )}
                {time(m.created_at)}
              </span>
            </div>
          </div>
        );
      })}
      {renderAttachPicker?.({
        open: pickerOpen && !!editing,
        onClose: () => setPickerOpen(false),
        onPick: (a) => {
          setPickerOpen(false);
          setEditing((cur) => (cur ? { ...cur, attach: a } : cur));
        },
      })}
    </div>
  );
}

/** การ์ดคำสั่งซื้อที่แนบ — เลขที่ · สินค้า · ยอด · สถานะ ณ ตอนส่ง · กดไปหน้ารายละเอียด (หรือเปิดป๊อปอัป ถ้ามี onOpen) */
function AttachmentCard({ a, href, mine, onOpen }: { a: ChatAttachment; href: string; mine: boolean; onOpen?: () => void }) {
  const t = useTranslations("chat");
  const ts = useTranslations("shop.orderStatus");
  const Icon = a.kind === "order" ? ReceiptText : Package;
  const more = Math.max(0, a.item_count - 1);
  const className = `block w-64 max-w-full rounded-2xl border bg-white p-3 text-left text-[#4A342E] shadow-sm transition hover:shadow-md ${
    mine ? "border-[#8C5A3C]/40" : "border-[#8C5A3C]/15"
  }`;
  const body = (
    <>
      <span className="flex items-center gap-2 text-xs font-semibold text-[#8C5A3C]">
        <Icon size={14} aria-hidden="true" />
        {a.kind === "order" ? t("attachOrder") : t("attachPreorder")}
      </span>
      <span className="mt-1 block text-sm font-bold">{a.doc_no}</span>
      {a.first_item_name && (
        <span className="block truncate text-xs text-stone-600">
          {more > 0 ? t("itemsMore", { name: a.first_item_name, n: more }) : a.first_item_name}
        </span>
      )}
      <span className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-extrabold">{baht(a.total_amount)}</span>
        {a.order_status && (
          <span className="rounded-full bg-[#FAF6F0] px-2 py-0.5 text-[11px] font-semibold text-[#8C5A3C]">{ts(a.order_status)}</span>
        )}
      </span>
      <span className="mt-1.5 block text-right text-xs font-semibold text-[#8C5A3C] underline-offset-2 hover:underline">{t("viewDetail")}</span>
    </>
  );
  return onOpen ? (
    <button type="button" onClick={onOpen} className={className}>
      {body}
    </button>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
