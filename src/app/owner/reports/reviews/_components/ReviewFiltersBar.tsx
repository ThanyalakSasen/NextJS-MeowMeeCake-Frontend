"use client";
// แถบกรองของหน้ารีวิว — 3 แถว:
//   1) ช่องค้นหา (ซ้าย · ไม่มีตัวกรองอื่นในแถวนี้) · ล้างตัวกรอง (ชิดขวา · แสดงเฉพาะเมื่อมีตัวกรองเปิดอยู่)
//   2) [คะแนน][สินค้า (กว้าง)][ประเภทคำสั่งซื้อ]
//   3) [หัวข้อ][รูป/วิดีโอ][การอ่าน][การตอบกลับ]   (จอแคบ: แถวละ 2 / 1)
// การเรียงอยู่นอกการ์ดนี้ (ReviewSortSelect — แถวสรุปเหนือรายการ) เพราะไม่ได้ตัดรีวิวออก แค่จัดลำดับ
import { useTranslations } from "next-intl";
import { Button, Card, Select } from "@/components/base";
import { FilterField, SearchInput } from "@/components/shared/data";
import { actionIcon } from "@/components/shared/actions";
import type { ReviewSort } from "@/types/review";
import type { RatingFilter, ReviewFilters, Tri } from "../useReviewsViewModel";

const SORTS: ReviewSort[] = ["newest", "needs_reply", "lowest", "highest", "oldest"];

type Opt = { value: string; label: string };

export function ReviewFiltersBar({ filters, setFilter, search, setSearch, onReset, productOptions, aspectOptions }: {
  filters: ReviewFilters;
  setFilter: <K extends keyof ReviewFilters>(key: K, value: ReviewFilters[K]) => void;
  search: string;
  setSearch: (v: string) => void;
  onReset: () => void;
  productOptions: Opt[];
  aspectOptions: Opt[];
}) {
  const t = useTranslations();
  const active =
    !!search.trim() ||
    filters.productId !== "all" ||
    filters.rating !== "all" ||
    filters.aspectId !== "all" ||
    filters.replied !== "all" ||
    filters.read !== "all" ||
    filters.media !== "all" ||
    filters.orderKind !== "all";

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder={t("reviews.searchPlaceholder")} className="min-w-0 flex-1" />
        {active && (
          <Button size="small" className="ml-auto shrink-0" icon={actionIcon("reset", "small")} onClick={onReset}>
            {t("reviews.filter.reset")}
          </Button>
        )}
      </div>

      {/* แถว 1: คะแนน · สินค้า (กว้างกว่า — ชื่อยาว) · ประเภทคำสั่งซื้อ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_2fr_1fr]">
        <FilterField label={t("reviews.filter.rating")}>
          <Select
            size="small"
            value={filters.rating}
            options={[
              { value: "all", label: t("reviews.filter.allRatings") },
              ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: t("reviews.filter.stars", { n }) })),
              { value: "negative", label: t("reviews.filter.negativeOnly") },
            ]}
            onChange={(v: RatingFilter) => setFilter("rating", v)}
          />
        </FilterField>
        <FilterField label={t("reviews.filter.product")}>
          <Select size="small" showSearch optionFilterProp="label" value={filters.productId}
            options={[{ value: "all", label: t("reviews.filter.allProducts") }, ...productOptions]} onChange={(v: string) => setFilter("productId", v)} />
        </FilterField>
        <FilterField label={t("reviews.filter.orderKind")}>
          <Select
            size="small"
            value={filters.orderKind}
            options={[
              { value: "all", label: t("common.all") },
              { value: "order", label: t("reviews.filter.order") },
              { value: "preorder", label: t("reviews.preorder") },
            ]}
            onChange={(v: ReviewFilters["orderKind"]) => setFilter("orderKind", v)}
          />
        </FilterField>
      </div>
      {/* แถว 2: หัวข้อ · รูป/วิดีโอ · การอ่าน · การตอบกลับ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterField label={t("reviews.filter.aspect")}>
          <Select size="small" value={filters.aspectId}
            options={[{ value: "all", label: t("reviews.filter.allAspects") }, ...aspectOptions]} onChange={(v: string) => setFilter("aspectId", v)} />
        </FilterField>
        <FilterField label={t("reviews.filter.media")}>
          <Select
            size="small"
            value={filters.media}
            options={[
              { value: "all", label: t("common.all") },
              { value: "1", label: t("reviews.filter.hasMedia") },
              { value: "0", label: t("reviews.filter.noMedia") },
            ]}
            onChange={(v: Tri) => setFilter("media", v)}
          />
        </FilterField>
        <FilterField label={t("reviews.filter.read")}>
          <Select
            size="small"
            value={filters.read}
            options={[
              { value: "all", label: t("common.all") },
              { value: "0", label: t("reviews.unread") },
              { value: "1", label: t("reviews.read") },
            ]}
            onChange={(v: Tri) => setFilter("read", v)}
          />
        </FilterField>
        <FilterField label={t("reviews.filter.replied")}>
          <Select
            size="small"
            value={filters.replied}
            options={[
              { value: "all", label: t("common.all") },
              { value: "0", label: t("reviews.notReplied") },
              { value: "1", label: t("reviews.replied") },
            ]}
            onChange={(v: Tri) => setFilter("replied", v)}
          />
        </FilterField>
      </div>
    </Card>
  );
}

/** ตัวเลือกการเรียง — วางแยกจากการ์ดตัวกรอง (แถวสรุปเหนือรายการรีวิว) */
export function ReviewSortSelect({ value, onChange }: { value: ReviewSort; onChange: (v: ReviewSort) => void }) {
  const t = useTranslations();
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-xs text-gray-500">{t("reviews.sortLabel")}</span>
      <Select
        aria-label={t("reviews.sortLabel")}
        size="small"
        style={{ width: 160 }}
        value={value}
        options={SORTS.map((s) => ({ value: s, label: t(`reviews.sort.${s}`) }))}
        onChange={onChange}
      />
    </div>
  );
}
