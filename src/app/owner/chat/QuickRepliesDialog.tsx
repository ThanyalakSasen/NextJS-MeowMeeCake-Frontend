"use client";
// จัดการข้อความตอบเร็วของหน้าแชท (สิทธิ์ chat.update) — เพิ่ม · แก้ · ลบ · เลื่อนลำดับขึ้น/ลง
// ใช้ร่วมกันทั้งร้าน (พนักงานทุกคนที่ตอบแชทได้เห็นชุดเดียวกัน)
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Trash2, X } from "lucide-react";
import { adminChatService, ADMIN_CHAT_QUICK_REPLIES_KEY, CHAT_TEXT_MAX, type ChatQuickReply } from "@/services/chat";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brown-500";

export default function QuickRepliesDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("chat");
  const qc = useQueryClient();
  const listQ = useQuery({ queryKey: ADMIN_CHAT_QUICK_REPLIES_KEY, queryFn: adminChatService.quickReplies });
  const items = listQ.data ?? [];
  const [editing, setEditing] = useState<ChatQuickReply | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const refresh = () => void qc.invalidateQueries({ queryKey: ADMIN_CHAT_QUICK_REPLIES_KEY });
  const fail = (e: unknown) => alert.error(isApiError(e) ? e.message : t("quickSaveFailed"));
  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setText("");
  };

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminChatService.updateQuickReply(editing._id, { title: title.trim(), text: text.trim() })
        : adminChatService.createQuickReply({ title: title.trim(), text: text.trim() }),
    onSuccess: () => {
      resetForm();
      refresh();
    },
    onError: fail,
  });
  const remove = useMutation({ mutationFn: (id: string) => adminChatService.deleteQuickReply(id), onSuccess: refresh, onError: fail });
  // สลับลำดับกับรายการข้างเคียง (บันทึก sort_order ทั้งคู่)
  const move = useMutation({
    mutationFn: async ({ a, b }: { a: ChatQuickReply; b: ChatQuickReply }) => {
      const [sa, sb] = a.sort_order === b.sort_order ? [b.sort_order + 1, a.sort_order] : [b.sort_order, a.sort_order];
      await adminChatService.updateQuickReply(a._id, { sort_order: sa });
      await adminChatService.updateQuickReply(b._id, { sort_order: sb });
    },
    onSuccess: refresh,
    onError: fail,
  });

  const startEdit = (r: ChatQuickReply) => {
    setEditing(r);
    setTitle(r.title);
    setText(r.text);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="quick-replies-title" className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 id="quick-replies-title" className="m-0 text-base font-semibold text-brown-900">{t("quickManageTitle")}</h2>
          <button type="button" onClick={onClose} aria-label={t("close")} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-3">
          {listQ.isLoading ? (
            <li className="p-4 text-center text-sm text-gray-500">{t("loading")}</li>
          ) : items.length === 0 ? (
            <li className="p-4 text-center text-sm text-gray-500">{t("quickEmpty")}</li>
          ) : (
            items.map((r, i) => (
              <li key={r._id} className={`flex items-start gap-2 rounded-lg px-2 py-2 ${editing?._id === r._id ? "bg-brown-50" : "hover:bg-gray-50"}`}>
                <div className="min-w-0 flex-1">
                  {r.title && <p className="m-0 text-xs font-semibold text-brown-700">{r.title}</p>}
                  <p className="m-0 whitespace-pre-wrap break-words text-sm text-gray-800">{r.text}</p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button type="button" disabled={i === 0 || move.isPending} onClick={() => move.mutate({ a: r, b: items[i - 1] })} aria-label={t("moveUp")} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" disabled={i === items.length - 1 || move.isPending} onClick={() => move.mutate({ a: r, b: items[i + 1] })} aria-label={t("moveDown")} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => startEdit(r)} aria-label={t("edit")} className="rounded p-1.5 text-gray-500 hover:bg-gray-100">
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (await confirmAlert(t("quickDeleteConfirm"), { confirmText: t("delete"), cancelText: t("cancel") })) remove.mutate(r._id);
                    }}
                    aria-label={t("delete")}
                    className="rounded p-1.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        <form
          className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) save.mutate();
          }}
        >
          <p className="m-0 text-sm font-semibold text-gray-800">{editing ? t("quickEditTitle") : t("quickAddTitle")}</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} placeholder={t("quickTitlePlaceholder")} aria-label={t("quickTitlePlaceholder")} className={input} />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={CHAT_TEXT_MAX} placeholder={t("quickTextPlaceholder")} aria-label={t("quickTextPlaceholder")} className={`${input} resize-none`} />
          <div className="flex justify-end gap-2">
            {editing && (
              <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-white">
                {t("cancel")}
              </button>
            )}
            <button type="submit" disabled={!text.trim() || save.isPending} className="rounded-lg bg-brown-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brown-700 disabled:opacity-40">
              {editing ? t("save") : t("add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
