"use client";
// View ของแชทลูกค้า — ซ้าย: รายการห้อง (ค้นหา · ทั้งหมด/ยังไม่ได้อ่าน) · ขวา: ข้อความในห้อง + ช่องตอบ
// แถวห้อง: ชื่อ + ปุ่ม "..." (ลบแชท) มุมขวาบน · ข้อความล่าสุด · เวลา ต่อท้ายข้อความล่าสุด
// จอแคบ (<1024px): แสดงทีละฝั่ง — เลือกห้องแล้วเห็นห้อง มีปุ่มย้อนกลับไปรายการ
import { useState } from "react";
import { Dropdown, Segmented } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftIcon, ChatBubbleLeftRightIcon, EllipsisHorizontalIcon, EnvelopeIcon, PhoneIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { SearchInput } from "@/components/shared/data";
import { LoadFailed } from "@/components/shared/feedback";
import ChatMessageList from "@/components/shared/chat/ChatMessageList";
import ChatComposer from "@/components/shared/chat/ChatComposer";
import type { ChatAttachment, ChatConversation } from "@/types/chat";
import { ChatOrderPopup } from "./_components/ChatOrderPopup";
import { staffAttachmentHref, type useChatsViewModel } from "./useChatsViewModel";

type VM = ReturnType<typeof useChatsViewModel>;

export function ChatsView(vm: VM) {
  const t = useTranslations("chat");
  const tn = useTranslations("nav");
  const conv = vm.thread.conversation;
  // กดการ์ดคำสั่งซื้อที่ลูกค้าแนบ = ป๊อปอัปรายละเอียดทับหน้าแชท (ไม่ออกจากห้อง)
  const [openAttachment, setOpenAttachment] = useState<ChatAttachment | null>(null);
  const customer = conv?.customer;

  return (
    <ListPageLayout title={tn("chats")}>
      <div className="flex h-[calc(100vh-13rem)] min-h-[30rem] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        {/* ── รายการห้อง ── */}
        <aside className={`w-full flex-col border-r border-stone-200 lg:flex lg:w-80 lg:shrink-0 ${vm.selectedId ? "hidden" : "flex"}`}>
          <div className="space-y-2 border-b border-stone-200 p-3">
            <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("searchCustomer")} className="!max-w-none" />
            <Segmented
              block
              value={vm.unreadOnly ? "unread" : "all"}
              onChange={(v) => vm.setUnreadOnly(v === "unread")}
              options={[
                { value: "all", label: t("filterAll") },
                { value: "unread", label: t("filterUnread") },
              ]}
              aria-label={t("filterLabel")}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {vm.listLoading ? (
              <div className="space-y-2 p-3" aria-busy="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-stone-100" />
                ))}
              </div>
            ) : vm.listError ? (
              <LoadFailed onRetry={vm.retryList} size="small" />
            ) : vm.conversations.length === 0 ? (
              <p className="m-0 p-6 text-center text-sm text-stone-500">{vm.search || vm.unreadOnly ? t("noMatchRooms") : t("noRooms")}</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {vm.conversations.map((c) => (
                  <ConversationRow
                    key={c._id}
                    c={c}
                    active={c._id === vm.selectedId}
                    onClick={() => vm.select(c._id)}
                    onDelete={vm.perm.delete ? () => vm.deleteConversation(c) : undefined}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* ── ห้องที่เลือก ── */}
        <section className={`min-w-0 flex-1 flex-col bg-[#FAF6F0]/40 ${vm.selectedId ? "flex" : "hidden lg:flex"}`}>
          {!vm.selectedId ? (
            <div className="m-auto flex flex-col items-center gap-2 p-6 text-center text-stone-500">
              <ChatBubbleLeftRightIcon className="h-10 w-10" aria-hidden="true" />
              <p className="m-0 text-sm">{t("pickRoom")}</p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-stone-200 bg-white px-3 py-2.5 sm:px-4">
                <button
                  type="button"
                  onClick={() => vm.select(null)}
                  aria-label={t("backToList")}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden"
                >
                  <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <Avatar name={customer?.user_fullname || "?"} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-sm font-semibold text-stone-800">{customer?.user_fullname || t("customer")}</p>
                  <p className="m-0 flex flex-wrap gap-x-3 text-xs text-stone-500">
                    {customer?.user_phone && (
                      <a href={`tel:${customer.user_phone}`} className="inline-flex items-center gap-1 hover:text-stone-800">
                        <PhoneIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {customer.user_phone}
                      </a>
                    )}
                    {customer?.email && (
                      <a href={`mailto:${customer.email}`} className="inline-flex min-w-0 items-center gap-1 truncate hover:text-stone-800">
                        <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{customer.email}</span>
                      </a>
                    )}
                  </p>
                </div>
              </header>

              {vm.thread.status === "error" ? (
                <p className="m-auto p-6 text-sm text-red-600">{t("loadFailed")}</p>
              ) : vm.thread.status === "loading" ? (
                <div className="flex-1 animate-pulse" aria-busy="true" aria-label={t("loading")} />
              ) : (
                <ChatMessageList
                  className="flex-1"
                  messages={vm.thread.messages}
                  viewer="staff"
                  attachmentHref={staffAttachmentHref}
                  onOpenAttachment={setOpenAttachment}
                  hasMore={vm.thread.hasMore}
                  loadingOlder={vm.thread.loadingOlder}
                  onLoadOlder={() => void vm.thread.loadOlder()}
                  onEditMessage={vm.perm.update ? vm.startEdit : undefined}
                  onDeleteMessage={vm.perm.delete ? vm.deleteMessage : undefined}
                  editingId={vm.editing?._id ?? null}
                />
              )}

              {vm.perm.create || vm.editing ? (
                <ChatComposer
                  onSend={vm.sendMessage}
                  sending={vm.sending}
                  disabled={vm.thread.status !== "ready"}
                  editing={vm.editing ? { key: vm.editing._id, text: vm.editing.body } : null}
                  onCancelEdit={vm.cancelEdit}
                />
              ) : (
                <p className="m-0 border-t border-stone-200 bg-white px-4 py-3 text-center text-sm text-stone-500">{t("noReplyPermission")}</p>
              )}
            </>
          )}
        </section>
      </div>
      <ChatOrderPopup attachment={openAttachment} onClose={() => setOpenAttachment(null)} />
    </ListPageLayout>
  );
}

function ConversationRow({
  c,
  active,
  onClick,
  onDelete,
}: {
  c: ChatConversation;
  active: boolean;
  onClick: () => void;
  /** ส่งมา = มีปุ่ม "..." → ลบแชท (chats.delete) */
  onDelete?: () => void;
}) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const name = c.customer?.user_fullname || t("customer");
  const when = c.last_message_at ? new Date(c.last_message_at) : null;
  const today = when && when.toDateString() === new Date().toDateString();
  const loc = locale === "th" ? "th-TH" : "en-GB";
  const whenText = when
    ? today
      ? when.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })
      : when.toLocaleDateString(loc, { day: "numeric", month: "short" })
    : "";
  const unread = c.staff_unread > 0;
  return (
    // ปุ่ม "..." อยู่นอกปุ่มแถว (ห้ามซ้อน button) — วางทับมุมขวาบนด้วย absolute
    <li className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        className={`flex w-full items-center gap-3 border-b border-stone-100 px-3 py-2.5 text-left transition ${
          active ? "bg-[#FAF6F0]" : "hover:bg-stone-50"
        }`}
      >
        <Avatar name={name} size={40} />
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm ${onDelete ? "pr-8" : ""} ${unread ? "font-bold text-stone-900" : "font-medium text-stone-800"}`}>
            {name}
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-baseline gap-1.5 text-xs">
              <span className={`truncate ${unread ? "font-semibold text-stone-800" : "text-stone-500"}`}>
                {c.last_sender_type === "staff" ? `${t("youPrefix")} ` : ""}
                {c.last_message_preview}
              </span>
              {whenText && <span className="shrink-0 text-stone-500">· {whenText}</span>}
            </span>
            {unread && (
              <span className="min-w-[1.25rem] shrink-0 rounded-full bg-red-500 px-1.5 text-center text-xs font-bold leading-5 text-white">
                {c.staff_unread > 99 ? "99+" : c.staff_unread}
              </span>
            )}
          </span>
        </span>
      </button>
      {onDelete && (
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: [{ key: "delete", danger: true, icon: <TrashIcon className="h-4 w-4" />, label: t("deleteRoom") }],
            onClick: ({ key }) => key === "delete" && onDelete(),
          }}
        >
          <button
            type="button"
            aria-label={t("roomMenu")}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-200 hover:text-stone-800"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </Dropdown>
      )}
    </li>
  );
}
