"use client";
// ─────────────────────────────────────────────────────────────
// ฟอร์มที่อยู่ระหว่างสั่งซื้อ — ใช้ร่วมกันหน้า checkout ปกติ และ checkout พรีออเดอร์ (D3) · 2 โหมด:
//   เพิ่มที่อยู่ใหม่ (ไม่ส่ง onApply) → POST /shop/addresses · cache ร่วมกับสมุดที่อยู่ (ผู้เรียก invalidate เองใน onCreated)
//   แก้เฉพาะคำสั่งซื้อนี้ (ส่ง onApply + initial) → ไม่เรียก API ไม่บันทึกลงสมุดที่อยู่ — ผู้เรียกส่งเป็น delivery_address ตอนสั่ง
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { shopAddressesService, type ShopAddress, type ShopAddressInput } from "@/services/shopAddresses";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { shopButton, shopButtonPrimary } from "@/components/customer/shopStyles";
import { AddressInputs, useAddressErrors, useTouched } from "@/components/customer/AddressInputs";

export type AddressFields = Omit<ShopAddressInput, "is_default">;

const EMPTY_ADDRESS: AddressFields = { house_no: "", sub_district: "", district: "", province: "", zip_code: "" };

type Props =
  | { onCreated: (a: ShopAddress) => void; onCancel: () => void; onApply?: undefined; initial?: undefined }
  | { onApply: (a: AddressFields) => void; initial: AddressFields; onCancel: () => void; onCreated?: undefined };

export default function CheckoutAddressForm(props: Props) {
  const { onCancel } = props;
  const local = !!props.onApply;
  const t = useTranslations("shop.address");
  const tc = useTranslations("shop.common");
  const [form, setForm] = useState<AddressFields>(props.initial ?? EMPTY_ADDRESS);
  const [isDefault, setIsDefault] = useState(false);
  const touched = useTouched();
  const errors = useAddressErrors()(form);
  const hasErrors = Object.keys(errors).length > 0;

  const trimmed = (): AddressFields => ({
    house_no: form.house_no.trim(),
    sub_district: form.sub_district.trim(),
    district: form.district.trim(),
    province: form.province.trim(),
    zip_code: form.zip_code.trim(),
  });

  const createMutation = useMutation({
    mutationFn: () => shopAddressesService.create({ ...trimmed(), is_default: isDefault }),
    onSuccess: (a) => {
      alert.success(t("saved"));
      props.onCreated?.(a);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("saveFailed")),
  });

  /** กดบันทึกตอนยังกรอกไม่ครบ = แสดงแจ้งเตือนใต้ทุกช่องที่ผิด แทนปุ่มกดไม่ได้เฉย ๆ */
  const submit = (go: () => void) => (hasErrors ? touched.revealAll() : go());

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-[#8C5A3C]/30 bg-white p-4">
      {local && <p className="m-0 rounded-lg bg-[#FAF6F0] px-3 py-2 text-xs text-[#4A342E]">{t("editOnceHint")}</p>}
      <AddressInputs
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        errors={errors}
        visible={touched.visible}
        onTouch={touched.touch}
        houseLabelKey="houseNo"
      />
      {!local && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          {t("setDefault")}
        </label>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className={shopButton} onClick={onCancel} disabled={createMutation.isPending}>
          {tc("cancel")}
        </button>
        {local ? (
          <button type="button" className={shopButtonPrimary} onClick={() => submit(() => props.onApply?.(trimmed()))}>
            {t("useOnce")}
          </button>
        ) : (
          <button type="button" className={shopButtonPrimary} disabled={createMutation.isPending} onClick={() => submit(() => createMutation.mutate())}>
            {createMutation.isPending ? tc("saving") : t("save")}
          </button>
        )}
      </div>
    </div>
  );
}
