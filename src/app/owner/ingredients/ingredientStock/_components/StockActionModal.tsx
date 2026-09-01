"use client";
// modal เดียวจัดการ 3 โหมด: รับเข้า (receive) / เบิกใช้ (use) / ปรับยอด (adjust)
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Form, FormItem, useAntForm, InputNumber, Input } from "@/components/base";
import { formatNumber } from "@/i18n/format";
import type { ActionMode, StockRow } from "../useIngredientStockViewModel";

interface FormValues {
  value: number;
  note?: string;
}

export function StockActionModal({
  target,
  mode,
  saving,
  onClose,
  onSubmit,
}: {
  target: StockRow | null;
  mode: ActionMode;
  saving: boolean;
  onClose: () => void;
  onSubmit: (value: number, note: string) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [form] = useAntForm<FormValues>();

  useEffect(() => {
    if (!target) return;
    // adjust: เริ่มที่ค่าปัจจุบัน (ผู้ใช้กรอกยอดใหม่) · receive/use: เริ่มว่าง
    form.resetFields();
    if (mode === "adjust") form.setFieldsValue({ value: target.currentStock });
  }, [target, mode, form]);

  const handleOk = async () => {
    if (!target) return;
    const { value, note } = await form.validateFields();
    onSubmit(value, note ?? "");
  };

  const valueLabel =
    mode === "adjust"
      ? t("ingredientStock.newStockLabel", { unit: target?.unitAbbr ?? "" })
      : t("ingredientStock.qtyLabel", { unit: target?.unitAbbr ?? "" });

  return (
    <Modal
      open={!!target}
      title={target ? t(`ingredientStock.title_${mode}`, { name: target.name }) : ""}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={t(`ingredientStock.ok_${mode}`)}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      {target && (
        <>
          <p className="mb-3 rounded-lg bg-brown-50 px-3 py-2 text-sm text-gray-700">
            {t("ingredientStock.currentStock", {
              qty: formatNumber(target.currentStock, locale),
              unit: target.unitAbbr,
            })}
          </p>
          <Form form={form} layout="vertical">
            <FormItem
              name="value"
              label={valueLabel}
              rules={[{ required: true, message: t("validation.required") }]}
            >
              <InputNumber min={mode === "adjust" ? 0 : 0.01} step={1} />
            </FormItem>
            <FormItem name="note" label={t("ingredientStock.noteLabel")}>
              <Input placeholder={t("ingredientStock.notePlaceholder")} />
            </FormItem>
          </Form>
        </>
      )}
    </Modal>
  );
}
