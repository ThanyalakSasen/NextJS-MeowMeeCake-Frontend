"use client";
// การ์ดแบนเนอร์ 1 ใบ — พรีวิว (รูปจริง หรือ gradient placeholder) + สถานะ + ปุ่มจัดการ
import { useTranslations, useLocale } from "next-intl";
import { Switch, Tag } from "@/components/base";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { formatDate } from "@/i18n/format";
import { resolveUploadUrl } from "@/lib/uploads";
import { BANNER_STATUS_CONFIG } from "@/constants/enumConfig";
import { EditButton, DeleteButton } from "@/components/shared/actions";
import type { BannerRow } from "../useStoreDesignViewModel";

const GRADIENTS = [
  { from: "#fce7f3", to: "#f9a8d4", text: "#be185d" },
  { from: "#dbeafe", to: "#93c5fd", text: "#1d4ed8" },
  { from: "#fef3c7", to: "#fcd34d", text: "#b45309" },
  { from: "#d1fae5", to: "#6ee7b7", text: "#15803d" },
  { from: "#ede9fe", to: "#c4b5fd", text: "#6d28d9" },
];

function paletteOf(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export function BannerCard({
  banner,
  draggable,
  dragging,
  dragOver,
  onEdit,
  onDelete,
  onToggle,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  banner: BannerRow;
  draggable: boolean;
  dragging: boolean;
  dragOver: boolean;
  onEdit: (b: BannerRow) => void;
  onDelete: (id: string) => void;
  onToggle: (b: BannerRow) => void;
  onDragStart: (id: string) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const cfg = BANNER_STATUS_CONFIG[banner.status];
  const palette = paletteOf(banner._id);

  const dateText =
    banner.start_date || banner.end_date
      ? [banner.start_date, banner.end_date]
          .filter(Boolean)
          .map((d) => formatDate(d, locale))
          .join(" – ")
      : t("storeDesign.allTime");

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", banner._id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(banner._id);
      }}
      onDragOver={(e) => { if (draggable) { e.preventDefault(); onDragOver(); } }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(banner._id); }}
      onDragEnd={onDragEnd}
      title={draggable ? t("storeDesign.reorderHint") : undefined}
      className={`flex h-full flex-col overflow-hidden rounded-xl border bg-white transition-all ${
        dragOver ? "border-brown-400 shadow-md" : "border-gray-100 hover:shadow-md"
      } ${banner.status === "inactive" || banner.status === "expired" ? "opacity-60" : ""} ${dragging ? "opacity-40" : ""} ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      {/* aspect-[3/1] = สัดส่วนเดียวกับขนาดที่แนะนำให้อัปโหลด (1200×400) — รูปแสดงเต็มไม่โดนตัดขอบซ้าย/ขวา
          (เดิม h-40 ตายตัว สัดส่วนจริง ~2.5:1 ทำให้ object-cover ตัดข้างรูปทิ้ง ~16%) */}
      <div className="relative aspect-[3/1] shrink-0 overflow-hidden">
        {banner.banner_img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveUploadUrl(banner.banner_img)} alt={banner.banner_name} className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center"
            style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
          >
            <span className="line-clamp-2 text-sm font-medium" style={{ color: palette.text }}>
              {banner.banner_name}
            </span>
          </div>
        )}
        <span className="absolute left-2 top-2">
          <Tag color={cfg.antColor}>{t(`enums.bannerStatus.${banner.status}`)}</Tag>
        </span>
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded bg-white/90 text-xs font-semibold text-gray-700">
          {banner.sort_order}
        </span>
      </div>

      {/* ทุกบรรทัดเป็น 1 บรรทัดตายตัว (truncate) + แสดงเสมอ — ไม่มีลิงก์ก็ยังกินที่ 1 บรรทัด ("—")
          การ์ดจึงสูงเท่ากันทุกใบไม่ว่าข้อความจะยาวแค่ไหน · ข้อความเต็มดูได้จาก tooltip (title) */}
      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-semibold text-brown-800" title={banner.banner_name}>{banner.banner_name}</p>
        <p className="mt-0.5 truncate text-xs text-gray-400" title={banner.banner_link || undefined}>
          {banner.banner_link || "—"}
        </p>
        <p className="mt-0.5 truncate text-xs text-gray-400" title={dateText}>{dateText}</p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <EditButton size="small" onClick={() => onEdit(banner)} />
          <ConfirmDeletePopup
            title={t("storeDesign.deleteConfirm", { name: banner.banner_name })}
            onConfirm={() => onDelete(banner._id)}
          >
            <DeleteButton size="small" />
          </ConfirmDeletePopup>
        </div>
        {/* ผูกกับ is_active ตรง ๆ (สวิตช์ = "เปิดใช้งาน") — เดิมใช้ status === "active" แบนเนอร์ที่เปิดไว้แต่ยัง
            "รอตามกำหนด" จึงโชว์เป็นปิด แล้วกดเปิดกลับได้ is_active: false (ตรงข้ามกับที่ตั้งใจ) */}
        <Switch
          checked={banner.is_active}
          onChange={() => onToggle(banner)}
          aria-label={banner.banner_name}
        />
      </div>
    </div>
  );
}
