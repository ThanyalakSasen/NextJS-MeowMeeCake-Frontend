"use client";
// สร้างใบสั่งผลิต — antd Modal + base/Form · รายการสินค้าเป็นแถวไดนามิก (state ในตัว คล้าย
// IngredientFormModal/StockActionModal — ยังไม่ซับซ้อนพอต้องแยก ViewModel ของตัวเอง)
// **ตัดจากต้นทาง:** ไม่มี recipe_id ผูกต่อแถว (ยังไม่มี resource `recipes` ในโปรเจกต์นี้ — รอ Screen #16)
// จึงไม่เช็ควัตถุดิบขาด/พอ และไม่คำนวณต้นทุนประมาณต่อใบสั่งผลิต
import { useState } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Form, FormItem, useAntForm, Input, TextArea, InputNumber, Select, DatePicker, Button } from "@/components/base";
import { alert } from "@/lib/alert";
import type { SourceType } from "@/constants/enumConfig";
import type { ProductionOrderItem } from "@/types/productionOrder";
import type { CreateProductionOrderValue } from "../useProductionViewModel";

interface ProductOption { _id: string; name: string; unit_abbr: string }
interface StaffOption { _id: string; user_fullname: string }

interface ItemRow {
  key: string;
  product_id: string;
  planned_qty: number;
  notes: string;
}

function emptyRow(): ItemRow {
  return { key: crypto.randomUUID(), product_id: "", planned_qty: 1, notes: "" };
}

interface FormValues {
  production_date: Dayjs;
  source_type: SourceType;
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
}: {
  open: boolean;
  products: ProductOption[];
  staff: StaffOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: CreateProductionOrderValue) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<FormValues>();
  const [rows, setRows] = useState<ItemRow[]>([emptyRow()]);

  /** เคลียร์ฟอร์ม+แถวหลังปิด modal สนิทแล้ว (ไม่ว่าจะปิดจากปุ่มยกเลิกหรือหลังบันทึกสำเร็จ)
   *  ใช้ callback ของ antd แทน useEffect(open) — เลี่ยง setState ใน effect (react-compiler) */
  const handleAfterClose = () => {
    form.resetFields();
    setRows([emptyRow()]);
  };

  const updateRow = (key: string, patch: Partial<ItemRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const handleOk = async () => {
    const v = await form.validateFields();
    const validRows = rows.filter((r) => r.product_id && r.planned_qty > 0);
    if (validRows.length === 0) {
      alert.error(t("production.itemsRequired"));
      return;
    }
    const items: ProductionOrderItem[] = validRows.map((r) => {
      const p = products.find((pr) => pr._id === r.product_id)!;
      return { product_id: p._id, product_name: p.name, planned_qty: r.planned_qty, unit_abbr: p.unit_abbr, notes: r.notes || null };
    });
    onSubmit({
      production_date: v.production_date.toISOString(),
      source_type: v.source_type,
      assigned_to: v.assigned_to ?? null,
      production_note: v.production_note?.trim() || null,
      items,
    });
  };

  return (
    <Modal
      open={open}
      title={t("production.createTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={t("production.createSubmit")}
      cancelText={t("common.cancel")}
      width={640}
      destroyOnHidden
      afterClose={handleAfterClose}
    >
      <Form form={form} layout="vertical" initialValues={{ production_date: dayjs(), source_type: "manual" as SourceType }}>
        <div className="grid grid-cols-2 gap-3">
          <FormItem
            name="production_date"
            label={t("production.fieldDate")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
          <FormItem name="source_type" label={t("production.fieldSourceType")}>
            <Select
              options={(["manual", "preorder"] as SourceType[]).map((s) => ({ value: s, label: t(`enums.sourceType.${s}`) }))}
            />
          </FormItem>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormItem name="assigned_to" label={t("production.fieldAssignee")}>
            <Select
              allowClear
              placeholder={t("production.assigneePlaceholder")}
              options={staff.map((s) => ({ value: s._id, label: s.user_fullname }))}
            />
          </FormItem>
          <FormItem name="production_note" label={t("production.fieldNote")}>
            <TextArea rows={1} placeholder={t("production.notePlaceholder")} />
          </FormItem>
        </div>

        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-500">{t("production.itemsTitle", { n: rows.length })}</p>
          <Button size="small" icon={<PlusIcon className="h-3.5 w-3.5" />} onClick={() => setRows((p) => [...p, emptyRow()])}>
            {t("production.addItem")}
          </Button>
        </div>

        {rows.map((row) => (
          <div key={row.key} className="grid gap-2 mb-2 items-center" style={{ gridTemplateColumns: "1fr 90px 1fr 24px" }}>
            <Select
              size="small"
              placeholder={t("production.selectProduct")}
              value={row.product_id || undefined}
              onChange={(v) => updateRow(row.key, { product_id: v as string })}
              showSearch
              optionFilterProp="label"
              options={products.map((p) => ({
                value: p._id,
                label: p.name,
                disabled: rows.some((r) => r.key !== row.key && r.product_id === p._id),
              }))}
            />
            <InputNumber
              size="small"
              className="!w-full"
              min={1}
              value={row.planned_qty}
              onChange={(v) => updateRow(row.key, { planned_qty: Number(v) || 1 })}
              suffix={<span className="text-xs text-gray-400">{products.find((p) => p._id === row.product_id)?.unit_abbr ?? ""}</span>}
            />
            <Input
              size="small"
              value={row.notes}
              onChange={(e) => updateRow(row.key, { notes: e.target.value })}
              placeholder={t("production.itemNotePlaceholder")}
            />
            <Button
              size="small" type="text" danger
              icon={<XMarkIcon className="h-3.5 w-3.5" />}
              disabled={rows.length === 1}
              onClick={() => setRows((p) => p.filter((r) => r.key !== row.key))}
              aria-label={t("common.delete")}
            />
          </div>
        ))}
      </Form>
    </Modal>
  );
}
