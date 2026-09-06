"use client";
// แถวไดนามิก "ขั้นตอนการทำ" — ใช้ร่วมทั้ง MainRecipeModal และ ComponentFormModal
import { useTranslations } from "next-intl";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Input, TextArea, InputNumber } from "@/components/base";
import type { RecipeStep } from "@/types/recipeShared";

export function StepEditor({
  steps,
  onChange,
}: {
  steps: RecipeStep[];
  onChange: (steps: RecipeStep[]) => void;
}) {
  const t = useTranslations();

  const add = () => onChange([...steps, { order: steps.length + 1, title: "", description: "", duration_minutes: null }]);
  const remove = (i: number) =>
    onChange(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })));
  const update = (i: number, patch: Partial<RecipeStep>) =>
    onChange(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-2">
          <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brown-800 text-xs font-bold text-white">
            {step.order}
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Input
              size="small"
              value={step.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder={t("recipes.stepTitlePlaceholder")}
            />
            <TextArea
              rows={2}
              value={step.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder={t("recipes.stepDescriptionPlaceholder")}
            />
            <div className="flex items-center gap-2">
              <InputNumber
                size="small"
                className="!w-28"
                min={0}
                value={step.duration_minutes ?? undefined}
                onChange={(v) => update(i, { duration_minutes: v === null || v === undefined ? null : Number(v) })}
                placeholder="0"
              />
              <span className="text-xs text-gray-400">{t("recipes.stepMinutes")}</span>
            </div>
          </div>
          <Button
            size="small" type="text" danger
            icon={<XMarkIcon className="h-3.5 w-3.5" />}
            onClick={() => remove(i)}
            aria-label={t("recipes.removeStep")}
          />
        </div>
      ))}
      <Button size="small" icon={<PlusIcon className="h-3.5 w-3.5" />} onClick={add} className="self-start">
        {t("recipes.addStep")}
      </Button>
    </div>
  );
}
