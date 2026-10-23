"use client";
// View ของ "ข้อมูลร้าน" (BACKLOG4 E2) — เจ้าของร้าน: 4 หัวข้อ · พนักงาน: เฉพาะหน้าร้าน/จุดรับสินค้า (ตามสิทธิ์ store_info)
// โหมดดู = รายการ "หัวข้อ: ค่า" ตัวเข้ม (ReadRow) · ยังไม่ได้ตั้ง = สีส้ม — เดิมใช้ช่องกรอก disabled ที่จางจนแยกไม่ออก
// กด "แก้ไข" ที่หัวการ์ด → ฟอร์มของหัวข้อนั้นเปิดเป็นป๊อปอัป (บันทึก/ยกเลิกในป๊อปอัป) · แก้ได้ครั้งละหัวข้อ
// ปิดป๊อปอัปโดยยังไม่บันทึก = ถามก่อนทิ้ง (ViewModel.cancelEdit)
import { Modal } from "antd";
import ShopImage from "@/components/customer/ShopImage";
import { useTranslations } from "next-intl";
import {
  BuildingStorefrontIcon, MapPinIcon, PhoneIcon, QrCodeIcon,
} from "@heroicons/react/24/outline";
import { Input, Select } from "@/components/base";
import { FormField } from "@/components/shared/form";
import { ListPageLayout } from "@/components/shared/layout";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { EditButton, modalButtonIcons } from "@/components/shared/actions";
import type { useStoreInfoViewModel } from "./useStoreInfoViewModel";
import { LOGO_TYPES, SOCIAL_KEYS, type SectionKey } from "./storeInfoForm";
import { SectionCard } from "./_components/SectionCard";
import { ReadList, ReadRow } from "./_components/ReadRow";
import { MarketsSummary } from "./_components/MarketsSummary";
import { StoreAddressFields } from "./_components/StoreAddressFields";
import { WeeklyMarketsEditor } from "./_components/WeeklyMarketsEditor";

type VM = ReturnType<typeof useStoreInfoViewModel>;

const SECTION_TITLE: Record<SectionKey, string> = {
  general: "storeInfo.general.title",
  contact: "storeInfo.contact.title",
  markets: "storeInfo.markets.titleCombined",
  promptpay: "storeInfo.promptpay.title",
};

export function StoreInfoView(vm: VM) {
  const t = useTranslations();
  const p = vm.profile;

  const editButton = (section: SectionKey) => (
    <EditButton size="small" onClick={() => vm.startEdit(section)} disabled={vm.editing !== null} />
  );
  const staffOf = (id: string) => vm.staffOptions.find((o) => o.value === id);
  const phoneHint = (id: string) => {
    const s = id ? staffOf(id) : undefined;
    return s ? t("storeInfo.contact.phoneOf", { phone: s.phone || t("storeInfo.contact.noPhone") }) : undefined;
  };

  // ── โหมดดู ──
  const generalRead = (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
        {/* ShopImage — โลโก้จาก R2 ย่อ + WebP · โลโก้เริ่มต้นใน /public = ไม่ผ่านตัวย่อ */}
        <ShopImage src={vm.logoSrc} alt={t("storeInfo.general.logo")} width={160} height={160} sizes="80px" className="h-full w-full object-contain p-1.5" />
      </div>
      <div className="min-w-0">
        <p className="m-0 text-xs text-gray-500">{t("storeInfo.general.storeName")}</p>
        <p className={`m-0 truncate text-lg font-semibold ${p.store_name ? "text-brown-900" : "text-amber-700"}`}>
          {p.store_name || t("storeInfo.notSetShort")}
        </p>
        {!vm.hasCustomLogo && <p className="m-0 text-xs text-amber-700">{t("storeInfo.general.logoDefault")}</p>}
      </div>
    </div>
  );

  const phoneRead = (id: string) => {
    const s = id ? staffOf(id) : undefined;
    if (!s) return undefined;
    return (
      <span>
        {s.phone || <span className="font-normal text-amber-700">{t("storeInfo.contact.noPhone")}</span>}
        <span className="block text-xs font-normal text-gray-500">{s.label}</span>
      </span>
    );
  };

  const contactRead = (
    <ReadList>
      <ReadRow label={t("storeInfo.contact.phonePrimary")}>{phoneRead(p.phone_primary_user_id)}</ReadRow>
      <ReadRow label={t("storeInfo.contact.phoneSecondary")}>{phoneRead(p.phone_secondary_user_id)}</ReadRow>
      <ReadRow label={t("storeInfo.contact.email")}>{p.contact_email}</ReadRow>
      <ReadRow label={t("storeInfo.contact.systemEmail")}>
        {vm.systemEmail && (
          <span>
            {vm.systemEmail} <span className="text-xs font-normal text-gray-500">({t("storeInfo.contact.fromSystem")})</span>
          </span>
        )}
      </ReadRow>
      {SOCIAL_KEYS.map((k) => (
        <ReadRow key={k} label={t(`storeInfo.contact.social.${k}`)}>
          {p.social_links[k] && (
            <a href={p.social_links[k]} target="_blank" rel="noreferrer" className="text-brown-700 hover:underline">
              {p.social_links[k]}
            </a>
          )}
        </ReadRow>
      ))}
    </ReadList>
  );

  const promptpayRead = (
    <>
      <ReadList>
        <ReadRow label={t("storeInfo.promptpay.id")}>{p.promptpay_id && <span className="font-mono">{p.promptpay_id}</span>}</ReadRow>
        <ReadRow label={t("storeInfo.promptpay.accountName")}>{p.promptpay_account_name}</ReadRow>
      </ReadList>
      {!p.promptpay_id && <p className="m-0 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">{t("storeInfo.promptpay.missing")}</p>}
    </>
  );

  // ── ป๊อปอัปแก้ไข (ฟอร์ม) ──
  const generalFields = () => (
    <>
      <FormField label={t("storeInfo.general.storeName")} required error={vm.fieldError("store_name")}>
        <Input value={p.store_name} maxLength={100} placeholder="MeowMee Cake" onChange={(e) => vm.setProfileField("store_name", e.target.value)} />
      </FormField>
      <FormField label={t("storeInfo.general.logo")} error={vm.fieldError("logo")}>
        <div className="flex items-start gap-4">
          <label className="relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400">
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
    </>
  );

  const contactFields = () => (
    <>
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
          <Input type="email" value={p.contact_email} placeholder="hello@meowmeecake.com" onChange={(e) => vm.setProfileField("contact_email", e.target.value)} />
        </FormField>
        <FormField label={t("storeInfo.contact.systemEmail")}>
          <Input value={vm.systemEmail || "—"} disabled suffix={<span className="text-xs text-gray-500">{t("storeInfo.contact.fromSystem")}</span>} />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 md:grid-cols-2">
        {SOCIAL_KEYS.map((k) => (
          <FormField key={k} label={t(`storeInfo.contact.social.${k}`)} error={vm.fieldError(`social_${k}`)}>
            <Input type="url" value={p.social_links[k]} placeholder="https://..." onChange={(e) => vm.setSocial(k, e.target.value)} />
          </FormField>
        ))}
      </div>
    </>
  );

  const promptpayFields = () => (
    <>
      <FormField label={t("storeInfo.promptpay.id")} error={vm.fieldError("promptpay_id")}>
        <Input value={p.promptpay_id} inputMode="numeric" placeholder="0812345678" onChange={(e) => vm.setProfileField("promptpay_id", e.target.value)} />
        <span className="text-xs text-gray-500">{t("storeInfo.promptpay.idHint")}</span>
      </FormField>
      <FormField label={t("storeInfo.promptpay.accountName")} required={!!p.promptpay_id.trim()} error={vm.fieldError("promptpay_account_name")}>
        <Input value={p.promptpay_account_name} maxLength={100} onChange={(e) => vm.setProfileField("promptpay_account_name", e.target.value)} />
      </FormField>
      <p className="m-0 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">{t("storeInfo.promptpay.note")}</p>
    </>
  );

  // หน้าร้าน / จุดรับสินค้า — ที่อยู่ร้านเป็นรายการที่ 1 (หน้าร้านหลัก) ในรายการเดียวกับจุดออกร้านอื่น
  const marketsFields = () => (
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
      onEnableMain={vm.canCreateMarket ? vm.addMainMarket : undefined}
      mainSlot={
        vm.isOwner ? (
          <StoreAddressFields
            address={vm.address}
            editable
            onField={vm.setAddressField}
            onCoordinates={vm.setCoordinates}
            onResolveShortLink={vm.resolveMapLink}
            fieldError={vm.fieldError}
          />
        ) : undefined
      }
    />
  );

  const FIELDS: Record<SectionKey, () => React.ReactNode> = {
    general: generalFields,
    contact: contactFields,
    markets: marketsFields,
    promptpay: promptpayFields,
  };

  const marketsCard = (
    <SectionCard icon={MapPinIcon} title={t("storeInfo.markets.titleCombined")} description={t("storeInfo.markets.descriptionShort")} actions={editButton("markets")}>
      <MarketsSummary markets={vm.markets} address={vm.isOwner ? vm.address : undefined} />
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
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_360px]">
          <div className="flex min-w-0 flex-col gap-5">
            <SectionCard icon={BuildingStorefrontIcon} title={t("storeInfo.general.title")} description={t("storeInfo.general.description")} actions={editButton("general")}>
              {generalRead}
            </SectionCard>
            <SectionCard icon={PhoneIcon} title={t("storeInfo.contact.title")} description={t("storeInfo.contact.description")} actions={editButton("contact")}>
              {contactRead}
            </SectionCard>
            {marketsCard}
          </div>
          <div className="flex flex-col gap-5 lg:sticky lg:top-6">
            <SectionCard icon={QrCodeIcon} title={t("storeInfo.promptpay.title")} description={t("storeInfo.promptpay.description")} actions={editButton("promptpay")}>
              {promptpayRead}
            </SectionCard>
          </div>
        </div>
      )}

      {/* ป๊อปอัปแก้ไขของหัวข้อที่กด — ปิด (กากบาท/พื้นหลัง/ยกเลิก) = cancelEdit (ถามก่อนทิ้งถ้ายังไม่บันทึก) */}
      <Modal
        open={vm.editing !== null}
        title={vm.editing ? t("storeInfo.editTitle", { section: t(SECTION_TITLE[vm.editing] as Parameters<typeof t>[0]) }) : ""}
        width={vm.editing === "markets" ? 820 : vm.editing === "contact" ? 720 : 560}
        onCancel={() => void vm.cancelEdit()}
        onOk={vm.onSave}
        confirmLoading={vm.saving}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        mask={{ closable: false }}
        {...modalButtonIcons("save")}
        destroyOnHidden
      >
        {vm.editing && <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">{FIELDS[vm.editing]()}</div>}
      </Modal>
    </ListPageLayout>
  );
}
