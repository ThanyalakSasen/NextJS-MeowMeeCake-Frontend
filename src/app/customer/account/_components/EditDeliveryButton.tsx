"use client";
// ─────────────────────────────────────────────────────────────
// ปุ่ม "แก้ไขวิธีรับสินค้า / ที่อยู่" ในหน้าชำระเงิน (ขั้นที่ 3) — ย้อนกลับไปแก้บิลเดิมได้ (เลขเดิม · ผู้ใช้เลือก 2026-10-29)
// PATCH /shop/orders/{id}/delivery · /shop/preorders/{id}/delivery — ค่าส่ง + ยอดรวมคิดใหม่ฝั่ง server
// แสดงเฉพาะบิลที่ยังแก้ได้: ยังจ่ายได้ · ยังไม่ส่งสลิป · ไม่ได้ชำระรวมกับบิลอื่น (canEditDelivery) — server ตรวจซ้ำเสมอ
// ป๊อปอัป: เลือกจัดส่ง (ที่อยู่ในสมุด + ชื่อ/เบอร์ผู้รับ) หรือรับเอง (จุดรับ + วันรับ) แบบเดียวกับหน้ายืนยันคำสั่งซื้อ
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { FaMapMarkerAlt, FaPen, FaStore, FaTruck } from "react-icons/fa";
import ShopModal from "@/components/customer/ShopModal";
import PickupLocationPicker from "@/components/customer/PickupLocationPicker";
import { shopButton, shopButtonPrimary, shopInput } from "@/components/customer/shopStyles";
import { shopAddressesService } from "@/services/shopAddresses";
import { pickupLocationsService } from "@/services/pickupLocations";
import { shopOrdersService } from "@/services/shopOrders";
import { shopPreordersService } from "@/services/shopPreorders";
import type { ShopPaymentPage } from "@/services/shopPayments";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { DeliveryAddress, OrderType } from "@/types/order";
import { pickupLocationsKey, shopAddressesKey } from "../../lib/shopQueries";
import { preorderPickupDates } from "../../preorder/lib/preorderDates";

const PHONE_RE = /^0\d{8,9}$/;

/** บิลนี้ย้อนกลับไปแก้วิธีรับได้ไหม — ตามข้อมูลหน้าชำระเงิน (server ตรวจซ้ำ) */
export const canEditDelivery = (page: ShopPaymentPage | undefined) =>
  !!page && page.can_pay && !page.late_upload && !page.slip_url && !page.group_id && page.order_status === "pending";

export interface EditDeliveryBill {
  kind: "order" | "preorder";
  id: string;
  order_type: OrderType;
  delivery_address?: DeliveryAddress | null;
  /** พรีออเดอร์ — วันรับของรอบ (คิดวันที่เลือกรับได้ของจุดรับ) */
  roundPickupDate?: string | null;
}

export default function EditDeliveryButton({ bill, onSaved, className = shopButton }: { bill: EditDeliveryBill; onSaved: () => void; className?: string }) {
  const t = useTranslations("shop.editDelivery");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${className} inline-flex items-center gap-2`}>
        <FaPen className="text-xs" aria-hidden="true" />
        {t("button")}
      </button>
      {open && <EditDeliveryModal bill={bill} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); onSaved(); }} />}
    </>
  );
}

function EditDeliveryModal({ bill, onClose, onSaved }: { bill: EditDeliveryBill; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("shop.editDelivery");
  const tc = useTranslations("shop.checkout");
  const addressesQ = useQuery({ queryKey: shopAddressesKey, queryFn: shopAddressesService.list });
  const pickupQ = useQuery({ queryKey: pickupLocationsKey, queryFn: pickupLocationsService.list });

  const [orderType, setOrderType] = useState<OrderType>(bill.order_type);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState(bill.delivery_address?.recipient_name ?? "");
  const [recipientPhone, setRecipientPhone] = useState(bill.delivery_address?.recipient_phone ?? "");
  const [pickupLocationId, setPickupLocationId] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addresses = addressesQ.data ?? [];
  // ที่อยู่เดิมของบิลตรงกับใบไหนในสมุด → เลือกไว้ให้ก่อน · ไม่ตรง = ใบ default
  const current = bill.delivery_address;
  const matched = current
    ? addresses.find((a) => a.house_no === current.house_no && a.zip_code === current.zip_code && a.province === current.province)
    : undefined;
  const selectedId = addressId ?? matched?._id ?? addresses.find((a) => a.is_default)?._id ?? addresses[0]?._id ?? null;

  const locations = (pickupQ.data ?? [])
    .map((l) => (bill.kind === "preorder" && bill.roundPickupDate ? { ...l, order_pickup_dates: preorderPickupDates(l, bill.roundPickupDate) } : l))
    .filter((l) => l.order_pickup_dates.length > 0);
  const locId = pickupLocationId ?? locations[0]?._id ?? null;

  const phoneOk = PHONE_RE.test(recipientPhone.trim());
  const deliveryOk = !!selectedId && !!recipientName.trim() && phoneOk;
  const pickupOk = locations.length === 0 || (!!locId && !!pickupDate);
  const ready = orderType === "delivery" ? deliveryOk : pickupOk;

  const save = async () => {
    if (!ready || saving) return;
    setSaving(true);
    const body =
      orderType === "delivery"
        ? { order_type: orderType, address_id: selectedId, recipient_name: recipientName.trim(), recipient_phone: recipientPhone.trim() }
        : { order_type: orderType, ...(locations.length ? { pickup_location_id: locId, pickup_date: pickupDate } : {}) };
    try {
      const updated =
        bill.kind === "order" ? await shopOrdersService.editDelivery(bill.id, body) : await shopPreordersService.editDelivery(bill.id, body);
      alert.success(t("saved", { total: updated.total_amount.toLocaleString("th-TH", { maximumFractionDigits: 2 }) }));
      onSaved();
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("failed"));
    } finally {
      setSaving(false);
    }
  };

  const methods = [
    ["delivery", tc("delivery"), tc("deliveryHint"), FaTruck],
    ["takeaway", tc("takeaway"), tc("takeawayHint"), FaStore],
  ] as const;

  return (
    <ShopModal
      open
      onClose={onClose}
      title={t("title")}
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={shopButton}>{t("cancel")}</button>
          <button type="button" onClick={() => void save()} disabled={!ready || saving} className={`${shopButtonPrimary} disabled:opacity-50`}>
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="m-0 rounded-xl bg-[#FAF6F0] p-3 text-xs leading-relaxed text-stone-600">{t("hint")}</p>

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={tc("receiveMethod")}>
          {methods.map(([value, label, hint, Icon]) => {
            const on = orderType === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setOrderType(value)}
                className={`flex items-start gap-2.5 rounded-2xl border-2 bg-white p-3 text-left transition ${
                  on ? "border-[#8C5A3C] shadow-sm" : "border-transparent ring-1 ring-[#8C5A3C]/15 hover:ring-[#8C5A3C]/40"
                }`}
              >
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${on ? "bg-[#8C5A3C] text-white" : "bg-[#FAF6F0] text-[#8C5A3C]"}`}>
                  <Icon aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#4A342E]">{label}</span>
                  <span className="block text-xs text-stone-500">{hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        {orderType === "delivery" ? (
          <div className="space-y-3">
            <p className="m-0 text-xs font-semibold text-stone-600">{tc("deliveryAddress")}</p>
            {addressesQ.isLoading ? (
              <div className="h-16 animate-pulse rounded-2xl bg-stone-100" />
            ) : addresses.length === 0 ? (
              <p className="m-0 text-sm text-stone-600">
                {t("noAddress")}{" "}
                <Link href="/customer/account/address" className="font-semibold text-[#8C5A3C] hover:underline">{t("manageAddress")}</Link>
              </p>
            ) : (
              <div className="space-y-2" role="radiogroup" aria-label={tc("deliveryAddress")}>
                {addresses.map((a) => {
                  const on = a._id === selectedId;
                  return (
                    <button
                      key={a._id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setAddressId(a._id)}
                      className={`flex w-full items-start gap-3 rounded-2xl border-2 bg-white p-3 text-left text-sm transition ${
                        on ? "border-[#8C5A3C] shadow-sm" : "border-transparent ring-1 ring-[#8C5A3C]/15 hover:ring-[#8C5A3C]/40"
                      }`}
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${on ? "bg-[#8C5A3C] text-white" : "bg-[#FAF6F0] text-[#8C5A3C]"}`}>
                        <FaMapMarkerAlt aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 leading-relaxed text-[#4A342E]">
                        {`${a.house_no} ${a.sub_district} ${a.district} ${a.province} ${a.zip_code}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-semibold text-[#4A342E]">{tc("recipientName")}</span>
                <input className={shopInput} value={recipientName} maxLength={200} onChange={(e) => setRecipientName(e.target.value)} />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-semibold text-[#4A342E]">{tc("recipientPhone")}</span>
                <input
                  className={shopInput}
                  value={recipientPhone}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ""))}
                  aria-invalid={!!recipientPhone && !phoneOk}
                />
                {recipientPhone && !phoneOk && <span className="block text-xs text-red-600">{tc("phoneInvalid")}</span>}
              </label>
            </div>
          </div>
        ) : pickupQ.isLoading ? (
          <div className="h-16 animate-pulse rounded-2xl bg-stone-100" />
        ) : locations.length > 0 ? (
          <PickupLocationPicker
            locations={locations}
            locationId={locId}
            date={pickupDate}
            onChange={(id, d) => {
              setPickupLocationId(id);
              setPickupDate(d);
            }}
          />
        ) : (
          <p className="m-0 rounded-xl bg-white p-3 text-sm text-stone-700 ring-1 ring-[#8C5A3C]/10">{t("pickupAtStore")}</p>
        )}
      </div>
    </ShopModal>
  );
}
