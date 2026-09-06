"use client";
// เนื้อหาใน DetailDrawer ของสูตรหลัก — ผูกกับสินค้า, ส่วนประกอบ (สูตรส่วนประกอบ+วัตถุดิบตรง), ขั้นตอนการทำ
import { Steps } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { LinkIcon } from "@heroicons/react/24/outline";
import { Divider, Tag } from "@/components/base";
import { formatCurrency } from "@/i18n/format";
import type { Recipe } from "@/types/recipe";

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const t = useTranslations();
  const locale = useLocale();
  const hours = Math.floor(recipe.duration_minutes / 60);
  const mins = recipe.duration_minutes % 60;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <LinkIcon className="h-3.5 w-3.5" /> {recipe.product_name}
        <Tag color={recipe.product_type === "ready" ? "success" : "processing"}>
          {t(`enums.orderType.${recipe.product_type}`)}
        </Tag>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t("recipes.fieldYieldQty"), value: `${recipe.yield_qty} ${recipe.yield_unit_abbr}` },
          { label: t("recipes.fieldCost"), value: `${formatCurrency(recipe.estimated_cost_per_batch, locale)}/${t("recipes.batch")}` },
          { label: t("recipes.fieldDuration"), value: `${hours > 0 ? t("recipes.hoursShort", { n: hours }) + " " : ""}${mins > 0 ? t("recipes.minutesShort", { n: mins }) : "—"}` },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-gray-50 p-2.5 text-center">
            <p className="text-sm text-gray-400">{m.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-brown-900">{m.value}</p>
          </div>
        ))}
      </div>

      {recipe.note && <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{recipe.note}</p>}

      <Divider>{t("recipes.componentsUsedTitle")}</Divider>
      {recipe.components.map((ref) => (
        <div key={ref.component_id} className="flex items-center gap-2.5 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-violet-700">{ref.component_name}</p>
            <p className="text-sm text-violet-400">{t("recipes.componentTag")}</p>
          </div>
          <span className="text-sm font-semibold text-violet-600">× {ref.quantity}</span>
        </div>
      ))}
      {recipe.ingredients.map((ing) => (
        <div key={ing.ingredient_id} className="flex items-center gap-2.5 rounded-lg border border-gray-100 px-3 py-2">
          <span className="flex-1 text-sm text-gray-700">{ing.ingredient_name}</span>
          <span className="text-sm font-medium text-gray-500">{ing.quantity} {ing.unit_abbr}</span>
        </div>
      ))}
      {recipe.components.length === 0 && recipe.ingredients.length === 0 && (
        <p className="text-sm text-gray-400">{t("recipes.noIngredients")}</p>
      )}

      <Divider>{t("recipes.stepsTitle")}</Divider>
      {recipe.steps.length === 0 ? (
        <p className="text-sm text-gray-400">{t("recipes.noSteps")}</p>
      ) : (
        <Steps
          direction="vertical"
          size="small"
          current={recipe.steps.length}
          items={recipe.steps.map((s) => ({
            title: <span className="text-sm font-medium">{s.title}</span>,
            description: (
              <span className="text-sm text-gray-400">
                {s.description}
                {s.duration_minutes ? ` · ${t("recipes.stepMinutesValue", { n: s.duration_minutes })}` : ""}
              </span>
            ),
          }))}
        />
      )}
    </div>
  );
}
