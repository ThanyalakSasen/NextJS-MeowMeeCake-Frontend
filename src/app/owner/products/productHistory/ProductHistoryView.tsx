"use client";
// View ของ Product Stock History — ตารางการเคลื่อนไหวสต็อกสินค้า (ก่อน → หลัง · ที่มา · ผู้ทำรายการ)
import { useTranslations, useLocale } from "next-intl";
import { Select, LazyRangePicker } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { DataTable, FilterToolbar, type Column, FilterField } from "@/components/shared/data";
import { LoadFailed } from "@/components/shared/feedback";
import { formatDate, formatNumber } from "@/i18n/format";
import { PRODUCT_STOCK_TXN_CONFIG, type ProductStockTxnType } from "@/constants/enumConfig";
import type { ProductHistoryRow, useProductHistoryViewModel } from "./useProductHistoryViewModel";

type VM = ReturnType<typeof useProductHistoryViewModel>;

const TXN_TYPES: ProductStockTxnType[] = ["receive", "use", "adjust", "production", "sale", "sale_return"];

export function ProductHistoryView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const typeBadge = (r: ProductHistoryRow) => {
    const cfg = PRODUCT_STOCK_TXN_CONFIG[r.type];
    return (
      <span
        className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-medium"
        style={{ backgroundColor: cfg.bg, color: cfg.color }}
      >
        {t(`enums.productStockTxnType.${r.type}`)}
      </span>
    );
  };

  const deltaText = (r: ProductHistoryRow) => (
    <span className={`font-semibold ${r.delta > 0 ? "text-green-700" : r.delta < 0 ? "text-pink-700" : "text-gray-600"}`}>
      {r.delta > 0 ? "+" : r.delta < 0 ? "−" : "±"}
      {formatNumber(Math.abs(r.delta), locale)} <span className="font-normal text-gray-600">{r.unit}</span>
    </span>
  );

  const balance = (r: ProductHistoryRow) => (
    <span className="whitespace-nowrap text-gray-700">
      {formatNumber(r.qtyBefore, locale)} → <span className="font-medium text-brown-800">{formatNumber(r.qtyAfter, locale)}</span>
    </span>
  );

  // ที่มา: เลขออเดอร์ / ใบสั่งผลิต · ไม่มี = ทำที่หน้าสต็อกสินค้า
  const source = (r: ProductHistoryRow) =>
    r.refType && r.refNo
      ? t(`productHistory.ref_${r.refType}`, { no: r.refNo })
      : r.refType
        ? t(`productHistory.ref_${r.refType}`, { no: "—" })
        : t("productHistory.refManual");

  const columns: Column<ProductHistoryRow>[] = [
    { key: "time", title: t("productHistory.colTime"), render: (r) => formatDate(r.createdAt, locale, { withTime: true }) },
    { key: "product", title: t("productHistory.colProduct"), render: (r) => <span className="font-medium text-brown-800">{r.productName}</span> },
    { key: "type", title: t("productHistory.colType"), render: typeBadge },
    { key: "delta", title: t("productHistory.colQty"), render: deltaText },
    { key: "balance", title: t("productHistory.colBalance"), render: balance },
    { key: "source", title: t("productHistory.colSource"), render: source },
    { key: "note", title: t("productHistory.colNote"), render: (r) => r.note || "—" },
    { key: "by", title: t("productHistory.colBy"), render: (r) => r.performedBy ?? t("productHistory.bySystem") },
  ];

  // จอ <1280px: การ์ดต่อแถว
  const renderCard = (r: ProductHistoryRow) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 font-medium text-brown-800 break-words">{r.productName}</p>
          <p className="m-0 text-sm text-gray-600">{formatDate(r.createdAt, locale, { withTime: true })}</p>
        </div>
        <div className="shrink-0">{typeBadge(r)}</div>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        {deltaText(r)}
        {balance(r)}
      </div>
      <p className="m-0 text-sm text-gray-600">
        {source(r)} · {r.performedBy ?? t("productHistory.bySystem")}
      </p>
      {r.note && <p className="m-0 text-sm text-gray-700">{r.note}</p>}
    </div>
  );

  return (
    <ListPageLayout
      title={t("productHistory.title")}
      toolbar={
        <FilterToolbar
          right={
            <>
              <FilterField label={t("filterLabel.product")} minWidth={200}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  value={vm.productId}
                  onChange={(v) => vm.setProductId(v as string)}
                  options={[{ value: "all", label: t("productHistory.allProducts") }, ...vm.productOptions]}
                />
              </FilterField>
              <FilterField label={t("filterLabel.transactionType")} minWidth={150}>
                <Select
                  value={vm.type}
                  onChange={(v) => vm.setType(v as VM["type"])}
                  options={[
                    { value: "all", label: t("common.all") },
                    ...TXN_TYPES.map((k) => ({ value: k, label: t(`enums.productStockTxnType.${k}`) })),
                  ]}
                />
              </FilterField>
              {/* โหลดปฏิทินเมื่อกด — RangePicker ของ antd หนักตอน hydrate (ดู base/LazyDatePicker) */}
              <LazyRangePicker
                value={vm.dateRange}
                onChange={(v) => vm.setDateRange((v as VM["dateRange"]) ?? null)}
              />
            </>
          }
        />
      }
    >
      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
      ) : (
        <DataTable
          columns={columns}
          rows={vm.rows}
          loading={vm.isLoading}
          emptyText={t("productHistory.empty")}
          pagination={vm.pagination}
          renderCard={renderCard}
        />
      )}
    </ListPageLayout>
  );
}
