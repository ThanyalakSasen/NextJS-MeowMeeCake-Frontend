"use client";
// แถบกรองของหน้ารีวิว — 2 แถว (2026-10-29):
//   แถว 1: ค้นข้อความ · เรียง (ที่เดิม — ขวาสุด)   แถว 2: ตัวกรองอื่นทั้งหมด — หมวด · สินค้า · ดาว · หัวข้อ (+ ชม/ติ) · รูป/วิดีโอ · ล้าง
// "ยังไม่ตอบ" จากทางลัดในแถบสรุปแสดงเป็นป้ายปิดได้
import { useTranslations } from "next-intl";
import { Button, Card, Select, Tag } from "@/components/base";
import { SearchInput } from "@/components/shared/data";
import type { ReviewSort } from "@/types/review";
import type { ReviewFilters, Tri } from "../useReviewsViewModel";
import { actionIcon } from "@/components/shared/actions";
import { NOTICE_TAG } from "@/constants/enumConfig";

const SORTS: ReviewSort[] = ["newest", "needs_reply", "lowest", "highest", "oldest"];

type Opt = { value: string; label: string };

export function ReviewFiltersBar({ filters, setFilter, search, setSearch, onReset, hasActiveFilters, categoryOptions, productOptions, aspectOptions }: {
  filters: ReviewFilters;
  setFilter: <K extends keyof ReviewFilters>(key: K, value: ReviewFilters[K]) => void;
  search: string;
  setSearch: (v: string) => void;
  onReset: () => void;
  /** แสดงปุ่มล้างตัวกรองเฉพาะเมื่อเลือกตัวกรองแล้ว */
  hasActiveFilters: boolean;
  categoryOptions: Opt[];
  productOptions: Opt[];
  aspectOptions: Opt[];
}) {
  const t = useTranslations();
  const all = (label: string): Opt => ({ value: "all", label });
  const tri = (yes: string, no: string): Opt[] => [all(t("common.all")), { value: "0", label: no }, { value: "1", label: yes }];

  const field = (label: string, node: React.ReactNode) => (
    <label className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[11px] text-gray-500">{label}</span>
      {node}
    </label>
  );

  return (
    <Card className="flex flex-col gap-3 p-4">
      {/* แถว 1: ค้นหา · เรียง (ตำแหน่งเดิม คอลัมน์ขวาสุด) */}
      <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-5">
        <div className="col-span-2 md:col-span-4">
          {field(t("reviews.filter.search"), <SearchInput value={search} onChange={setSearch} placeholder={t("reviews.searchPlaceholder")} className="!max-w-none md:!max-w-sm" />)}
        </div>
        <div className="col-span-2 md:col-span-1">
          {field(t("reviews.sortLabel"), (
            <Select size="small" value={filters.sort}
              options={SORTS.map((s) => ({ value: s, label: t(`reviews.sort.${s}`) }))}
              onChange={(v: ReviewSort) => setFilter("sort", v)} />
          ))}
        </div>
      </div>

      {/* แถว 2: ตัวกรองอื่นทั้งหมด — หมวด · สินค้า · ดาว · หัวข้อ (+ ชม/ติ) · รูป/วิดีโอ · ล้างตัวกรอง (ประเภทคำสั่งซื้อเป็นแท็บเหนือรายการ — ReviewsView) */}
      <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-5">
        {field(t("reviews.filter.category"), (
          <Select size="small" showSearch optionFilterProp="label" value={filters.categoryId}
            options={[all(t("reviews.filter.allCategories")), ...categoryOptions]} onChange={(v: string) => setFilter("categoryId", v)} />
        ))}
        {field(t("reviews.filter.product"), (
          <Select size="small" showSearch optionFilterProp="label" value={filters.productId}
            options={[all(t("reviews.filter.allProducts")), ...productOptions]} onChange={(v: string) => setFilter("productId", v)} />
        ))}
        {field(t("reviews.filter.rating"), (
          <Select size="small" value={filters.rating ?? 0}
            options={[{ value: 0, label: t("reviews.filter.allRatings") }, ...[5, 4, 3, 2, 1].map((n) => ({ value: n, label: t("reviews.filter.stars", { n }) }))]}
            onChange={(v: number) => setFilter("rating", v || null)} />
        ))}
        {field(t("reviews.filter.aspect"), (
          <Select size="small" value={filters.aspectId}
            options={[all(t("reviews.filter.allAspects")), ...aspectOptions]} onChange={(v: string) => setFilter("aspectId", v)} />
        ))}
        {filters.aspectId !== "all" &&
          field(t("reviews.filter.aspectSentiment"), (
            <Select size="small" value={filters.aspectSentiment}
              options={[
                { value: "negative", label: t("reviews.filter.improve") },
                { value: "positive", label: t("reviews.filter.liked") },
                { value: "all", label: t("reviews.filter.both") },
              ]}
              onChange={(v: ReviewFilters["aspectSentiment"]) => setFilter("aspectSentiment", v)} />
          ))}
        {field(t("reviews.filter.media"), (
          <Select size="small" value={filters.media} options={tri(t("reviews.filter.hasMedia"), t("reviews.filter.noMedia"))}
            onChange={(v: Tri) => setFilter("media", v)} />
        ))}
        {hasActiveFilters && (
          <div className="flex items-end">
            <Button size="small" icon={actionIcon("reset", "small")} onClick={onReset}>
              {t("reviews.filter.reset")}
            </Button>
          </div>
        )}
      </div>

      {(filters.negativeOnly || filters.replied !== "all") && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
          {filters.negativeOnly && (
            <Tag closable color={NOTICE_TAG.negativeFilter} onClose={() => setFilter("negativeOnly", false)} className="!m-0">
              {t("reviews.filter.negativeOnly")}
            </Tag>
          )}
          {filters.replied !== "all" && (
            <Tag closable color={NOTICE_TAG.negativeFilter} onClose={() => setFilter("replied", "all")} className="!m-0">
              {filters.replied === "0" ? t("reviews.notReplied") : t("reviews.replied")}
            </Tag>
          )}
        </div>
      )}
    </Card>
  );
}
