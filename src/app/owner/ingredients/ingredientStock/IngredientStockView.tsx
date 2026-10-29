"use client";
// View ของ Ingredient Stock — ตาราง + ปุ่ม รับเข้า / เบิกใช้ / ปรับยอด ต่อแถว
import dynamic from "next/dynamic";
import { useTranslations, useLocale } from "next-intl";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { Button, ProgressBar } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid, StatusBadge } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, StatusFilterSelect, type Column, useStockStatusOptions } from "@/components/shared/data";
import { formatCurrency, formatNumber } from "@/i18n/format";
import { STOCK_STATUS_CONFIG } from "@/constants/enumConfig";
import { actionIcon } from "@/components/shared/actions";
import type { StockRow, useIngredientStockViewModel } from "./useIngredientStockViewModel";
import { LoadFailed } from "@/components/shared/feedback";
import { StockAlertSection, INGREDIENT_STOCK_MAX } from "@/components/shared/stock";

// ฟอร์ม/โมดัลแยก chunk — โหลดเมื่อเปิดครั้งแรก ไม่ต้อง parse/รันตอนเปิดหน้า (โมดัลไม่ render ฝั่ง server อยู่แล้ว)
const StockActionModal = dynamic(() => import("./_components/StockActionModal").then((m) => m.StockActionModal), { ssr: false });
const BulkStockModal = dynamic(() => import("@/components/shared/stock/BulkStockModal").then((m) => m.BulkStockModal), { ssr: false });

type VM = ReturnType<typeof useIngredientStockViewModel>;

export function IngredientStockView(vm: VM) {
  const t = useTranslations();
  const bulkUsed = useOpenedOnce(vm.bulkOpen);
  const actionUsed = useOpenedOnce(!!vm.target);
  const locale = useLocale();

  const columns: Column<StockRow>[] = [
    {
      key: "name",
      title: t("ingredientStock.colName"),
      render: (r) => (
        <div>
          <p className="font-medium text-brown-800">{r.name}</p>
        </div>
      ),
    },
    {
      key: "stock",
      title: t("ingredientStock.colStock"),
      render: (r) => (
        <div className="min-w-[140px]">
          <p className="text-sm font-semibold" style={{ color: STOCK_STATUS_CONFIG[r.status].text }}>
            {formatNumber(r.currentStock, locale)}{" "}
            <span className="font-normal text-gray-600">{r.unitAbbr}</span>
          </p>
          <ProgressBar percent={r.pct} color={STOCK_STATUS_CONFIG[r.status].dotColor} />
        </div>
      ),
    },
    {
      key: "reorder",
      title: t("ingredientStock.colReorder"),
      align: "right",
      render: (r) => `${formatNumber(r.reorderPoint, locale)} ${r.unitAbbr}`,
    },
    {
      key: "status",
      title: t("ingredientStock.colStatus"),
      render: (r) => <StatusBadge group="stockStatus" value={r.status} />,
    },
  ];

  // ปุ่มต่อแถว — ใช้ทั้งตารางใกล้หมด/หมดสต็อกและตารางหลัก
  const rowActions = vm.perm.update
    ? (r: StockRow) => (
        <div className="flex justify-end gap-2">
          <Button size="small" icon={actionIcon("receive", "small")} onClick={() => vm.openAction(r, "receive")}>{t("ingredientStock.ok_receive")}</Button>
          <Button size="small" icon={actionIcon("use", "small")} disabled={r.currentStock <= 0} onClick={() => vm.openAction(r, "use")}>{t("ingredientStock.ok_use")}</Button>
          <Button size="small" icon={actionIcon("adjust", "small")} onClick={() => vm.openAction(r, "adjust")}>{t("ingredientStock.ok_adjust")}</Button>
        </div>
      )
    : undefined;

  return (
    <ListPageLayout
      title={t("ingredientStock.title")}
      actions={
        vm.perm.update && (
          <Button type="primary" icon={actionIcon("add")} onClick={vm.openBulk}>
            {t("bulkStock.open")}
          </Button>
        )
      }
      toolbar={
        <FilterToolbar
          left={<SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("ingredientStock.searchPlaceholder")} />}
          // ตัวกรองชิดขวา (ช่องค้นหา/แท็บอยู่ซ้าย) — แบบเดียวกับหน้าพนักงาน
          right={
            <>
              <StatusFilterSelect label={t("filterLabel.stockStatus")} value={vm.status} onChange={vm.setStatus} options={useStockStatusOptions()} />
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
            <StatCard label={t("ingredientStock.statTracked")} value={vm.stats.tracked} sub={t("ingredientStock.statTrackedSub")} />
            <StatCard label={t("enums.stockStatus.low")} value={vm.stats.low} sub={t("ingredientStock.statLowSub")} tone="warn" />
            <StatCard label={t("enums.stockStatus.out")} value={vm.stats.out} sub={t("ingredientStock.statOutSub")} tone="down" />
            <StatCard label={t("ingredientStock.statValue")} value={formatCurrency(vm.stats.totalValue, locale)} sub={t("ingredientStock.statValueSub")} />
          </StatCardsGrid>

          {vm.alertRows.length > 0 && (
            <StockAlertSection
              title={t("ingredientStock.alertTitle", { n: vm.alertRows.length })}
              description={t("ingredientStock.alertDescription")}
            >
              <DataTable columns={columns} rows={vm.alertRows} inCard actions={rowActions} />
            </StockAlertSection>
          )}

          {vm.alertRows.length > 0 && <h2 className="m-0 -mb-2 text-base font-semibold text-brown-900">{t("ingredientStock.allItemsTitle")}</h2>}
          <DataTable
            columns={columns}
            rows={vm.rows}
            loading={vm.isLoading}
            emptyText={t("ingredientStock.empty")}
            actions={rowActions}
          />
        </div>
      )}

      {bulkUsed && (
        <BulkStockModal
          open={vm.bulkOpen}
          items={vm.bulkItems}
          initialIds={vm.alertRows.map((r) => r._id)}
          withNote
          withDates
          decimals={2}
          max={INGREDIENT_STOCK_MAX}
          onClose={vm.closeBulk}
          onSubmit={vm.onBulkSubmit}
        />
      )}

      {actionUsed && (
        <StockActionModal
          target={vm.target}
          mode={vm.mode}
          saving={vm.submitting}
          onClose={vm.closeAction}
          onSubmit={vm.onSubmit}
        />
      )}
    </ListPageLayout>
  );
}
