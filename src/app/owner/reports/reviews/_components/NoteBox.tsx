"use client";
// บันทึกภายในของรีวิว (ทีมงานเห็นเท่านั้น ลูกค้าไม่เห็น) — เขียน/แก้ในป๊อปอัป · ข้อความว่าง = ลบโน้ต
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Modal } from "antd";
import { TextArea } from "@/components/base";
import { formatDate } from "@/i18n/format";
import { actionIcon } from "@/components/shared/actions";

const MAX_NOTE = 2000;

export function NoteBox({ note, canEdit, onSave, context }: {
  note: { text: string; updated_at: string } | null | undefined;
  canEdit: boolean;
  onSave: (text: string) => Promise<boolean>;
  /** รีวิวของลูกค้า (แสดงบนสุดของป๊อปอัป) */
  context?: React.ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note?.text ?? "");
  const [saving, setSaving] = useState(false);

  const open = (value: string) => {
    setText(value);
    setEditing(true);
  };
  const save = async () => {
    setSaving(true);
    const ok = await onSave(text.trim());
    setSaving(false);
    if (ok) setEditing(false);
  };

  // ป๊อปอัปเขียน/แก้โน้ตภายใน (ข้อความว่าง = ลบโน้ต)
  const modal = (
    <Modal
      open={editing}
      title={note?.text ? t("reviews.note.editTitle") : t("reviews.note.add")}
      width={560}
      onCancel={() => !saving && setEditing(false)}
      onOk={() => void save()}
      confirmLoading={saving}
      okText={t("reviews.note.save")}
      cancelText={t("common.cancel")}
      mask={{ closable: false }}
      destroyOnHidden
    >
      <div className="flex flex-col gap-3">
        {context && <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{context}</div>}
        <p className="m-0 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">{t("reviews.note.hint")}</p>
        <TextArea autoFocus rows={4} value={text} maxLength={MAX_NOTE} placeholder={t("reviews.note.placeholder")} onChange={(e) => setText(e.target.value)} />
      </div>
    </Modal>
  );

  if (note?.text) {
    return (
      <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="m-0 text-[11px] font-semibold text-yellow-800">
            {t("reviews.note.title")} <span className="font-normal text-yellow-700/70">· {formatDate(note.updated_at, locale, { withTime: true })}</span>
          </p>
          {canEdit && (
            <button type="button" onClick={() => open(note.text)} className="inline-flex items-center gap-1 text-[11px] text-yellow-800 hover:underline">
              {actionIcon("edit", undefined, "h-3 w-3")}
              {t("common.edit")}
            </button>
          )}
        </div>
        <p className="m-0 whitespace-pre-line text-xs text-gray-700">{note.text}</p>
        {modal}
      </div>
    );
  }

  return canEdit ? (
    <>
      <button type="button" onClick={() => open("")} className="mt-2 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-yellow-800 hover:underline">
        {actionIcon("edit", undefined, "h-3 w-3")}
        {t("reviews.note.add")}
      </button>
      {modal}
    </>
  ) : null;
}
