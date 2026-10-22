"use client";
// ตอบกลับรีวิวในนามร้าน (ลูกค้าเห็นในหน้าสินค้า) — ยกจาก FrontOffice ProductReviews.ReplyBox
// ข้อความสำเร็จรูป (รีวิวลบ → ชุดขอโทษขึ้นก่อน · รีวิวดี → ชุดขอบคุณขึ้นก่อน) + คำตอบเก่าที่เคยใช้ (คะแนนใกล้เคียงก่อน)
// เขียน/แก้คำตอบในป๊อปอัป · บันทึกผ่าน onSave ของ ViewModel (คืน true = สำเร็จ → ปิดป๊อปอัป) · ข้อความว่าง = ลบคำตอบ
import { useState } from "react";
import { AutoComplete, Modal } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { Button, TextArea } from "@/components/base";
import { formatDate } from "@/i18n/format";
import type { ReplySuggestion } from "@/types/review";
import { actionIcon } from "@/components/shared/actions";

const MAX_REPLY = 2000;
const TEMPLATES = [
  { key: "thanks", negative: false },
  { key: "thanksMore", negative: false },
  { key: "sorryLate", negative: true },
  { key: "sorryDamaged", negative: true },
  { key: "sorryTaste", negative: true },
  { key: "sorryGeneral", negative: true },
] as const;

export function ReplyBox({ rating, reply, suggestions, canEdit, onSave, context }: {
  rating: number;
  reply: { text: string; replied_at: string } | null | undefined;
  suggestions: ReplySuggestion[];
  canEdit: boolean;
  onSave: (text: string) => Promise<boolean>;
  /** รีวิวของลูกค้า (แสดงบนสุดของป๊อปอัป ให้เห็นว่ากำลังตอบอะไร) */
  context?: React.ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const current = reply?.text ?? "";
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(current);
  const [saving, setSaving] = useState(false);

  const save = async (value: string) => {
    setSaving(true);
    const ok = await onSave(value.trim());
    setSaving(false);
    if (ok) setEditing(false);
  };
  const open = (value: string) => {
    setText(value);
    setEditing(true);
  };

  const negative = rating <= 2;
  const templates = [...TEMPLATES].sort((a, b) => Number(b.negative === negative) - Number(a.negative === negative));
  const options = [...suggestions]
    .sort((a, b) => Math.abs(a.rating_avg - rating) - Math.abs(b.rating_avg - rating) || b.used_count - a.used_count)
    .map((s) => ({
      value: s.text,
      label: (
        <div className="flex items-start justify-between gap-3 py-0.5">
          <span className="line-clamp-2 whitespace-normal text-xs">{s.text}</span>
          <span className="shrink-0 text-[10px] text-gray-500">{t("reviews.reply.usedTimes", { n: s.used_count, rating: s.rating_avg.toFixed(1) })}</span>
        </div>
      ),
    }));

  // ป๊อปอัปเขียน/แก้คำตอบ — ข้อความสำเร็จรูป + คำตอบเก่าที่เคยใช้ (AutoComplete)
  const modal = (
    <Modal
      open={editing}
      title={current ? t("reviews.reply.editTitle") : t("reviews.reply.write")}
      width={640}
      onCancel={() => !saving && setEditing(false)}
      mask={{ closable: false }}
      destroyOnHidden
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-gray-500">{text.length}/{MAX_REPLY}</span>
          <div className="flex gap-2">
            {current && (
              <Button danger type="text" disabled={saving} onClick={() => void save("")}>
                {t("reviews.reply.remove")}
              </Button>
            )}
            <Button disabled={saving} onClick={() => setEditing(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="primary" loading={saving} disabled={!text.trim()} onClick={() => void save(text)}>
              {t("reviews.reply.save")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {context && <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{context}</div>}
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-0.5 text-[11px] text-gray-500">{t("reviews.reply.templates")}</span>
          {templates.map((tpl) => (
            <button
              key={tpl.key}
              type="button"
              title={t(`reviews.templates.${tpl.key}.text`)}
              onClick={() => setText(t(`reviews.templates.${tpl.key}.text`))}
              className="h-[36px] rounded-lg border border-gray-200 px-3 text-xs text-gray-600 hover:border-brown-300 hover:text-brown-700"
            >
              {t(`reviews.templates.${tpl.key}.label`)}
            </button>
          ))}
        </div>
        <AutoComplete
          className="w-full"
          value={text}
          onChange={setText}
          options={options}
          filterOption={(input, option) => !input.trim() || String(option?.value ?? "").toLowerCase().includes(input.trim().toLowerCase())}
        >
          <TextArea
            autoFocus
            rows={4}
            maxLength={MAX_REPLY}
            placeholder={suggestions.length > 0 ? t("reviews.reply.placeholderWithSuggestions") : t("reviews.reply.placeholder")}
          />
        </AutoComplete>
      </div>
    </Modal>
  );

  if (current) {
    return (
      <div className="mt-2 rounded-lg bg-brown-50 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="m-0 text-[11px] font-semibold text-brown-700">
            {t("reviews.reply.shopReplied")}
            {reply?.replied_at && <span className="font-normal text-gray-500"> · {formatDate(reply.replied_at, locale, { withTime: true })}</span>}
          </p>
          {canEdit && (
            <button type="button" onClick={() => open(current)} className="inline-flex items-center gap-1 text-[11px] text-brown-600 hover:underline">
              {actionIcon("edit", undefined, "h-3 w-3")}
              {t("common.edit")}
            </button>
          )}
        </div>
        <p className="m-0 whitespace-pre-line text-xs text-gray-700">{current}</p>
        {modal}
      </div>
    );
  }

  return canEdit ? (
    <>
      <button type="button" onClick={() => open("")} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brown-700 hover:underline">
        {actionIcon("edit", "small")}
        {t("reviews.reply.write")}
      </button>
      {modal}
    </>
  ) : null;
}
