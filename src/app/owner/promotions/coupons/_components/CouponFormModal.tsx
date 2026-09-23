"use client";
// เพิ่ม/แก้ไขคูปอง — antd Modal + base/Form
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Form, FormItem, useAntForm, Input, InputNumber, Select, Switch, RangePicker, Divider } from "@/components/base";
import type { Rule } from "antd/es/form";
import type { Promotion } from "@/types/promotion";
import { modalButtonIcons } from "@/components/shared/actions";
import { emptyCouponForm, fromPromotion, type CouponFormValue, type CouponScope } from "../couponForm";
import { SelectedItemsList } from "./SelectedItemsList";

export function CouponFormModal({
  open,
  editTarget,
  productOptions,
  categoryOptions,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editTarget: Promotion | null;
  productOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: CouponFormValue) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<CouponFormValue>();

  const scope: CouponScope = Form.useWatch("scope", form) ?? "all";
  const productIds: string[] = Form.useWatch("productIds", form) ?? [];
  const categoryIds: string[] = Form.useWatch("categoryIds", form) ?? [];

  const required: Rule[] = [{ required: true, message: t("validation.required") }];
  const percentMaxRule: Rule = ({ getFieldValue }) => ({
    validator(_, v) {
      if (getFieldValue("discountType") !== "Percentage" || v == null || v <= 100) return Promise.resolve();
      return Promise.reject(new Error(t("coupons.percentMax")));
    },
  });

  const handleOk = async () => {
    const v = await form.validateFields();
    onSubmit(v);
  };

  return (
    <Modal
      open={open}
      title={editTarget ? t("coupons.editTitle", { code: editTarget.promotion_code }) : t("coupons.addTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons(editTarget ? "save" : "add")}
      okText={editTarget ? t("common.save") : t("coupons.addCoupon")}
      cancelText={t("common.cancel")}
      width={480}
      destroyOnHidden
    >
      <Divider className="!my-3" />
      <Form
        form={form}
        layout="vertical"
        initialValues={editTarget ? fromPromotion(editTarget) : emptyCouponForm}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormItem name="code" label={t("coupons.fieldCode")} rules={required}>
            <Input placeholder={t("coupons.codePlaceholder")} className="font-mono uppercase tracking-widest" />
          </FormItem>
          <FormItem name="name" label={t("coupons.fieldName")} rules={required}>
            <Input placeholder={t("coupons.namePlaceholder")} />
          </FormItem>
        </div>

        <FormItem name="discountType" label={t("coupons.fieldDiscountType")} rules={required}>
          <Select
            options={[
              { value: "Percentage", label: t("enums.discountType.Percentage") },
              { value: "Amount", label: t("enums.discountType.Amount") },
              { value: "FreeShipping", label: t("enums.discountType.FreeShipping") },
            ]}
          />
        </FormItem>

        <div className="grid grid-cols-2 gap-3">
          <FormItem name="discountValue" label={t("coupons.fieldDiscountValue")} dependencies={["discountType"]} rules={[percentMaxRule]}>
            <InputNumber min={0} placeholder={t("coupons.discountValuePlaceholder")} />
          </FormItem>
          <FormItem name="minOrder" label={t("coupons.fieldMinOrder")}>
            <InputNumber min={0} placeholder={t("coupons.noMinimumPlaceholder")} />
          </FormItem>
        </div>

        <FormItem name="scope" label={t("coupons.fieldScope")} rules={required}>
          <Select
            options={[
              { value: "all", label: t("coupons.scopeAllOption") },
              { value: "category", label: t("coupons.scopeCategoryOption") },
              { value: "product", label: t("coupons.scopeProductOption") },
            ]}
          />
        </FormItem>

        {scope === "product" && (
          <>
            <FormItem
              name="productIds"
              label={t("coupons.fieldProducts")}
              extra={t("coupons.scopeHintMulti")}
              rules={[{ required: true, message: t("coupons.selectAtLeastOneProduct") }]}
            >
              <Select
                mode="multiple"
                placeholder={t("coupons.selectProductsPlaceholder")}
                options={productOptions}
                showSearch
                filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                tagRender={() => <></>}
              />
            </FormItem>
            <SelectedItemsList ids={productIds} options={productOptions} onRemove={(id) => form.setFieldValue("productIds", productIds.filter((x) => x !== id))} />
          </>
        )}

        {scope === "category" && (
          <>
            <FormItem
              name="categoryIds"
              label={t("coupons.fieldCategories")}
              extra={t("coupons.scopeHintMulti")}
              rules={[{ required: true, message: t("coupons.selectAtLeastOneCategory") }]}
            >
              <Select
                mode="multiple"
                placeholder={t("coupons.selectCategoriesPlaceholder")}
                options={categoryOptions}
                showSearch
                filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                tagRender={() => <></>}
              />
            </FormItem>
            <SelectedItemsList ids={categoryIds} options={categoryOptions} onRemove={(id) => form.setFieldValue("categoryIds", categoryIds.filter((x) => x !== id))} />
          </>
        )}

        {(scope === "product" || scope === "category") && (
          <FormItem name="minQuantity" label={t("coupons.fieldMinQuantity")} extra={t("coupons.minQuantityHint")}>
            <InputNumber min={0} placeholder={t("coupons.noMinimumPlaceholder")} />
          </FormItem>
        )}

        <FormItem label={t("coupons.fieldChannels")} required>
          <div className="flex items-center gap-5">
            <FormItem name="chInstore" valuePropName="checked" noStyle>
              <Switch />
            </FormItem>
            <span className="text-sm text-gray-600">{t("coupons.channelInstore")}</span>
            <FormItem name="chOnline" valuePropName="checked" noStyle>
              <Switch />
            </FormItem>
            <span className="text-sm text-gray-600">{t("coupons.channelOnline")}</span>
          </div>
        </FormItem>

        <FormItem name="dateRange" label={t("coupons.fieldDateRange")} extra={t("coupons.dateRangeHint")}>
          <RangePicker style={{ width: "100%" }} />
        </FormItem>

        <div className="grid grid-cols-2 gap-3">
          <FormItem name="usageLimit" label={t("coupons.fieldUsageLimit")}>
            <InputNumber min={0} placeholder={t("coupons.unlimitedPlaceholder")} />
          </FormItem>
          <FormItem name="perCustomer" label={t("coupons.fieldPerCustomer")}>
            <InputNumber min={1} placeholder="1" />
          </FormItem>
        </div>
      </Form>
    </Modal>
  );
}
