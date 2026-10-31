"use client";
// ─────────────────────────────────────────────────────────────
// ExpenseStockItemsModal — ค่าใช้จ่ายใบนี้ซื้ออะไรเข้าสต็อกบ้าง (วัตถุดิบ · จำนวน · ราคารวม · ราคาต่อหน่วย)
// + ผูกรายการรับเข้าเดิม (บันทึกก่อนมีบันทึกการซื้อ) ย้อนหลัง / ยกเลิกการผูก — ผู้ใช้ขอ 2026-10-31
// ราคารวมของที่ผูกต้องไม่เกินยอดค่าใช้จ่าย (บิลอาจมีของที่ไม่เข้าสต็อก จึงน้อยกว่าได้) — backend ตรวจซ้ำ
// ผูกแล้วอัปเดตต้นทุนวัตถุดิบได้ (ผู้ใช้ขอ 2026-10-31) — backend ตั้งเฉพาะเมื่อเป็นราคาซื้อล่าสุด ผูกบิลเก่าไม่ทับราคาใหม่
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Checkbox, Modal } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Button, InputNumber, RangePicker, Select, Spinner } from "@/components/base";
import { actionIcon } from "@/components/shared/actions";
import { ConfirmDeletePopup, LoadFailed } from "@/components/shared/feedback";
import { formatCurrency, formatDate, formatNumber } from "@/i18n/format";
import { alert } from "@/lib/alert";
import { expensesService } from "@/services/expenses";
import { ingredientTransactionsService } from "@/services/ingredientTransactions";
import { isApiError } from "@/types/api";
import type { Expense } from "@/types/expense";
import type { IngredientTransaction } from "@/types/ingredientTransaction";
import { unitLabel } from "@/utils/unitContext";

/** รายการรับเข้าที่ยังไม่ผูกบิลในช่วงวันที่ที่เลือก — ล่าสุดก่อน · ค่าเริ่มต้น ±30 วันรอบวันที่ของค่าใช้จ่าย
 *  (เดิมดึง 200 รายการล่าสุดของทั้งร้าน — บิลเก่ากว่านั้นหารายการมาผูกไม่เจอ) */
const UNLINKED_LIMIT = 200;
const AROUND_DAYS = 30;
export const stockItemsKey = (id: string) => ["expenses", id, "stock-items"] as const;

const nameOf = (x: IngredientTransaction) => (typeof x.ingredient_id === "object" ? x.ingredient_id.ingredient_name : "");

interface LinkLine {
  key: number;
  id: string | null;
  total: number | null;
}
let seq = 0;
const newLine = (): LinkLine => ({ key: ++seq, id: null, total: null });

export function ExpenseStockItemsModal({
  expense,
  canEdit,
  onClose,
}: {
  expense: Expense | null;
  canEdit: boolean;
  onClose: () => void;
}) {
  const t = useTranslations();
  return (
    <Modal open={!!expense} title={t("purchase.itemsTitle")} footer={null} width={860} destroyOnHidden onCancel={onClose}>
      {expense && <Body expense={expense} canEdit={canEdit} />}
    </Modal>
  );
}

function Body({ expense, canEdit }: { expense: Expense; canEdit: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const itemsQ = useQuery({ queryKey: stockItemsKey(expense._id), queryFn: () => expensesService.stockItems(expense._id) });
  const items = itemsQ.data ?? [];
  const linkedTotal = items.reduce((s, x) => s + (x.line_total ?? 0), 0);
  const remaining = expense.amount - linkedTotal;

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["expenses"] });
    void qc.invalidateQueries({ queryKey: ["ingredient-transactions"] });
    void qc.invalidateQueries({ queryKey: ["ingredients"] });
  };
  const onError = (e: unknown) => alert.error(isApiError(e) ? e.message : t("purchase.linkFailed"));

  const unlink = useMutation({
    mutationFn: (txnId: string) => expensesService.unlinkStockItem(expense._id, txnId),
    onSuccess: () => { alert.success(t("purchase.unlinked")); invalidate(); },
    onError,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
        <span className="font-medium text-brown-900">
          {expense.description} · {formatDate(expense.date, locale)}
        </span>
        <span className="text-gray-600">
          {t("purchase.linkedOfTotal", { linked: formatCurrency(linkedTotal, locale), total: formatCurrency(expense.amount, locale) })}
        </span>
      </div>

      {itemsQ.isError ? (
        <LoadFailed className="flex flex-col items-center gap-3 py-6 text-center" onRetry={() => void itemsQ.refetch()} />
      ) : itemsQ.isPending ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : items.length === 0 ? (
        <p className="m-0 py-4 text-center text-sm text-gray-500">{t("purchase.noItems")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
              <th className="py-2 font-medium">{t("purchase.colIngredient")}</th>
              <th className="py-2 text-right font-medium">{t("purchase.colQty")}</th>
              <th className="py-2 text-right font-medium">{t("purchase.colLineTotal")}</th>
              <th className="py-2 text-right font-medium">{t("purchase.colUnitPrice")}</th>
              <th className="py-2 pl-3 font-medium">{t("purchase.colReceivedAt")}</th>
              {canEdit && <th />}
            </tr>
          </thead>
          <tbody>
            {items.map((x) => {
              const unit = unitLabel(x.unit_id);
              return (
                <tr key={x._id} className="border-b border-gray-50">
                  <td className="py-2 text-brown-900">{nameOf(x)}</td>
                  <td className="py-2 text-right">{formatNumber(x.qty, locale)} {unit}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(x.line_total ?? 0, locale)}</td>
                  <td className="py-2 text-right text-gray-600">
                    {x.qty > 0 ? `${formatCurrency((x.line_total ?? 0) / x.qty, locale)}${unit ? `/${unit}` : ""}` : "—"}
                  </td>
                  <td className="py-2 pl-3 text-gray-600">{formatDate(x.transaction_date ?? x.created_at, locale)}</td>
                  {canEdit && (
                    <td className="py-2 text-right">
                      <ConfirmDeletePopup title={t("purchase.unlinkConfirm", { name: nameOf(x) })} onConfirm={() => unlink.mutate(x._id)}>
                        <Button size="small" icon={actionIcon("unlink", "small")} loading={unlink.isPending && unlink.variables === x._id}>
                          {t("purchase.unlink")}
                        </Button>
                      </ConfirmDeletePopup>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {canEdit && itemsQ.isSuccess && <LinkSection expense={expense} remaining={remaining} onLinked={invalidate} onError={onError} />}
    </div>
  );
}

/** ผูกรายการรับเข้าเดิมย้อนหลัง — เลือกรายการ + ราคารวมของแต่ละรายการ */
function LinkSection({
  expense,
  remaining,
  onLinked,
  onError,
}: {
  expense: Expense;
  remaining: number;
  onLinked: () => void;
  onError: (e: unknown) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [lines, setLines] = useState<LinkLine[]>([newLine()]);
  const [updateCost, setUpdateCost] = useState(true);
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => {
    const d = dayjs(expense.date);
    const end = d.add(AROUND_DAYS, "day");
    return [d.subtract(AROUND_DAYS, "day").startOf("day"), (end.isAfter(dayjs()) ? dayjs() : end).endOf("day")];
  });
  const from = range[0].startOf("day").toISOString();
  const to = range[1].endOf("day").toISOString();
  const candidatesQ = useQuery({
    queryKey: ["ingredient-transactions", "unlinked", from, to],
    queryFn: () =>
      ingredientTransactionsService.list({ type: "receive", expense_id: "none", date_from: from, date_to: to, limit: UNLINKED_LIMIT }),
  });
  // รายการที่เลือกไว้แล้วต้องยังอยู่ในตัวเลือก แม้เปลี่ยนช่วงวันที่ (ไม่งั้น Select โชว์เป็น id)
  const [picked, setPicked] = useState<Map<string, IngredientTransaction>>(new Map());
  const fetched = candidatesQ.data?.data ?? [];
  const candidates = [...fetched, ...[...picked.values()].filter((p) => !fetched.some((x) => x._id === p._id))];
  const more = (candidatesQ.data?.meta.total ?? 0) > fetched.length;

  const used = new Set(lines.map((l) => l.id).filter(Boolean));
  const filled = lines.filter((l) => l.id);
  const sum = filled.reduce((s, l) => s + (l.total ?? 0), 0);
  // เตือนใต้รายการทันที · ยังไม่เลือกอะไร = แค่ปิดปุ่ม
  const issue = filled.some((l) => l.total == null)
    ? t("purchase.linkTotalRequired")
    : sum > remaining
      ? t("purchase.linkExceeds", { remaining: formatCurrency(Math.max(remaining, 0), locale) })
      : null;

  const link = useMutation({
    mutationFn: () =>
      expensesService.linkStockItems(
        expense._id,
        filled.map((l) => ({ transaction_id: l.id as string, line_total: l.total as number })),
        updateCost,
      ),
    onSuccess: (res) => {
      const n = res.data.cost_updated;
      alert.success(n > 0 ? t("purchase.linkedCostUpdated", { n }) : t("purchase.linked"));
      setLines([newLine()]);
      onLinked();
    },
    onError,
  });

  const update = (key: number, p: Partial<LinkLine>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));
  const label = (x: IngredientTransaction) =>
    `${formatDate(x.transaction_date ?? x.created_at, locale)} · ${nameOf(x)} +${formatNumber(x.qty, locale)} ${unitLabel(x.unit_id)}${x.po_ref ? ` (${x.po_ref})` : ""}`;

  return (
    <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
      <p className="m-0 text-sm font-semibold text-brown-900">{t("purchase.linkTitle")}</p>
      <p className="m-0 text-xs text-gray-500">{t("purchase.linkHint")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-600">{t("purchase.linkRange")}</span>
        <RangePicker
          format="DD/MM/YYYY"
          allowClear={false}
          value={range}
          disabledDate={(d) => d.isAfter(dayjs(), "day")}
          onChange={(v) => v?.[0] && v[1] && setRange([v[0], v[1]])}
        />
        {more && <span className="text-xs text-amber-700">{t("purchase.linkRangeMore", { n: UNLINKED_LIMIT })}</span>}
      </div>
      {lines.map((l) => (
        <div key={l.key} className="grid items-center gap-2" style={{ gridTemplateColumns: "minmax(0,1fr) 9rem 2rem" }}>
          <Select
            showSearch
            optionFilterProp="label"
            loading={candidatesQ.isPending}
            placeholder={t("purchase.selectReceive")}
            value={l.id ?? undefined}
            onChange={(v) => {
              const x = candidates.find((c) => c._id === v);
              if (x) setPicked((m) => new Map(m).set(x._id, x));
              update(l.key, { id: v as string });
            }}
            options={candidates.map((x) => ({ value: x._id, label: label(x), disabled: used.has(x._id) && x._id !== l.id }))}
            notFoundContent={t("purchase.noUnlinked")}
            className="w-full"
          />
          <InputNumber
            min={0}
            precision={0}
            value={l.total}
            disabled={!l.id}
            placeholder={t("purchase.colLineTotal")}
            suffix={t("common.currencySymbol")}
            onChange={(v) => update(l.key, { total: v == null ? null : Number(v) })}
          />
          <Button
            type="text"
            aria-label={t("common.delete")}
            icon={<TrashIcon className="h-4 w-4" />}
            disabled={lines.length === 1}
            onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
          />
        </div>
      ))}
      {issue && <p role="alert" className="m-0 text-sm text-red-500">{issue}</p>}
      <Checkbox checked={updateCost} onChange={(e) => setUpdateCost(e.target.checked)}>
        {t("purchase.linkUpdateCost")}
      </Checkbox>
      <p className="m-0 ml-6 text-xs text-gray-500">{t("purchase.linkUpdateCostHint")}</p>
      <div className="flex justify-between gap-2">
        <Button size="small" icon={actionIcon("add", "small")} onClick={() => setLines((ls) => [...ls, newLine()])}>
          {t("purchase.addLine")}
        </Button>
        <Button type="primary" icon={actionIcon("link")} loading={link.isPending} disabled={filled.length === 0 || !!issue} onClick={() => link.mutate()}>
          {t("purchase.linkSubmit", { n: filled.length })}
        </Button>
      </div>
    </div>
  );
}
