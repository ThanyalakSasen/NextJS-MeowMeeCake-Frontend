"use client";
// ฟิลด์ของฟอร์มสินค้า — render ข้างใน <Form> (antd) เท่านั้น
// <FormItem> จัดการ label + error + validation ให้เอง
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { Rule } from "antd/es/form";
import { Input, TextArea, InputNumber, Select, Switch, FormItem } from "@/components/base";
import { UploadImageBox } from "@/components/shared/form";
import { productCategoriesService } from "@/services/productCategories";
import { unitsService } from "@/services/units";

export function ProductFormFields() {
  const t = useTranslations();
  const cats = useQuery({ queryKey: ["product-categories"], queryFn: () => productCategoriesService.list() });
  const units = useQuery({ queryKey: ["units", { usage: "Product" }], queryFn: () => unitsService.list({ usage_context: "Product" }) });

  const required: Rule[] = [{ required: true, message: t("validation.required") }];
  const price: Rule[] = [
    { required: true, message: t("validation.required") },
    { type: "number", min: 0.01, message: t("validation.positive") },
  ];
  // sale_price ต้องน้อยกว่า product_price (validator ข้ามฟิลด์)
  const saleRule: Rule = ({ getFieldValue }) => ({
    validator(_, v) {
      if (v == null || v < getFieldValue("product_price")) return Promise.resolve();
      return Promise.reject(new Error(t("products.saleLtPrice")));
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 max-w-3xl">
      <FormItem name="product_name_th" label={t("fields.product_name_th")} rules={required}>
        <Input />
      </FormItem>
      <FormItem name="product_name_eng" label={t("fields.product_name_eng")}>
        <Input />
      </FormItem>

      <FormItem name="category_id" label={t("fields.category_id")}>
        <Select allowClear options={(cats.data?.data ?? []).map((c) => ({ value: c._id, label: c.category_name }))} />
      </FormItem>
      <FormItem name="unit_id" label={t("fields.unit_id")}>
        <Select allowClear options={(units.data?.data ?? []).map((u) => ({ value: u._id, label: u.unit_name }))} />
      </FormItem>

      <FormItem name="product_type" label={t("fields.product_type")}>
        <Select
          options={[
            { value: "ready", label: t("enums.orderType.ready") },
            { value: "preorder", label: t("enums.orderType.preorder") },
          ]}
        />
      </FormItem>
      <FormItem name="product_stock_quantity" label={t("fields.product_stock_quantity")} rules={[{ type: "number", min: 0, message: t("validation.nonNegative") }]}>
        <InputNumber min={0} />
      </FormItem>

      <FormItem name="product_price" label={t("fields.product_price")} rules={price}>
        <InputNumber min={0} />
      </FormItem>
      <FormItem name="sale_price" label={t("fields.sale_price")} dependencies={["product_price"]} rules={[saleRule]}>
        <InputNumber min={0} />
      </FormItem>

      <FormItem name="product_description" label={t("fields.product_description")} className="md:col-span-2">
        <TextArea rows={3} />
      </FormItem>

      <FormItem name="product_img" label={t("fields.product_img")}>
        <UploadImageBox />
      </FormItem>
      <FormItem name="is_visible" label={t("fields.is_visible")} valuePropName="checked">
        <Switch />
      </FormItem>
    </div>
  );
}
