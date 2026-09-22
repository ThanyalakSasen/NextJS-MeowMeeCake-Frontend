"use client";
// ฟิลด์ของฟอร์มสินค้า — render ข้างใน <Form> (antd) เท่านั้น
// <FormItem> จัดการ label + error + validation ให้เอง
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { Rule } from "antd/es/form";
import { Input, TextArea, InputNumber, Select, Switch, Form, FormItem } from "@/components/base";
import { productCategoriesService } from "@/services/productCategories";
import { unitsService } from "@/services/units";
import { ProductImageUpload } from "./ProductImageUpload";

export function ProductFormFields() {
  const t = useTranslations();
  const cats = useQuery({ queryKey: ["product-categories"], queryFn: () => productCategoriesService.list() });
  const units = useQuery({ queryKey: ["units", { usage: "Product" }], queryFn: () => unitsService.list({ usage_context: "Product" }) });
  // ซ่อน/โชว์ field ตาม product_type ที่เลือกอยู่ (preorder ต้องการ preorder_config แทน stock)
  const form = Form.useFormInstance();
  const productType = Form.useWatch("product_type", form);
  const isPreorder = productType === "preorder";

  const required: Rule[] = [{ required: true, message: t("validation.required") }];
  const price: Rule[] = [
    { required: true, message: t("validation.required") },
    { type: "number", min: 0.01, message: t("validation.positive") },
  ];
  const requiredPositiveInt: Rule[] = [
    { required: true, message: t("validation.required") },
    { type: "number", min: 1, message: t("validation.positive") },
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
      <FormItem name="product_name_eng" label={t("fields.product_name_eng")} rules={required}>
        <Input />
      </FormItem>

      <FormItem name="category_id" label={t("fields.category_id")} rules={required}>
        <Select loading={cats.isLoading} options={(cats.data?.data ?? []).map((c) => ({ value: c._id, label: c.product_category_name }))} />
      </FormItem>
      <FormItem name="unit_id" label={t("fields.unit_id")} rules={required}>
        <Select loading={units.isLoading} options={(units.data?.data ?? []).map((u) => ({ value: u._id, label: u.unit_name }))} />
      </FormItem>

      <FormItem name="product_type" label={t("fields.product_type")}>
        <Select
          options={[
            { value: "inStore", label: t("enums.productType.inStore") },
            { value: "online", label: t("enums.productType.online") },
            { value: "preorder", label: t("enums.productType.preorder") },
          ]}
        />
      </FormItem>
      {/* backend ห้ามส่ง product_stock_quantity ตอน type=preorder (ใช้ preorder_config แทน) */}
      {!isPreorder && (
        <FormItem name="product_stock_quantity" label={t("fields.product_stock_quantity")} rules={[{ type: "number", min: 0, message: t("validation.nonNegative") }]}>
          <InputNumber min={0} />
        </FormItem>
      )}

      <FormItem name="product_price" label={t("fields.product_price")} rules={price}>
        <InputNumber min={0} />
      </FormItem>
      <FormItem name="sale_price" label={t("fields.sale_price")} dependencies={["product_price"]} rules={[saleRule]}>
        <InputNumber min={0} />
      </FormItem>

      {/* backend บังคับต้องมี preorder_config ครบ 3 ค่าตอน type=preorder เท่านั้น */}
      {isPreorder && (
        <div className="md:col-span-2 grid grid-cols-1 gap-x-4 gap-y-0 rounded-lg border border-gray-100 bg-gray-50 p-3 md:grid-cols-3">
          <FormItem name={["preorder_config", "min_order_qty"]} label={t("fields.min_order_qty")} rules={requiredPositiveInt}>
            <InputNumber min={1} className="!w-full" />
          </FormItem>
          <FormItem name={["preorder_config", "max_order_qty"]} label={t("fields.max_order_qty")} rules={requiredPositiveInt}>
            <InputNumber min={1} className="!w-full" />
          </FormItem>
          <FormItem name={["preorder_config", "lead_time_days"]} label={t("fields.lead_time_days")} rules={requiredPositiveInt}>
            <InputNumber min={1} className="!w-full" />
          </FormItem>
        </div>
      )}

      <FormItem name="product_description" label={t("fields.product_description")} className="md:col-span-2">
        <TextArea rows={3} />
      </FormItem>

      <FormItem name="product_img" label={t("fields.product_img")} className="md:col-span-2">
        <ProductImageUpload />
      </FormItem>
      <FormItem name="is_visible" label={t("fields.is_visible")} valuePropName="checked">
        <Switch />
      </FormItem>
    </div>
  );
}
