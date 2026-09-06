"use client";
// สร้าง/แก้ไขสูตรส่วนประกอบ (sub-recipe) — antd Modal + base/Form
// ingredients/steps เป็น state ในตัว (คล้าย ProductionOrderFormModal) — ต่างจากตัวนั้นตรงมีโหมดแก้ไข
// ด้วย (editTarget เปลี่ยนได้) จึงต้องพึ่ง parent ส่ง `key={editTarget?._id ?? "new"}` มาบังคับ remount
// ทุกครั้งที่เปลี่ยนเป้าหมาย — ให้ useState อ่านค่าเริ่มต้นถูกชุดเสมอ (แทน useEffect(open) ที่ผิด
// react-compiler's set-state-in-effect และไม่ต่างจาก key ทั้งที่ซับซ้อนกว่า)
import { useState } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Form, FormItem, useAntForm, Input, TextArea, InputNumber, Select, Divider } from "@/components/base";
import { alert } from "@/lib/alert";
import { RECIPE_CATEGORIES } from "@/constants/enumConfig";
import type { RecipeComponent } from "@/types/recipeComponent";
import type { RecipeIngredientLine, RecipeStep } from "@/types/recipeShared";
import type { ComponentFormValue } from "../componentForm";
import { emptyComponentForm, fromComponent } from "../componentForm";
import { IngredientEditor, type IngredientOption } from "./IngredientEditor";
import { StepEditor } from "./StepEditor";

export interface ComponentSubmitValue extends ComponentFormValue {
  ingredients: RecipeIngredientLine[];
  steps: RecipeStep[];
}

export function ComponentFormModal({
  open,
  editTarget,
  ingredientOptions,
  yieldUnitOptions,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editTarget: RecipeComponent | null;
  ingredientOptions: IngredientOption[];
  yieldUnitOptions: { value: string; label: string }[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: ComponentSubmitValue) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<ComponentFormValue>();
  const [ingredients, setIngredients] = useState<RecipeIngredientLine[]>(editTarget?.ingredients ?? []);
  const [steps, setSteps] = useState<RecipeStep[]>(editTarget?.steps ?? []);

  const handleOk = async () => {
    const v = await form.validateFields();
    if (ingredients.some((i) => !i.ingredient_id)) {
      alert.error(t("recipes.ingredientRequired"));
      return;
    }
    onSubmit({ ...v, note: v.note?.trim() || undefined, ingredients, steps });
  };

  return (
    <Modal
      open={open}
      title={editTarget ? t("recipes.editComponentTitle", { name: editTarget.component_name }) : t("recipes.addComponentTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={editTarget ? t("common.save") : t("recipes.addComponent")}
      cancelText={t("common.cancel")}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={editTarget ? fromComponent(editTarget) : emptyComponentForm}>
        <div className="grid grid-cols-2 gap-3">
          <FormItem name="component_name" label={t("recipes.fieldComponentName")} rules={[{ required: true, message: t("validation.required") }]}>
            <Input placeholder={t("recipes.componentNamePlaceholder")} />
          </FormItem>
          <FormItem name="category" label={t("recipes.fieldCategory")} rules={[{ required: true, message: t("validation.required") }]}>
            <Select options={RECIPE_CATEGORIES.map((c) => ({ value: c, label: t(`enums.recipeCategory.${c}`) }))} />
          </FormItem>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormItem name="yield_qty" label={t("recipes.fieldYieldQty")}>
            <InputNumber min={0} />
          </FormItem>
          <FormItem name="yield_unit_id" label={t("recipes.fieldYieldUnit")} rules={[{ required: true, message: t("validation.required") }]}>
            <Select options={yieldUnitOptions} placeholder={t("recipes.selectUnit")} />
          </FormItem>
          <FormItem name="estimated_cost_per_batch" label={t("recipes.fieldCost")}>
            <InputNumber min={0} step={0.01} />
          </FormItem>
        </div>

        <Divider />
        <p className="mb-3 text-sm font-semibold text-gray-500">{t("recipes.ingredientsTitle")}</p>
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
