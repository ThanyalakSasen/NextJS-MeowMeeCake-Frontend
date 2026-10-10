"use client";
// ตอบกลับรีวิวในนามร้าน (ลูกค้าเห็นในหน้าสินค้า) — ยกจาก FrontOffice ProductReviews.ReplyBox
// ข้อความสำเร็จรูป (รีวิวลบ → ชุดขอโทษขึ้นก่อน · รีวิวดี → ชุดขอบคุณขึ้นก่อน) + คำตอบเก่าที่เคยใช้ (คะแนนใกล้เคียงก่อน)
// บันทึกผ่าน onSave ของ ViewModel (คืน true = สำเร็จ → ปิดโหมดแก้ไข) · ข้อความว่าง = ลบคำตอบ
import { useState } from "react";
import { AutoComplete } from "antd";
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

export function ReplyBox({ rating, reply, suggestions, canEdit, onSave }: {
  rating: number;
  reply: { text: string; replied_at: string } | null | undefined;
  suggestions: ReplySuggestion[];
  canEdit: boolean;
  onSave: (text: string) => Promise<boolean>;
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

  if (editing) {
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
    return (
      <div className="mt-2 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-0.5 text-[11px] text-gray-500">{t("reviews.reply.templates")}</span>
          {templates.map((tpl) => (
            <button
              key={tpl.key}
              type="button"
              title={t(`reviews.templates.${tpl.key}.text`)}
              onClick={() => setText(t(`reviews.templates.${tpl.key}.text`))}
              className="rounded border border-gray-200 px-1.5 py-0.5 text-[11px] text-gray-600 hover:border-brown-300 hover:text-brown-700"
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
            rows={3}
            maxLength={MAX_REPLY}
            placeholder={suggestions.length > 0 ? t("reviews.reply.placeholderWithSuggestions") : t("reviews.reply.placeholder")}
          />
        </AutoComplete>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-gray-500">{text.length}/{MAX_REPLY}</span>
          <div className="flex gap-2">
            {current && (
              <Button size="small" danger type="text" disabled={saving} onClick={() => void save("")}>
                {t("reviews.reply.remove")}
              </Button>
            )}
            <Button size="small" disabled={saving} onClick={() => setEditing(false)}>
              {t("common.cancel")}
            </Button>
            <Button size="small" type="primary" loading={saving} disabled={!text.trim()} onClick={() => void save(text)}>
              {t("reviews.reply.save")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (current) {
    return (
      <div className="mt-2 rounded-lg bg-brown-50 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="m-0 text-[11px] font-semibold text-brown-700">
            {t("reviews.reply.shopReplied")}
            {reply?.replied_at && <span className="font-normal text-gray-500"> · {formatDate(reply.replied_at, locale, { withTime: true })}</span>}
          </p>
          {canEdit && (
            <button type="button" onClick={() => { setText(current); setEditing(true); }} className="inline-flex items-center gap-1 text-[11px] text-brown-600 hover:underline">
              {actionIcon("edit", undefined, "h-3 w-3")}
              {t("common.edit")}
            </button>
          )}
        </div>
        <p className="m-0 whitespace-pre-line text-xs text-gray-700">{current}</p>
      </div>
    );
  }

  return canEdit ? (
    <button type="button" onClick={() => { setText(""); setEditing(true); }} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brown-700 hover:underline">
      {actionIcon("edit", "small")}
      {t("reviews.reply.write")}
    </button>
  ) : null;
}
