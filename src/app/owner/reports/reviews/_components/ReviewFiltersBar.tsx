"use client";
// แถบกรองของหน้ารีวิว — ค้นข้อความ · หมวด · สินค้า · ดาว · หัวข้อ (+ ชม/ติ) · ตอบกลับ · อ่าน · รูป/วิดีโอ · ประเภทออเดอร์ · สถานะ · เรียง
import { useTranslations } from "next-intl";
import { Button, Card, Select, Tag } from "@/components/base";
import { SearchInput } from "@/components/shared/data";
import type { ReviewSort, ReviewStatus } from "@/types/review";
import type { ReviewFilters, Tri } from "../useReviewsViewModel";
import { actionIcon } from "@/components/shared/actions";

const SORTS: ReviewSort[] = ["newest", "needs_reply", "lowest", "highest", "oldest"];
const STATUSES: ReviewStatus[] = ["approved", "hidden", "pending"];

type Opt = { value: string; label: string };

export function ReviewFiltersBar({ filters, setFilter, search, setSearch, onReset, categoryOptions, productOptions, aspectOptions }: {
  filters: ReviewFilters;
  setFilter: <K extends keyof ReviewFilters>(key: K, value: ReviewFilters[K]) => void;
  search: string;
  setSearch: (v: string) => void;
  onReset: () => void;
  categoryOptions: Opt[];
  productOptions: Opt[];
  aspectOptions: Opt[];
}) {
  const t = useTranslations();
  const all = (label: string): Opt => ({ value: "all", label });
  const tri = (yes: string, no: string): Opt[] => [all(t("common.all")), { value: "0", label: no }, { value: "1", label: yes }];

  const field = (label: string, node: React.ReactNode) => (
    <label className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[11px] text-gray-400">{label}</span>
      {node}
    </label>
  );

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder={t("reviews.searchPlaceholder")} />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">{t("reviews.sortLabel")}</span>
          <Select
            size="small"
            style={{ width: 150 }}
            value={filters.sort}
            options={SORTS.map((s) => ({ value: s, label: t(`reviews.sort.${s}`) }))}
            onChange={(v: ReviewSort) => setFilter("sort", v)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-4 xl:grid-cols-6">
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
        {field(t("reviews.filter.replied"), (
          <Select size="small" value={filters.replied} options={tri(t("reviews.replied"), t("reviews.notReplied"))}
            onChange={(v: Tri) => setFilter("replied", v)} />
        ))}
        {field(t("reviews.filter.read"), (
          <Select size="small" value={filters.read} options={tri(t("reviews.read"), t("reviews.unread"))}
            onChange={(v: Tri) => setFilter("read", v)} />
        ))}
        {field(t("reviews.filter.media"), (
          <Select size="small" value={filters.media} options={tri(t("reviews.filter.hasMedia"), t("reviews.filter.noMedia"))}
            onChange={(v: Tri) => setFilter("media", v)} />
        ))}
        {field(t("reviews.filter.orderKind"), (
          <Select size="small" value={filters.orderKind}
            options={[all(t("common.all")), { value: "order", label: t("reviews.filter.order") }, { value: "preorder", label: t("reviews.preorder") }]}
            onChange={(v: ReviewFilters["orderKind"]) => setFilter("orderKind", v)} />
        ))}
        {field(t("reviews.statusLabel"), (
          <Select size="small" value={filters.status}
            options={[all(t("reviews.filter.allStatuses")), ...STATUSES.map((s) => ({ value: s, label: t(`reviews.status.${s}`) }))]}
            onChange={(v: ReviewFilters["status"]) => setFilter("status", v)} />
        ))}
        <div className="flex items-end">
          <Button size="small" icon={actionIcon("reset", "small")} onClick={onReset}>
            {t("reviews.filter.reset")}
          </Button>
        </div>
      </div>

      {filters.negativeOnly && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
          <Tag closable color="red" onClose={() => setFilter("negativeOnly", false)} className="!m-0">
            {t("reviews.filter.negativeOnly")}
          </Tag>
        </div>
      )}
    </Card>
  );
}
