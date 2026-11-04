"use client";
// ─────────────────────────────────────────────────────────────
// เปลี่ยนสินค้าในพรีออเดอร์ — ร้านโทรคุยกับลูกค้าแล้วแก้รายการให้ (เฉพาะรอบที่ยังเปิด/ตั้งเวลาไว้) · 2 ขั้น:
//   1) แก้รายการ: ต่อบรรทัด = ปรับจำนวน / "เปลี่ยนเป็น" สินค้าอื่นในรอบ (แทนที่บรรทัดนั้น) / เอาออก · เพิ่มสินค้าอื่นได้
//   2) ตรวจสอบยอด: ยอดจริงจาก backend (POST /items/preview — ส่วนลดตามสัดส่วน · หักรอโอนคืน/รอชำระเพิ่มที่ค้าง · โควตา)
//      + ผลลัพธ์ (ไม่มีส่วนต่าง / ร้านโอนคืน / ลูกค้าชำระเพิ่ม / ยังไม่ชำระ) + ข้อความที่ลูกค้าจะได้รับ
//      ลูกค้าต้องชำระเพิ่ม = ต้องติ๊ก "ตกลงกับลูกค้าแล้ว" ก่อนยืนยัน (ส่ง allow_extra_payment)
// เดิมเป็นหน้าเดียว + ยอดประมาณที่หน้าเว็บคิดเอง (ไม่ตรงกับที่ backend บันทึกเมื่อมีส่วนลด) + ป๊อปอัปยืนยันซ้อน
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { Checkbox, Modal, Steps } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { Button, InputNumber, Select } from "@/components/base";
import { actionIcon } from "@/components/shared/actions";
import { formatCurrency } from "@/i18n/format";
import { hasCustomization, toSelection, type Picked } from "@/lib/customizationSelection";
import type { Product } from "@/types/product";
import type { ProductCustomization } from "@/types/productCustomization";
import type { EditPreorderItemsInput, Preorder, PreorderEditPreview } from "@/types/preorder";
import type { PreorderRoundItem } from "@/types/preorderRound";
import { CustomizationPickerModal } from "../../OrderInStore/_components/CustomizationPickerModal";
import { lineExtras } from "../useRoundDashboardViewModel";

const round2 = (n: number) => Math.round(n * 100) / 100;

interface AddedLine {
  key: string;
  round_item_id: string;
  name: string;
  extras: string | null;
  unit_price: number;
  quantity: number;
  min_qty: number;
  variant_ids: string[];
  selected_options: { option_id: string; text_value: string | null }[];
  /** เปลี่ยนแทนบรรทัดเดิมนี้ (item _id) · ไม่มี = เพิ่มสินค้าเฉย ๆ */
  replaces: string | null;
}

const STATUS_STYLE: Record<PreorderEditPreview["lines"][number]["status"], string> = {
  kept: "bg-gray-100 text-gray-700",
  changed: "bg-amber-50 text-amber-800",
  removed: "bg-red-50 text-red-700",
  added: "bg-green-50 text-green-800",
};

export function EditPreorderItemsModal({
  order,
  roundItems,
  roundItemsLoading,
  saving,
  previewing,
  loadCustomization,
  onPreview,
  onClose,
  onSubmit,
}: {
  order: Preorder;
  roundItems: PreorderRoundItem[];
  roundItemsLoading: boolean;
  saving: boolean;
  previewing: boolean;
  /** null = โหลดไม่สำเร็จ (VM แจ้ง error แล้ว) */
  loadCustomization: (productId: string) => Promise<ProductCustomization | null>;
  /** null = ตรวจยอดไม่สำเร็จ (VM แจ้ง error แล้ว) */
  onPreview: (input: EditPreorderItemsInput) => Promise<PreorderEditPreview | null>;
  onClose: () => void;
  onSubmit: (input: EditPreorderItemsInput) => void;
}) {
  const t = useTranslations("preorderRound.editItems");
  const tc = useTranslations("common");
  const locale = useLocale();
  const money = (n: number) => formatCurrency(n, locale);
  const items = order.items ?? [];

  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(items.map((it) => [it._id, it.quantity])));
  const [added, setAdded] = useState<AddedLine[]>([]);
  // บรรทัดที่กำลังเลือกสินค้ามาแทน
  const [swapping, setSwapping] = useState<string | null>(null);
  const [picking, setPicking] = useState<{ item: PreorderRoundItem; customization: ProductCustomization; replaces: string | null } | null>(null);
  const [loadingPick, setLoadingPick] = useState(false);
  const [preview, setPreview] = useState<PreorderEditPreview | null>(null);
  const [agreed, setAgreed] = useState(false);

  const kept = items.filter((it) => (qty[it._id] ?? 0) > 0);
  const newSubtotal = round2(
    kept.reduce((s, it) => s + it.unit_price * qty[it._id], 0) + added.reduce((s, l) => s + l.unit_price * l.quantity, 0),
  );
  const changed = added.length > 0 || items.some((it) => (qty[it._id] ?? 0) !== it.quantity);
  const empty = kept.length + added.length === 0;

  // สินค้าในรอบที่เลือกได้: เปิดขายอยู่และยังมีโควตา
  const options = roundItems
    .filter((r) => r.is_active && r.remaining_qty > 0)
    .map((r) => ({ value: r._id, label: `${r.product_name} · ${money(r.current_price)} · ${t("remaining", { n: r.remaining_qty })}` }));

  const addLine = (item: PreorderRoundItem, customization: ProductCustomization | null, picked: Picked | null, replaces: string | null) => {
    const sel = customization && picked ? toSelection(customization, picked) : null;
    const old = replaces ? items.find((it) => it._id === replaces) : null;
    // เปลี่ยนแทนบรรทัดเดิม = ขั้นต่ำ 1 (ตกลงกับลูกค้าแล้ว ไม่ใช้ขั้นต่ำต่อรายการ) · เพิ่มสินค้าใหม่ = เตือนขั้นต่ำตามปกติ
    const minQty = replaces ? 1 : item.effective_min_qty;
    setAdded((prev) => [
      ...prev,
      {
        key: `${item._id}#${sel?.key ?? ""}#${prev.length}#${replaces ?? ""}`,
        round_item_id: item._id,
        name: item.product_name,
        extras: [sel?.variantLabel, ...(sel?.options ?? []).map((o) => (o.text_value ? `${o.option_name}: ${o.text_value}` : o.option_name))]
          .filter(Boolean)
          .join(" · ") || null,
        unit_price: round2(item.current_price + (sel?.extra ?? 0)),
        // เปลี่ยนแทนบรรทัดเดิม = ตั้งจำนวนเท่าเดิมไว้ก่อน
        quantity: replaces ? Math.max(1, old?.quantity ?? 1) : Math.max(minQty, 1),
        min_qty: minQty,
        variant_ids: sel?.variantIds ?? [],
        selected_options: (sel?.options ?? []).map((o) => ({ option_id: o.option_id, text_value: o.text_value })),
        replaces,
      },
    ]);
    if (replaces) setQty((q) => ({ ...q, [replaces]: 0 }));
    setSwapping(null);
  };

  const onPick = async (roundItemId: string, replaces: string | null) => {
    const item = roundItems.find((r) => r._id === roundItemId);
    if (!item) return;
    setLoadingPick(true);
    const customization = await loadCustomization(item.product_id);
    setLoadingPick(false);
    if (customization && hasCustomization(customization)) setPicking({ item, customization, replaces });
    else if (customization) addLine(item, null, null, replaces);
  };

  const undoSwap = (itemId: string) => {
    const old = items.find((it) => it._id === itemId);
    setAdded((a) => a.filter((l) => l.replaces !== itemId));
    setQty((q) => ({ ...q, [itemId]: old?.quantity ?? 1 }));
  };

  const setAddedQty = (key: string, v: number | string | null) =>
    setAdded((a) => a.map((x) => (x.key === key ? { ...x, quantity: Math.max(1, Number(v) || 1) } : x)));

  const input = (): EditPreorderItemsInput => ({
    keep: kept.map((it) => ({ item_id: it._id, quantity: qty[it._id] })),
    add: added.map((l) => ({
      round_item_id: l.round_item_id,
      quantity: l.quantity,
      variant_ids: l.variant_ids,
      selected_options: l.selected_options,
    })),
  });

  const goReview = async () => {
    const pv = await onPreview(input());
    if (!pv) return;
    setAgreed(false);
    setPreview(pv);
  };

  // เตือนเฉพาะสินค้าที่เพิ่มใหม่ — สินค้าที่เปลี่ยนแทนบรรทัดเดิมขั้นต่ำ 1
  const belowMin = (preview?.below_min ?? []).filter((b) => added.some((l) => !l.replaces && l.name === b.name && l.quantity < l.min_qty));
  const isExtra = preview?.outcome === "extra";
  const blocked = !!preview && (preview.quota_errors.length > 0 || (isExtra && !agreed));
  const submit = () => onSubmit({ ...input(), ...(isExtra ? { allow_extra_payment: true } : {}) });

  const addedLine = (l: AddedLine, onRemove: () => void, removeLabel: string) => (
    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
      <div className="min-w-0 flex-1 text-sm">
        <p className="m-0 font-medium text-gray-800">{l.name}</p>
        {l.extras && <p className="m-0 text-xs text-gray-500">{l.extras}</p>}
        <p className="m-0 text-xs text-gray-500">{money(l.unit_price)} / {t("unit")}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <InputNumber size="small" min={1} precision={0} value={l.quantity} onChange={(v) => setAddedQty(l.key, v)} className="!w-20" aria-label={t("qty")} />
        {/* ขั้นต่ำต่อรายการ (กติกาตอนลูกค้าสั่งเอง) — ร้านใส่ต่ำกว่าได้ เพราะตกลงกับลูกค้าแล้ว */}
        {l.min_qty > 1 && (
          <span className={`text-xs ${l.quantity < l.min_qty ? "font-medium text-amber-700" : "text-gray-500"}`}>
            {l.quantity < l.min_qty ? t("belowMin", { n: l.min_qty }) : t("minQty", { n: l.min_qty })}
          </span>
        )}
      </div>
      <Button size="small" danger type="text" icon={actionIcon("delete", "small")} aria-label={removeLabel} title={removeLabel} onClick={onRemove} />
    </div>
  );

  // ── ขั้นที่ 1: แก้รายการ ──
  const editStep = (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-gray-600">{t("hint")}</p>

      <section className="flex flex-col gap-2">
        <p className="m-0 text-sm font-semibold text-brown-800">{t("current")}</p>
        {items.map((it) => {
          const replacement = added.filter((l) => l.replaces === it._id);
          const removed = (qty[it._id] ?? 0) === 0;
          return (
            <div key={it._id} className="flex flex-col gap-2">
              <div className={`flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 ${removed ? "bg-gray-50" : ""}`}>
                <div className="min-w-0 flex-1 text-sm">
                  <p className={`m-0 font-medium ${removed ? "text-gray-500 line-through" : "text-gray-800"}`}>
                    {it.product_name} <span className="font-normal text-gray-500">×{it.quantity}</span>
                  </p>
                  {lineExtras(it).map((x) => (
                    <p key={x} className="m-0 text-xs text-gray-500">{x}</p>
                  ))}
                  <p className="m-0 text-xs text-gray-500">{money(it.unit_price)} / {t("unit")}</p>
                </div>
                {replacement.length > 0 ? (
                  <Button size="small" onClick={() => undoSwap(it._id)}>{t("undoSwap")}</Button>
                ) : removed ? (
                  <Button size="small" onClick={() => setQty((q) => ({ ...q, [it._id]: it.quantity }))}>{t("undoRemove")}</Button>
                ) : (
                  <div className="flex items-center gap-1">
                    <InputNumber
                      size="small"
                      min={1}
                      precision={0}
                      value={qty[it._id]}
                      onChange={(v) => setQty((q) => ({ ...q, [it._id]: Math.max(1, Number(v) || 1) }))}
                      className="!w-20"
                      aria-label={t("qty")}
                    />
                    <Button size="small" onClick={() => setSwapping(swapping === it._id ? null : it._id)}>{t("swap")}</Button>
                    <Button
                      size="small"
                      danger
                      type="text"
                      icon={actionIcon("delete", "small")}
                      aria-label={t("remove")}
                      title={t("remove")}
                      onClick={() => setQty((q) => ({ ...q, [it._id]: 0 }))}
                    />
                  </div>
                )}
              </div>

              {swapping === it._id && (
                <div className="ml-4 flex items-center gap-2">
                  <span className="shrink-0 text-xs font-medium text-gray-600">{t("swapTo")}</span>
                  <Select
                    showSearch
                    autoFocus
                    defaultOpen
                    optionFilterProp="label"
                    value={null}
                    className="min-w-0 flex-1"
                    placeholder={t("swapPlaceholder")}
                    loading={roundItemsLoading || loadingPick}
                    disabled={loadingPick}
                    options={options.filter((o) => o.value !== it.round_item_id)}
                    onChange={(v) => void onPick(v as string, it._id)}
                    notFoundContent={t("noProducts")}
                    aria-label={t("swapPlaceholder")}
                  />
                  <Button size="small" type="text" onClick={() => setSwapping(null)}>{tc("cancel")}</Button>
                </div>
              )}

              {replacement.map((l) => (
                <div key={l.key} className="ml-4 flex flex-col gap-1">
                  <span className="text-xs font-medium text-green-800">{t("swapTo")}</span>
                  {addedLine(l, () => undoSwap(it._id), t("undoSwap"))}
                </div>
              ))}
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-2">
        <p className="m-0 text-sm font-semibold text-brown-800">{t("addTitle")}</p>
        {added
          .filter((l) => !l.replaces)
          .map((l) => (
            <div key={l.key}>{addedLine(l, () => setAdded((a) => a.filter((x) => x.key !== l.key)), t("remove"))}</div>
          ))}
        <Select
          showSearch
          optionFilterProp="label"
          value={null}
          placeholder={t("addPlaceholder")}
          loading={roundItemsLoading || loadingPick}
          disabled={loadingPick}
          options={options}
          onChange={(v) => void onPick(v as string, null)}
          notFoundContent={t("noProducts")}
          aria-label={t("addPlaceholder")}
        />
      </section>

      <section className="flex flex-col gap-0.5 rounded-lg bg-gray-50 px-3 py-2 text-sm">
        <p className="m-0 font-medium text-gray-800">{t("estimate", { old: money(order.subtotal), next: money(newSubtotal) })}</p>
        <p className="m-0 text-xs text-gray-500">{t("estimateHint")}</p>
        {empty && <p className="m-0 text-xs text-danger">{t("empty")}</p>}
      </section>
    </div>
  );

  // ── ขั้นที่ 2: ตรวจสอบยอด ──
  const reviewStep = preview && (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-1.5">
        <p className="m-0 text-sm font-semibold text-brown-800">{t("linesTitle")}</p>
        {preview.lines.map((l, i) => (
          <div key={i} className="flex items-start justify-between gap-3 text-sm">
            <span className={l.status === "removed" ? "text-gray-500 line-through" : "text-gray-800"}>
              {l.name} ×{l.status === "removed" ? l.old_qty : l.new_qty}
              {l.extras.map((x) => (
                <span key={x} className="block text-xs text-gray-500">{x}</span>
              ))}
            </span>
            <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[l.status]}`}>
              {l.status === "changed" ? t("statusChanged", { from: l.old_qty, to: l.new_qty }) : t(`status.${l.status}`)}
            </span>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-200 text-sm">
        <div className="grid grid-cols-3 gap-2 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
          <span />
          <span className="text-right">{t("colBefore")}</span>
          <span className="text-right">{t("colAfter")}</span>
        </div>
        {(
          [
            ["rowSubtotal", "subtotal", 1],
            ["rowDiscount", "discount_amount", -1],
            ["rowDelivery", "delivery_fee", 1],
          ] as const
        ).map(([label, key, sign]) =>
          key !== "subtotal" && preview.before[key] === 0 && preview.after[key] === 0 ? null : (
            <div key={key} className="grid grid-cols-3 gap-2 px-3 py-1.5">
              <span className="text-gray-600">{t(label)}</span>
              <span className="text-right text-gray-500">{money(sign * preview.before[key])}</span>
              <span className="text-right text-gray-800">{money(sign * preview.after[key])}</span>
            </div>
          ),
        )}
        <div className="grid grid-cols-3 gap-2 border-t border-gray-200 px-3 py-2 font-semibold">
          <span className="text-gray-700">{t("rowTotal")}</span>
          <span className="text-right text-gray-500">{money(preview.before.total_amount)}</span>
          <span className="text-right text-brown-800">{money(preview.after.total_amount)}</span>
        </div>
      </section>

      {/* ผลของการเปลี่ยน */}
      {preview.outcome === "extra" ? (
        <section className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <p className="m-0 text-base font-bold">{t("outcomeExtra", { amount: money(preview.extra_due_after) })}</p>
          <p className="m-0 text-xs">{t("extraHint", { paid: money(preview.paid_amount) })}</p>
          <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
            <span className="text-sm font-medium text-amber-900">{t("extraAgree", { amount: money(preview.extra_due_after) })}</span>
          </Checkbox>
        </section>
      ) : preview.outcome === "refund" ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-900">
          <p className="m-0 text-base font-bold">{t("outcomeRefund", { amount: money(preview.refund) })}</p>
          <p className="m-0 text-xs">{t("refundHint")}</p>
        </section>
      ) : preview.outcome === "unpaid" ? (
        <section className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800">
          <p className="m-0 font-semibold">{t("outcomeUnpaid", { amount: money(preview.after.total_amount) })}</p>
        </section>
      ) : (
        <section className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-900">
          <p className="m-0 font-semibold">
            {preview.extra_due_after < order.extra_due_amount
              ? t("extraReduced", { amount: money(preview.extra_due_after) })
              : t("outcomeNone")}
          </p>
        </section>
      )}

      {belowMin.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p className="m-0 font-semibold">{t("belowMinTitle")}</p>
          {belowMin.map((b) => (
            <p key={b.name} className="m-0 text-xs">{t("belowMinLine", { name: b.name, qty: b.quantity, min: b.min_qty })}</p>
          ))}
        </section>
      )}

      {preview.quota_errors.length > 0 && (
        <section className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="m-0 font-semibold">{t("quotaTitle")}</p>
          {preview.quota_errors.map((e) => (
            <p key={e} className="m-0 text-xs">{e}</p>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-1">
        <p className="m-0 text-xs font-medium text-gray-600">{t("messageTitle")}</p>
        <p className="m-0 whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">{preview.customer_message}</p>
      </section>
    </div>
  );

  const footer = preview ? (
    <div className="flex flex-wrap justify-end gap-2">
      <Button icon={actionIcon("back")} disabled={saving} onClick={() => setPreview(null)}>{t("back")}</Button>
      <Button type="primary" icon={actionIcon("save")} loading={saving} disabled={blocked} onClick={submit}>
        {isExtra ? t("confirmExtra") : t("confirm")}
      </Button>
    </div>
  ) : (
    <div className="flex flex-wrap justify-end gap-2">
      <Button icon={actionIcon("cancel")} onClick={onClose}>{tc("cancel")}</Button>
      <Button type="primary" icon={actionIcon("next")} loading={previewing} disabled={!changed || empty || loadingPick} onClick={() => void goReview()}>
        {t("next")}
      </Button>
    </div>
  );

  return (
    <>
      <Modal open title={t("title", { no: order.preorder_no })} onCancel={onClose} footer={footer} width={620} destroyOnHidden maskClosable={false}>
        <Steps size="small" current={preview ? 1 : 0} className="!mb-4" items={[{ title: t("stepEdit") }, { title: t("stepReview") }]} />
        {preview ? reviewStep : editStep}
      </Modal>

      {picking && (
        <CustomizationPickerModal
          product={{ product_name_th: picking.item.product_name, product_price: picking.item.current_price, sale_price: null } as unknown as Product}
          customization={picking.customization}
          onCancel={() => setPicking(null)}
          onConfirm={(picked) => {
            addLine(picking.item, picking.customization, picked, picking.replaces);
            setPicking(null);
          }}
        />
      )}
    </>
  );
}
