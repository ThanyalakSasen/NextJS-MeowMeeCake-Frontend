"use client";
// ─────────────────────────────────────────────────────────────
// เปลี่ยนสินค้าในพรีออเดอร์ — ร้านโทรคุยกับลูกค้าแล้วแก้รายการให้ (เฉพาะรอบที่ยังเปิด/ตั้งเวลาไว้)
//   รายการเดิม: ปรับจำนวน / เอาออก (ราคาเดิมตอนสั่ง) · เพิ่มสินค้าอื่นในรอบเดียวกัน (ราคาปัจจุบัน + ตัวเลือก)
//   ชำระแล้ว: ยอดสินค้าใหม่ต้องไม่เกินยอดเดิม — ส่วนต่างเข้า "รอโอนคืน" (backend หักส่วนลดตามสัดส่วน)
// state การแก้อยู่ในหน้าต่างนี้ · โหลดตัวเลือกสินค้าผ่าน loadCustomization จาก ViewModel
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { Modal } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { Button, InputNumber, Select } from "@/components/base";
import { actionIcon, modalButtonIcons } from "@/components/shared/actions";
import { formatCurrency } from "@/i18n/format";
import { hasCustomization, toSelection, type Picked } from "@/lib/customizationSelection";
import type { Product } from "@/types/product";
import type { ProductCustomization } from "@/types/productCustomization";
import type { EditPreorderItemsInput, Preorder } from "@/types/preorder";
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
  variant_ids: string[];
  selected_options: { option_id: string; text_value: string | null }[];
}

export function EditPreorderItemsModal({
  order,
  roundItems,
  roundItemsLoading,
  saving,
  loadCustomization,
  onClose,
  onSubmit,
}: {
  order: Preorder;
  roundItems: PreorderRoundItem[];
  roundItemsLoading: boolean;
  saving: boolean;
  /** null = โหลดไม่สำเร็จ (VM แจ้ง error แล้ว) */
  loadCustomization: (productId: string) => Promise<ProductCustomization | null>;
  onClose: () => void;
  onSubmit: (input: EditPreorderItemsInput) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const money = (n: number) => formatCurrency(n, locale);
  const items = order.items ?? [];

  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(items.map((it) => [it._id, it.quantity])));
  const [added, setAdded] = useState<AddedLine[]>([]);
  const [picking, setPicking] = useState<{ item: PreorderRoundItem; customization: ProductCustomization } | null>(null);
  const [loadingPick, setLoadingPick] = useState(false);

  const kept = items.filter((it) => (qty[it._id] ?? 0) > 0);
  const newSubtotal = round2(
    kept.reduce((s, it) => s + it.unit_price * qty[it._id], 0) + added.reduce((s, l) => s + l.unit_price * l.quantity, 0),
  );
  const paid = order.payment_status === "paid";
  const over = paid && newSubtotal > order.subtotal;
  const changed = added.length > 0 || items.some((it) => (qty[it._id] ?? 0) !== it.quantity);
  const empty = kept.length + added.length === 0;
  const diff = round2(order.subtotal - newSubtotal);

  // สินค้าในรอบที่เพิ่มได้: เปิดขายอยู่และยังมีโควตา
  const options = roundItems
    .filter((r) => r.is_active && r.remaining_qty > 0)
    .map((r) => ({ value: r._id, label: `${r.product_name} · ${money(r.current_price)} · ${t("preorderRound.editItems.remaining", { n: r.remaining_qty })}` }));

  const addLine = (item: PreorderRoundItem, customization: ProductCustomization | null, picked: Picked | null) => {
    const sel = customization && picked ? toSelection(customization, picked) : null;
    setAdded((prev) => [
      ...prev,
      {
        key: `${item._id}#${sel?.key ?? ""}#${prev.length}`,
        round_item_id: item._id,
        name: item.product_name,
        extras: [sel?.variantLabel, ...(sel?.options ?? []).map((o) => (o.text_value ? `${o.option_name}: ${o.text_value}` : o.option_name))]
          .filter(Boolean)
          .join(" · ") || null,
        unit_price: round2(item.current_price + (sel?.extra ?? 0)),
        quantity: Math.max(1, item.min_order_qty),
        variant_ids: sel?.variantIds ?? [],
        selected_options: (sel?.options ?? []).map((o) => ({ option_id: o.option_id, text_value: o.text_value })),
      },
    ]);
  };

  const onPick = async (roundItemId: string) => {
    const item = roundItems.find((r) => r._id === roundItemId);
    if (!item) return;
    setLoadingPick(true);
    const customization = await loadCustomization(item.product_id);
    setLoadingPick(false);
    if (customization && hasCustomization(customization)) setPicking({ item, customization });
    else if (customization) addLine(item, null, null);
  };

  const submit = () =>
    onSubmit({
      keep: kept.map((it) => ({ item_id: it._id, quantity: qty[it._id] })),
      add: added.map((l) => ({
        round_item_id: l.round_item_id,
        quantity: l.quantity,
        variant_ids: l.variant_ids,
        selected_options: l.selected_options,
      })),
    });

  return (
    <>
      <Modal
        open
        title={t("preorderRound.editItems.title", { no: order.preorder_no })}
        onCancel={onClose}
        onOk={submit}
        confirmLoading={saving}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        okButtonProps={{ ...modalButtonIcons("save").okButtonProps, disabled: !changed || empty || over }}
        cancelButtonProps={modalButtonIcons("save").cancelButtonProps}
        width={600}
        destroyOnHidden
      >
        <div className="flex flex-col gap-4">
          <p className="m-0 text-sm text-gray-600">{t("preorderRound.editItems.hint")}</p>

          {/* รายการเดิม */}
          <section className="flex flex-col gap-2">
            <p className="m-0 text-sm font-semibold text-brown-800">{t("preorderRound.editItems.current")}</p>
            {items.map((it) => {
              const removed = (qty[it._id] ?? 0) === 0;
              return (
                <div key={it._id} className={`flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 ${removed ? "opacity-50" : ""}`}>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className={`m-0 font-medium text-gray-800 ${removed ? "line-through" : ""}`}>{it.product_name}</p>
                    {lineExtras(it).map((x) => (
                      <p key={x} className="m-0 text-xs text-gray-500">{x}</p>
                    ))}
                    <p className="m-0 text-xs text-gray-500">{money(it.unit_price)} / {t("preorderRound.editItems.unit")}</p>
                  </div>
                  {removed ? (
                    <Button size="small" onClick={() => setQty((q) => ({ ...q, [it._id]: it.quantity }))}>
                      {t("preorderRound.editItems.undoRemove")}
                    </Button>
                  ) : (
                    <>
                      <InputNumber
                        size="small"
                        min={1}
                        precision={0}
                        value={qty[it._id]}
                        onChange={(v) => setQty((q) => ({ ...q, [it._id]: Math.max(1, Number(v) || 1) }))}
                        className="!w-20"
                        aria-label={t("preorderRound.editItems.qty")}
                      />
                      <Button
                        size="small"
                        danger
                        type="text"
                        icon={actionIcon("delete", "small")}
                        aria-label={t("preorderRound.editItems.remove")}
                        onClick={() => setQty((q) => ({ ...q, [it._id]: 0 }))}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </section>

          {/* สินค้าที่เพิ่ม */}
          <section className="flex flex-col gap-2">
            <p className="m-0 text-sm font-semibold text-brown-800">{t("preorderRound.editItems.addTitle")}</p>
            {added.map((l) => (
              <div key={l.key} className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="m-0 font-medium text-gray-800">{l.name}</p>
                  {l.extras && <p className="m-0 text-xs text-gray-500">{l.extras}</p>}
                  <p className="m-0 text-xs text-gray-500">{money(l.unit_price)} / {t("preorderRound.editItems.unit")}</p>
                </div>
                <InputNumber
                  size="small"
                  min={1}
                  precision={0}
                  value={l.quantity}
                  onChange={(v) => setAdded((a) => a.map((x) => (x.key === l.key ? { ...x, quantity: Math.max(1, Number(v) || 1) } : x)))}
                  className="!w-20"
                  aria-label={t("preorderRound.editItems.qty")}
                />
                <Button
                  size="small"
                  danger
                  type="text"
                  icon={actionIcon("delete", "small")}
                  aria-label={t("preorderRound.editItems.remove")}
                  onClick={() => setAdded((a) => a.filter((x) => x.key !== l.key))}
                />
              </div>
            ))}
            <Select
              showSearch
              optionFilterProp="label"
              value={null}
              placeholder={t("preorderRound.editItems.addPlaceholder")}
              loading={roundItemsLoading || loadingPick}
              disabled={loadingPick}
              options={options}
              onChange={(v) => void onPick(v as string)}
              notFoundContent={t("preorderRound.editItems.noProducts")}
              aria-label={t("preorderRound.editItems.addPlaceholder")}
            />
          </section>

          {/* สรุปยอด */}
          <section className="flex flex-col gap-1 rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t(paid ? "preorderRound.editItems.paidGoods" : "preorderRound.editItems.oldGoods")}</span>
              <span className="text-gray-800">{money(order.subtotal)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-gray-700">{t("preorderRound.editItems.newGoods")}</span>
              <span className={over ? "text-danger" : "text-brown-800"}>{money(newSubtotal)}</span>
            </div>
            {over && <p className="m-0 text-xs text-danger">{t("preorderRound.editItems.overPaid", { amount: money(-diff) })}</p>}
            {paid && diff > 0 && <p className="m-0 text-xs text-amber-700">{t("preorderRound.editItems.refundNote", { amount: money(diff) })}</p>}
            {!paid && changed && <p className="m-0 text-xs text-gray-500">{t("preorderRound.editItems.unpaidNote")}</p>}
            {empty && <p className="m-0 text-xs text-danger">{t("preorderRound.editItems.empty")}</p>}
          </section>
        </div>
      </Modal>

      {picking && (
        <CustomizationPickerModal
          product={{ product_name_th: picking.item.product_name, product_price: picking.item.current_price, sale_price: null } as unknown as Product}
          customization={picking.customization}
          onCancel={() => setPicking(null)}
          onConfirm={(picked) => {
            addLine(picking.item, picking.customization, picked);
            setPicking(null);
          }}
        />
      )}
    </>
  );
}
