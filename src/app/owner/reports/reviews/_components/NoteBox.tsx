"use client";
// บันทึกภายในของรีวิว (ทีมงานเห็นเท่านั้น ลูกค้าไม่เห็น) — แก้แบบอินไลน์ · ข้อความว่าง = ลบโน้ต
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Button, TextArea } from "@/components/base";
import { formatDate } from "@/i18n/format";

const MAX_NOTE = 2000;

export function NoteBox({ note, canEdit, onSave }: {
  note: { text: string; updated_at: string } | null | undefined;
  canEdit: boolean;
  onSave: (text: string) => Promise<boolean>;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note?.text ?? "");
  const [saving, setSaving] = useState(false);

  if (editing) {
    return (
      <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-2">
        <p className="m-0 mb-1 text-[11px] text-yellow-800">{t("reviews.note.hint")}</p>
        <TextArea autoFocus rows={2} value={text} maxLength={MAX_NOTE} placeholder={t("reviews.note.placeholder")} onChange={(e) => setText(e.target.value)} />
        <div className="mt-2 flex justify-end gap-2">
          <Button size="small" disabled={saving} onClick={() => setEditing(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            size="small"
            type="primary"
            loading={saving}
            onClick={async () => {
              setSaving(true);
              const ok = await onSave(text.trim());
              setSaving(false);
              if (ok) setEditing(false);
            }}
          >
            {t("reviews.note.save")}
          </Button>
        </div>
      </div>
    );
  }

  if (note?.text) {
    return (
      <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="m-0 text-[11px] font-semibold text-yellow-800">
            {t("reviews.note.title")} <span className="font-normal text-yellow-700/70">· {formatDate(note.updated_at, locale, { withTime: true })}</span>
          </p>
          {canEdit && (
            <button type="button" onClick={() => { setText(note.text); setEditing(true); }} className="inline-flex items-center gap-1 text-[11px] text-yellow-800 hover:underline">
              <PencilSquareIcon className="h-3 w-3" />
              {t("common.edit")}
            </button>
          )}
        </div>
        <p className="m-0 whitespace-pre-line text-xs text-gray-700">{note.text}</p>
      </div>
    );
  }

  return canEdit ? (
    <button type="button" onClick={() => { setText(""); setEditing(true); }} className="mt-2 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-yellow-800 hover:underline">
      <PencilSquareIcon className="h-3 w-3" />
      {t("reviews.note.add")}
    </button>
  ) : null;
}
