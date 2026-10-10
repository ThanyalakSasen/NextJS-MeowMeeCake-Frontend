"use client";
// ─────────────────────────────────────────────────────────────
// การ์ด "ตัวเลือกสินค้า" ในหน้าแก้สินค้า — presentational ล้วน (ข้อมูล/handler จาก useCustomizationEditor)
// UX ยกจาก FrontOffice src/app/components/products/ProductCustomizationEditor.tsx
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Button, Card, Input, InputNumber, Select, Switch, EmptyState } from "@/components/base";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { actionIcon } from "@/components/shared/actions";
import type { useCustomizationEditor } from "../useCustomizationEditor";
import { groupRuleOf, type GroupRow, type OptionRow } from "../customizationForm";

type VM = ReturnType<typeof useCustomizationEditor>;

export function CustomizationEditor(vm: VM) {
  const t = useTranslations();

  return (
    <Card className="flex flex-col gap-5 p-5">
      <div>
        <h2 className="m-0 text-base font-semibold text-brown-900">{t("customization.title")}</h2>
        <p className="m-0 mt-1 text-sm text-gray-600">{t("customization.description")}</p>
      </div>

      {vm.isLoading ? (
        <LoadingSpin className="py-6" />
      ) : vm.isError ? (
        <LoadFailed className="flex flex-col items-center gap-3 py-4" onRetry={vm.refetch} />
      ) : (
        <>
          {/* ── กลุ่มตัวเลือก ── */}
          <section className="flex flex-col gap-3">
            <div>
              <p className="m-0 text-sm font-semibold text-brown-800">{t("customization.groups")}</p>
              <p className="m-0 text-xs text-gray-500">{t("customization.groupsHint")}</p>
            </div>
            {vm.groups.length === 0 && <EmptyState description={t("customization.noGroups")} />}
            {vm.groups.map((g, gi) => (
              <GroupCard key={g.key} vm={vm} group={g} index={gi} />
            ))}
            {vm.canEdit && vm.groups.length < vm.limits.maxGroups && (
              <Button className="w-fit" icon={actionIcon("add", "small")} onClick={vm.addGroup}>
                {t("customization.addGroup")}
              </Button>
            )}
          </section>

          {/* ── ออปชันเสริม ── */}
          <section className="flex flex-col gap-3 border-t border-gray-100 pt-4">
            <div>
              <p className="m-0 text-sm font-semibold text-brown-800">{t("customization.options")}</p>
              <p className="m-0 text-xs text-gray-500">{t("customization.optionsHint")}</p>
            </div>
            {vm.options.length === 0 && <EmptyState description={t("customization.noOptions")} />}
            {vm.options.map((o, i) => (
              <OptionCard key={o.key} vm={vm} option={o} index={i} />
            ))}
            {vm.canEdit && vm.options.length < vm.limits.maxOptions && (
              <Button className="w-fit" icon={actionIcon("add", "small")} onClick={vm.addOption}>
                {t("customization.addOption")}
              </Button>
            )}
          </section>

          {vm.dirty && vm.problems.length > 0 && (
            <ul className="m-0 flex flex-col gap-1 rounded-lg border border-danger/30 bg-danger/5 py-2 pl-6 pr-3 text-sm text-danger">
              {vm.problems.map((p, i) => (
                <li key={i}>{t(`customization.${p.key}` as Parameters<typeof t>[0], p.params)}</li>
              ))}
            </ul>
          )}

          {vm.canEdit && (
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
              <Button
                type="primary"
                icon={actionIcon("save")}
                loading={vm.saving}
                disabled={!vm.dirty || vm.problems.length > 0}
                onClick={vm.onSave}
              >
                {t("customization.save")}
              </Button>
              {vm.dirty && (
                <Button icon={actionIcon("reset")} disabled={vm.saving} onClick={vm.onDiscard}>
                  {t("customization.discard")}
                </Button>
              )}
              {vm.dirty && <span className="text-xs text-amber-700">{t("customization.unsaved")}</span>}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

/** ปุ่มเลื่อนขึ้น/ลง/ลบ ของ 1 แถว */
function RowTools({
  index, total, label, disabled, onMove, onRemove,
}: {
  index: number;
  total: number;
  label: string;
  disabled: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const t = useTranslations();
  if (disabled) return null;
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button size="small" icon={<ChevronUpIcon className="h-3.5 w-3.5" />} disabled={index === 0}
        aria-label={t("customization.moveUp", { name: label })} onClick={() => onMove(-1)} />
      <Button size="small" icon={<ChevronDownIcon className="h-3.5 w-3.5" />} disabled={index === total - 1}
        aria-label={t("customization.moveDown", { name: label })} onClick={() => onMove(1)} />
      <Button size="small" danger icon={actionIcon("delete", "small")}
        aria-label={t("customization.remove", { name: label })} onClick={onRemove} />
    </div>
  );
}

function GroupCard({ vm, group: g, index }: { vm: VM; group: GroupRow; index: number }) {
  const t = useTranslations();
  const rule = groupRuleOf(g);
  const ro = !vm.canEdit;
  const label = g.name || t("customization.groupN", { n: index + 1 });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3">
      <div className="flex items-center gap-2">
        <Input
          value={g.name}
          disabled={ro}
          maxLength={vm.limits.maxName}
          placeholder={t("customization.groupNamePlaceholder")}
          aria-label={t("customization.groupName")}
          onChange={(e) => vm.setGroup(g.key, { name: e.target.value })}
        />
        <RowTools index={index} total={vm.groups.length} label={label} disabled={ro}
          onMove={(d) => vm.moveGroup(index, d)} onRemove={() => vm.removeGroup(g.key)} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700">
        <label className="flex items-center gap-2">
          {t("customization.minSelect")}
          <InputNumber size="small" min={0} max={vm.limits.maxVariantsPerGroup} precision={0} value={g.min} disabled={ro}
            style={{ width: 72 }} onChange={(v) => vm.setGroup(g.key, { min: v === null ? null : Number(v) })} />
        </label>
        <label className="flex items-center gap-2">
          {t("customization.maxSelect")}
          <InputNumber size="small" min={1} max={vm.limits.maxVariantsPerGroup} precision={0} value={g.max} disabled={ro}
            style={{ width: 72 }} onChange={(v) => vm.setGroup(g.key, { max: v === null ? null : Number(v) })} />
        </label>
        <span className="text-xs text-gray-500">
          {rule.required ? t("customization.required") : t("customization.optional")} ·{" "}
          {rule.single ? t("customization.single") : t("customization.multiple", { n: rule.max })}
        </span>
      </div>

      <div className="flex flex-col gap-2 border-l-2 border-brown-100 pl-3">
        {g.variants.map((v, vi) => (
          <div key={v.key} className="flex items-center gap-2">
            <Input
              size="small"
              value={v.name}
              disabled={ro}
              maxLength={vm.limits.maxName}
              placeholder={t("customization.variantNamePlaceholder")}
              aria-label={t("customization.variantName")}
              onChange={(e) => vm.setVariant(g.key, v.key, { name: e.target.value })}
            />
            <InputNumber
              size="small"
              min={0}
              max={vm.limits.maxPrice}
              value={v.price}
              disabled={ro}
              prefix="+"
              suffix={t("customization.currency")}
              style={{ width: 130 }}
              aria-label={t("customization.extraPrice")}
              onChange={(val) => vm.setVariant(g.key, v.key, { price: val === null ? null : Number(val) })}
            />
            <RowTools index={vi} total={g.variants.length} label={v.name || String(vi + 1)} disabled={ro}
              onMove={(d) => vm.moveVariant(g.key, vi, d)} onRemove={() => vm.removeVariant(g.key, v.key)} />
          </div>
        ))}
        {!ro && g.variants.length < vm.limits.maxVariantsPerGroup && (
          <Button size="small" type="link" className="w-fit !px-0" icon={actionIcon("add", "small")} onClick={() => vm.addVariant(g.key)}>
            {t("customization.addVariant")}
          </Button>
        )}
      </div>
    </div>
  );
}

function OptionCard({ vm, option: o, index }: { vm: VM; option: OptionRow; index: number }) {
  const t = useTranslations();
  const ro = !vm.canEdit;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3">
      <div className="flex items-center gap-2">
        <Input
          value={o.name}
          disabled={ro}
          maxLength={vm.limits.maxName}
          placeholder={t("customization.optionNamePlaceholder")}
          aria-label={t("customization.optionName")}
          onChange={(e) => vm.setOption(o.key, { name: e.target.value })}
        />
        <InputNumber
          min={0}
          max={vm.limits.maxPrice}
          value={o.price}
          disabled={ro}
          prefix="+"
          suffix={t("customization.currency")}
          style={{ width: 130 }}
          aria-label={t("customization.extraPrice")}
          onChange={(val) => vm.setOption(o.key, { price: val === null ? null : Number(val) })}
        />
        <RowTools index={index} total={vm.options.length} label={o.name || String(index + 1)} disabled={ro}
          onMove={(d) => vm.moveOption(index, d)} onRemove={() => vm.removeOption(o.key)} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700">
        <Select
          size="small"
          value={o.isText ? "text" : "check"}
          disabled={ro}
          style={{ width: 150 }}
          aria-label={t("customization.optionType")}
          options={[
            { value: "check", label: t("customization.typeCheck") },
            { value: "text", label: t("customization.typeText") },
          ]}
          onChange={(v) => vm.setOption(o.key, { isText: v === "text" })}
        />
        {o.isText && (
          <label className="flex items-center gap-2">
            {t("customization.maxLength")}
            <InputNumber size="small" min={1} max={vm.limits.maxTextLimit} precision={0} value={o.maxLength} disabled={ro}
              style={{ width: 80 }} onChange={(v) => vm.setOption(o.key, { maxLength: v === null ? null : Number(v) })} />
          </label>
        )}
        <label className="flex items-center gap-2">
          <Switch size="small" checked={o.required} disabled={ro} onChange={(v) => vm.setOption(o.key, { required: v })} />
          {o.isText ? t("customization.requiredText") : t("customization.requiredCheck")}
        </label>
      </div>
    </div>
  );
}
