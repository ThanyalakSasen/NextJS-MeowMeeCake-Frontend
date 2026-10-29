"use client";
// View ของ Product Stock — JSX ล้วน รับ props จาก useProductStockViewModel
import { useTranslations, useLocale } from "next-intl";
import { Button, Select } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid, StatusBadge } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, type Column, useStockStatusOptions, FilterField } from "@/components/shared/data";
import { formatCurrency } from "@/i18n/format";
import { actionIcon } from "@/components/shared/actions";
import type { StockProductRow, useProductStockViewModel } from "./useProductStockViewModel";
import { StockProgressRow } from "./_components/StockProgressRow";
import { StockActionModal } from "./_components/StockActionModal";
import { BulkStockModal, StockAlertSection, PRODUCT_STOCK_MAX } from "@/components/shared/stock";
import { LoadFailed } from "@/components/shared/feedback";
import { LotLookupModal } from "@/components/shared/lots";

type VM = ReturnType<typeof useProductStockViewModel>;

export function ProductStockView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<StockProductRow>[] = [
    {
      key: "name",
      title: t("productStock.colProduct"),
      render: (r) => (
        <div>
          <p className="font-medium text-brown-800">{r.name}</p>
          {r.category && <p className="text-sm text-gray-600">{r.category}</p>}
        </div>
      ),
    },
    {
      key: "stock",
      title: t("productStock.colStock"),
      render: (r) => <StockProgressRow qty={r.stock} unit={r.unit} threshold={r.threshold} />,
    },
    {
      key: "status",
      title: t("productStock.colStatus"),
      render: (r) => <StatusBadge group="stockStatus" value={r.status} />,
    },
    {
      key: "price",
      title: t("productStock.colPrice"),
      align: "right",
      render: (r) => formatCurrency(r.price, locale),
    },
    {
      key: "value",
      title: t("productStock.colValue"),
      align: "right",
      render: (r) => formatCurrency(r.value, locale),
    },
  ];

  // wrapper ของหน้านี้มี label กำกับ (ต่างจากหน้าวัตถุดิบ/สต็อกวัตถุดิบ) จึงไม่ใช้ StatusFilterSelect
  const statusOptions = useStockStatusOptions();

  // ปุ่มต่อแถว — ใช้ทั้งตารางใกล้หมด/หมดสต็อกและตารางหลัก (และในการ์ดจอแคบ)
  const actionButtons = (r: StockProductRow) => (
    <>
      <Button size="small" icon={actionIcon("receive", "small")} onClick={() => vm.openAction(r, "receive")}>{t("productStock.ok_receive")}</Button>
      <Button size="small" icon={actionIcon("use", "small")} disabled={r.stock <= 0} onClick={() => vm.openAction(r, "use")}>{t("productStock.ok_use")}</Button>
      <Button size="small" icon={actionIcon("adjust", "small")} onClick={() => vm.openAction(r, "adjust")}>{t("productStock.ok_adjust")}</Button>
    </>
  );
  // ประวัติแสดงได้แม้ไม่มีสิทธิ์ปรับสต็อก (stock_history.view แยกจาก stock.update)
  const historyButton = (r: StockProductRow) => (
    <Button size="small" icon={actionIcon("history", "small")} onClick={() => vm.openHistory(r)}>{t("productStock.history")}</Button>
  );
  const hasRowActions = vm.perm.update || vm.canViewHistory;
  const rowButtons = (r: StockProductRow) => (
    <>
      {vm.perm.update && actionButtons(r)}
      {vm.canViewHistory && historyButton(r)}
    </>
  );
  const rowActions = hasRowActions
    ? (r: StockProductRow) => <div className="flex justify-end gap-2">{rowButtons(r)}</div>
    : undefined;

  // จอ <1280px: การ์ดต่อแถวแทนตาราง (DataTable renderCard) — ข้อมูลชุดเดียวกับคอลัมน์ข้างบน
  const renderCard = (r: StockProductRow) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 font-medium text-brown-800 break-words">{r.name}</p>
          {r.category && <p className="m-0 text-sm text-gray-600">{r.category}</p>}
        </div>
        <div className="shrink-0">
          <StatusBadge group="stockStatus" value={r.status} />
        </div>
      </div>
      <StockProgressRow qty={r.stock} unit={r.unit} threshold={r.threshold} />
      <dl className="m-0 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-gray-600">{t("productStock.colPrice")}</dt>
          <dd className="m-0 font-medium text-brown-800">{formatCurrency(r.price, locale)}</dd>
        </div>
        <div>
          <dt className="text-gray-600">{t("productStock.colValue")}</dt>
          <dd className="m-0 font-medium text-brown-800">{formatCurrency(r.value, locale)}</dd>
        </div>
      </dl>
      {hasRowActions && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">{rowButtons(r)}</div>
      )}
    </div>
  );

  return (
    <ListPageLayout
      title={t("productStock.title")}
      actions={
        <>
          <Button icon={actionIcon("scan")} onClick={vm.openLotLookup}>
            {t("lots.lookup")}
          </Button>
          {vm.canViewHistory && (
            <Button icon={actionIcon("history")} onClick={() => vm.openHistory()}>
              {t("productStock.history")}
            </Button>
          )}
          {vm.perm.update && (
            <Button type="primary" icon={actionIcon("add")} onClick={vm.openBulk}>
              {t("bulkStock.open")}
            </Button>
          )}
        </>
      }
      toolbar={
        <FilterToolbar
          left={
            <>
              <SearchInput
                value={vm.search}
                onChange={vm.setSearch}
                placeholder={t("productStock.searchPlaceholder")}
              />
            </>
          }
          right={
            <>
              <FilterField label={t("productStock.categoryFilter")} className="min-w-40 flex-1 sm:flex-none">
                <Select
                  value={vm.categoryId}
                  onChange={(v) => vm.setCategoryId(v as string)}
                  options={[
                    { value: "all", label: t("common.all") },
                    // vm.categories เรียง ก-ฮ มาแล้ว (sortByThai)
                    ...vm.categories.map((c) => ({ value: c._id, label: c.product_category_name })),
                  ]}
                />
              </FilterField>
              <FilterField label={t("productStock.statusFilter")} className="min-w-40 flex-1 sm:flex-none">
                <Select
                  value={vm.status}
                  onChange={(v) => vm.setStatus(v as VM["status"])}
                  options={statusOptions}
                />
              </FilterField>
            </>
          }
        />
      }
    >
      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
      ) : (
        <div className="flex flex-col gap-5">
          <StatCardsGrid>
            <StatCard
              label={t("productStock.statTracked")}
              value={vm.stats.tracked}
              sub={t("productStock.statTrackedSub")}
            />
            <StatCard
              label={t("productStock.statLow")}
              value={vm.stats.low}
              sub={t("productStock.statLowSub")}
              tone="warn"
            />
            <StatCard
              label={t("productStock.statOut")}
              value={vm.stats.out}
              sub={t("productStock.statOutSub")}
              tone="down"
            />
            <StatCard
              label={t("productStock.statValue")}
              value={formatCurrency(vm.stats.totalValue, locale)}
              sub={t("productStock.statValueSub")}
            />
          </StatCardsGrid>

          {vm.alertRows.length > 0 && (
            <StockAlertSection
              title={t("productStock.alertTitle", { n: vm.alertRows.length })}
              description={t("productStock.alertDescription")}
            >
              <DataTable columns={columns} rows={vm.alertRows} inCard actions={rowActions} renderCard={renderCard} />
            </StockAlertSection>
          )}

          {vm.alertRows.length > 0 && <h2 className="m-0 -mb-2 text-base font-semibold text-brown-900">{t("productStock.allItemsTitle")}</h2>}
          <DataTable
            columns={columns}
            rows={vm.rows}
            loading={vm.isLoading}
            emptyText={t("productStock.empty")}
            actions={rowActions}
            renderCard={renderCard}
          />
        </div>
      )}

      <BulkStockModal
        open={vm.bulkOpen}
        items={vm.bulkItems}
        initialIds={vm.alertRows.map((r) => r._id)}
        withNote
        max={PRODUCT_STOCK_MAX}
        onClose={vm.closeBulk}
        onSubmit={vm.onBulkSubmit}
      />

      <StockActionModal
        target={vm.target}
        mode={vm.mode}
        saving={vm.saving}
        onClose={vm.closeAction}
        onSubmit={vm.onSubmit}
      />

      {vm.lotLookupOpen && <LotLookupModal onClose={vm.closeLotLookup} />}
    </ListPageLayout>
  );
}
