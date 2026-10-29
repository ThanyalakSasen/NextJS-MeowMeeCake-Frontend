"use client";
// เพิ่ม/แก้ไขวัตถุดิบ — antd Modal + base/Form
import { useEffect, useMemo } from "react";
import { Modal } from "antd";
import type { Rule } from "antd/es/form";
import { useTranslations, useLocale } from "next-intl";
import { Form, FormItem, useAntForm, Input, InputNumber, Select } from "@/components/base";
import type { IngredientInput } from "@/types/ingredient";
import type { IngredientCategory } from "@/types/ingredientCategory";
import type { Unit } from "@/types/unit";
import { modalButtonIcons } from "@/components/shared/actions";
import type { IngredientRow } from "../useIngredientsViewModel";
import { sortOptionsThai } from "@/lib/thaiSort";
import { formatNumber } from "@/i18n/format";
import { INGREDIENT_STOCK_MAX } from "@/components/shared/stock";
import {
  blockIntegerKeyDown,
  blockNegativeKeyDown,
  blockNonIntegerPaste,
  blockNonNumericPaste,
  integerParser,
  isIntegerOnlyUnit,
  numericParser,
  resolveIngredientCategoryUnits,
} from "@/constants/ingredientCategoryUnits";

interface FormValues {
  ingredient_name: string;
  ingredient_category_id: string;
  unit_id: string;
  current_stock?: number;
  reorder_point: number;
  max_stock?: number;
  cost_per_unit?: number;
  supplier?: string;
}

export function IngredientFormModal({
  open,
  editTarget,
  categories,
  units,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  editTarget: IngredientRow | null;
  categories: IngredientCategory[];
  units: Unit[];
  saving: boolean;
  onClose: () => void;
  onSave: (body: IngredientInput) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [form] = useAntForm<FormValues>();
  const watchedCategoryId = Form.useWatch("ingredient_category_id", form);
  const watchedName = Form.useWatch("ingredient_name", form);
  const watchedUnitId = Form.useWatch("unit_id", form);

  const selectedCategoryName = useMemo(
    () => categories.find((c) => c._id === watchedCategoryId)?.ingredient_category_name,
    [categories, watchedCategoryId],
  );

  const { allowedUnits, defaultUnitId } = useMemo(
    () => resolveIngredientCategoryUnits(selectedCategoryName, watchedName, units),
    [selectedCategoryName, watchedName, units],
  );

  const selectedUnit = useMemo(
    () => units.find((u) => u._id === watchedUnitId),
    [units, watchedUnitId],
  );
  // ระบบไม่แปลงหน่วย — มียอดคงเหลืออยู่ เปลี่ยนหน่วย = ยอดเดิมถูกนับเป็นหน่วยใหม่ (backend ตอบ 409 · มีสูตรใช้ก็ 409)
  const unitLocked = !!editTarget && (editTarget.currentStock ?? 0) !== 0;
  const isIntUnit = useMemo(() => isIntegerOnlyUnit(selectedUnit), [selectedUnit]);
  const unitSuffix = selectedUnit ? (
    <span className="text-xs text-gray-500">{selectedUnit.unit_name || selectedUnit.unit_abbr}</span>
  ) : undefined;

  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      form.setFieldsValue({
        ingredient_name: editTarget.name,
        ingredient_category_id: editTarget.categoryId,
        unit_id: editTarget.unitId,
        current_stock: editTarget.currentStock,
        reorder_point: editTarget.reorderPoint,
        max_stock: editTarget.maxStock ?? undefined,
        cost_per_unit: editTarget.costPerUnit,
        supplier: editTarget.supplier,
      });
    } else {
      form.resetFields();
    }
  }, [open, editTarget, form]);

  // เมื่อเลือกหมวดหมู่หรือพิมพ์ชื่อวัตถุดิบ ระบบล็อกและเลือกหน่วยนับที่ตรงกับหมวดหมู่อัตโนมัติ
  useEffect(() => {
    if (!open || !watchedCategoryId || unitLocked) return;
    const currentUnitId = form.getFieldValue("unit_id");
    const isCurrentValid = !!currentUnitId && allowedUnits.some((u) => u._id === currentUnitId);
    if (!isCurrentValid && defaultUnitId) {
      form.setFieldValue("unit_id", defaultUnitId);
    }
  }, [open, watchedCategoryId, allowedUnits, defaultUnitId, form, unitLocked]);

  // ถ้าเปลี่ยนมาเป็นหน่วยนับที่ต้องเป็นจำนวนเต็ม (เช่น ฟอง, ชิ้น, กล่อง) ให้ปัดค่าทศนิยมที่ค้างอยู่ในช่องปริมาณเป็นจำนวนเต็ม
  useEffect(() => {
    if (!open || !isIntUnit) return;
    for (const field of ["reorder_point", "current_stock", "max_stock"] as const) {
      const val = form.getFieldValue(field);
      if (typeof val === "number" && !Number.isInteger(val)) {
        form.setFieldValue(field, Math.round(val));
      }
    }
  }, [open, isIntUnit, form]);

  const maxStockRule: Rule = ({ getFieldValue }) => ({
    validator(_, v) {
      if (v == null) return Promise.resolve();
      const reorder = getFieldValue("reorder_point");
      if (reorder != null && Number(v) < Number(reorder)) {
        return Promise.reject(new Error(t("ingredients.maxLtReorder")));
      }
      const current = getFieldValue("current_stock");
      if (current != null && Number(v) < Number(current)) {
        return Promise.reject(new Error(t("ingredients.maxLtCurrent")));
      }
      return Promise.resolve();
    },
  });

  const handleOk = async () => {
    const v = await form.validateFields();
    onSave({
      ingredient_name: v.ingredient_name.trim(),
      ingredient_category_id: v.ingredient_category_id,
      unit_id: v.unit_id,
      current_stock: v.current_stock ?? 0,
      reorder_point: v.reorder_point,
      // ว่าง = null (ล้างเพดาน) — ไม่ส่ง key = คงค่าเดิม ลบออกไม่ได้ · backend schemas/inventory.ts รับ nullish
      max_stock: v.max_stock ?? null,
      cost_per_unit: v.cost_per_unit ?? 0,
      supplier: (v.supplier ?? "").trim(),
    });
  };

  return (
    <Modal
      open={open}
      title={editTarget ? t("ingredients.editTitle", { name: editTarget.name }) : t("ingredients.addTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons(editTarget ? "save" : "add")}
      okText={editTarget ? t("common.save") : t("ingredients.addIngredient")}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <FormItem
          name="ingredient_name"
          label={t("ingredients.fieldName")}
          rules={[{ required: true, whitespace: true, message: t("validation.required") }]}
        >
          <Input maxLength={120} placeholder={t("ingredients.namePlaceholder")} />
        </FormItem>

        <div className="grid grid-cols-2 gap-3">
          <FormItem
            name="ingredient_category_id"
            label={t("ingredients.fieldCategory")}
            rules={[{ required: true, whitespace: true, message: t("validation.required") }]}
          >
            <Select
              options={sortOptionsThai(categories.map((c) => ({ value: c._id, label: c.ingredient_category_name })))}
              placeholder={t("ingredients.selectCategory")}
            />
          </FormItem>
          <FormItem
            name="unit_id"
            label={t("ingredients.fieldUnit")}
            rules={[{ required: true, whitespace: true, message: t("validation.required") }]}
            extra={unitLocked ? t("ingredients.unitLockedHint") : undefined}
          >
            <Select
              disabled={unitLocked || !watchedCategoryId || allowedUnits.length <= 1}
              options={sortOptionsThai(
                allowedUnits.map((u) => ({ value: u._id, label: `${u.unit_name} (${u.unit_abbr})` })),
              )}
              placeholder={watchedCategoryId ? t("ingredients.selectUnit") : t("ingredients.selectCategoryFirst")}
            />
          </FormItem>
        </div>

        {/* ป้าย "เกณฑ์แจ้งเตือนวัตถุดิบขั้นต่ำ" ยาว — แยกเป็นแถวเต็มเอง ช่องปริมาณปัจจุบัน/สูงสุดในแถวเดียวกันจึงตรงกัน */}
        <FormItem
          name="reorder_point"
          label={t("ingredients.fieldReorderPoint")}
          tooltip={t("ingredients.fieldReorderPointHint")}
          rules={[
            { required: true, message: t("validation.required") },
            {
              type: isIntUnit ? "integer" : "number",
              min: 0,
              message: t(isIntUnit ? "ingredients.integerUnitOnly" : "validation.nonNegative"),
            },
          ]}
        >
          <InputNumber
            min={0}
            precision={isIntUnit ? 0 : 2}
            step={1}
            parser={isIntUnit ? integerParser : numericParser}
            onKeyDown={isIntUnit ? blockIntegerKeyDown : blockNegativeKeyDown}
            onPaste={isIntUnit ? blockNonIntegerPaste : blockNonNumericPaste}
            suffix={unitSuffix}
          />
        </FormItem>
        <div className="grid grid-cols-2 gap-3">
          <FormItem
            name="current_stock"
            label={t("ingredients.fieldCurrentStock")}
            extra={editTarget ? t("ingredients.stockEditHint") : undefined}
            rules={[
              {
                type: isIntUnit ? "integer" : "number",
                min: 0,
                message: t(isIntUnit ? "ingredients.integerUnitOnly" : "validation.nonNegative"),
              },
              // เพดานรวมเฉพาะตอนสร้าง — ตอนแก้ไขช่องปิดอยู่ ยอดเดิมที่เกิน (ข้อมูลเก่า) ต้องไม่กันการบันทึกช่องอื่น
              ...(editTarget ? [] : [{ type: "number" as const, max: INGREDIENT_STOCK_MAX, message: t("validation.maxValue", { max: formatNumber(INGREDIENT_STOCK_MAX, locale) }) }]),
            ]}
          >
            <InputNumber
              min={0}
              precision={isIntUnit ? 0 : 2}
              step={1}
              parser={isIntUnit ? integerParser : numericParser}
              onKeyDown={isIntUnit ? blockIntegerKeyDown : blockNegativeKeyDown}
              onPaste={isIntUnit ? blockNonIntegerPaste : blockNonNumericPaste}
              disabled={!!editTarget}
              suffix={unitSuffix}
            />
          </FormItem>
          <FormItem
            name="max_stock"
            label={t("ingredients.fieldMaxStock")}
            dependencies={["reorder_point", "current_stock"]}
            rules={[
              {
                type: isIntUnit ? "integer" : "number",
                min: isIntUnit ? 1 : 0.01,
                message: t(isIntUnit ? "ingredients.integerUnitOnly" : "validation.positive"),
              },
              maxStockRule,
            ]}
          >
            <InputNumber
              min={0}
              precision={isIntUnit ? 0 : 2}
              step={1}
              parser={isIntUnit ? integerParser : numericParser}
              onKeyDown={isIntUnit ? blockIntegerKeyDown : blockNegativeKeyDown}
              onPaste={isIntUnit ? blockNonIntegerPaste : blockNonNumericPaste}
              suffix={unitSuffix}
            />
          </FormItem>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormItem
            name="cost_per_unit"
            label={t("ingredients.fieldCostPerUnit")}
            rules={[
              { required: true, message: t("validation.required") },
              { type: "number", min: 0, message: t("validation.nonNegative") },
            ]}
          >
            <InputNumber
              min={0}
              precision={2}
              step={0.01}
              parser={numericParser}
              onKeyDown={blockNegativeKeyDown}
              onPaste={blockNonNumericPaste}
            />
          </FormItem>
          <FormItem name="supplier" label={t("ingredients.fieldSupplier")}>
            <Input maxLength={200} placeholder={t("ingredients.supplierPlaceholder")} />
          </FormItem>
        </div>
      </Form>
    </Modal>
  );
}
