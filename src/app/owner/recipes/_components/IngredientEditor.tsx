"use client";
// แถวไดนามิก "วัตถุดิบที่ใช้ในสูตร" — ใช้ร่วมทั้ง MainRecipeModal และ ComponentFormModal
// หน่วยล็อกตามหน่วยของวัตถุดิบที่เลือก (ไม่มี unit picker แยก — วัตถุดิบแต่ละตัวมีหน่วยคงที่ของตัวเองอยู่แล้ว)
import { useTranslations } from "next-intl";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, InputNumber, Select } from "@/components/base";
import type { RecipeIngredientLine } from "@/types/recipeShared";

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
  rows: RecipeIngredientLine[];
  options: IngredientOption[];
  onChange: (rows: RecipeIngredientLine[]) => void;
}) {
  const t = useTranslations();

  const add = () => onChange([...rows, { ingredient_id: "", ingredient_name: "", quantity: 1, unit_id: "", unit_abbr: "" }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, ingredientId: string) => {
    const opt = options.find((o) => o._id === ingredientId);
    onChange(rows.map((r, idx) => (idx === i
      ? { ...r, ingredient_id: ingredientId, ingredient_name: opt?.name ?? "", unit_id: opt?.unit_id ?? "", unit_abbr: opt?.unit_abbr ?? "" }
      : r)));
  };
  const updateQty = (i: number, qty: number) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, quantity: qty } : r)));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 110px 24px" }}>
          <Select
            size="small"
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
            step={0.01}
            value={row.quantity}
            onChange={(v) => updateQty(i, Number(v) || 0)}
            suffix={<span className="text-xs text-gray-400">{row.unit_abbr}</span>}
          />
          <Button
            size="small" type="text" danger
            icon={<XMarkIcon className="h-3.5 w-3.5" />}
            onClick={() => remove(i)}
            aria-label={t("common.delete")}
          />
        </div>
      ))}
      <Button size="small" icon={<PlusIcon className="h-3.5 w-3.5" />} onClick={add} className="self-start">
        {t("recipes.addIngredient")}
      </Button>
    </div>
  );
}
