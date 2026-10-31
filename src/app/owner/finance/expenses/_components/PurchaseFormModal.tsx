"use client";
// ─────────────────────────────────────────────────────────────
// PurchaseFormModal — บันทึกการซื้อวัตถุดิบ: กรอกบิลครั้งเดียว ได้ทั้ง "รับเข้าสต็อก" ทุกรายการ + "ค่าใช้จ่าย" 1 ใบ ผูกถึงกัน
// (ผู้ใช้ขอ 2026-10-31) · ยอดค่าใช้จ่าย = ผลรวมราคาทุกรายการ · ใช้ทั้งหน้าค่าใช้จ่ายและหน้าสต็อกวัตถุดิบ
// หัวบิลเป็น antd Form (rules) · รายการวัตถุดิบเป็น state เอง (แบบ BulkStockModal) — ปุ่มบันทึกกดได้เมื่อถูกครบทั้งสองส่วน
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Checkbox, Modal } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Button, DatePicker, Form, FormItem, Input, InputNumber, Select, TextArea, useAntForm, useFormValid } from "@/components/base";
import { actionIcon, modalButtonIcons } from "@/components/shared/actions";
import { EXPENSE_PAYMENT_METHODS, type ExpensePaymentMethod } from "@/constants/enumConfig";
import { isIntegerOnlyUnit } from "@/constants/ingredientCategoryUnits";
import { formatCurrency, formatNumber } from "@/i18n/format";
import { sortOptionsThai } from "@/lib/thaiSort";
import { unitLabel } from "@/utils/unitContext";
import type { Ingredient } from "@/types/ingredient";
import { PURCHASE_CATEGORIES, PURCHASE_ITEMS_MAX, type PurchaseCategory, type PurchaseInput } from "@/types/purchase";
import { ReceiptUpload } from "./ReceiptUpload";

/** ยอดสูงสุดต่อบิล (บาท) — เท่า backend schemas/expense.ts EXPENSE_MAX */
const EXPENSE_MAX = 10_000_000;

interface HeaderValue {
  date: Dayjs;
  vendor?: string;
  category: PurchaseCategory;
  payment_method: ExpensePaymentMethod;
  po_ref?: string;
  description?: string;
  note?: string;
  receipt_url?: string;
  /** ตั้งต้นทุนวัตถุดิบ (cost_per_unit) เป็นราคาต่อหน่วยของบิลนี้ */
  update_cost: boolean;
}

interface Line {
  key: number;
  id: string | null;
  qty: number | null;
  total: number | null;
  expiry: Dayjs | null;
}

let seq = 0;
const newLine = (id: string | null = null): Line => ({ key: ++seq, id, qty: null, total: null, expiry: null });

/** วันที่เลือก → ISO · วันนี้ใช้เวลาปัจจุบัน (เรียงในประวัติถูก) · วันก่อนหน้าใช้เที่ยงวัน (ไม่เลื่อนวันเพราะเขตเวลา) */
const dateIso = (d: Dayjs) => (d.isSame(dayjs(), "day") ? dayjs() : d.hour(12).minute(0).second(0)).toISOString();

export function PurchaseFormModal({
  open,
  ingredients,
  initialIds = [],
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  ingredients: Ingredient[];
  /** วัตถุดิบที่ใส่ไว้ให้ตอนเปิด (เช่น ใกล้หมด/หมดสต็อก) */
  initialIds?: string[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: PurchaseInput) => void;
}) {
  const t = useTranslations();
  return (
    <Modal open={open} title={t("purchase.title")} footer={null} width={1000} destroyOnHidden onCancel={onClose} mask={{ closable: false }}>
      {/* เนื้อหาแยก component — state เริ่มใหม่ทุกครั้งที่เปิด (destroyOnHidden) */}
      {open && <Body ingredients={ingredients} initialIds={initialIds} saving={saving} onClose={onClose} onSubmit={onSubmit} />}
    </Modal>
  );
}

function Body({
  ingredients,
  initialIds,
  saving,
  onClose,
  onSubmit,
}: {
  ingredients: Ingredient[];
  initialIds: string[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: PurchaseInput) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [form] = useAntForm<HeaderValue>();
  // หัวบิลผ่าน rules ครบ (required + รูปแบบ) — ผู้ใช้ขอ 2026-10-31
  const valid = useFormValid(form);
  const date = (Form.useWatch("date", form) as Dayjs | undefined) ?? dayjs();

  const [lines, setLines] = useState<Line[]>(() => {
    const known = initialIds.filter((id) => ingredients.some((i) => i._id === id));
    return known.length ? [...known.map((id) => newLine(id)), newLine()] : [newLine(), newLine()];
  });

  const byId = new Map(ingredients.map((i) => [i._id, i]));
  const used = new Set(lines.map((l) => l.id).filter(Boolean));
  const filled = lines.filter((l) => l.id);
  const sum = filled.reduce((s, l) => s + (l.total ?? 0), 0);
  const badExpiry = (l: Line) => !!l.expiry && l.expiry.isBefore(date, "day");
  const incomplete = (l: Line) => !!l.id && (!l.qty || l.total == null);

  // รายการวัตถุดิบ (อยู่นอก antd Form) — เตือนใต้รายการทันที · ยังไม่เลือกวัตถุดิบเลย = แค่ปิดปุ่ม ไม่ขึ้นตัวแดงตั้งแต่เปิด
  const rowsIssue = lines.some(incomplete)
    ? "purchase.lineIncomplete"
    : lines.some(badExpiry)
      ? "purchase.expiryBeforeDate"
      : filled.length === 0
        ? "purchase.itemsRequired"
        : filled.length > PURCHASE_ITEMS_MAX
          ? "purchase.tooManyItems"
          : sum <= 0
            ? "purchase.totalZero"
            : sum > EXPENSE_MAX
              ? "purchase.totalMax"
              : null;

  const update = (key: number, p: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));

  const handleOk = async () => {
    const v = await form.validateFields();
    // ปุ่มถูก disable อยู่แล้วถ้ารายการไม่ครบ — กันไว้อีกชั้น (เช่น กด Enter)
    if (rowsIssue) return;
    onSubmit({
      date: dateIso(v.date),
      vendor: v.vendor?.trim() || undefined,
      category: v.category,
      payment_method: v.payment_method,
      po_ref: v.po_ref?.trim() || undefined,
      description: v.description?.trim() || undefined,
      note: v.note?.trim() || undefined,
      receipt_url: v.receipt_url || null,
      update_cost: v.update_cost,
      items: filled.map((l) => ({
        ingredient_id: l.id as string,
        qty: l.qty as number,
        line_total: l.total as number,
        expiry_date: l.expiry ? l.expiry.startOf("day").toISOString() : null,
      })),
    });
  };

  const cols = "minmax(0,1.4fr) 9rem 9rem 7rem 9.5rem 2rem";

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-gray-600">{t("purchase.hint")}</p>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ date: dayjs(), category: PURCHASE_CATEGORIES[0], payment_method: EXPENSE_PAYMENT_METHODS[0], update_cost: true }}
      >
        <div className="grid grid-cols-2 gap-x-3 md:grid-cols-4">
          <FormItem name="date" label={t("purchase.fieldDate")} rules={[{ required: true, message: t("validation.required") }]}>
            <DatePicker format="DD/MM/YYYY" allowClear={false} disabledDate={(d) => d.isAfter(dayjs(), "day")} className="!w-full" />
          </FormItem>
          <FormItem name="vendor" label={t("finance.fieldVendor")}>
            <Input maxLength={200} placeholder={t("finance.vendorPlaceholder")} />
          </FormItem>
          <FormItem name="category" label={t("finance.fieldCategory")} rules={[{ required: true, message: t("validation.required") }]}>
            <Select options={PURCHASE_CATEGORIES.map((c) => ({ value: c, label: t(`enums.expenseCategory.${c}`) }))} />
          </FormItem>
          <FormItem name="payment_method" label={t("finance.fieldPaymentMethod")} rules={[{ required: true, message: t("validation.required") }]}>
            <Select options={sortOptionsThai(EXPENSE_PAYMENT_METHODS.map((p) => ({ value: p, label: t(`enums.expensePaymentMethod.${p}`) })))} />
          </FormItem>
          <FormItem name="po_ref" label={t("purchase.fieldPoRef")}>
            <Input maxLength={100} placeholder={t("purchase.poRefPlaceholder")} />
          </FormItem>
          <FormItem name="description" label={t("finance.fieldDescription")} className="md:col-span-3">
            <Input maxLength={300} placeholder={t("purchase.descriptionPlaceholder")} />
          </FormItem>
        </div>

        {/* รายการวัตถุดิบในบิล */}
        <div className="flex flex-col gap-2">
          <div className="grid gap-2 px-1 text-xs font-medium text-gray-500" style={{ gridTemplateColumns: cols }}>
            <span>{t("purchase.colIngredient")}</span>
            <span>{t("purchase.colQty")}</span>
            <span>{t("purchase.colLineTotal")}</span>
            <span>{t("purchase.colUnitPrice")}</span>
            <span>{t("purchase.colExpiry")}</span>
            <span />
          </div>
          {lines.map((l) => {
            const ing = l.id ? byId.get(l.id) : undefined;
            const unit = ing ? unitLabel(ing.unit_id) : "";
            const intOnly = !!ing && isIntegerOnlyUnit(typeof ing.unit_id === "object" ? ing.unit_id : undefined);
            const unitPrice = l.qty && l.total != null ? l.total / l.qty : null;
            return (
              <div key={l.key} className="grid items-start gap-2" style={{ gridTemplateColumns: cols }}>
                <div className="min-w-0">
                  <Select
                    showSearch
                    optionFilterProp="label"
                    aria-label={t("purchase.colIngredient")}
                    placeholder={t("purchase.selectIngredient")}
                    value={l.id ?? undefined}
                    onChange={(v) => update(l.key, { id: v as string, qty: null })}
                    options={sortOptionsThai(
                      ingredients.map((i) => ({ value: i._id, label: i.ingredient_name, disabled: used.has(i._id) && i._id !== l.id })),
                    )}
                    className="w-full"
                  />
                  {ing && (
                    <p className="m-0 mt-0.5 text-xs text-gray-500">
                      {t("purchase.currentStock", { qty: formatNumber(ing.current_stock, locale), unit })}
                    </p>
                  )}
                </div>
                <InputNumber
                  min={intOnly ? 1 : 0.01}
                  precision={intOnly ? 0 : 2}
                  value={l.qty}
                  disabled={!l.id}
                  status={l.id && !l.qty && l.total != null ? "error" : undefined}
                  suffix={unit || undefined}
                  onChange={(v) => update(l.key, { qty: v == null ? null : Number(v) })}
                  className="!w-full"
                />
                <InputNumber
                  min={0}
                  max={EXPENSE_MAX}
                  precision={0}
                  value={l.total}
                  disabled={!l.id}
                  status={l.id && l.total == null && !!l.qty ? "error" : undefined}
                  suffix={t("common.currencySymbol")}
                  onChange={(v) => update(l.key, { total: v == null ? null : Number(v) })}
                  className="!w-full"
                />
                <span className="pt-1.5 text-sm text-gray-600">
                  {unitPrice != null ? `${formatCurrency(unitPrice, locale)}${unit ? `/${unit}` : ""}` : "—"}
                </span>
                <DatePicker
                  format="DD/MM/YYYY"
                  placeholder={t("purchase.expiryPlaceholder")}
                  value={l.expiry}
                  disabled={!l.id}
                  status={badExpiry(l) ? "error" : undefined}
                  disabledDate={(d) => d.isBefore(date, "day")}
                  onChange={(d) => update(l.key, { expiry: d && !Array.isArray(d) ? d : null })}
                  className="!w-full"
                />
                <Button
                  type="text"
                  aria-label={t("common.delete")}
                  icon={<TrashIcon className="h-4 w-4" />}
                  disabled={lines.length === 1}
                  onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                />
              </div>
            );
          })}
          <div>
            <Button size="small" icon={actionIcon("add", "small")} disabled={lines.length >= PURCHASE_ITEMS_MAX} onClick={() => setLines((ls) => [...ls, newLine()])}>
              {t("purchase.addLine")}
            </Button>
          </div>
          {rowsIssue && rowsIssue !== "purchase.itemsRequired" && (
            <p role="alert" className="m-0 text-sm text-red-500">
              {t(rowsIssue, { max: formatNumber(EXPENSE_MAX, locale), n: PURCHASE_ITEMS_MAX })}
            </p>
          )}
        </div>

        {/* ต้นทุนวัตถุดิบ = ราคาซื้อล่าสุด (ผู้ใช้ขอ 2026-10-31) — ใช้คิดมูลค่าสต็อก + ต้นทุนสูตรตอนบันทึกสูตรครั้งถัดไป */}
        <FormItem name="update_cost" valuePropName="checked" className="!mb-0 mt-3">
          <Checkbox>{t("purchase.updateCost")}</Checkbox>
        </FormItem>
        <p className="m-0 ml-6 text-xs text-gray-500">{t("purchase.updateCostHint")}</p>

        <div className="mt-4 grid grid-cols-1 gap-x-3 md:grid-cols-2">
          <FormItem name="note" label={t("finance.fieldNote")}>
            <TextArea maxLength={1000} rows={3} placeholder={t("finance.notePlaceholder")} />
          </FormItem>
          <FormItem name="receipt_url" label={t("finance.fieldReceipt")}>
            <ReceiptUpload />
          </FormItem>
        </div>
      </Form>

      <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-600">
          {t("purchase.summary", { n: filled.length })}{" "}
          <span className="font-semibold text-brown-900">{formatCurrency(sum, locale)}</span>
        </span>
        <div className="flex gap-2">
          <Button icon={actionIcon("cancel")} onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="primary" icon={modalButtonIcons("save").okButtonProps.icon} loading={saving} disabled={!valid || !!rowsIssue} onClick={handleOk}>
            {t("purchase.submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
