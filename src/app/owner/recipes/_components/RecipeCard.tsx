"use client";
// การ์ดสูตรหลัก 1 สูตร — ผูกกับสินค้า แสดงส่วนประกอบ (สูตรส่วนประกอบ + วัตถุดิบตรง) แบบย่อ
import { useTranslations, useLocale } from "next-intl";
import { LinkIcon, EyeIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { Button, Card, Tag } from "@/components/base";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { Recipe } from "@/types/recipe";

export function RecipeCard({
  recipe,
  canUpdate,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  recipe: Recipe;
  canUpdate: boolean;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const hours = Math.floor(recipe.duration_minutes / 60);
  const mins = recipe.duration_minutes % 60;
  const durationText = `${hours > 0 ? t("recipes.hoursShort", { n: hours }) + " " : ""}${mins > 0 ? t("recipes.minutesShort", { n: mins }) : ""}`.trim();
  const extraIngredients = Math.max(0, recipe.ingredients.length - 2);

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="border-b border-gray-100 px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-violet-50 text-lg">📖</div>
            <div>
              <p className="text-sm font-semibold text-brown-900">{recipe.recipe_name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-400">
                <LinkIcon className="h-3 w-3" /> {recipe.product_name}
              </p>
            </div>
          </div>
          <Tag color={recipe.product_type === "ready" ? "success" : "processing"}>
            {t(`enums.orderType.${recipe.product_type}`)}
          </Tag>
        </div>
      </div>

      <div className="flex-1 px-3.5 py-2.5">
        <p className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-gray-400">{t("recipes.componentsUsedTitle")}</p>
        {recipe.components.length === 0 && recipe.ingredients.length === 0 && (
          <p className="text-sm text-gray-400">{t("recipes.noIngredients")}</p>
        )}
        {recipe.components.map((ref) => (
          <div key={ref.component_id} className="mb-1 flex items-center gap-1.5 rounded bg-violet-50 px-2 py-1 text-sm text-violet-700">
            <span className="font-medium">{ref.component_name}</span>
            <span className="ml-auto">× {ref.quantity}</span>
          </div>
        ))}
        {recipe.ingredients.slice(0, 2).map((ing) => (
          <div key={ing.ingredient_id} className="mb-0.5 flex items-center gap-1.5 text-sm text-gray-500">
            <span className="h-1 w-1 shrink-0 rounded-full bg-gray-300" />
            <span className="flex-1 truncate">{ing.ingredient_name}</span>
            <span className="text-gray-400">{ing.quantity} {ing.unit_abbr}</span>
          </div>
        ))}
        {extraIngredients > 0 && <p className="text-sm text-gray-400">{t("recipes.moreItems", { n: extraIngredients })}</p>}
      </div>

      <div className="flex items-center gap-3 border-t border-b border-gray-100 bg-gray-50 px-3.5 py-1.5 text-sm text-gray-500">
        <span>{formatCurrency(recipe.estimated_cost_per_batch, locale)}/{t("recipes.batch")}</span>
        <span>{recipe.yield_qty} {recipe.yield_unit_abbr}</span>
        {durationText && <span>{durationText}</span>}
      </div>

      <div className="flex items-center justify-between px-3.5 py-2">
        <span className="text-sm text-gray-400">{t("recipes.updatedAt", { date: formatDate(recipe.updated_at, locale) })}</span>
        <div className="flex items-center gap-1.5">
          <Button size="small" type="text" icon={<EyeIcon className="h-3.5 w-3.5" />} onClick={onView} aria-label={t("common.view")} />
          {canUpdate && (
            <Button size="small" type="text" icon={<PencilSquareIcon className="h-3.5 w-3.5" />} onClick={onEdit} aria-label={t("common.edit")} />
          )}
          {canDelete && (
            <ConfirmDeletePopup title={t("recipes.deleteRecipeConfirm", { name: recipe.recipe_name })} onConfirm={onDelete}>
              <Button size="small" type="text" danger>{t("common.delete")}</Button>
            </ConfirmDeletePopup>
          )}
        </div>
      </div>
    </Card>
  );
}
