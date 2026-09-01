"use client";
// ─────────────────────────────────────────────────────────────
// AdjustStockModal — ปรับยอดสต็อกสินค้าเป็นค่าใหม่ (ตั้งค่า ไม่ใช่ +/-)
// state: antd Form + submitting ครอบโดย VM (saving) — modal แค่ validate แล้วยิง onSave
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Form, FormItem, useAntForm, InputNumber } from "@/components/base";
import { formatNumber } from "@/i18n/format";
import type { StockProductRow } from "../useProductStockViewModel";

export function AdjustStockModal({
  target,
  saving,
  onClose,
  onSave,
}: {
  target: StockProductRow | null;
  saving: boolean;
  onClose: () => void;
  onSave: (id: string, qty: number) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [form] = useAntForm();

  useEffect(() => {
    if (target) form.setFieldsValue({ qty: target.stock });
  }, [target, form]);

  const handleOk = async () => {
    if (!target) return;
    const { qty } = await form.validateFields();
    onSave(target._id, qty);
  };

  return (
    <Modal
      open={!!target}
      title={target ? t("productStock.adjustTitle", { name: target.name }) : ""}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      {target && (
        <>
          <p className="mb-3 text-sm text-gray-600">
            {t("productStock.adjustHint", {
              qty: formatNumber(target.stock, locale),
              unit: target.unit,
            })}
          </p>
          <Form form={form} layout="vertical">
            <FormItem
              name="qty"
              label={t("productStock.adjustNewQty", { unit: target.unit })}
              rules={[{ required: true, message: t("validation.required") }]}
            >
              <InputNumber min={0} />
            </FormItem>
          </Form>
        </>
      )}
    </Modal>
  );
}
