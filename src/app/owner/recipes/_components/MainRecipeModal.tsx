"use client";
// สร้าง/แก้ไขสูตรหลัก (ผูกกับสินค้า) — antd Modal + base/Form
// components (สูตรส่วนประกอบที่ใช้)/ingredients/steps เป็น state ในตัว — parent ต้องส่ง
// `key={editTarget?._id ?? "new"}` มาบังคับ remount ทุกครั้งที่เปลี่ยนเป้าหมาย (ดูเหตุผลเต็มใน ComponentFormModal)
import { useState } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Form, FormItem, useAntForm, Input, TextArea, InputNumber, Select, Divider, Button } from "@/components/base";
import { alert } from "@/lib/alert";
import type { Recipe, RecipeComponentRef } from "@/types/recipe";
import type { RecipeIngredientLine, RecipeStep } from "@/types/recipeShared";
import type { ProductKind } from "@/types/product";
import { actionIcon, modalButtonIcons } from "@/components/shared/actions";
import type { RecipeFormValue } from "../recipeForm";
import { emptyRecipeForm, fromRecipe } from "../recipeForm";
import { IngredientEditor, hasQty, type EditableIngredientLine, type IngredientOption } from "./IngredientEditor";
import { StepEditor } from "./StepEditor";

// หัวคอลัมน์ + ทุกแถวของสูตรย่อยใช้ชุดเดียวกัน · minmax(0, …) กันคอลัมน์ขยายตามชื่อสูตรยาว (ช่องจำนวนเยื้อง)
// จำนวน 110px ให้พอทั้งตัวเลขและคำว่า "ชุด" (suffix) — เท่ากับช่องจำนวนของวัตถุดิบ (IngredientEditor)
const COMPONENT_COLUMNS = "minmax(0, 1fr) 110px 24px";

/** quantity null = ช่องว่างระหว่างพิมพ์ (เดิมเด้งเป็น 1 ทันที) — ตรวจ > 0 ตอนบันทึก */
type ComponentRow = Omit<RecipeComponentRef, "quantity"> & { quantity: number | null };

export interface RecipeSubmitValue extends RecipeFormValue {
  components: RecipeComponentRef[];
  ingredients: RecipeIngredientLine[];
  steps: RecipeStep[];
}

export function MainRecipeModal({
  open,
  editTarget,
  productOptions,
  componentOptions,
  ingredientOptions,
  yieldUnitOptions,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editTarget: Recipe | null;
  productOptions: { _id: string; name: string; type: ProductKind }[];
  componentOptions: { _id: string; name: string }[];
  ingredientOptions: IngredientOption[];
  yieldUnitOptions: { value: string; label: string }[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: RecipeSubmitValue) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<RecipeFormValue>();
  const [components, setComponents] = useState<ComponentRow[]>(editTarget?.components ?? []);
  const [ingredients, setIngredients] = useState<EditableIngredientLine[]>(editTarget?.ingredients ?? []);
  const [steps, setSteps] = useState<RecipeStep[]>(editTarget?.steps ?? []);

  const addComponentRef = () => setComponents((p) => [...p, { component_id: "", component_name: "", quantity: 1 }]);
  const removeComponentRef = (i: number) => setComponents((p) => p.filter((_, idx) => idx !== i));
  const updateComponentRef = (i: number, patch: Partial<ComponentRow>) =>
    setComponents((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const handleOk = async () => {
    const v = await form.validateFields();
    if (components.some((c) => !c.component_id) || ingredients.some((i) => !i.ingredient_id)) {
      alert.warning(t("recipes.ingredientRequired"));
      return;
    }
    if (!hasQty(components) || !hasQty(ingredients)) {
      alert.warning(t("recipes.qtyRequired"));
      return;
    }
    // ต้นทุนส่งไปเฉพาะเมื่อผู้ใช้กรอกเอง — ไม่แตะช่องนี้ = ให้ backend คำนวณจากวัตถุดิบใหม่ทุกครั้งที่บันทึก
    // (ตอนแก้ไขสูตรช่องนี้มีค่าเดิมอยู่ ถ้าส่งค่าเดิมกลับไป ต้นทุนจะไม่ตามวัตถุดิบที่เปลี่ยน)
    const cost = form.isFieldTouched("estimated_cost_per_batch") ? v.estimated_cost_per_batch : null;
    onSubmit({ ...v, estimated_cost_per_batch: cost, note: v.note?.trim() || undefined, components, ingredients, steps });
  };

  return (
    <Modal
      open={open}
      title={editTarget ? t("recipes.editRecipeTitle", { name: editTarget.recipe_name }) : t("recipes.addRecipeTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons(editTarget ? "save" : "add")}
      okText={editTarget ? t("common.save") : t("recipes.addRecipe")}
      cancelText={t("common.cancel")}
      width={640}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={editTarget ? fromRecipe(editTarget) : emptyRecipeForm}>
        <div className="grid grid-cols-2 gap-3">
          <FormItem name="recipe_name" label={t("recipes.fieldRecipeName")} rules={[{ required: true, whitespace: true, message: t("validation.required") }]}>
            <Input placeholder={t("recipes.recipeNamePlaceholder")} />
          </FormItem>
          <FormItem name="product_id" label={t("recipes.fieldProduct")} rules={[{ required: true, whitespace: true, message: t("validation.required") }]}>
            <Select
              disabled={!!editTarget}
              placeholder={t("recipes.selectProduct")}
              options={productOptions.map((p) => ({ value: p._id, label: p.name }))}
            />
          </FormItem>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* backend หารด้วยค่านี้ตอนหักวัตถุดิบ — ว่าง/0 = ปิดงานผลิตไม่ได้ (สูตรหลัก) หรือสูตรย่อยถูกข้ามไม่หักวัตถุดิบ */}
          <FormItem
            name="yield_qty"
            label={t("recipes.fieldYieldQty")}
            rules={[
              { required: true, whitespace: true, message: t("validation.required") },
              { type: "number", min: 0.01, message: t("validation.positive") },
            ]}
          >
            <InputNumber min={0} />
          </FormItem>
          <FormItem name="yield_unit_id" label={t("recipes.fieldYieldUnit")} rules={[{ required: true, whitespace: true, message: t("validation.required") }]}>
            <Select options={yieldUnitOptions} placeholder={t("recipes.selectUnit")} />
          </FormItem>
          <FormItem name="duration_minutes" label={t("recipes.fieldDuration")}>
            <InputNumber min={0} />
          </FormItem>
        </div>
        <FormItem name="estimated_cost_per_batch" label={t("recipes.fieldCost")} extra={t("recipes.costAutoHint")}>
          <InputNumber min={0} step={0.01} placeholder={t("recipes.costAuto")} />
        </FormItem>

        <Divider />
        <p className="mb-3 text-sm font-semibold text-gray-500">{t("recipes.componentsUsedTitle")}</p>
        <div className="flex flex-col gap-2">
          {components.length > 0 && (
            <div className="grid gap-2 text-xs text-gray-500" style={{ gridTemplateColumns: COMPONENT_COLUMNS }}>
              <span>{t("filterLabel.component")}</span>
              <span>{t("filterLabel.batches")}</span>
              <span />
            </div>
          )}
          {components.map((ref, i) => (
            <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: COMPONENT_COLUMNS }}>
              <Select
                size="small"
                aria-label={t("filterLabel.component")}
                placeholder={t("recipes.selectComponent")}
                value={ref.component_id || undefined}
                showSearch
                optionFilterProp="label"
                onChange={(v) => {
                  const comp = componentOptions.find((c) => c._id === v);
                  updateComponentRef(i, { component_id: v as string, component_name: comp?.name ?? "" });
                }}
                options={componentOptions.map((c) => ({
                  value: c._id,
                  label: c.name,
                  disabled: components.some((r, idx) => idx !== i && r.component_id === c._id),
                }))}
              />
              <InputNumber
                size="small"
                className="!w-full"
                min={1}
                aria-label={t("filterLabel.batches")}
                value={ref.quantity}
                status={ref.component_id && !ref.quantity ? "error" : undefined}
                onChange={(v) => updateComponentRef(i, { quantity: v == null ? null : Number(v) })}
                suffix={<span className="text-xs text-gray-500">{t("recipes.batch")}</span>}
              />
              <Button
                size="small" type="text" danger
                icon={<XMarkIcon className="h-3.5 w-3.5" />}
                onClick={() => removeComponentRef(i)}
                aria-label={t("common.delete")}
              />
            </div>
          ))}
          <Button size="small" icon={actionIcon("add", "small")} onClick={addComponentRef} className="self-start">
            {t("recipes.addComponentRef")}
          </Button>
        </div>

        <Divider />
        <p className="mb-3 text-sm font-semibold text-gray-500">{t("recipes.directIngredientsTitle")}</p>
        <IngredientEditor rows={ingredients} options={ingredientOptions} onChange={setIngredients} />

        <Divider />
        <p className="mb-3 text-sm font-semibold text-gray-500">{t("recipes.stepsTitle")}</p>
        <StepEditor steps={steps} onChange={setSteps} />

        <Divider />
        <FormItem name="note" label={t("recipes.fieldNote")}>
          <TextArea rows={2} placeholder={t("recipes.notePlaceholder")} />
        </FormItem>
      </Form>
    </Modal>
  );
}
