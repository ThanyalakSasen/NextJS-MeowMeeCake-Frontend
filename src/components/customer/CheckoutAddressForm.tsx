"use client";
// ─────────────────────────────────────────────────────────────
// เพิ่มที่อยู่ใหม่ระหว่างสั่งซื้อ — ใช้ร่วมกันหน้า checkout ปกติ และ checkout พรีออเดอร์ (D3)
// POST /shop/addresses · cache ร่วมกับสมุดที่อยู่ (shopAddressesKey — ผู้เรียก invalidate เองใน onCreated)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { shopAddressesService, type ShopAddress, type ShopAddressInput } from "@/services/shopAddresses";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { shopButton, shopButtonPrimary, shopInput } from "@/components/customer/shopStyles";

const ZIP_RE = /^\d{5}$/;

const EMPTY_ADDRESS: ShopAddressInput = { house_no: "", sub_district: "", district: "", province: "", zip_code: "" };

export default function CheckoutAddressForm({ onCreated, onCancel }: { onCreated: (a: ShopAddress) => void; onCancel: () => void }) {
  const t = useTranslations("shop.address");
  const tc = useTranslations("shop.common");
  const [form, setForm] = useState<ShopAddressInput>(EMPTY_ADDRESS);
  const [isDefault, setIsDefault] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      shopAddressesService.create({
        house_no: form.house_no.trim(),
        sub_district: form.sub_district.trim(),
        district: form.district.trim(),
        province: form.province.trim(),
        zip_code: form.zip_code.trim(),
        is_default: isDefault,
      }),
    onSuccess: (a) => {
      alert.success(t("saved"));
      onCreated(a);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("saveFailed")),
  });

  const fields: { key: keyof ShopAddressInput; label: string; max: number; wide?: boolean }[] = [
    { key: "house_no", label: t("houseNo"), max: 200, wide: true },
    { key: "sub_district", label: t("subDistrict"), max: 120 },
    { key: "district", label: t("district"), max: 120 },
    { key: "province", label: t("province"), max: 120 },
    { key: "zip_code", label: t("zipCode"), max: 5 },
  ];
  const filled = fields.every((f) => String(form[f.key] ?? "").trim()) && ZIP_RE.test(form.zip_code.trim());

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-[#8C5A3C]/30 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className={`space-y-1 text-sm ${f.wide ? "sm:col-span-2" : ""}`}>
            <span className="font-semibold">{f.label}</span>
            <input
              className={shopInput}
              value={String(form[f.key] ?? "")}
              maxLength={f.max}
              inputMode={f.key === "zip_code" ? "numeric" : undefined}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [f.key]: f.key === "zip_code" ? e.target.value.replace(/\D/g, "") : e.target.value,
                }))
              }
            />
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        {t("setDefault")}
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" className={shopButton} onClick={onCancel} disabled={createMutation.isPending}>
          {tc("cancel")}
        </button>
        <button type="button" className={shopButtonPrimary} disabled={!filled || createMutation.isPending} onClick={() => createMutation.mutate()}>
          {createMutation.isPending ? tc("saving") : t("save")}
        </button>
      </div>
    </div>
  );
}
