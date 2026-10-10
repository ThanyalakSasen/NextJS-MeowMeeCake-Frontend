"use client";
// การ์ดรีวิว 1 รายการ — เลือก · รูปสินค้า · ดาว/ลูกค้า/วันที่/เลขออเดอร์ · ป้ายที่มาผลวิเคราะห์ + ตอบแล้ว/ยัง ·
// สถานะ (แสดง/ซ่อน/รออนุมัติ) · ปักหมุด · อ่านแล้ว · ข้อความ (ย่อ/อ่านเพิ่ม) · หัวข้อชอบ/ติ · แท็กภายใน · รูป/วิดีโอ ·
// โน้ตภายใน · ตอบกลับ · ปุ่มแท็ก/รายละเอียด/ลบ — ปุ่มแก้ไขตามสิทธิ์ reports.update / delete
import { useState } from "react";
import { Checkbox, Image, Tooltip } from "antd";
import { useLocale, useTranslations } from "next-intl";
// EyeIcon/EyeSlashIcon ที่นี่เป็น "สลับอ่านแล้ว/ยังไม่อ่าน" เป็นคู่ ไม่ใช่ปุ่ม "ดู" ของ actionIcon("view")
// — EyeSlashIcon ไม่มีในตาราง §1.1 ถ้าดึงมาแค่ตัวเดียวจะกลายเป็นคนละแหล่งกัน จึง import เองทั้งคู่
import { EyeIcon, EyeSlashIcon, PhotoIcon, TagIcon } from "@heroicons/react/24/outline";
import { MapPinIcon as PinSolid } from "@heroicons/react/24/solid";
import { MapPinIcon as PinOutline } from "@heroicons/react/24/outline";
import { Button, Select } from "@/components/base";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { DeleteButton, ViewButton } from "@/components/shared/actions";
import { formatDate } from "@/i18n/format";
import type { ReplySuggestion, ReviewStatus } from "@/types/review";
import type { ReviewRow } from "../reviewRow";
import { StarRating } from "./StarRating";
import { ReplyBox } from "./ReplyBox";
import { NoteBox } from "./NoteBox";

const TEXT_PREVIEW = 200;
const STATUSES: ReviewStatus[] = ["approved", "hidden", "pending"];
const TOPIC_CLASS = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  negative: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-stone-200 bg-stone-50 text-stone-600",
} as const;
const SOURCE_CLASS = {
  customer: "bg-emerald-50 text-emerald-700",
  inferred: "bg-amber-50 text-amber-700",
  model: "bg-indigo-50 text-indigo-700",
} as const;

export function ReviewCard({
  review: r, selected, canUpdate, canDelete, suggestions,
  onSelect, onStatus, onTogglePin, onToggleRead, onSaveReply, onSaveNote, onTags, onDetail, onDelete,
}: {
  review: ReviewRow;
  selected: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  suggestions: ReplySuggestion[];
  onSelect: () => void;
  onStatus: (s: ReviewStatus) => void;
  onTogglePin: () => void;
  onToggleRead: () => void;
  onSaveReply: (text: string) => Promise<boolean>;
  onSaveNote: (text: string) => Promise<boolean>;
  onTags: () => void;
  onDetail: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const text = r.review_text ?? "";
  const long = text.length > TEXT_PREVIEW;
  const replied = !!r.shop_reply?.text;

  return (
    <li className={`flex gap-3 rounded-xl border bg-white p-3 ${selected ? "border-brown-300 ring-1 ring-brown-200" : "border-gray-100"}`}>
      <Checkbox checked={selected} onChange={onSelect} className="mt-1 self-start" aria-label={t("reviews.selectOne")} />
      {/* รูปสินค้า — ซ่อนบนจอแคบ ให้เนื้อหารีวิวได้ความกว้างเต็ม */}
      <div className="hidden h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 sm:flex">
        {r.productImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- รูปจาก backend (คนละ origin)
          <img src={r.productImage} alt={r.productName} className="h-full w-full object-cover" />
        ) : (
          <PhotoIcon className="h-5 w-5 text-gray-300" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-1.5 text-sm font-semibold text-brown-800">
              {!r.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" title={t("reviews.unread")} />}
              <span className="truncate">{r.productName || t("reviews.unknownProduct")}</span>
              {r.is_pinned && <PinSolid className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label={t("reviews.pinned")} />}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <StarRating rating={r.rating} />
              <span>{r.userName || t("reviews.customer")}</span>
              <span className="text-gray-400">· {formatDate(r.created_at, locale, { withTime: true })}</span>
              {r.orderNo && <span className="font-mono text-gray-400">· {r.orderNo}</span>}
              {r.isPreorder && <span className="rounded bg-sky-50 px-1.5 text-[10px] text-sky-700">{t("reviews.preorder")}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {r.analysis_source && (
              <Tooltip title={t(`reviews.source.${r.analysis_source}Hint`)}>
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${SOURCE_CLASS[r.analysis_source]}`}>{t(`reviews.source.${r.analysis_source}`)}</span>
              </Tooltip>
            )}
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                replied ? "bg-emerald-50 text-emerald-700" : r.rating <= 2 ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {replied ? t("reviews.replied") : t("reviews.notReplied")}
            </span>
            <Select
              size="small"
              style={{ width: 112 }}
              value={r.status}
              disabled={!canUpdate}
              aria-label={t("reviews.statusLabel")}
              options={STATUSES.map((s) => ({ value: s, label: t(`reviews.status.${s}`) }))}
              onChange={(v: ReviewStatus) => onStatus(v)}
            />
            {canUpdate && (
              <>
                <Tooltip title={r.is_pinned ? t("reviews.unpin") : t("reviews.pin")}>
                  {/* Tooltip ช่วยเฉพาะคนที่ใช้เมาส์ — screen reader/คีย์บอร์ดต้องพึ่ง aria-label (ACTION_BUTTONS.md §4.1) */}
                  <Button size="small" type="text" onClick={onTogglePin}
                    aria-label={r.is_pinned ? t("reviews.unpin") : t("reviews.pin")}
                    icon={r.is_pinned ? <PinSolid className="h-4 w-4 text-amber-500" /> : <PinOutline className="h-4 w-4" />} />
                </Tooltip>
                <Tooltip title={r.isRead ? t("reviews.markUnread") : t("reviews.markRead")}>
                  <Button size="small" type="text" onClick={onToggleRead}
                    aria-label={r.isRead ? t("reviews.markUnread") : t("reviews.markRead")}
                    icon={r.isRead ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4 text-sky-600" />} />
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {text ? (
          <p className="m-0 mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-700">
            {long && !expanded ? `${text.slice(0, TEXT_PREVIEW).trimEnd()}… ` : text}
            {long && (
              <button type="button" onClick={() => setExpanded((v) => !v)} className="ml-1 text-brown-600 hover:underline">
                {expanded ? t("reviews.showLess") : t("reviews.showMore")}
              </button>
            )}
          </p>
        ) : (
          <p className="m-0 mt-1 text-xs text-gray-300">{t("reviews.noComment")}</p>
        )}

        {(r.topics.length > 0 || r.internalTags.length > 0) && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {r.topics.map((tp, i) => (
              <span key={`t-${i}`} className={`rounded border px-1.5 py-0.5 text-[11px] ${TOPIC_CLASS[tp.sentiment]}`}>
                {tp.label || t("reviews.unknownTopic")}
              </span>
            ))}
            {r.internalTags.map((tag) => (
              <span key={`g-${tag}`} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">#{tag.replace(/^#/, "")}</span>
            ))}
          </div>
        )}

        {(r.images.length > 0 || r.videoUrl) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Image.PreviewGroup>
              {r.images.map((src) => (
                <Image key={src} src={src} width={48} height={48} className="rounded object-cover" alt="" />
              ))}
            </Image.PreviewGroup>
            {r.videoUrl && (
              <a href={r.videoUrl} target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-[10px] text-gray-500">
                ▶ {t("reviews.video")}
              </a>
            )}
          </div>
        )}

        {/* ปุ่ม "บันทึกภายใน" กับ "ตอบกลับ" ตอนยังว่างอยู่แถวเดียวกัน — ห่อด้วย flex ให้มีระยะห่าง · เปิดแก้แล้วขยายเต็มแถว */}
        <div className="flex flex-wrap items-start gap-x-4 [&>*]:max-w-full [&>div]:basis-full">
          <NoteBox key={`n-${r.internal_note?.updated_at ?? ""}`} note={r.internal_note} canEdit={canUpdate} onSave={onSaveNote} />
          <ReplyBox key={`r-${r.shop_reply?.replied_at ?? ""}`} rating={r.rating} reply={r.shop_reply} suggestions={suggestions} canEdit={canUpdate} onSave={onSaveReply} />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-end gap-1">
          {canUpdate && (
            <Button size="small" type="text" icon={<TagIcon className="h-4 w-4" />} onClick={onTags}>
              {t("reviews.internalTags")}
            </Button>
          )}
          <ViewButton size="small" onClick={onDetail} />
          {canDelete && (
            <ConfirmDeletePopup title={t("reviews.deleteConfirm")} onConfirm={onDelete}>
              <DeleteButton size="small" />
            </ConfirmDeletePopup>
          )}
        </div>
      </div>
    </li>
  );
}
