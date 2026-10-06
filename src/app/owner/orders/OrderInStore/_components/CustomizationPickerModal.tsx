"use client";
// ─────────────────────────────────────────────────────────────
// หน้าต่างเลือกตัวเลือกก่อนลงบิล (POS · BACKLOG3-merge I4)
// กลุ่มเลือกได้อย่างเดียว = ปุ่มแบบ radio · หลายอย่าง = ติ๊กได้ถึง max · ออปชันติ๊ก/กรอกข้อความ
// ปุ่ม "เพิ่มลงบิล" กดได้เมื่อครบกติกา (checkPicked — เหมือน backend) · state การเลือกอยู่ในหน้าต่างนี้เท่านั้น
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/base";
import { modalButtonIcons } from "@/components/shared/actions";
import { formatCurrency } from "@/i18n/format";
import type { Product } from "@/types/product";
import { CUSTOMIZATION_LIMITS, type ProductCustomization } from "@/types/productCustomization";
import { checkPicked, initialPicked, toSelection, toggleVariant, type Picked } from "../customizationSelection";

export function CustomizationPickerModal({
  product,
  customization,
  onConfirm,
  onCancel,
}: {
  product: Product;
  customization: ProductCustomization;
  onConfirm: (picked: Picked) => void;
  onCancel: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [picked, setPicked] = useState<Picked>(() => initialPicked(customization));
  const problems = checkPicked(customization, picked);
  const unitPrice = (product.sale_price ?? product.product_price) + toSelection(customization, picked).extra;
  const plus = (n: number) => (n > 0 ? ` +${formatCurrency(n, locale)}` : "");

  const setOption = (id: string, value: string | undefined) =>
    setPicked((p) => {
      const options = { ...p.options };
      if (value === undefined) delete options[id];
      else options[id] = value;
      return { ...p, options };
    });

  return (
    <Modal
      open
      title={product.product_name_th}
      onCancel={onCancel}
      onOk={() => onConfirm(picked)}
      okText={t("pos.pickAdd", { price: formatCurrency(unitPrice, locale) })}
      cancelText={t("common.cancel")}
      okButtonProps={{ disabled: problems.length > 0, ...modalButtonIcons("add").okButtonProps }}
      cancelButtonProps={modalButtonIcons("add").cancelButtonProps}
      destroyOnHidden
    >
      <div className="flex flex-col gap-4">
        {customization.groups.map((g) => {
          const chosen = new Set(picked.variantIds);
          const count = g.variants.filter((v) => chosen.has(v._id)).length;
          const single = g.max_select <= 1;
          return (
            <fieldset key={g._id} className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-1 flex w-full items-baseline justify-between gap-2 p-0">
                <span className="font-semibold text-brown-900">{g.group_name}</span>
                <span className="text-xs text-gray-500">
                  {g.min_select >= 1 ? t("customization.required") : t("customization.optional")} ·{" "}
                  {single ? t("customization.single") : t("pos.pickCount", { n: count, max: g.max_select })}
                </span>
              </legend>
              <div className="flex flex-wrap gap-2" role={single ? "radiogroup" : "group"} aria-label={g.group_name}>
                {g.variants.map((v) => {
                  const on = chosen.has(v._id);
                  const full = !single && !on && count >= g.max_select;
                  return (
                    <button
                      key={v._id}
                      type="button"
                      role={single ? "radio" : "checkbox"}
                      aria-checked={on}
                      disabled={full}
                      onClick={() => setPicked((p) => toggleVariant(customization, p, g._id, v._id))}
                      className={`rounded-lg border-2 px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        on ? "border-brown-700 bg-brown-50 font-semibold text-brown-900" : "border-gray-200 text-gray-700 hover:border-brown-300"
                      }`}
                    >
                      {v.variant_name}
                      <span className="text-gray-500">{plus(v.variant_price)}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        {customization.options.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
            {customization.options.map((o) =>
              o.is_text_input ? (
                <label key={o._id} className="flex flex-col gap-1 text-sm">
                  <span className="text-gray-700">
                    {o.option_name}
                    <span className="text-gray-500">{plus(o.extra_price)}</span>
                    {o.is_required && <span className="text-danger"> *</span>}
                  </span>
                  <Input
                    value={picked.options[o._id] ?? ""}
                    maxLength={o.max_text_length ?? CUSTOMIZATION_LIMITS.defaultTextLength}
                    showCount
                    onChange={(e) => setOption(o._id, e.target.value === "" ? undefined : e.target.value)}
                  />
                </label>
              ) : (
                <label key={o._id} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brown-700"
                    checked={picked.options[o._id] !== undefined}
                    onChange={(e) => setOption(o._id, e.target.checked ? "" : undefined)}
                  />
                  {o.option_name}
                  <span className="text-gray-500">{plus(o.extra_price)}</span>
                  {o.is_required && <span className="text-danger">*</span>}
                </label>
              ),
            )}
          </div>
        )}

        {problems.length > 0 && (
          <ul className="m-0 flex flex-col gap-0.5 pl-5 text-sm text-amber-700">
            {problems.map((p, i) => (
              <li key={i}>{t(`pos.${p.key}`, p.params)}</li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
