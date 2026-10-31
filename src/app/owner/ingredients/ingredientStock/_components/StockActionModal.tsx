"use client";
// modal เดียวจัดการ 3 โหมด: รับเข้า (receive) / เบิกใช้ (use) / ปรับยอด (adjust)
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Form, FormItem, useAntForm, useFormValid, InputNumber, Input } from "@/components/base";
import { formatNumber } from "@/i18n/format";
import { modalButtonIcons } from "@/components/shared/actions";
import { INGREDIENT_STOCK_MAX } from "@/components/shared/stock";
import {
  blockIntegerKeyDown,
  blockNegativeKeyDown,
  blockNonIntegerPaste,
  blockNonNumericPaste,
  integerParser,
  isIntegerOnlyUnit,
  numericParser,
} from "@/constants/ingredientCategoryUnits";
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
  // ปุ่มบันทึกกดได้เมื่อทุกช่องผ่าน rules (required + รูปแบบ) — ผู้ใช้ขอ 2026-10-31
  const valid = useFormValid(form);

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
  const isIntUnit = isIntegerOnlyUnit(target?.unitAbbr);

  return (
    <Modal
      open={!!target}
      title={target ? t(`ingredientStock.title_${mode}`, { name: target.name }) : ""}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons(mode)}
      okButtonProps={{ ...modalButtonIcons(mode).okButtonProps, disabled: !valid }}
      okText={t(`ingredientStock.ok_${mode}`)}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      {target && (
        <>
          <p className="mb-3 rounded-lg bg-brown-50 px-3 py-2 text-sm text-gray-700">
            {target.maxStock != null && target.maxStock > 0
              ? t("ingredientStock.currentStockWithMax", {
                  qty: formatNumber(target.currentStock, locale),
                  max: formatNumber(target.maxStock, locale),
                  unit: target.unitAbbr,
                })
              : t("ingredientStock.currentStock", {
                  qty: formatNumber(target.currentStock, locale),
                  unit: target.unitAbbr,
                })}
          </p>
          <p className="mb-3 text-sm text-gray-600">{t(`ingredientStock.hint_${mode}`)}</p>
          <Form form={form} layout="vertical">
            <FormItem
              name="value"
              label={valueLabel}
              rules={[
                { required: true, message: t("validation.required") },
                {
                  type: isIntUnit ? "integer" : "number",
                  min: mode === "adjust" ? 0 : isIntUnit ? 1 : 0.01,
                  message: t(
                    isIntUnit
                      ? "ingredients.integerUnitOnly"
                      : mode === "adjust"
                        ? "validation.nonNegative"
                        : "validation.positive",
                  ),
                },
                ...(mode === "use"
                  ? [
                      {
                        type: "number" as const,
                        max: target.currentStock,
                        message: t("ingredientStock.useExceeds", {
                          qty: formatNumber(target.currentStock, locale),
                          unit: target.unitAbbr,
                        }),
                      },
                    ]
                  : []),
                ...(mode === "receive" && target.maxStock != null && target.maxStock > 0
                  ? [
                      {
                        type: "number" as const,
                        max: Math.max(0, Number((target.maxStock - target.currentStock).toFixed(isIntUnit ? 0 : 2))),
                        message: t("ingredientStock.receiveExceedsMax", {
                          max: formatNumber(target.maxStock, locale),
                          remain: formatNumber(Math.max(0, target.maxStock - target.currentStock), locale),
                          unit: target.unitAbbr,
                        }),
                      },
                    ]
                  : []),
                ...(mode === "adjust" && target.maxStock != null && target.maxStock > 0
                  ? [
                      {
                        type: "number" as const,
                        max: target.maxStock,
                        message: t("ingredientStock.adjustExceedsMax", {
                          max: formatNumber(target.maxStock, locale),
                          unit: target.unitAbbr,
                        }),
                      },
                    ]
                  : []),
                // เพดานรวม (วัตถุดิบที่ไม่ได้ตั้ง max_stock ก็ไม่เกินนี้) — stockLimits.ts
                { type: "number", max: INGREDIENT_STOCK_MAX, message: t("validation.maxValue", { max: formatNumber(INGREDIENT_STOCK_MAX, locale) }) },
              ]}
            >
              <InputNumber
                min={mode === "adjust" ? 0 : isIntUnit ? 1 : 0.01}
                precision={isIntUnit ? 0 : 2}
                step={1}
                parser={isIntUnit ? integerParser : numericParser}
                onKeyDown={isIntUnit ? blockIntegerKeyDown : blockNegativeKeyDown}
                onPaste={isIntUnit ? blockNonIntegerPaste : blockNonNumericPaste}
              />
            </FormItem>
            <FormItem name="note" label={t("ingredientStock.noteLabel")}>
              <Input maxLength={200} placeholder={t("ingredientStock.notePlaceholder")} />
            </FormItem>
          </Form>
        </>
      )}
    </Modal>
  );
}
