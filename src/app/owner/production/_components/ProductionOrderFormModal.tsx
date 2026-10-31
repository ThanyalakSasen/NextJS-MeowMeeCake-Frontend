"use client";
// สร้างใบสั่งผลิต — antd Modal + base/Form · รายการสินค้าเป็นแถวไดนามิก (state ในตัว คล้าย
// IngredientFormModal/StockActionModal — ยังไม่ซับซ้อนพอต้องแยก ViewModel ของตัวเอง)
// รายการสินค้า = ทุกตัว (useProductionViewModel.productOptions) · ตัวที่ยังไม่มีสูตรแสดงแต่เลือกไม่ได้
// (backend บังคับ recipe_id ต่อแถว) · สินค้าที่มีหลายสูตร = ต้องเลือกสูตรในแถวนั้น (เดิมหยิบสูตรแรกเงียบ ๆ — ข้อ 15)
// เช็ควัตถุดิบพอไหมทันทีที่เลือกสินค้า/แก้จำนวน (POST /production-orders/stock-check · หน่วง 400ms) — แถวที่ไม่พอขึ้นกล่องแดง
// บอกวัตถุดิบที่ขาด คงเหลือ ต้องใช้ และผลิตได้สูงสุด · ไม่บล็อกการสร้าง (รับวัตถุดิบเข้าก่อนวันผลิตได้) แค่ถามยืนยันตอนกดสร้าง
// query อยู่ที่นี่ไม่ใช่ ViewModel เพราะผูกกับแถวที่อยู่ใน state ของ modal นี้ (แบบเดียวกับ ReceiptUpload)
// โหมดแก้ไข (editTarget): ผู้เรียก mount ใหม่ต่อใบ (key = id) — ค่าเริ่มต้นของฟอร์ม/แถวมาจากใบนั้น
//   แถวเดิมเปลี่ยนสินค้าไม่ได้ (ลบแล้วเพิ่มใหม่แทน) · itemsEditable=false = แถวเดิมล็อก
//   canAddItems=true (ใบจากรอบพรีออเดอร์ที่ยังไม่เริ่ม) = เพิ่มแถวใหม่ได้ · false = แก้ได้แค่วันผลิต/ผู้รับผิดชอบ/หมายเหตุ
// backend ยังเช็คซ้ำตอนปิดงานผลิต (consumeStock) เสมอ
import { useEffect, useState } from "react";
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { Form, FormItem, useAntForm, Input, TextArea, InputNumber, Select, DatePicker, Button } from "@/components/base";
import { alert, confirmAlert } from "@/lib/alert";
import { formatNumber } from "@/i18n/format";
import { productionOrdersService } from "@/services/productionOrders";
import type { IngredientShortage, ProductionOrder, ProductionStockCheck } from "@/types/productionOrder";
import { actionIcon, modalButtonIcons } from "@/components/shared/actions";
import type { CreateProductionOrderValue, ProductionOrderFormItem } from "../useProductionViewModel";
import { useEditableRows, RemoveRowButton } from "@/components/shared/form";
import { sortOptionsThai } from "@/lib/thaiSort";

// หัวคอลัมน์ + ทุกแถวใช้ชุดเดียวกัน · minmax(0, …) กันคอลัมน์ขยายตามชื่อสินค้ายาว (fr เฉย ๆ ไม่หดต่ำกว่าเนื้อหา
// → แถวที่ชื่อยาวดันช่องจำนวน/หมายเหตุเยื้องจากแถวอื่น) · จำนวน 110px ให้พอทั้งตัวเลขและหน่วย (suffix)
const ROW_COLUMNS = "minmax(0, 1.4fr) 110px minmax(0, 1fr) 24px";

interface ProductOption { _id: string; name: string; unit_abbr: string; recipes: { _id: string; name: string }[] }
interface StaffOption { _id: string; user_fullname: string }

interface ItemRow {
  key: string;
  /** รายการเดิมของใบ (โหมดแก้ไข) — ไม่มี = แถวใหม่ */
  itemId?: string;
  product_id: string;
  /** สูตรของแถว — "" = ยังไม่ได้เลือก (สินค้าหลายสูตร) · แถวเดิมใช้สูตรที่ผูกไว้ในใบ (สูตรของสินค้าอาจถูกลบ/เปลี่ยนไปแล้ว) */
  recipe_id: string;
  /** null = ช่องว่าง (กำลังพิมพ์ใหม่) — เดิมแปลงเป็น 1 ทันที ช่องเด้งเป็น "1" กลางการพิมพ์ (ลบแล้วพิมพ์ 5 ได้ 15) */
  planned_qty: number | null;
  notes: string;
}

function emptyRow(): ItemRow {
  return { key: crypto.randomUUID(), product_id: "", recipe_id: "", planned_qty: 1, notes: "" };
}

/** แถวเริ่มต้นของโหมดแก้ไข — รายการที่ยกเลิกแล้วไม่นำมาแสดง */
const rowsOf = (o: ProductionOrder): ItemRow[] =>
  o.items
    .filter((it) => it.item_status !== "cancelled")
    .map((it) => ({ key: it._id, itemId: it._id, product_id: it.product_id, recipe_id: it.recipe_id, planned_qty: it.planned_qty, notes: it.notes ?? "" }));

const STOCK_CHECK_DEBOUNCE_MS = 400;
type StockCheckRow = ProductionStockCheck["items"][number];
/** ผลของแถวขึ้นกับสูตร + จำนวนเท่านั้น — ใช้เป็น key จับคู่ผลกับแถว (ผลเก่าระหว่างรอ debounce ยังถูกต้องถ้าสองค่านี้เท่าเดิม) */
const rowSig = (recipeId: string, qty: number) => `${recipeId}|${qty}`;

interface FormValues {
  production_date: Dayjs;
  assigned_to?: string;
  production_note?: string;
}

export function ProductionOrderFormModal({
  open,
  products,
  staff,
  saving,
  onClose,
  onSubmit,
  editTarget = null,
  itemsEditable = true,
  canAddItems = itemsEditable,
  canRemoveExisting = true,
}: {
  open: boolean;
  products: ProductOption[];
  staff: StaffOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: CreateProductionOrderValue) => void;
  /** ใบที่กำลังแก้ · null = สร้างใหม่ */
  editTarget?: ProductionOrder | null;
  /** แก้รายการสินค้าได้ไหม (ใบสร้างเองที่ยังไม่เริ่มผลิต) */
  itemsEditable?: boolean;
  /** เพิ่มรายการใหม่ได้ไหม (ทุกใบที่ยังไม่เริ่มผลิต) — ค่าเริ่มต้นตาม itemsEditable */
  canAddItems?: boolean;
  /** ลบรายการเดิมได้ไหม — backend ใช้สิทธิ์ production.delete */
  canRemoveExisting?: boolean;
}) {
  const t = useTranslations();
  const [form] = useAntForm<FormValues>();
  const locale = useLocale();
  const { rows, setRows, updateRow, removeRow } = useEditableRows<ItemRow>(editTarget ? rowsOf(editTarget) : [emptyRow()]);

  // ── เช็ควัตถุดิบ: แถวที่เลือกสินค้าแล้ว → หน่วงก่อนยิง (พิมพ์จำนวนรัว ๆ ไม่ยิงทุกตัวอักษร)
  // สูตรของแถวอยู่ในแถวเอง (row.recipe_id) — รายการเดิมใช้สูตรที่ผูกไว้ในใบ
  const recipesOf = (productId: string) => products.find((p) => p._id === productId)?.recipes ?? [];
  const checkItems = rows.flatMap((r) => {
    const recipe_id = r.recipe_id;
    return r.product_id && recipe_id && r.planned_qty != null && r.planned_qty > 0 ? [{ recipe_id, planned_qty: r.planned_qty }] : [];
  });
  const checkKey = JSON.stringify(checkItems);
  const [debouncedKey, setDebouncedKey] = useState("[]");
  useEffect(() => {
    const h = setTimeout(() => setDebouncedKey(checkKey), STOCK_CHECK_DEBOUNCE_MS);
    return () => clearTimeout(h);
  }, [checkKey]);
  const stockQ = useQuery({
    queryKey: ["production-stock-check", debouncedKey],
    queryFn: async () => (await productionOrdersService.stockCheck(JSON.parse(debouncedKey))).data,
    enabled: open && debouncedKey !== "[]",
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const sent: { recipe_id: string; planned_qty: number }[] = JSON.parse(debouncedKey);
  const resultBySig = new Map<string, StockCheckRow>();
  stockQ.data?.items.forEach((it, i) => sent[i] && resultBySig.set(rowSig(sent[i].recipe_id, sent[i].planned_qty), it));
  const rowResult = (r: ItemRow) => {
    const recipeId = r.recipe_id;
    return recipeId && r.planned_qty != null ? resultBySig.get(rowSig(recipeId, r.planned_qty)) : undefined;
  };
  // ผลรวมทุกแถวใช้ได้เฉพาะตอนผลตรงกับแถวปัจจุบันทั้งชุด
  const checkCurrent = !!stockQ.data && !stockQ.isPlaceholderData && debouncedKey === checkKey;
  const rowsAllOk = checkItems.length > 0 && rows.every((r) => !r.product_id || rowResult(r)?.can_produce);
  const totalShort = checkCurrent && rowsAllOk ? stockQ.data!.total_shortages : [];

  const num = (n: number) => formatNumber(n, locale, { maximumFractionDigits: 3 });
  const shortLine = (s: IngredientShortage) =>
    t("production.stockShortLine", { name: s.ingredient_name, stock: num(s.in_stock), unit: s.unit_abbr ?? "", need: num(s.required), missing: num(s.missing) });

  /** เคลียร์ฟอร์ม+แถวหลังปิด modal สนิทแล้ว (ไม่ว่าจะปิดจากปุ่มยกเลิกหรือหลังบันทึกสำเร็จ)
   *  ใช้ callback ของ antd แทน useEffect(open) — เลี่ยง setState ใน effect (react-compiler) */
  const handleAfterClose = () => {
    form.resetFields();
    setRows(editTarget ? rowsOf(editTarget) : [emptyRow()]);
    setDebouncedKey("[]");
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    // เลือกสินค้าแล้วแต่จำนวนว่าง = บอก (ไม่ทิ้งแถวนั้นเงียบ ๆ)
    if (rows.some((r) => r.product_id && !r.planned_qty)) {
      alert.warning(t("production.qtyRequired"));
      return;
    }
    // สินค้าหลายสูตรยังไม่ได้เลือกสูตร = บอก (เดิมหยิบสูตรแรกให้เงียบ ๆ)
    if (rows.some((r) => r.product_id && !r.recipe_id)) {
      alert.warning(t("production.recipeRequired"));
      return;
    }
    const validRows = rows.filter((r): r is ItemRow & { planned_qty: number } => !!r.product_id && !!r.planned_qty);
    if (validRows.length === 0) {
      alert.warning(t("production.itemsRequired"));
      return;
    }
    // วัตถุดิบไม่พอ (ที่รู้แล้ว) — ถามก่อน ไม่บล็อก: ร้านอาจรับวัตถุดิบเข้าก่อนวันผลิต
    const knownShort = validRows.some((r) => rowResult(r)?.can_produce === false) || totalShort.length > 0;
    if (knownShort) {
      const ok = await confirmAlert(t("production.stockShortConfirm"), {
        title: t("production.stockShortConfirmTitle"),
        confirmText: t("production.stockShortConfirmOk"),
        cancelText: t("common.cancel"),
      });
      if (!ok) return;
    }
    // เลือกได้เฉพาะตัวที่มีสูตร (ตัวอื่น disabled ใน Select) · แถวเดิมใช้สูตรที่ผูกไว้ในใบ
    const items: ProductionOrderFormItem[] = validRows.map((r) => ({
      item_id: r.itemId,
      product_id: r.product_id,
      recipe_id: r.recipe_id,
      planned_qty: r.planned_qty,
      notes: r.notes.trim() || null,
    }));
    onSubmit({
      production_date: v.production_date.toISOString(),
      assigned_to: v.assigned_to ?? null,
      production_note: v.production_note?.trim() || null,
      items,
    });
  };

  return (
    <Modal
      open={open}
      title={editTarget ? t("production.editTitle", { no: editTarget.production_no }) : t("production.createTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons(editTarget ? "save" : "add")}
      okText={editTarget ? t("common.save") : t("production.createSubmit")}
      cancelText={t("common.cancel")}
      width={640}
      destroyOnHidden
      afterClose={handleAfterClose}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          editTarget
            ? {
                production_date: dayjs(editTarget.production_date),
                assigned_to: editTarget.assigned_to ?? undefined,
                production_note: editTarget.production_note ?? "",
              }
            : { production_date: dayjs() }
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <FormItem
            name="production_date"
            label={t("production.fieldDate")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
          <FormItem name="assigned_to" label={t("production.fieldAssignee")}>
            <Select
              allowClear
              placeholder={t("production.assigneePlaceholder")}
              options={sortOptionsThai(staff.map((s) => ({ value: s._id, label: s.user_fullname })))}
            />
          </FormItem>
        </div>
        <FormItem name="production_note" label={t("production.fieldNote")}>
          <TextArea maxLength={1000} rows={1} placeholder={t("production.notePlaceholder")} />
        </FormItem>

        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-500">{t("production.itemsTitle", { n: rows.length })}</p>
          {canAddItems && (
            <Button size="small" icon={actionIcon("add", "small")} onClick={() => setRows((p) => [...p, emptyRow()])}>
              {t("production.addItem")}
            </Button>
          )}
        </div>
        {!itemsEditable && (
          <p className="mb-2 text-xs text-gray-500">{t(canAddItems ? "production.roundItemsLockedHint" : "production.itemsLockedHint")}</p>
        )}

        {canAddItems && products.some((p) => !p.recipes.length) && (
          <p className="mb-2 text-xs text-gray-500">{t("production.noRecipeHint")}</p>
        )}
        {rows.length > 0 && (
          <div className="mb-1 grid gap-2 text-xs text-gray-500" style={{ gridTemplateColumns: ROW_COLUMNS }}>
            <span>{t("filterLabel.product")}</span>
            <span>{t("filterLabel.quantity")}</span>
            <span>{t("filterLabel.note")}</span>
            <span />
          </div>
        )}
        {rows.map((row) => {
          const res = rowResult(row);
          const unit = products.find((p) => p._id === row.product_id)?.unit_abbr ?? "";
          const recipes = recipesOf(row.product_id);
          // แถวเดิมที่ผูกสูตรซึ่งไม่อยู่ในรายการแล้ว (ถูกลบ) — แสดงเป็น "สูตรเดิม" ไม่ขึ้นเป็น id
          const recipeGone = !!row.recipe_id && !recipes.some((r) => r._id === row.recipe_id);
          const recipeOptions = [
            ...recipes.map((r) => ({ value: r._id, label: r.name })),
            ...(recipeGone ? [{ value: row.recipe_id, label: t("production.recipeRemoved") }] : []),
          ];
          // แถวเดิมของใบที่แก้รายการไม่ได้ — แถวที่เพิ่มใหม่แก้/ลบได้เสมอ
          const locked = !!row.itemId && !itemsEditable;
          return (
            <div key={row.key} className="mb-2">
              <div className="grid gap-2 items-center" style={{ gridTemplateColumns: ROW_COLUMNS }}>
                <Select
                  size="small"
                  aria-label={t("filterLabel.product")}
                  placeholder={t("production.selectProduct")}
                  value={row.product_id || undefined}
                  // แถวเดิมเปลี่ยนสินค้าไม่ได้ — ลบแถวแล้วเพิ่มใหม่แทน
                  disabled={!!row.itemId}
                  // สูตรเดียว = เลือกให้เลย · หลายสูตร = ว่างไว้ให้เลือกเอง
                  onChange={(v) => {
                    const list = recipesOf(v as string);
                    updateRow(row.key, { product_id: v as string, recipe_id: list.length === 1 ? list[0]._id : "" });
                  }}
                  showSearch
                  optionFilterProp="label"
                  // มีสูตรขึ้นก่อน (เรียง ก-ฮ) · ยังไม่มีสูตรต่อท้าย เลือกไม่ได้
                  options={[
                    ...sortOptionsThai(products.filter((p) => p.recipes.length).map((p) => ({
                      value: p._id,
                      label: p.name,
                      disabled: rows.some((r) => r.key !== row.key && r.product_id === p._id),
                    }))),
                    ...sortOptionsThai(products.filter((p) => !p.recipes.length).map((p) => ({
                      value: p._id,
                      label: t("production.productNoRecipe", { name: p.name }),
                      disabled: true,
                    }))),
                  ]}
                />
                <InputNumber precision={0}
                  size="small"
                  className="!w-full"
                  min={1}
                  aria-label={t("filterLabel.quantity")}
                  value={row.planned_qty}
                  disabled={locked}
                  status={row.product_id && row.planned_qty == null ? "error" : undefined}
                  onChange={(v) => updateRow(row.key, { planned_qty: v == null ? null : Number(v) })}
                  suffix={<span className="text-xs text-gray-500">{unit}</span>}
                />
                <Input
                  size="small"
                  aria-label={t("filterLabel.note")}
                  value={row.notes}
                  disabled={locked}
                  onChange={(e) => updateRow(row.key, { notes: e.target.value })}
                  placeholder={t("production.itemNotePlaceholder")}
                />
                <RemoveRowButton
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length === 1 || locked || (!!row.itemId && !canRemoveExisting)}
                />
              </div>
              {row.product_id && (recipes.length > 1 || (!!row.itemId && recipeGone)) && (
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span className="shrink-0">{t("production.recipeLabel")}</span>
                  <Select
                    size="small"
                    className="min-w-0 flex-1"
                    aria-label={t("production.recipeLabel")}
                    placeholder={t("production.selectRecipe")}
                    value={row.recipe_id || undefined}
                    // แถวเดิมเปลี่ยนสูตรไม่ได้ (backend แก้ได้แค่จำนวน/หมายเหตุ) — ลบแถวแล้วเพิ่มใหม่แทน
                    disabled={!!row.itemId}
                    status={!row.recipe_id ? "warning" : undefined}
                    onChange={(v) => updateRow(row.key, { recipe_id: v as string })}
                    options={recipeOptions}
                  />
                </div>
              )}
              {res?.recipe_invalid && (
                <p role="alert" className="m-0 mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
                  {t("production.stockRecipeInvalid")}
                </p>
              )}
              {res && !res.recipe_invalid && !res.can_produce && (
                <div role="alert" className="mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
                  <p className="m-0 font-semibold">{t("production.stockShortRow")}</p>
                  <ul className="m-0 list-disc pl-4">
                    {res.shortages.map((s) => <li key={s.ingredient_id}>{shortLine(s)}</li>)}
                  </ul>
                  {res.max_qty != null && <p className="m-0 mt-0.5">{t("production.stockMaxQty", { n: num(res.max_qty), unit })}</p>}
                </div>
              )}
            </div>
          );
        })}

        {totalShort.length > 0 && (
          <div role="alert" className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <p className="m-0 font-semibold">{t("production.stockShortTotal")}</p>
            <ul className="m-0 list-disc pl-4 text-xs">
              {totalShort.map((s) => <li key={s.ingredient_id}>{shortLine(s)}</li>)}
            </ul>
          </div>
        )}
        {checkItems.length > 0 && stockQ.isFetching && !stockQ.data && (
          <p className="m-0 mt-2 text-xs text-gray-500">{t("production.stockChecking")}</p>
        )}
        {stockQ.isError && <p className="m-0 mt-2 text-xs text-amber-700">{t("production.stockCheckFailed")}</p>}
      </Form>
    </Modal>
  );
}
