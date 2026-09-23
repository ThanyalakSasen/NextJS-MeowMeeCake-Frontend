"use client";
// การ์ดสูตรหลัก 1 สูตร — ผูกกับสินค้า แสดงส่วนประกอบ (สูตรส่วนประกอบ + วัตถุดิบตรง) แบบย่อ
import { useTranslations, useLocale } from "next-intl";
import { LinkIcon, EyeIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@/components/base";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { Recipe } from "@/types/recipe";
import { EditButton, DeleteButton } from "@/components/shared/actions";

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
  // การ์ดสูงเท่ากันทุกใบ (ข้ามแถวด้วย) — ทุกส่วนที่ยาวได้ถูกจำกัดเป็นจำนวน "ช่อง" ตายตัว:
  //   ชื่อสูตร 2 บรรทัด (เผื่อที่เสมอ) · ชื่อสินค้า 1 บรรทัด · ส่วนประกอบ+วัตถุดิบรวมกันไม่เกิน MAX_ITEM_ROWS แถว
  //   ที่สูงเท่ากันทุกแถว · บรรทัด "+N รายการอื่น" เผื่อที่เสมอ · แถวต้นทุน/ปริมาณ/เวลา 1 บรรทัด
  // รายการครบดูได้จากปุ่มดูรายละเอียด (onView)
  const MAX_ITEM_ROWS = 3;
  const shownComponents = recipe.components.slice(0, MAX_ITEM_ROWS);
  const shownIngredients = recipe.ingredients.slice(0, MAX_ITEM_ROWS - shownComponents.length);
  const hiddenCount = recipe.components.length + recipe.ingredients.length - shownComponents.length - shownIngredients.length;
  const isEmpty = recipe.components.length === 0 && recipe.ingredients.length === 0;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-gray-100 px-3.5 py-3">
        {/* items-start: ไอคอนอยู่มุมซ้ายบนเสมอ ไม่ถูกจัดกึ่งกลางตามความสูงของชื่อ */}
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-violet-50 text-lg">📖</div>
          {/* ชื่อสินค้าต่อใต้ชื่อสูตรทันที (ไม่มีช่องว่างคั่น) — ที่เผื่อไว้สำหรับชื่อสูตรบรรทัดที่ 2 ย้ายไปอยู่ท้ายส่วนหัวแทน
              min-h = ชื่อสูตร 2 บรรทัด (2 × 1.25rem) + mt-0.5 (0.125rem) + ชื่อสินค้า 1 บรรทัด (1.25rem) = 3.875rem */}
          <div className="min-h-[3.875rem] min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold leading-5 text-brown-900" title={recipe.recipe_name}>
              {recipe.recipe_name}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-sm leading-5 text-gray-400" title={recipe.product_name}>
              <LinkIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{recipe.product_name}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3.5 py-2.5">
        <p className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-gray-400">{t("recipes.componentsUsedTitle")}</p>
        {/* ช่องรายการสูงคงที่ = MAX_ITEM_ROWS × h-7 (แม้มีน้อยกว่า / ไม่มีเลย) */}
        <div className="flex h-21 flex-col">
          {isEmpty && <p className="flex h-7 items-center text-sm text-gray-400">{t("recipes.noIngredients")}</p>}
          {shownComponents.map((ref) => (
            <div key={ref.component_id} className="flex h-7 shrink-0 items-center py-0.5">
              <div className="flex h-full w-full items-center gap-1.5 rounded bg-violet-50 px-2 text-sm text-violet-700" title={ref.component_name}>
                <span className="truncate font-medium">{ref.component_name}</span>
                <span className="ml-auto shrink-0">× {ref.quantity}</span>
              </div>
            </div>
          ))}
          {shownIngredients.map((ing) => (
            <div key={ing.ingredient_id} className="flex h-7 shrink-0 items-center gap-1.5 text-sm text-gray-500">
              <span className="h-1 w-1 shrink-0 rounded-full bg-gray-300" />
              <span className="flex-1 truncate" title={ing.ingredient_name}>{ing.ingredient_name}</span>
              <span className="shrink-0 text-gray-400">{ing.quantity} {ing.unit_abbr}</span>
            </div>
          ))}
        </div>
        {/* เผื่อที่บรรทัดนี้เสมอ (h-5) — มีหรือไม่มีรายการที่ซ่อนอยู่ การ์ดก็สูงเท่ากัน */}
        <p className="h-5 text-sm leading-5 text-gray-400">
          {hiddenCount > 0 && t("recipes.moreItems", { n: hiddenCount })}
        </p>
      </div>

      <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap border-t border-b border-gray-100 bg-gray-50 px-3.5 py-1.5 text-sm text-gray-500">
        <span>{formatCurrency(recipe.estimated_cost_per_batch, locale)}/{t("recipes.batch")}</span>
        <span className="truncate">{recipe.yield_qty} {recipe.yield_unit_abbr}</span>
        {durationText && <span>{durationText}</span>}
      </div>

      <div className="flex items-center justify-between px-3.5 py-2">
        <span className="text-sm text-gray-400">{t("recipes.updatedAt", { date: formatDate(recipe.updated_at, locale) })}</span>
        <div className="flex items-center gap-1.5">
          <Button size="small" type="text" icon={<EyeIcon className="h-3.5 w-3.5" />} onClick={onView} aria-label={t("common.view")} />
          {canUpdate && (
            <EditButton size="small" type="text" onClick={onEdit} />
          )}
          {canDelete && (
            <ConfirmDeletePopup title={t("recipes.deleteRecipeConfirm", { name: recipe.recipe_name })} onConfirm={onDelete}>
              <DeleteButton size="small" type="text" />
            </ConfirmDeletePopup>
          )}
        </div>
      </div>
    </Card>
  );
}
