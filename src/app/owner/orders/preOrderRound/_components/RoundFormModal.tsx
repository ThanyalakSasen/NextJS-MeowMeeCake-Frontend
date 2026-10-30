"use client";
// สร้างรอบพรีออเดอร์ใหม่ — antd Modal + base/Form · รายการสินค้าเริ่มต้นเป็นแถวไดนามิก (ไม่บังคับ
// เพิ่มก็ได้ ค่อยเพิ่มทีหลังจาก drawer จัดการรอบ) แพทเทิร์นเดียวกับ ProductionOrderFormModal
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import type { Dayjs } from "dayjs";
import { Form, FormItem, useAntForm, Input, InputNumber, Select, DatePicker, Button } from "@/components/base";
import { alert } from "@/lib/alert";
import { formatCurrency } from "@/i18n/format";
import type { Product } from "@/types/product";
import type { CreateRoundInput, RoundItemInput } from "@/types/preorderRound";
import { actionIcon, modalButtonIcons } from "@/components/shared/actions";
import { roundDatesError, roundDatesPayload } from "./roundDates";
import { useEditableRows, RemoveRowButton } from "@/components/shared/form";
import { sortOptionsThai } from "@/lib/thaiSort";

interface ItemRow {
  key: string;
  product_id: string;
  price_override: number | null;
  /** null = ช่องว่าง (กำลังพิมพ์ใหม่) — เดิมแปลงเป็น 1 ทันที ช่องเด้งเป็น "1" กลางการพิมพ์ */
  min_order_qty: number | null;
  max_qty_total: number | null;
}

// หัวคอลัมน์ + ทุกแถวใช้ชุดเดียวกัน · minmax(0, …) กันคอลัมน์ขยายตามชื่อสินค้ายาว (fr เฉย ๆ ไม่หดต่ำกว่าเนื้อหา
// → แถวที่ชื่อยาวดันช่องราคา/ขั้นต่ำ/โควตาเยื้องจากแถวอื่น)
const ROW_COLUMNS = "minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 0.8fr) minmax(0, 0.8fr) 24px";

function emptyRow(): ItemRow {
  return { key: crypto.randomUUID(), product_id: "", price_override: null, min_order_qty: 1, max_qty_total: 10 };
}

interface FormValues {
  round_name: string;
  open_date: Dayjs;
  close_date: Dayjs;
  pickup_date: Dayjs;
}

export function RoundFormModal({
  open,
  products,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  products: Product[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: CreateRoundInput) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<FormValues>();
  const { rows, setRows, updateRow, removeRow } = useEditableRows<ItemRow>([]);

  const handleAfterClose = () => {
    form.resetFields();
    setRows([]);
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    const err = roundDatesError(v);
    if (err) {
      alert.warning(t(err));
      return;
    }
    // เลือกสินค้าแล้วแต่ขั้นต่ำ/โควตาว่าง = บอก (ไม่ทิ้งแถวนั้นเงียบ ๆ)
    const picked = rows.filter((r) => r.product_id);
    if (picked.some((r) => !r.min_order_qty || !r.max_qty_total)) {
      alert.warning(t("preorderRound.itemQtyRequired"));
      return;
    }
    // ขั้นต่ำเกินโควตารวม = ไม่มีใครสั่งได้ (backend ปฏิเสธด้วย)
    if (picked.some((r) => r.min_order_qty! > r.max_qty_total!)) {
      alert.warning(t("preorderRound.minExceedsMax"));
      return;
    }
    const items: RoundItemInput[] = picked.map((r) => ({
      product_id: r.product_id,
      price_override: r.price_override ?? undefined,
      min_order_qty: r.min_order_qty!,
      max_qty_total: r.max_qty_total!,
    }));
    onSubmit({
      round_name: v.round_name.trim(),
      ...roundDatesPayload(v),
      items: items.length ? items : undefined,
    });
  };

  return (
    <Modal
      open={open}
      title={t("preorderRound.createTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons("add")}
      okText={t("common.create")}
      cancelText={t("common.cancel")}
      width={680}
      destroyOnHidden
      afterClose={handleAfterClose}
    >
      <Form form={form} layout="vertical">
        <FormItem
          name="round_name"
          label={t("preorderRound.fieldRoundName")}
          rules={[{ required: true, whitespace: true, message: t("validation.required") }]}
        >
          <Input maxLength={200} placeholder={t("preorderRound.roundNamePlaceholder")} />
        </FormItem>

        <div className="grid grid-cols-3 gap-3">
          <FormItem name="open_date" label={t("preorderRound.fieldOpenDate")} rules={[{ required: true, message: t("validation.required") }]}>
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
          <FormItem name="close_date" label={t("preorderRound.fieldCloseDate")} rules={[{ required: true, message: t("validation.required") }]}>
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
          <FormItem name="pickup_date" label={t("preorderRound.fieldPickupDate")} rules={[{ required: true, message: t("validation.required") }]}>
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
        </div>
        <p className="-mt-2 mb-3 text-xs text-gray-500">{t("preorderRound.closeDateHint")}</p>

        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-500">{t("preorderRound.itemsTitle", { n: rows.length })}</p>
          <Button size="small" icon={actionIcon("add", "small")} onClick={() => setRows((p) => [...p, emptyRow()])}>
            {t("preorderRound.addItem")}
          </Button>
        </div>

        {/* หัวคอลัมน์ (อยู่เหนือแถว — เดิมอยู่ใต้รายการ) */}
        {rows.length > 0 && (
          <div className="mb-1 grid gap-2 text-xs text-gray-500" style={{ gridTemplateColumns: ROW_COLUMNS }}>
            <span>{t("preorderRound.colProduct")}</span>
            <span>{t("preorderRound.colPriceOverride")}</span>
            <span>{t("preorderRound.colMinQty")}</span>
            <span>{t("preorderRound.colMaxQty")}</span>
            <span />
          </div>
        )}
        {rows.map((row) => {
          const product = products.find((p) => p._id === row.product_id);
          return (
            <div key={row.key} className="grid gap-2 mb-2 items-center" style={{ gridTemplateColumns: ROW_COLUMNS }}>
              <Select
                size="small"
                className="w-full min-w-0"
                aria-label={t("preorderRound.colProduct")}
                placeholder={t("preorderRound.selectProduct")}
                value={row.product_id || undefined}
                onChange={(v) => updateRow(row.key, { product_id: v as string })}
                showSearch
                optionFilterProp="label"
                options={sortOptionsThai(products.map((p) => ({
                  value: p._id,
                  label: p.product_name_th,
                  disabled: rows.some((r) => r.key !== row.key && r.product_id === p._id),
                })))}
              />
              <InputNumber precision={0}
                size="small"
                className="!w-full"
                min={0}
                aria-label={t("preorderRound.colPriceOverride")}
                placeholder={product ? formatCurrency(product.sale_price ?? product.product_price, "th") : t("preorderRound.priceOverridePlaceholder")}
                value={row.price_override ?? undefined}
                onChange={(v) => updateRow(row.key, { price_override: v == null ? null : Number(v) })}
              />
              <InputNumber
                size="small"
                className="!w-full"
                min={1}
                precision={0}
                aria-label={t("preorderRound.colMinQty")}
                value={row.min_order_qty}
                status={row.product_id && row.min_order_qty == null ? "error" : undefined}
                onChange={(v) => updateRow(row.key, { min_order_qty: v == null ? null : Number(v) })}
              />
              <InputNumber
                size="small"
                className="!w-full"
                min={1}
                precision={0}
                aria-label={t("preorderRound.colMaxQty")}
                value={row.max_qty_total}
                status={row.product_id && row.max_qty_total == null ? "error" : undefined}
                onChange={(v) => updateRow(row.key, { max_qty_total: v == null ? null : Number(v) })}
              />
              <RemoveRowButton onClick={() => removeRow(row.key)} />
            </div>
          );
        })}
      </Form>
    </Modal>
  );
}
