"use client";
// การ์ดรีวิว 1 รายการ — ป้าย "ใหม่" (ยังไม่อ่าน) + ปุ่มอ่านแล้ว · รูปสินค้า · ดาว/ลูกค้า/วันที่/เลขออเดอร์ · ป้ายตอบแล้ว/ยัง ·
// สถานะ (แสดง/ซ่อน — เอาป้ายที่มาผลวิเคราะห์ และตัวเลือก "รออนุมัติ" ออก) · ปักหมุด · อ่านแล้ว · ข้อความ (ย่อ/อ่านเพิ่ม) · หัวข้อชอบ/ติ · แท็กภายใน · รูป/วิดีโอ ·
// โน้ตภายใน · ตอบกลับ · ปุ่มแท็ก/รายละเอียด/ลบ — ปุ่มแก้ไขตามสิทธิ์ reports.update / delete
import { useState } from "react";
import { Image, Tooltip } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { MapPinIcon as PinSolid } from "@heroicons/react/24/solid";
import { MapPinIcon as PinOutline } from "@heroicons/react/24/outline";
import { Button, Select } from "@/components/base";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { DeleteButton } from "@/components/shared/actions";
import { formatDate } from "@/i18n/format";
import ShopImage from "@/components/customer/ShopImage";
import { thumbSrc } from "@/lib/thumbSrc";
import type { ReplySuggestion, ReviewStatus } from "@/types/review";
import type { ReviewRow } from "../reviewRow";
import { StarRating } from "./StarRating";
import { ReplyBox } from "./ReplyBox";
import { NoteBox } from "./NoteBox";

const TEXT_PREVIEW = 200;
/** ตัวเลือกสถานะ — ไม่มี "รออนุมัติ" แล้ว (รีวิวเก่าที่ค้างสถานะนี้ยังแสดงค่าเดิมได้ แต่เลือกกลับไม่ได้) */
const STATUSES: ReviewStatus[] = ["approved", "hidden"];
const TOPIC_CLASS = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  negative: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-stone-200 bg-stone-50 text-stone-600",
} as const;

export function ReviewCard({
  review: r, canUpdate, canDelete, suggestions,
  onStatus, onTogglePin, onSaveReply, onSaveNote, onDelete,
}: {
  review: ReviewRow;
  canUpdate: boolean;
  canDelete: boolean;
  suggestions: ReplySuggestion[];
  onStatus: (s: ReviewStatus) => void;
  onTogglePin: () => void;
  onSaveReply: (text: string) => Promise<boolean>;
  onSaveNote: (text: string) => Promise<boolean>;
  onDelete: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const text = r.review_text ?? "";
  const long = text.length > TEXT_PREVIEW;
  const replied = !!r.shop_reply?.text;

  return (
    <li className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3">
      {/* รูปสินค้า — ซ่อนบนจอแคบ ให้เนื้อหารีวิวได้ความกว้างเต็ม */}
      <div className="hidden h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 sm:flex">
        {r.productImage ? (
          // ย่อ/WebP ผ่าน optimizer (เดิมโหลดไฟล์ต้นฉบับหลายร้อย KB มาแสดง 48px) · lazy — จอแคบกล่องนี้ซ่อนอยู่ ไม่ต้องโหลด
          <ShopImage src={r.productImage} alt={r.productName} width={96} height={96} sizes="48px" className="h-full w-full object-cover" />
        ) : (
          <PhotoIcon className="h-5 w-5 text-gray-300" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-1.5 text-sm font-semibold text-brown-800">
              <span className="truncate">{r.productName || t("reviews.unknownProduct")}</span>
              {r.is_pinned && <PinSolid className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label={t("reviews.pinned")} />}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <StarRating rating={r.rating} />
              <span>{r.userName || t("reviews.customer")}</span>
              <span className="text-gray-500">· {formatDate(r.created_at, locale, { withTime: true })}</span>
              {r.orderNo && <span className="font-mono text-gray-500">· {r.orderNo}</span>}
              {r.isPreorder && <span className="rounded bg-sky-50 px-1.5 text-[10px] text-sky-700">{t("reviews.preorder")}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                replied ? "bg-emerald-50 text-emerald-700" : r.rating <= 2 ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {replied ? t("reviews.replied") : t("reviews.notReplied")}
            </span>
            <span className="text-xs text-gray-500">{t("reviews.statusLabel")}</span>
            <Select
              size="small"
              style={{ width: 112 }}
              value={r.status}
              disabled={!canUpdate}
              aria-label={t("reviews.statusLabel")}
              options={(r.status === "pending" ? [...STATUSES, r.status] : STATUSES).map((s) => ({
                value: s,
                label: t(`reviews.status.${s}`),
                disabled: s === "pending",
              }))}
              onChange={(v: ReviewStatus) => onStatus(v)}
            />
            {canUpdate && (
              <>
                <Tooltip title={r.is_pinned ? t("reviews.unpin") : t("reviews.pin")}>
                  {/* Tooltip ช่วยเฉพาะคนที่ใช้เมาส์ — screen reader/คีย์บอร์ดต้องพึ่ง aria-label (ACTION_BUTTONS.md §4.1) */}
                  <Button size="small" type="text" onClick={onTogglePin}
                    aria-label={r.is_pinned ? t("reviews.unpin") : t("reviews.pin")}
                    icon={r.is_pinned ? <PinSolid className="h-4 w-4 text-amber-500" /> : <PinOutline className="h-4 w-4" />} />
                </Tooltip>              </>
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

        {/* แท็กภายในไม่แสดงแล้ว (2026-10-26 — เอาปุ่มแก้แท็กออก) · เหลือหัวข้อที่ลูกค้าพูดถึง */}
        {r.topics.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {r.topics.map((tp, i) => (
              <span key={`t-${i}`} className={`rounded border px-1.5 py-0.5 text-[11px] ${TOPIC_CLASS[tp.sentiment]}`}>
                {tp.label || t("reviews.unknownTopic")}
              </span>
            ))}
          </div>
        )}

        {(r.images.length > 0 || r.videoUrl) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Image.PreviewGroup>
              {/* รูปย่อ 48px ผ่าน optimizer · กดดู = รูปต้นฉบับ · alt = ชื่อปุ่มดูรูป (antd ใช้เป็น aria-label) */}
              {r.images.map((src, i) => (
                <Image
                  key={src}
                  src={thumbSrc(src, 48)}
                  preview={{ src }}
                  width={48}
                  height={48}
                  className="rounded object-cover"
                  alt={t("reviews.photoAlt", { n: i + 1 })}
                />
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
          {/* เอาปุ่ม "แท็กภายใน" กับ "ดู" ออก (2026-10-26) — เหลือแค่ลบ */}
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
