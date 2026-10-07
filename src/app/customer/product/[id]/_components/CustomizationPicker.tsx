"use client";
// ─────────────────────────────────────────────────────────────
// เลือกตัวเลือกสินค้าในหน้ารายละเอียด — แทน FrontOffice ProductCustomizationPicker
// กลุ่มเลือก 1 = ปุ่มแบบ radio · เลือกได้หลายอย่าง = ปุ่มติ๊ก (ครบจำนวนแล้วติ๊กเพิ่มไม่ได้) · ออปชัน = ติ๊ก หรือกรอกข้อความ
// ตรวจ/คิดราคาด้วย src/lib/customizationSelection.ts ตัวเดียวกับ POS (กติกาเดียวกับ backend resolveCustomization)
// ─────────────────────────────────────────────────────────────
import { CUSTOMIZATION_LIMITS, type ProductCustomization } from "@/types/productCustomization";
import { toggleVariant, type Picked } from "@/lib/customizationSelection";

const priceTag = (n: number) => (n > 0 ? `+฿${n.toLocaleString("th-TH")}` : "ไม่มีค่าใช้จ่ายเพิ่ม");

function ruleText(min: number, max: number): string {
  if (min >= 1 && max === 1) return "เลือก 1 อย่าง";
  if (min >= 1) return `เลือก ${min}–${max} อย่าง`;
  return max === 1 ? "ไม่บังคับ" : `เลือกได้สูงสุด ${max} อย่าง`;
}

const chip = (active: boolean) =>
  `rounded-xl border-2 px-3 py-2 text-left text-xs sm:text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
    active ? "border-[#8C5A3C] bg-white font-bold text-[#4A342E] shadow-sm" : "border-[#8C5A3C]/15 bg-white/60 text-gray-700 hover:border-[#8C5A3C]/40"
  }`;

export default function CustomizationPicker({
  customization,
  picked,
  onChange,
  disabled,
}: {
  customization: ProductCustomization;
  picked: Picked;
  onChange: (next: Picked) => void;
  disabled?: boolean;
}) {
  const { groups, options } = customization;
  const setOption = (id: string, value: string | undefined) => {
    const next = { ...picked.options };
    if (value === undefined) delete next[id];
    else next[id] = value;
    onChange({ ...picked, options: next });
  };

  return (
    <div className="space-y-4 rounded-xl border border-[#8C5A3C]/10 bg-[#FAF6F0] p-4 sm:p-5">
      {groups.map((g) => {
        const single = g.max_select === 1;
        const count = g.variants.filter((v) => picked.variantIds.includes(v._id)).length;
        const full = !single && count >= g.max_select;
        return (
          <fieldset key={g._id} className="m-0 space-y-2 border-0 p-0">
            <legend className="flex w-full items-baseline justify-between gap-2 text-xs font-bold text-[#4A342E] sm:text-sm">
              <span>
                {g.group_name}
                {g.min_select >= 1 && <span className="text-red-500"> *</span>}
              </span>
              <span className="text-[11px] font-normal text-gray-500">
                {ruleText(g.min_select, g.max_select)}
                {!single && ` · เลือกแล้ว ${count}`}
              </span>
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role={single ? "radiogroup" : "group"} aria-label={g.group_name}>
              {g.variants.map((v) => {
                const active = picked.variantIds.includes(v._id);
                return (
                  <button
                    key={v._id}
                    type="button"
                    role={single ? "radio" : "checkbox"}
                    aria-checked={active}
                    disabled={disabled || (full && !active)}
                    onClick={() => onChange(toggleVariant(customization, picked, g._id, v._id))}
                    className={chip(active)}
                  >
                    <span className="block">{v.variant_name}</span>
                    <span className="block text-[11px] font-normal text-[#8C5A3C]">{priceTag(v.variant_price)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {options.length > 0 && (
        <div className={`space-y-3 ${groups.length ? "border-t border-[#8C5A3C]/10 pt-4" : ""}`}>
          <p className="m-0 text-xs font-bold text-[#4A342E] sm:text-sm">ตัวเลือกเพิ่มเติม</p>
          {options.map((o) =>
            o.is_text_input ? (
              <label key={o._id} className="block space-y-1">
                <span className="flex items-baseline justify-between gap-2 text-xs font-semibold text-[#4A342E]">
                  <span>
                    {o.option_name}
                    {o.is_required && <span className="text-red-500"> *</span>}
                  </span>
                  <span className="text-[11px] font-normal text-[#8C5A3C]">{priceTag(o.extra_price)}</span>
                </span>
                <input
                  type="text"
                  disabled={disabled}
                  value={picked.options[o._id] ?? ""}
                  maxLength={o.max_text_length ?? CUSTOMIZATION_LIMITS.defaultTextLength}
                  placeholder={o.is_required ? "จำเป็นต้องกรอก" : "ไม่ใส่ก็ได้"}
                  onChange={(e) => setOption(o._id, e.target.value || undefined)}
                  className="w-full rounded-xl border border-[#8C5A3C]/20 bg-white px-4 py-2.5 text-xs text-[#4A342E] transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8C5A3C]/40 sm:text-sm"
                />
              </label>
            ) : (
              <label key={o._id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#8C5A3C]/15 bg-white/60 px-3 py-2 text-xs sm:text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={picked.options[o._id] !== undefined}
                    onChange={(e) => setOption(o._id, e.target.checked ? "" : undefined)}
                    className="h-4 w-4 accent-[#8C5A3C]"
                  />
                  {o.option_name}
                  {o.is_required && <span className="text-red-500">*</span>}
                </span>
                <span className="text-[11px] text-[#8C5A3C]">{priceTag(o.extra_price)}</span>
              </label>
            ),
          )}
        </div>
      )}
    </div>
  );
}
