"use client";
// เพิ่ม/แก้ไขหน่วยนับ — antd Modal + base/Form + checkbox "ใช้กับ วัตถุดิบ / สินค้า"
import { useEffect } from "react";
import { Modal, Checkbox } from "antd";
import { useTranslations } from "next-intl";
import { Form, FormItem, useAntForm, Input, Select } from "@/components/base";
import { UNIT_TYPES } from "@/utils/unitContext";
import { isIngredientUnit, isProductUnit } from "@/utils/unitContext";
import type { Unit } from "@/types/unit";
import type { UnitContext, UnitFormValues } from "../useUnitsViewModel";

export function UnitFormModal({
  open,
  editTarget,
  defaultContext,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editTarget: Unit | null;
  defaultContext: UnitContext;
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: UnitFormValues) => void;
}) {
  const t = useTranslations();
  const tUnitType = useTranslations("enums.unitType");
  const [form] = useAntForm<UnitFormValues>();

  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      form.setFieldsValue({
        unit_name: editTarget.unit_name,
        unit_abbr: editTarget.unit_abbr,
        unit_type: editTarget.unit_type,
        forIngredient: isIngredientUnit(editTarget.usage_context),
        forProduct: isProductUnit(editTarget.usage_context),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        forIngredient: defaultContext === "ingredient",
        forProduct: defaultContext === "product",
      });
    }
  }, [open, editTarget, defaultContext, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    onSubmit(v);
  };

  return (
    <Modal
      open={open}
      title={editTarget ? t("units.editTitle", { name: editTarget.unit_name }) : t("units.addTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={editTarget ? t("common.save") : t("units.addUnit")}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <div className="grid grid-cols-2 gap-3">
          <FormItem
            name="unit_name"
            label={t("units.fieldName")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input placeholder={t("units.namePlaceholder")} />
          </FormItem>
          <FormItem
            name="unit_abbr"
            label={t("units.fieldAbbr")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <Input placeholder={t("units.abbrPlaceholder")} />
          </FormItem>
        </div>

        <FormItem
          name="unit_type"
          label={t("units.fieldType")}
          rules={[{ required: true, message: t("validation.required") }]}
        >
          <Select
            placeholder={t("units.selectType")}
            options={UNIT_TYPES.map((ut) => ({ value: ut, label: tUnitType(ut) }))}
          />
        </FormItem>

        <FormItem label={t("units.fieldUsedWith")} required>
          <div className="flex flex-col gap-1.5">
            <FormItem name="forIngredient" valuePropName="checked" noStyle>
              <Checkbox>{t("units.forIngredient")}</Checkbox>
            </FormItem>
            <FormItem name="forProduct" valuePropName="checked" noStyle>
              <Checkbox>{t("units.forProduct")}</Checkbox>
            </FormItem>
          </div>
        </FormItem>
      </Form>
    </Modal>
  );
}
