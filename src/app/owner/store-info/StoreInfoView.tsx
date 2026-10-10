"use client";
// View ของ "ข้อมูลร้าน" (BACKLOG4 E2) — เจ้าของร้าน: 4 หัวข้อ · พนักงาน: เฉพาะหน้าร้านประจำสัปดาห์ (ตามสิทธิ์ store_info)
// ปุ่มแก้ไข/ยกเลิก/บันทึกอยู่ที่หัวการ์ดของแต่ละหัวข้อ — แก้ได้ครั้งละหัวข้อ
import { useTranslations } from "next-intl";
import { Button, Input, Select } from "@/components/base";
import { FormField } from "@/components/shared/form";
import { ListPageLayout } from "@/components/shared/layout";
import { LoadingSpin } from "@/components/shared/feedback";
import { RetryButton } from "@/components/shared/actions";
import type { useStoreInfoViewModel } from "./useStoreInfoViewModel";
import { LOGO_TYPES, SOCIAL_KEYS, type SectionKey } from "./storeInfoForm";
import { SectionCard } from "./_components/SectionCard";
import { StoreAddressFields } from "./_components/StoreAddressFields";
import { WeeklyMarketsEditor } from "./_components/WeeklyMarketsEditor";

type VM = ReturnType<typeof useStoreInfoViewModel>;

export function StoreInfoView(vm: VM) {
  const t = useTranslations();

  const actions = (section: SectionKey) =>
    vm.editing === section ? (
      <>
        <Button size="small" onClick={() => void vm.cancelEdit()} disabled={vm.saving}>
          {t("common.cancel")}
        </Button>
        <Button size="small" type="primary" onClick={vm.onSave} loading={vm.saving}>
          {t("common.save")}
        </Button>
      </>
    ) : (
      <Button
        size="small"
        onClick={() => vm.startEdit(section)}
        disabled={vm.editing !== null}
        title={vm.editing !== null ? t("storeInfo.finishOtherFirst") : undefined}
      >
        {t("common.edit")}
      </Button>
    );

  const p = vm.profile;
  // ตัวอย่างค่า (placeholder) แสดงเฉพาะตอนแก้ไข — โหมดดูแสดง "ยังไม่ได้ตั้งค่า" ไม่งั้นช่องว่างดูเหมือนตั้งค่าไว้แล้ว
  const ph = (section: SectionKey, example: string) => (vm.editing === section ? example : t("storeInfo.notSet"));
  const phoneHint = (id: string) => {
    if (!id) return undefined;
    const s = vm.staffOptions.find((o) => o.value === id);
    return s ? t("storeInfo.contact.phoneOf", { phone: s.phone || t("storeInfo.contact.noPhone") }) : undefined;
  };

  const marketsCard = (
    <SectionCard
      title={vm.isOwner ? t("storeInfo.markets.titleWithAddress") : t("storeInfo.markets.title")}
      description={t("storeInfo.markets.description")}
      actions={actions("markets")}
    >
      {vm.isOwner && (
        <>
          <StoreAddressFields
            address={vm.address}
            editable={vm.editing === "markets"}
            onField={vm.setAddressField}
            onCoordinates={vm.setCoordinates}
            onResolveShortLink={vm.resolveMapLink}
            fieldError={vm.fieldError}
          />
          <p className="m-0 border-t border-gray-100 pt-3 text-sm font-semibold text-brown-800">{t("storeInfo.markets.title")}</p>
        </>
      )}
      <WeeklyMarketsEditor
        markets={vm.markets}
        editing={vm.editing === "markets"}
        error={vm.marketsError}
        canCreate={vm.canCreateMarket}
        canEdit={vm.canEditMarket}
        canRemove={vm.canRemoveMarket}
        onField={vm.setMarketField}
        onToggleDay={vm.toggleMarketDay}
        onToggleActive={vm.toggleMarketActive}
        onAdd={vm.addMarket}
        onRemove={(i) => void vm.removeMarket(i)}
      />
    </SectionCard>
  );

  return (
    <ListPageLayout title={t("storeInfo.title")} description={vm.isOwner ? t("storeInfo.description") : t("storeInfo.staffDescription")}>
      {/* โหมดดู: ค่าที่บันทึกแล้วเป็นตัวเข้ม (antd disabled จางเกินจนแยกจาก placeholder ไม่ออก) */}
      <div className="[&_.ant-input-disabled]:!text-gray-800 [&_.ant-select-disabled_.ant-select-content]:!text-gray-800 [&_.ant-select-disabled_.ant-select-selection-item]:!text-gray-800">
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <RetryButton onClick={vm.refetch} />
        </div>
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : !vm.isOwner ? (
        marketsCard
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            <SectionCard title={t("storeInfo.general.title")} description={t("storeInfo.general.description")} actions={actions("general")}>
              <FormField label={t("storeInfo.general.storeName")} required error={vm.fieldError("store_name")}>
                <Input
                  value={p.store_name}
                  maxLength={100}
                  disabled={vm.editing !== "general"}
                  placeholder={ph("general", "MeowMee Cake")}
                  onChange={(e) => vm.setProfileField("store_name", e.target.value)}
                />
              </FormField>
              <FormField label={t("storeInfo.general.logo")} error={vm.fieldError("logo")}>
                <div className="flex items-start gap-4">
                  <label
                    className={`relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-gray-50 ${
                      vm.editing === "general" ? "cursor-pointer border-gray-300 hover:border-gray-400" : "border-gray-200"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- โลโก้จาก backend (คนละ origin) / object URL ก่อนบันทึก */}
                    <img src={vm.logoSrc} alt={t("storeInfo.general.logo")} className="h-full w-full object-contain p-2" />
                    {vm.editing === "general" && (
                      <input
                        type="file"
                        accept={LOGO_TYPES.join(",")}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) vm.pickLogo(file);
                        }}
                      />
                    )}
                  </label>
                  <p className="m-0 text-xs leading-relaxed text-gray-500">
                    {vm.editing === "general" ? t("storeInfo.general.logoPick") : ""} {t("storeInfo.general.logoHint")}
                  </p>
                </div>
              </FormField>
            </SectionCard>

            <SectionCard title={t("storeInfo.contact.title")} description={t("storeInfo.contact.description")} actions={actions("contact")}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(["phone_primary_user_id", "phone_secondary_user_id"] as const).map((key) => (
                  <FormField key={key} label={t(key === "phone_primary_user_id" ? "storeInfo.contact.phonePrimary" : "storeInfo.contact.phoneSecondary")}>
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      value={p[key] || undefined}
                      disabled={vm.editing !== "contact"}
                      placeholder={ph("contact", t("storeInfo.contact.pickStaff"))}
                      options={vm.staffOptions}
                      onChange={(v?: string) => vm.setProfileField(key, v ?? "")}
                    />
                    {phoneHint(p[key]) && <span className="text-xs text-gray-500">{phoneHint(p[key])}</span>}
                  </FormField>
                ))}
                <FormField label={t("storeInfo.contact.email")} error={vm.fieldError("contact_email")}>
                  <Input
                    type="email"
                    value={p.contact_email}
                    disabled={vm.editing !== "contact"}
                    placeholder={ph("contact", "hello@meowmeecake.com")}
                    onChange={(e) => vm.setProfileField("contact_email", e.target.value)}
                  />
                </FormField>
                <FormField label={t("storeInfo.contact.systemEmail")}>
                  <Input value={vm.systemEmail || "—"} disabled suffix={<span className="text-xs text-gray-500">{t("storeInfo.contact.fromSystem")}</span>} />
                </FormField>
              </div>
              <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 md:grid-cols-2">
                {SOCIAL_KEYS.map((k) => (
                  <FormField key={k} label={t(`storeInfo.contact.social.${k}`)} error={vm.fieldError(`social_${k}`)}>
                    <Input
                      type="url"
                      value={p.social_links[k]}
                      disabled={vm.editing !== "contact"}
                      placeholder={ph("contact", "https://...")}
                      onChange={(e) => vm.setSocial(k, e.target.value)}
                    />
                  </FormField>
                ))}
              </div>
            </SectionCard>

            {marketsCard}
          </div>

          <div className="flex flex-col gap-5 lg:sticky lg:top-6">
            <SectionCard title={t("storeInfo.promptpay.title")} description={t("storeInfo.promptpay.description")} actions={actions("promptpay")}>
              <FormField label={t("storeInfo.promptpay.id")} error={vm.fieldError("promptpay_id")}>
                <Input
                  value={p.promptpay_id}
                  disabled={vm.editing !== "promptpay"}
                  inputMode="numeric"
                  placeholder={ph("promptpay", "0812345678")}
                  onChange={(e) => vm.setProfileField("promptpay_id", e.target.value)}
                />
                <span className="text-xs text-gray-500">{t("storeInfo.promptpay.idHint")}</span>
              </FormField>
              <FormField label={t("storeInfo.promptpay.accountName")} required={!!p.promptpay_id.trim()} error={vm.fieldError("promptpay_account_name")}>
                <Input
                  value={p.promptpay_account_name}
                  maxLength={100}
                  disabled={vm.editing !== "promptpay"}
                  placeholder={ph("promptpay", "")}
                  onChange={(e) => vm.setProfileField("promptpay_account_name", e.target.value)}
                />
              </FormField>
              <p className="m-0 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">{t("storeInfo.promptpay.note")}</p>
            </SectionCard>
          </div>
        </div>
      )}
      </div>
    </ListPageLayout>
  );
}
