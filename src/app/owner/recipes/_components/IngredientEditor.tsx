"use client";
// แถวไดนามิก "วัตถุดิบที่ใช้ในสูตร" — ใช้ร่วมทั้ง MainRecipeModal และ ComponentFormModal
// หน่วยล็อกตามหน่วยของวัตถุดิบที่เลือก (ไม่มี unit picker แยก — วัตถุดิบแต่ละตัวมีหน่วยคงที่ของตัวเองอยู่แล้ว)
import { useTranslations } from "next-intl";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button, InputNumber, Select } from "@/components/base";
import type { RecipeIngredientLine } from "@/types/recipeShared";
import { actionIcon } from "@/components/shared/actions";
import { isIntegerOnlyUnit } from "@/constants/ingredientCategoryUnits";

// หัวคอลัมน์ + ทุกแถวใช้ชุดเดียวกัน · minmax(0, …) กันคอลัมน์ขยายตามชื่อวัตถุดิบยาว (fr เฉย ๆ ไม่หดต่ำกว่าเนื้อหา
// → แถวที่ชื่อยาวดันช่องจำนวนเยื้องจากแถวอื่น)
const ROW_COLUMNS = "minmax(0, 1fr) 110px 24px";

/** แถวระหว่างแก้ — quantity null = ช่องว่าง (กำลังพิมพ์ใหม่) · ฟอร์มตรวจ > 0 ก่อนบันทึก (hasQty)
 *  เดิมแปลงช่องว่างเป็น 0 ทันที ช่องเด้งเป็น "0" กลางการพิมพ์ และบันทึกวัตถุดิบจำนวน 0 ได้ */
export type EditableIngredientLine = Omit<RecipeIngredientLine, "quantity"> & { quantity: number | null };

/** หน่วยนับ (ฟอง/ชิ้น/กล่อง …) ต้องเป็นจำนวนเต็ม — กติกาเดียวกับสต็อกวัตถุดิบ (IngredientFormModal)
 *  เดิมสูตรใส่ "ไข่ 1.5 ฟอง" ได้ ทั้งที่สต็อกห้ามเศษ → ผลิตแล้วตัดสต็อกเหลือเศษฟอง */
export const wholeUnitsOk = (rows: { quantity: number | null; unit_abbr: string }[]) =>
  rows.every((r) => r.quantity == null || !isIntegerOnlyUnit(r.unit_abbr) || Number.isInteger(r.quantity));

/** ทุกแถวมีจำนวน > 0 แล้ว → ส่งเข้า API ได้ */
export const hasQty = <T extends { quantity: number | null }>(rows: T[]): rows is (T & { quantity: number })[] =>
  rows.every((r) => r.quantity != null && r.quantity > 0);

export interface IngredientOption {
  _id: string;
  name: string;
  unit_id: string;
  unit_abbr: string;
}

export function IngredientEditor({
  rows,
  options,
  onChange,
}: {
  rows: EditableIngredientLine[];
  options: IngredientOption[];
  onChange: (rows: EditableIngredientLine[]) => void;
}) {
  const t = useTranslations();

  const add = () => onChange([...rows, { ingredient_id: "", ingredient_name: "", quantity: 1, unit_id: "", unit_abbr: "" }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, ingredientId: string) => {
    const opt = options.find((o) => o._id === ingredientId);
    // เปลี่ยนเป็นวัตถุดิบหน่วยนับ → ปัดจำนวนเดิมที่มีเศษขึ้นเป็นจำนวนเต็ม (ช่องจะล็อกเป็นจำนวนเต็มต่อจากนี้)
    const whole = isIntegerOnlyUnit(opt?.unit_abbr);
    onChange(rows.map((r, idx) => (idx === i
      ? {
          ...r,
          ingredient_id: ingredientId,
          ingredient_name: opt?.name ?? "",
          unit_id: opt?.unit_id ?? "",
          unit_abbr: opt?.unit_abbr ?? "",
          quantity: whole && r.quantity != null ? Math.max(1, Math.ceil(r.quantity)) : r.quantity,
        }
      : r)));
  };
  const updateQty = (i: number, qty: number | null) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, quantity: qty } : r)));

  return (
    <div className="flex flex-col gap-2">
      {rows.length > 0 && (
        <div className="grid gap-2 text-xs text-gray-500" style={{ gridTemplateColumns: ROW_COLUMNS }}>
          <span>{t("filterLabel.ingredient")}</span>
          <span>{t("filterLabel.quantity")}</span>
          <span />
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: ROW_COLUMNS }}>
          <Select
            size="small"
            aria-label={t("filterLabel.ingredient")}
            placeholder={t("recipes.selectIngredient")}
            value={row.ingredient_id || undefined}
            onChange={(v) => updateIngredient(i, v as string)}
            showSearch
            optionFilterProp="label"
            options={options.map((o) => ({
              value: o._id,
              label: o.name,
              disabled: rows.some((r, idx) => idx !== i && r.ingredient_id === o._id),
            }))}
          />
          <InputNumber
            size="small"
            className="!w-full"
            min={0}
            {...(isIntegerOnlyUnit(row.unit_abbr) ? { precision: 0, step: 1 } : { step: 0.01 })}
            aria-label={t("filterLabel.quantity")}
            value={row.quantity}
            status={
              (row.ingredient_id && !row.quantity) || !wholeUnitsOk([row]) ? "error" : undefined
            }
            onChange={(v) => updateQty(i, v == null ? null : Number(v))}
            suffix={<span className="text-xs text-gray-500">{row.unit_abbr}</span>}
          />
          <Button
            size="small" type="text" danger
            icon={<XMarkIcon className="h-3.5 w-3.5" />}
            onClick={() => remove(i)}
            aria-label={t("common.delete")}
          />
        </div>
      ))}
      <Button size="small" icon={actionIcon("add", "small")} onClick={add} className="self-start">
        {t("recipes.addIngredient")}
      </Button>
    </div>
  );
}
