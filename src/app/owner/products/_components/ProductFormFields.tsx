"use client";
// ฟิลด์ของฟอร์มสินค้า — render ข้างใน <Form> (antd) เท่านั้น
// <FormItem> จัดการ label + error + validation ให้เอง
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "antd";
import type { Rule } from "antd/es/form";
import { Input, TextArea, InputNumber, Select, Switch, Form, FormItem } from "@/components/base";
import { productCategoriesService } from "@/services/productCategories";
import { unitsService } from "@/services/units";
import { ProductImageUpload } from "./ProductImageUpload";
import { useCategoryShipping } from "@/hooks/useCategoryShipping";
import { sortOptionsThai } from "@/lib/thaiSort";
import { formatNumber } from "@/i18n/format";
import { PRODUCT_STOCK_MAX } from "@/components/shared/stock";
import { PRODUCT_CATEGORIES_KEY, PRODUCT_UNITS_KEY, PRODUCT_UNITS_PARAMS } from "../productFormQuery";

/** mode "edit": สต็อกโชว์อย่างเดียว (แก้ไม่ได้) — ปรับที่หน้าสต็อกสินค้าเท่านั้น (PUT …/stock) */
export function ProductFormFields({ mode = "create" }: { mode?: "create" | "edit" }) {
  const t = useTranslations();
  const locale = useLocale();
  // key ร่วมกับ page.tsx ของหน้าเพิ่ม/แก้ไขสินค้า (ดึงไว้ฝั่ง server แล้ว)
  const cats = useQuery({ queryKey: PRODUCT_CATEGORIES_KEY, queryFn: () => productCategoriesService.list() });
  const units = useQuery({ queryKey: PRODUCT_UNITS_KEY, queryFn: () => unitsService.list(PRODUCT_UNITS_PARAMS) });
  // ซ่อน/โชว์ field ตามประเภทที่เลือกอยู่ (พรีออเดอร์ต้องการ preorder_config แทน stock)
  const form = Form.useFormInstance();
  const isPreorder = Form.useWatch("is_preorder", form) === true;
  // ขอบเขตจัดส่งออเดอร์เว็บ — สิทธิ์ shipping (คนละเมนูกับสินค้า) · ไม่มี view = ไม่แสดงช่อง · ไม่มี update = ดูได้อย่างเดียว
  // "ตามหมวดหมู่" บอกค่าปัจจุบันของหมวดที่เลือก (useCategoryShipping — ชุดเดียวกับหน้าค่าจัดส่ง)
  const shipping = useCategoryShipping();
  const categoryId = Form.useWatch("category_id", form) as string | undefined;
  const catShipping = shipping.items.find((c) => c._id === categoryId);

  const required: Rule[] = [{ required: true, whitespace: true, message: t("validation.required") }];
  const price: Rule[] = [
    { required: true, whitespace: true, message: t("validation.required") },
    { type: "number", min: 0.01, message: t("validation.positive") },
  ];
  const requiredPositiveInt: Rule[] = [
    { required: true, whitespace: true, message: t("validation.required") },
    { type: "integer", min: 1, message: t("validation.positive") },
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
        <Select loading={cats.isLoading} options={sortOptionsThai((cats.data?.data ?? []).map((c) => ({ value: c._id, label: c.product_category_name })))} />
      </FormItem>
      <FormItem name="unit_id" label={t("fields.unit_id")} rules={required}>
        <Select loading={units.isLoading} options={sortOptionsThai((units.data?.data ?? []).map((u) => ({ value: u._id, label: u.unit_name })))} />
      </FormItem>

      {shipping.perm.view && (
        <FormItem name="shipping_scope" label={t("products.shippingScope")} className="md:col-span-2" extra={t("products.shippingScopeHint")}>
          <Radio.Group
            disabled={!shipping.perm.update}
            options={[
              {
                value: "category",
                label: catShipping
                  ? t("products.shippingScopeCategoryIs", {
                      scope: t(catShipping.ships_nationwide ? "shippingZones.categories.nationwide" : "shippingZones.categories.provinceOnly"),
                    })
                  : t("products.shippingScopeCategory"),
              },
              { value: "nationwide", label: t("products.shippingScopeNationwide") },
              { value: "province", label: t("products.shippingScopeProvince") },
            ]}
          />
        </FormItem>
      )}

      {/* ช่องทางขาย (เว็บ/หน้าร้าน) ไม่ได้ผูกกับสินค้าแล้ว — เลือกแค่ปกติ/พรีออเดอร์ (ซ่อนจากเว็บใช้ "แสดงผล") */}
      <FormItem name="is_preorder" label={t("fields.product_type")}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          options={[
            { value: false, label: t("enums.productType.normal") },
            { value: true, label: t("enums.productType.preorder") },
          ]}
        />
      </FormItem>
      {/* backend ห้ามส่ง product_stock_quantity ตอนเป็นพรีออเดอร์ (ใช้ preorder_config แทน)
          ตอนแก้ไข: โชว์อย่างเดียว ไม่ส่งไปกับ PATCH (toUpdateInput) — สต็อกตั้งได้ตอนสร้าง หรือที่หน้าสต็อกสินค้า */}
      {!isPreorder && (
        <FormItem
          name="product_stock_quantity"
          label={t("fields.product_stock_quantity")}
          extra={mode === "edit" ? t("products.stockEditHint") : undefined}
          rules={[
            { type: "number", min: 0, message: t("validation.nonNegative") },
            // เฉพาะตอนสร้าง — ตอนแก้ไขช่องนี้ปิดอยู่ ถ้าสต็อกเดิมเกินเพดาน (ข้อมูลเก่า) จะบันทึกการแก้อย่างอื่นไม่ได้
            ...(mode === "edit" ? [] : [{ type: "number" as const, max: PRODUCT_STOCK_MAX, message: t("validation.maxValue", { max: formatNumber(PRODUCT_STOCK_MAX, locale) }) }]),
          ]}
        >
          <InputNumber min={0} precision={0} disabled={mode === "edit"} />
        </FormItem>
      )}
      {/* เกณฑ์สินค้าใกล้หมดรายสินค้า — มีความหมายเฉพาะสินค้าที่มีสต็อก (ไม่ใช่ preorder) */}
      {!isPreorder && (
        <FormItem
          name="low_stock_threshold"
          label={t("fields.low_stock_threshold")}
          extra={t("products.lowStockThresholdHint")}
          rules={[{ type: "integer", min: 0, message: t("products.lowStockThresholdInvalid") }]}
        >
          <InputNumber min={0} precision={0} placeholder="5" />
        </FormItem>
      )}
      {/* อายุสินค้า — วันหมดอายุเริ่มต้นของล็อตตอนปิดงานผลิต (ทั้งปกติและพรีออเดอร์) */}
      <FormItem
        name="shelf_life_days"
        label={t("fields.shelf_life_days")}
        extra={t("products.shelfLifeHint")}
        rules={[{ type: "integer", min: 1, message: t("products.shelfLifeInvalid") }]}
      >
        <InputNumber min={1} precision={0} />
      </FormItem>

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
            <InputNumber min={1} precision={0} className="!w-full" />
          </FormItem>
          <FormItem name={["preorder_config", "max_order_qty"]} label={t("fields.max_order_qty")} rules={requiredPositiveInt}>
            <InputNumber min={1} precision={0} className="!w-full" />
          </FormItem>
          <FormItem name={["preorder_config", "lead_time_days"]} label={t("fields.lead_time_days")} rules={requiredPositiveInt}>
            <InputNumber min={1} precision={0} className="!w-full" />
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
