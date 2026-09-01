"use client";
// เพิ่ม/แก้ไขวัตถุดิบ — antd Modal + base/Form
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Form, FormItem, useAntForm, Input, InputNumber, Select } from "@/components/base";
import type { IngredientInput } from "@/types/ingredient";
import type { IngredientCategory } from "@/types/ingredientCategory";
import type { Unit } from "@/types/unit";
import type { IngredientRow } from "../useIngredientsViewModel";

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
  const [form] = useAntForm<FormValues>();

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

  const handleOk = async () => {
    const v = await form.validateFields();
    onSave({
      ingredient_name: v.ingredient_name,
      ingredient_category_id: v.ingredient_category_id,
      unit_id: v.unit_id,
      current_stock: v.current_stock ?? 0,
      reorder_point: v.reorder_point,
      max_stock: v.max_stock ?? null,
      cost_per_unit: v.cost_per_unit ?? 0,
      supplier: v.supplier ?? "",
    });
  };

  return (
    <Modal
      open={open}
      title={editTarget ? t("ingredients.editTitle", { name: editTarget.name }) : t("ingredients.addTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={editTarget ? t("common.save") : t("ingredients.addIngredient")}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <FormItem
          name="ingredient_name"
          label={t("ingredients.fieldName")}
          rules={[{ required: true, message: t("validation.required") }]}
        >
          <Input placeholder={t("ingredients.namePlaceholder")} />
        </FormItem>

        <div className="grid grid-cols-2 gap-3">
          <FormItem
            name="ingredient_category_id"
            label={t("ingredients.fieldCategory")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Select
              options={categories.map((c) => ({ value: c._id, label: c.category_name }))}
              placeholder={t("ingredients.selectCategory")}
            />
          </FormItem>
          <FormItem
            name="unit_id"
            label={t("ingredients.fieldUnit")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Select
              options={units.map((u) => ({ value: u._id, label: `${u.unit_name} (${u.unit_abbr})` }))}
              placeholder={t("ingredients.selectUnit")}
            />
          </FormItem>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormItem name="current_stock" label={t("ingredients.fieldCurrentStock")}>
            <InputNumber min={0} />
          </FormItem>
          <FormItem
            name="reorder_point"
            label={t("ingredients.fieldReorderPoint")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <InputNumber min={0} />
          </FormItem>
          <FormItem name="max_stock" label={t("ingredients.fieldMaxStock")}>
            <InputNumber min={0} />
          </FormItem>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormItem name="cost_per_unit" label={t("ingredients.fieldCostPerUnit")}>
            <InputNumber min={0} step={0.01} />
          </FormItem>
          <FormItem name="supplier" label={t("ingredients.fieldSupplier")}>
            <Input placeholder={t("ingredients.supplierPlaceholder")} />
          </FormItem>
        </div>
      </Form>
    </Modal>
  );
}
