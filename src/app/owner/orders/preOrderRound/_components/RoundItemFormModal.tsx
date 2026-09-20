"use client";
// เพิ่ม/แก้สินค้าในรอบพรีออเดอร์ — item === null คือโหมดเพิ่ม (เลือกสินค้าได้), มีค่าคือโหมดแก้ (ล็อก
// สินค้า แก้ได้แค่ราคา/โควตา/เปิด-ปิดการขาย — backend ไม่รับ product_id ตอน PATCH)
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Form, FormItem, useAntForm, InputNumber, Select, Switch } from "@/components/base";
import type { Product } from "@/types/product";
import type { PreorderRound, PreorderRoundItem, RoundItemInput } from "@/types/preorderRound";

interface FormValues {
  product_id: string;
  price_override?: number | null;
  min_order_qty: number;
  max_qty_total: number;
  is_active: boolean;
}

export function RoundItemFormModal({
  open,
  round,
  item,
  products,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  round: PreorderRound;
  item: PreorderRoundItem | null;
  products: Product[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: RoundItemInput) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<FormValues>();
  const isEdit = !!item;

  useEffect(() => {
    if (!open) return;
    if (item) {
      form.setFieldsValue({
        product_id: item.product_id,
        price_override: item.price_override,
        min_order_qty: item.min_order_qty,
        max_qty_total: item.max_qty_total,
        is_active: item.is_active,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ min_order_qty: 1, max_qty_total: 10, is_active: true });
    }
  }, [open, item, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    onSubmit({
      product_id: v.product_id,
      price_override: v.price_override ?? null,
      min_order_qty: v.min_order_qty,
      max_qty_total: v.max_qty_total,
      is_active: v.is_active,
    });
  };

  const usedProductIds = new Set((round.items ?? []).map((it) => it.product_id));

  return (
    <Modal
      open={open}
      title={isEdit ? t("preorderRound.editItemTitle") : t("preorderRound.addItemTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      width={480}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <FormItem
          name="product_id"
          label={t("preorderRound.colProduct")}
          rules={[{ required: true, message: t("validation.required") }]}
        >
          <Select
            disabled={isEdit}
            showSearch
            optionFilterProp="label"
            placeholder={t("preorderRound.selectProduct")}
            options={products.map((p) => ({
              value: p._id,
              label: p.product_name_th,
              disabled: !isEdit && usedProductIds.has(p._id),
            }))}
          />
        </FormItem>
        <FormItem name="price_override" label={t("preorderRound.fieldPriceOverride")} help={t("preorderRound.priceOverrideHint")}>
          <InputNumber className="!w-full" min={0} placeholder={t("preorderRound.priceOverridePlaceholder")} />
        </FormItem>
        <div className="grid grid-cols-2 gap-3">
          <FormItem
            name="min_order_qty"
            label={t("preorderRound.fieldMinOrderQty")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <InputNumber className="!w-full" min={1} />
          </FormItem>
          <FormItem
            name="max_qty_total"
            label={t("preorderRound.fieldMaxQtyTotal")}
            rules={[{ required: true, message: t("validation.required") }]}
          >
            <InputNumber className="!w-full" min={Math.max(1, item?.current_qty ?? 1)} />
          </FormItem>
        </div>
        {isEdit && (
          <FormItem name="is_active" label={t("preorderRound.fieldIsActive")} valuePropName="checked">
            <Switch />
          </FormItem>
        )}
      </Form>
    </Modal>
  );
}
