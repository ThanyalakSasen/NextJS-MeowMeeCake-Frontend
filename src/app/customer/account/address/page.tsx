"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/address — สมุดที่อยู่ (BACKLOG3-merge D2) · ยกจาก FrontOffice src/app/customer/account/address/page.tsx
// API: /shop/addresses (GET/POST) · /shop/addresses/{id} (PATCH/DELETE) · /shop/addresses/{id}/default (POST)
// ต่างจากต้นแบบ: ไม่มีชื่อ/เบอร์ผู้รับในที่อยู่ — backend หลักเก็บเฉพาะตำแหน่ง ผู้รับกรอกตอน checkout
// cache เดียวกับหน้า checkout (shopAddressesKey) — แก้ที่นี่แล้วหน้า checkout เห็นทันที
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { shopAddressesService, type ShopAddress, type ShopAddressInput } from "@/services/shopAddresses";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import AccountSideMenu from "@/components/customer/AccountSideMenu";
import { shopButton, shopButtonPrimary, shopInput, shopPage } from "@/components/customer/shopStyles";
import { shopAddressesKey } from "../../lib/shopQueries";
import { formatStoreAddress } from "../../lib/storeFormat";

const ZIP_RE = /^\d{5}$/;
type Form = Required<ShopAddressInput>;
const EMPTY: Form = { house_no: "", sub_district: "", district: "", province: "", zip_code: "", is_default: false };

/** labelKey/placeholderKey = i18n shop.address (placeholder ไม่มี key = ใช้ label) */
const FIELDS: { key: Exclude<keyof Form, "is_default">; labelKey: "houseNoFull" | "subDistrict" | "district" | "province" | "zipCode"; placeholderKey?: "houseNoPlaceholder"; placeholder?: string; max: number; wide?: boolean }[] = [
  { key: "house_no", labelKey: "houseNoFull", placeholderKey: "houseNoPlaceholder", max: 200, wide: true },
  { key: "sub_district", labelKey: "subDistrict", max: 120 },
  { key: "district", labelKey: "district", max: 120 },
  { key: "province", labelKey: "province", max: 120 },
  { key: "zip_code", labelKey: "zipCode", placeholder: "40000", max: 5 },
];

const addressText = (a: ShopAddress) => formatStoreAddress(a);

export default function AddressBookPage() {
  const t = useTranslations("shop.address");
  return (
    <CustomerAuthGate message={t("loginToManage")}>
      <AddressBookContent />
    </CustomerAuthGate>
  );
}

function AddressBookContent() {
  const t = useTranslations("shop.address");
  const ta = useTranslations("shop.accountMenu");
  const tc = useTranslations("shop.common");
  const to = useTranslations("shop.orders");
  const qc = useQueryClient();
  const q = useQuery({ queryKey: shopAddressesKey, queryFn: shopAddressesService.list });
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: shopAddressesKey });

  const save = useMutation({
    mutationFn: ({ id, form }: { id: string | null; form: Form }) => {
      const body = { ...form, ...Object.fromEntries(FIELDS.map((f) => [f.key, form[f.key].trim()])) } as Form;
      return id ? shopAddressesService.update(id, body) : shopAddressesService.create(body);
    },
    onSuccess: (_r, v) => {
      alert.success(v.id ? t("saved") : t("added"));
      setEditing(null);
      void refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("saveFailed")),
  });
  const makeDefault = useMutation({
    mutationFn: shopAddressesService.setDefault,
    onSuccess: () => {
      alert.success(t("defaultSet"));
      void refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("defaultFailed")),
  });
  const remove = useMutation({
    mutationFn: shopAddressesService.remove,
    onSuccess: () => {
      alert.success(t("deleted"));
      void refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("deleteFailed")),
  });

  const onDelete = async (a: ShopAddress) => {
    const ok = await confirmAlert(addressText(a), {
      title: t("deleteConfirm"),
      note: a.is_default ? t("deleteDefaultNote") : undefined,
      confirmText: t("delete"),
      cancelText: t("keep"),
      danger: true,
    });
    if (ok) remove.mutate(a._id);
  };

  const addresses = q.data ?? [];
  const form = editing?.form ?? EMPTY;
  const problem = !editing
    ? null
    : FIELDS.some((f) => !form[f.key].trim())
      ? t("fillAll")
      : !ZIP_RE.test(form.zip_code.trim())
        ? t("zipInvalid")
        : null;
  const setField = (key: keyof Form, value: string | boolean) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, [key]: value } } : e));

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: to("myAccount"), href: "/customer/account" }, { label: ta("address") }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <AccountSideMenu />
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <header className="flex flex-col justify-between gap-3 border-b border-stone-200 pb-5 sm:flex-row sm:items-center">
              <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-stone-800 sm:text-2xl">
                <MapPin className="h-6 w-6 text-[#4A342E]" aria-hidden="true" />
                {t("title")}
              </h1>
              <button type="button" className={`${shopButtonPrimary} self-start sm:self-auto`} onClick={() => setEditing({ id: null, form: { ...EMPTY, is_default: addresses.length === 0 } })}>
                <Plus className="h-4 w-4" /> {t("addNew")}
              </button>
            </header>

            {q.isLoading ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center text-sm text-stone-500">{t("loading")}</p>
            ) : q.isError ? (
              <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">{t("loadFailed")}</p>
            ) : addresses.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center">
                <MapPin className="h-8 w-8 text-stone-300" aria-hidden="true" />
                <p className="m-0 text-sm font-medium text-stone-500">{t("empty")}</p>
                <p className="m-0 text-xs text-stone-400">{t("emptyHint")}</p>
              </div>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {addresses.map((a) => (
                  <li key={a._id} className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5 ${a.is_default ? "border-[#8C5A3C]/40" : "border-stone-100"}`}>
                    <div className="min-w-0">
                      {a.is_default && (
                        <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#8C5A3C]/10 px-2.5 py-0.5 text-xs font-semibold text-[#8C5A3C]">
                          <Star className="h-3 w-3 fill-current" /> {t("default")}
                        </span>
                      )}
                      <p className="m-0 text-sm leading-relaxed text-stone-700">{addressText(a)}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {!a.is_default && (
                        <button type="button" className={`${shopButton} !px-3 !py-1.5 text-xs`} disabled={makeDefault.isPending} onClick={() => makeDefault.mutate(a._id)}>
                          {t("makeDefault")}
                        </button>
                      )}
                      <button type="button" aria-label={t("editAria")} className={`${shopButton} !px-3 !py-1.5 text-xs`}
                        onClick={() => setEditing({ id: a._id, form: { house_no: a.house_no, sub_district: a.sub_district, district: a.district, province: a.province, zip_code: a.zip_code, is_default: a.is_default } })}>
                        <Pencil className="h-3.5 w-3.5" /> {t("edit")}
                      </button>
                      <button type="button" aria-label={t("deleteAria")} disabled={remove.isPending} onClick={() => void onDelete(a)}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-600/30 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={!!editing}
        title={editing?.id ? t("editTitle") : t("addNew")}
        onCancel={() => setEditing(null)}
        onOk={() => editing && !problem && save.mutate(editing)}
        okText={save.isPending ? tc("saving") : t("saveBtn")}
        cancelText={tc("cancel")}
        okButtonProps={{ disabled: !!problem || save.isPending }}
        destroyOnHidden
      >
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className={`space-y-1 ${f.wide ? "sm:col-span-2" : ""}`}>
              <span className="block text-xs font-semibold text-stone-600">{t(f.labelKey)}</span>
              <input
                className={shopInput}
                value={form[f.key]}
                maxLength={f.max}
                placeholder={f.placeholderKey ? t(f.placeholderKey) : (f.placeholder ?? t(f.labelKey))}
                inputMode={f.key === "zip_code" ? "numeric" : undefined}
                onChange={(e) => setField(f.key, f.key === "zip_code" ? e.target.value.replace(/\D/g, "") : e.target.value)}
              />
            </label>
          ))}
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" className="h-4 w-4 accent-[#4A342E]" checked={form.is_default} onChange={(e) => setField("is_default", e.target.checked)} />
            {t("setDefaultAuto")}
          </label>
          {problem && <p className="m-0 text-xs text-red-600 sm:col-span-2">{problem}</p>}
          <p className="m-0 text-xs text-stone-400 sm:col-span-2">{t("recipientHint")}</p>
        </div>
      </Modal>
    </div>
  );
}
