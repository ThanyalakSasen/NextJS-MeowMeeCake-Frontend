"use client";
// การ์ดแบนเนอร์ 1 ใบ — พรีวิว (รูปจริง หรือ gradient placeholder) + สถานะ + ปุ่มจัดการ
import { useTranslations, useLocale } from "next-intl";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { Button, Switch, Tag } from "@/components/base";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { formatDate } from "@/i18n/format";
import { BANNER_STATUS_CONFIG } from "@/constants/enumConfig";
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
  onEdit,
  onDelete,
  onToggle,
}: {
  banner: BannerRow;
  onEdit: (b: BannerRow) => void;
  onDelete: (id: string) => void;
  onToggle: (b: BannerRow) => void;
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
      className={`overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow hover:shadow-md ${
        banner.status === "inactive" ? "opacity-60" : ""
      }`}
    >
      <div className="relative h-40 overflow-hidden">
        {banner.banner_img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner.banner_img} alt={banner.banner_name} className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center"
            style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
          >
            <span className="text-sm font-medium" style={{ color: palette.text }}>
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

      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-semibold text-brown-800">{banner.banner_name}</p>
        {banner.banner_link && (
          <p className="mt-0.5 truncate text-xs text-gray-400">{banner.banner_link}</p>
        )}
        <p className="mt-0.5 text-xs text-gray-400">{dateText}</p>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Button size="small" icon={<PencilSquareIcon className="h-3.5 w-3.5" />} onClick={() => onEdit(banner)}>
            {t("common.edit")}
          </Button>
          <ConfirmDeletePopup
            title={t("storeDesign.deleteConfirm", { name: banner.banner_name })}
            onConfirm={() => onDelete(banner._id)}
          >
            <Button size="small" danger>{t("common.delete")}</Button>
          </ConfirmDeletePopup>
        </div>
        <Switch
          checked={banner.status === "active"}
          onChange={() => onToggle(banner)}
          aria-label={banner.banner_name}
        />
      </div>
    </div>
  );
}
