"use client";
// View ของ "ข้อมูลร้าน" (BACKLOG4 E2) — เจ้าของร้าน: 4 หัวข้อ · พนักงาน: เฉพาะหน้าร้านประจำสัปดาห์ (ตามสิทธิ์ store_info)
// การ์ดแสดงข้อมูลอ่านง่ายเสมอ (ReadView.tsx) · กด "แก้ไข" ที่หัวการ์ด = เปิดป๊อปอัพฟอร์มของหัวข้อนั้น (2026-10-26) — แก้ได้ครั้งละหัวข้อ
// ที่อยู่ร้านกับหน้าร้านหลักเป็นข้อมูลชุดเดียวกัน — ช่องที่อยู่ + พิกัดอยู่ในรายการหน้าร้านหลัก (WeeklyMarketsEditor · mainAddress)
import { Modal } from "antd";
import ShopImage from "@/components/customer/ShopImage";
import { useTranslations } from "next-intl";
import { Button, Input, Select } from "@/components/base";
import { FormField } from "@/components/shared/form";
import { ListPageLayout } from "@/components/shared/layout";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { modalButtonIcons, actionIcon } from "@/components/shared/actions";
import type { useStoreInfoViewModel } from "./useStoreInfoViewModel";
import { LOGO_TYPES, SOCIAL_KEYS, type SectionKey } from "./storeInfoForm";
import { SectionCard } from "./_components/SectionCard";
import { StoreAddressFields } from "./_components/StoreAddressFields";
import { WeeklyMarketsEditor } from "./_components/WeeklyMarketsEditor";
import { ContactRead, GeneralRead, MarketsRead, PromptpayRead } from "./_components/ReadView";

type VM = ReturnType<typeof useStoreInfoViewModel>;

const MODAL_WIDTH: Record<SectionKey, number> = { general: 560, contact: 720, promptpay: 520, markets: 760 };

export function StoreInfoView(vm: VM) {
  const t = useTranslations();
  const p = vm.profile;

  const editButton = (section: SectionKey) => (
    <Button icon={actionIcon("edit", "small")} size="small" onClick={() => vm.startEdit(section)} disabled={vm.editing !== null}>
      {t("common.edit")}
    </Button>
  );

  const phoneHint = (id: string) => {
    if (!id) return undefined;
    const s = vm.staffOptions.find((o) => o.value === id);
    return s ? t("storeInfo.contact.phoneOf", { phone: s.phone || t("storeInfo.contact.noPhone") }) : undefined;
  };

  const marketsTitle = vm.isOwner ? t("storeInfo.markets.titleWithAddress") : t("storeInfo.markets.title");

  // ── ฟอร์มของแต่ละหัวข้อ (อยู่ในป๊อปอัพ) ──
  const forms: Record<SectionKey, () => React.ReactNode> = {
    general: () => (
      <div className="flex flex-col gap-4">
        <FormField label={t("storeInfo.general.storeName")} required error={vm.fieldError("store_name")}>
          <Input value={p.store_name} maxLength={100} placeholder="MeowMee Cake" onChange={(e) => vm.setProfileField("store_name", e.target.value)} />
        </FormField>
        <FormField label={t("storeInfo.general.logo")} error={vm.fieldError("logo")}>
          <div className="flex items-start gap-4">
            <label className="relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400">
              {/* ShopImage — โลโก้จาก R2 ย่อ + WebP · object URL ก่อนบันทึก / โลโก้เริ่มต้นใน /public = ไม่ผ่านตัวย่อ */}
              <ShopImage src={vm.logoSrc} alt={t("storeInfo.general.logo")} width={256} height={256} sizes="128px" className="h-full w-full object-contain p-2" />
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
            </label>
            <p className="m-0 text-xs leading-relaxed text-gray-500">
              {t("storeInfo.general.logoPick")} {t("storeInfo.general.logoHint")}
            </p>
          </div>
        </FormField>
      </div>
    ),
    contact: () => (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(["phone_primary_user_id", "phone_secondary_user_id"] as const).map((key) => (
            <FormField key={key} label={t(key === "phone_primary_user_id" ? "storeInfo.contact.phonePrimary" : "storeInfo.contact.phoneSecondary")}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                value={p[key] || undefined}
                placeholder={t("storeInfo.contact.pickStaff")}
                options={vm.staffOptions}
                onChange={(v?: string) => vm.setProfileField(key, v ?? "")}
              />
              {phoneHint(p[key]) && <span className="text-xs text-gray-500">{phoneHint(p[key])}</span>}
            </FormField>
          ))}
          <FormField label={t("storeInfo.contact.email")} error={vm.fieldError("contact_email")}>
            <Input maxLength={254} type="email" value={p.contact_email} placeholder="hello@meowmeecake.com" onChange={(e) => vm.setProfileField("contact_email", e.target.value)} />
          </FormField>
          <FormField label={t("storeInfo.contact.systemEmail")}>
            <Input value={vm.systemEmail || "—"} disabled suffix={<span className="text-xs text-gray-500">{t("storeInfo.contact.fromSystem")}</span>} />
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 md:grid-cols-2">
          {SOCIAL_KEYS.map((k) => (
            <FormField key={k} label={t(`storeInfo.contact.social.${k}`)} error={vm.fieldError(`social_${k}`)}>
              <Input maxLength={500} type="url" value={p.social_links[k]} placeholder="https://..." onChange={(e) => vm.setSocial(k, e.target.value)} />
            </FormField>
          ))}
        </div>
      </div>
    ),
    promptpay: () => (
      <div className="flex flex-col gap-4">
        <FormField label={t("storeInfo.promptpay.id")} error={vm.fieldError("promptpay_id")}>
          <Input maxLength={20} value={p.promptpay_id} inputMode="numeric" placeholder="0812345678" onChange={(e) => vm.setProfileField("promptpay_id", e.target.value)} />
          <span className="text-xs text-gray-500">{t("storeInfo.promptpay.idHint")}</span>
        </FormField>
        <FormField label={t("storeInfo.promptpay.accountName")} required={!!p.promptpay_id.trim()} error={vm.fieldError("promptpay_account_name")}>
          <Input value={p.promptpay_account_name} maxLength={100} onChange={(e) => vm.setProfileField("promptpay_account_name", e.target.value)} />
        </FormField>
        <p className="m-0 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">{t("storeInfo.promptpay.note")}</p>
      </div>
    ),
    markets: () => (
      <WeeklyMarketsEditor
        markets={vm.markets}
        editing
        error={vm.marketsError}
        canCreate={vm.canCreateMarket}
        canEdit={vm.canEditMarket}
        canRemove={vm.canRemoveMarket}
        onField={vm.setMarketField}
        onToggleDay={vm.toggleMarketDay}
        onToggleActive={vm.toggleMarketActive}
        onAdd={vm.addMarket}
        onRemove={(i) => void vm.removeMarket(i)}
        onSetMain={vm.setMainMarket}
        mainAddress={
          vm.isOwner ? (
            <StoreAddressFields
              address={vm.address}
              editable
              onField={vm.setAddressField}
              onCoordinates={vm.setCoordinates}
              onResolveShortLink={vm.resolveMapLink}
              fieldError={vm.fieldError}
              embedded
            />
          ) : undefined
        }
      />
    ),
  };

  const modalTitle: Record<SectionKey, string> = {
    general: t("storeInfo.general.title"),
    contact: t("storeInfo.contact.title"),
    promptpay: t("storeInfo.promptpay.title"),
    markets: marketsTitle,
  };

  const marketsCard = (
    <SectionCard title={marketsTitle} description={t("storeInfo.markets.description")} actions={editButton("markets")}>
      <MarketsRead markets={vm.markets} address={vm.isOwner ? vm.address : undefined} />
    </SectionCard>
  );

  return (
    <ListPageLayout title={t("storeInfo.title")}>
      {vm.isError ? (
        <LoadFailed onRetry={vm.refetch} />
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : !vm.isOwner ? (
        marketsCard
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            <SectionCard title={t("storeInfo.general.title")} description={t("storeInfo.general.description")} actions={editButton("general")}>
              <div className="flex items-center gap-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  <ShopImage src={vm.logoSrc} alt={t("storeInfo.general.logo")} width={160} height={160} sizes="80px" className="h-full w-full object-contain p-1.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <GeneralRead profile={p} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title={t("storeInfo.contact.title")} description={t("storeInfo.contact.description")} actions={editButton("contact")}>
              <ContactRead profile={p} staff={vm.staffOptions} systemEmail={vm.systemEmail} />
            </SectionCard>

            {marketsCard}
          </div>

          <div className="flex flex-col gap-5 lg:sticky lg:top-6">
            <SectionCard title={t("storeInfo.promptpay.title")} description={t("storeInfo.promptpay.description")} actions={editButton("promptpay")}>
              <PromptpayRead profile={p} />
              <p className="m-0 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">{t("storeInfo.promptpay.note")}</p>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ป๊อปอัพแก้ไข — ปิด/ยกเลิก = ถามก่อนทิ้งถ้ายังไม่บันทึก (vm.cancelEdit) */}
      <Modal
        open={vm.editing !== null}
        title={vm.editing ? modalTitle[vm.editing] : ""}
        width={vm.editing ? MODAL_WIDTH[vm.editing] : undefined}
        onCancel={() => void vm.cancelEdit()}
        onOk={vm.onSave}
        confirmLoading={vm.saving}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        mask={{ closable: false }}
        {...modalButtonIcons("save")}
        destroyOnHidden
      >
        {vm.editing && forms[vm.editing]()}
      </Modal>
    </ListPageLayout>
  );
}
