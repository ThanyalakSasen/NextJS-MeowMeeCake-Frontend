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
import type { RecipeComponent } from "@/types/recipeComponent";
import type { RecipeIngredientLine, RecipeStep } from "@/types/recipeShared";
import { modalButtonIcons } from "@/components/shared/actions";
import type { ComponentFormValue } from "../componentForm";
import { emptyComponentForm, fromComponent } from "../componentForm";
import { IngredientEditor, hasQty, wholeUnitsOk, type EditableIngredientLine, type IngredientOption } from "./IngredientEditor";
import { isIntegerOnlyUnit } from "@/constants/ingredientCategoryUnits";
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
  categoryOptions,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editTarget: RecipeComponent | null;
  ingredientOptions: IngredientOption[];
  yieldUnitOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: ComponentSubmitValue) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<ComponentFormValue>();
  // หน่วยของจำนวนที่ได้ต่อสูตรเป็นหน่วยนับ (ชิ้น/ถาด …) → จำนวนเต็มเท่านั้น
  const yieldUnitId = Form.useWatch("yield_unit_id", form);
  const yieldWhole = isIntegerOnlyUnit(yieldUnitOptions.find((o) => o.value === yieldUnitId)?.label);
  const [ingredients, setIngredients] = useState<EditableIngredientLine[]>(editTarget?.ingredients ?? []);
  const [steps, setSteps] = useState<RecipeStep[]>(editTarget?.steps ?? []);

  const handleOk = async () => {
    const v = await form.validateFields();
    if (ingredients.some((i) => !i.ingredient_id)) {
      alert.warning(t("recipes.ingredientRequired"));
      return;
    }
    if (!hasQty(ingredients)) {
      alert.warning(t("recipes.qtyRequired"));
      return;
    }
    if (!wholeUnitsOk(ingredients)) {
      alert.warning(t("recipes.wholeUnitRequired"));
      return;
    }
    // ต้นทุนส่งไปเฉพาะเมื่อผู้ใช้กรอกเอง — ไม่แตะช่องนี้ = ให้ backend คำนวณจากวัตถุดิบใหม่ทุกครั้งที่บันทึก
    // (ตอนแก้ไขสูตรช่องนี้มีค่าเดิมอยู่ ถ้าส่งค่าเดิมกลับไป ต้นทุนจะไม่ตามวัตถุดิบที่เปลี่ยน)
    const cost = form.isFieldTouched("estimated_cost_per_batch") ? v.estimated_cost_per_batch : null;
    onSubmit({ ...v, estimated_cost_per_batch: cost, note: v.note?.trim() || undefined, ingredients, steps });
  };

  return (
    <Modal
      open={open}
      title={editTarget ? t("recipes.editComponentTitle", { name: editTarget.component_name }) : t("recipes.addComponentTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons(editTarget ? "save" : "add")}
      okText={editTarget ? t("common.save") : t("recipes.addComponent")}
      cancelText={t("common.cancel")}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={editTarget ? fromComponent(editTarget) : emptyComponentForm}>
        <div className="grid grid-cols-2 gap-3">
          <FormItem name="component_name" label={t("recipes.fieldComponentName")} rules={[{ required: true, whitespace: true, message: t("validation.required") }]}>
            <Input placeholder={t("recipes.componentNamePlaceholder")} />
          </FormItem>
          <FormItem name="componentcategory_id" label={t("recipes.fieldCategory")} rules={[{ required: true, whitespace: true, message: t("validation.required") }]}>
            <Select options={categoryOptions} />
          </FormItem>
        </div>

        {/* ป้ายสั้นบรรทัดเดียวทั้งแถว ช่องกรอกจึงตรงกัน — ต้นทุนมีคำอธิบายยาว แยกเป็นแถวเต็มแบบฟอร์มสูตรหลัก */}
        <div className="grid grid-cols-2 gap-3">
          {/* backend หารด้วยค่านี้ตอนหักวัตถุดิบ — ว่าง/0 = ปิดงานผลิตไม่ได้ (สูตรหลัก) หรือสูตรย่อยถูกข้ามไม่หักวัตถุดิบ */}
          <FormItem
            name="yield_qty"
            label={t("recipes.fieldYieldQty")}
            rules={[
              { required: true, whitespace: true, message: t("validation.required") },
              { type: "number", min: 0.01, message: t("validation.positive") },
              ...(yieldWhole ? [{ type: "integer" as const, message: t("ingredients.integerUnitOnly") }] : []),
            ]}
          >
            <InputNumber min={0} {...(yieldWhole ? { precision: 0 } : {})} />
          </FormItem>
          <FormItem name="yield_unit_id" label={t("recipes.fieldYieldUnit")} rules={[{ required: true, whitespace: true, message: t("validation.required") }]}>
            <Select options={yieldUnitOptions} placeholder={t("recipes.selectUnit")} />
          </FormItem>
        </div>
        <FormItem name="estimated_cost_per_batch" label={t("recipes.fieldCost")} extra={t("recipes.costAutoHint")}>
          <InputNumber precision={0} min={0} placeholder={t("recipes.costAuto")} />
        </FormItem>

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
