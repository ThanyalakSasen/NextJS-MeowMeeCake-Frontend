"use client";
// ─────────────────────────────────────────────────────────────
// StockActionModal — modal เดียว 3 โหมด (แบบเดียวกับหน้าสต็อกวัตถุดิบ)
//   รับเข้า (receive) = +จำนวน · เบิกใช้ (use) = −จำนวน · ปรับยอด (adjust) = ตั้งยอดใหม่ตามที่นับได้
// state: antd Form + submitting ครอบโดย VM (saving) — modal แค่ validate แล้วยิง onSubmit
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Form, FormItem, useAntForm, InputNumber, Input } from "@/components/base";
import { formatNumber } from "@/i18n/format";
import { modalButtonIcons } from "@/components/shared/actions";
import { PRODUCT_STOCK_MAX } from "@/components/shared/stock";
import type { StockActionMode, StockProductRow } from "../useProductStockViewModel";

export function StockActionModal({
  target,
  mode,
  saving,
  onClose,
  onSubmit,
}: {
  target: StockProductRow | null;
  mode: StockActionMode;
  saving: boolean;
  onClose: () => void;
  onSubmit: (value: number, note: string) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [form] = useAntForm<{ value: number; note?: string }>();

  useEffect(() => {
    if (!target) return;
    // ปรับยอด: เริ่มที่ยอดปัจจุบัน (ผู้ใช้กรอกยอดที่นับได้) · รับเข้า/เบิกใช้: เริ่มว่าง
    form.resetFields();
    if (mode === "adjust") form.setFieldsValue({ value: target.stock });
  }, [target, mode, form]);

  const handleOk = async () => {
    if (!target) return;
    const { value, note } = await form.validateFields();
    onSubmit(value, note ?? "");
  };

  return (
    <Modal
      open={!!target}
      title={target ? t(`productStock.title_${mode}`, { name: target.name }) : ""}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons(mode)}
      okText={t(`productStock.ok_${mode}`)}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      {target && (
        <>
          <p className="mb-3 rounded-lg bg-brown-50 px-3 py-2 text-sm text-gray-700">
            {t("productStock.currentStock", { qty: formatNumber(target.stock, locale), unit: target.unit })}
          </p>
          <p className="mb-3 text-sm text-gray-600">{t(`productStock.hint_${mode}`)}</p>
          <Form form={form} layout="vertical">
            <FormItem
              name="value"
              label={t(mode === "adjust" ? "productStock.newStockLabel" : "productStock.qtyLabel", { unit: target.unit })}
              rules={[
                { required: true, whitespace: true, message: t("validation.required") },
                { type: "number", max: PRODUCT_STOCK_MAX, message: t("validation.maxValue", { max: formatNumber(PRODUCT_STOCK_MAX, locale) }) },
                // เบิกเกินที่มี backend ปฏิเสธอยู่แล้ว — บอกก่อนส่ง
                ...(mode === "use"
                  ? [{ type: "number" as const, max: target.stock, message: t("productStock.useExceeds", { qty: target.stock, unit: target.unit }) }]
                  : []),
              ]}
            >
              <InputNumber min={mode === "adjust" ? 0 : 1} precision={0} />
            </FormItem>
            {/* เก็บในประวัติสต็อกสินค้า (หน้า productHistory) + บันทึกการทำงาน */}
            <FormItem name="note" label={t("productStock.noteLabel")}>
              <Input maxLength={200} placeholder={t("productStock.notePlaceholder")} />
            </FormItem>
          </Form>
        </>
      )}
    </Modal>
  );
}
