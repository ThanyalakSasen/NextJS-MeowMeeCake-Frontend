"use client";
// View ของ "ข้อมูลร้าน" (BACKLOG4 E2) — เจ้าของร้าน: 4 หัวข้อ · พนักงาน: เฉพาะหน้าร้าน/จุดรับสินค้า (ตามสิทธิ์ store_info)
// การ์ดแสดงค่าที่บันทึกแล้ว (อ่านอย่างเดียว) · กด "แก้ไข" ที่หัวการ์ด → ฟอร์มของหัวข้อนั้นเปิดเป็นป๊อปอัป (บันทึก/ยกเลิกในป๊อปอัป)
// แก้ได้ครั้งละหัวข้อ · ปิดป๊อปอัปโดยยังไม่บันทึก = ถามก่อนทิ้ง (ViewModel.cancelEdit)
import { Modal } from "antd";
import ShopImage from "@/components/customer/ShopImage";
import { useTranslations } from "next-intl";
import { Button, Input, Select } from "@/components/base";
import { FormField } from "@/components/shared/form";
import { ListPageLayout } from "@/components/shared/layout";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { modalButtonIcons } from "@/components/shared/actions";
import type { useStoreInfoViewModel } from "./useStoreInfoViewModel";
import { LOGO_TYPES, SOCIAL_KEYS, type SectionKey } from "./storeInfoForm";
import { SectionCard } from "./_components/SectionCard";
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

  const editButton = (section: SectionKey) => (
    <Button size="small" onClick={() => vm.startEdit(section)} disabled={vm.editing !== null}>
      {t("common.edit")}
    </Button>
  );

  const p = vm.profile;
  // ตัวอย่างค่า (placeholder) แสดงเฉพาะในป๊อปอัปแก้ไข — การ์ดแสดง "ยังไม่ได้ตั้งค่า" ไม่งั้นช่องว่างดูเหมือนตั้งค่าไว้แล้ว
  const ph = (editable: boolean, example: string) => (editable ? example : t("storeInfo.notSet"));
  const phoneHint = (id: string) => {
    if (!id) return undefined;
    const s = vm.staffOptions.find((o) => o.value === id);
    return s ? t("storeInfo.contact.phoneOf", { phone: s.phone || t("storeInfo.contact.noPhone") }) : undefined;
  };

  const generalFields = (editable: boolean) => (
    <>
      <FormField label={t("storeInfo.general.storeName")} required error={editable ? vm.fieldError("store_name") : undefined}>
        <Input
          value={p.store_name}
          maxLength={100}
          disabled={!editable}
          placeholder={ph(editable, "MeowMee Cake")}
          onChange={(e) => vm.setProfileField("store_name", e.target.value)}
        />
      </FormField>
      <FormField label={t("storeInfo.general.logo")} error={editable ? vm.fieldError("logo") : undefined}>
        <div className="flex items-start gap-4">
          <label
            className={`relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-gray-50 ${
              editable ? "cursor-pointer border-gray-300 hover:border-gray-400" : "border-gray-200"
            }`}
          >
            {/* ShopImage — โลโก้จาก R2 ย่อ + WebP (ไฟล์ต้นฉบับอาจใหญ่) · object URL ก่อนบันทึก / โลโก้เริ่มต้นใน /public = ไม่ผ่านตัวย่อ */}
            <ShopImage src={vm.logoSrc} alt={t("storeInfo.general.logo")} width={256} height={256} sizes="128px" className="h-full w-full object-contain p-2" />
            {editable && (
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
            {editable ? t("storeInfo.general.logoPick") : ""} {t("storeInfo.general.logoHint")}
          </p>
        </div>
      </FormField>
    </>
  );

  const contactFields = (editable: boolean) => (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {(["phone_primary_user_id", "phone_secondary_user_id"] as const).map((key) => (
          <FormField key={key} label={t(key === "phone_primary_user_id" ? "storeInfo.contact.phonePrimary" : "storeInfo.contact.phoneSecondary")}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={p[key] || undefined}
              disabled={!editable}
              placeholder={ph(editable, t("storeInfo.contact.pickStaff"))}
              options={vm.staffOptions}
              onChange={(v?: string) => vm.setProfileField(key, v ?? "")}
            />
            {phoneHint(p[key]) && <span className="text-xs text-gray-500">{phoneHint(p[key])}</span>}
          </FormField>
        ))}
        <FormField label={t("storeInfo.contact.email")} error={editable ? vm.fieldError("contact_email") : undefined}>
          <Input
            type="email"
            value={p.contact_email}
            disabled={!editable}
            placeholder={ph(editable, "hello@meowmeecake.com")}
            onChange={(e) => vm.setProfileField("contact_email", e.target.value)}
          />
        </FormField>
        <FormField label={t("storeInfo.contact.systemEmail")}>
          <Input value={vm.systemEmail || "—"} disabled suffix={<span className="text-xs text-gray-500">{t("storeInfo.contact.fromSystem")}</span>} />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 md:grid-cols-2">
        {SOCIAL_KEYS.map((k) => (
          <FormField key={k} label={t(`storeInfo.contact.social.${k}`)} error={editable ? vm.fieldError(`social_${k}`) : undefined}>
            <Input
              type="url"
              value={p.social_links[k]}
              disabled={!editable}
              placeholder={ph(editable, "https://...")}
              onChange={(e) => vm.setSocial(k, e.target.value)}
            />
          </FormField>
        ))}
      </div>
    </>
  );

  const promptpayFields = (editable: boolean) => (
    <>
      <FormField label={t("storeInfo.promptpay.id")} error={editable ? vm.fieldError("promptpay_id") : undefined}>
        <Input
          value={p.promptpay_id}
          disabled={!editable}
          inputMode="numeric"
          placeholder={ph(editable, "0812345678")}
          onChange={(e) => vm.setProfileField("promptpay_id", e.target.value)}
        />
        <span className="text-xs text-gray-500">{t("storeInfo.promptpay.idHint")}</span>
      </FormField>
      <FormField label={t("storeInfo.promptpay.accountName")} required={!!p.promptpay_id.trim()} error={editable ? vm.fieldError("promptpay_account_name") : undefined}>
        <Input
          value={p.promptpay_account_name}
          maxLength={100}
          disabled={!editable}
          placeholder={ph(editable, "")}
          onChange={(e) => vm.setProfileField("promptpay_account_name", e.target.value)}
        />
      </FormField>
      <p className="m-0 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">{t("storeInfo.promptpay.note")}</p>
    </>
  );

  // หน้าร้าน / จุดรับสินค้า — ที่อยู่ร้านเป็นรายการที่ 1 (หน้าร้านหลัก) ในรายการเดียวกับจุดออกร้านอื่น
  const marketsFields = (editable: boolean) => (
    <WeeklyMarketsEditor
      markets={vm.markets}
      editing={editable}
      error={editable ? vm.marketsError : undefined}
      canCreate={editable && vm.canCreateMarket}
      canEdit={(m) => editable && vm.canEditMarket(m)}
      canRemove={(m) => editable && vm.canRemoveMarket(m)}
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
            editable={editable}
            onField={vm.setAddressField}
            onCoordinates={vm.setCoordinates}
            onResolveShortLink={vm.resolveMapLink}
            fieldError={(name) => (editable ? vm.fieldError(name) : undefined)}
          />
        ) : undefined
      }
    />
  );

  const FIELDS: Record<SectionKey, (editable: boolean) => React.ReactNode> = {
    general: generalFields,
    contact: contactFields,
    markets: marketsFields,
    promptpay: promptpayFields,
  };

  const marketsCard = (
    <SectionCard title={t("storeInfo.markets.titleCombined")} description={t("storeInfo.markets.descriptionCombined")} actions={editButton("markets")}>
      {marketsFields(false)}
    </SectionCard>
  );

  return (
    <ListPageLayout title={t("storeInfo.title")}>
      {/* โหมดดู: ค่าที่บันทึกแล้วเป็นตัวเข้ม (antd disabled จางเกินจนแยกจาก placeholder ไม่ออก) */}
      <div className="[&_.ant-input-disabled]:!text-gray-800 [&_.ant-select-disabled_.ant-select-content]:!text-gray-800 [&_.ant-select-disabled_.ant-select-selection-item]:!text-gray-800">
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
                {generalFields(false)}
              </SectionCard>
              <SectionCard title={t("storeInfo.contact.title")} description={t("storeInfo.contact.description")} actions={editButton("contact")}>
                {contactFields(false)}
              </SectionCard>
              {marketsCard}
            </div>
            <div className="flex flex-col gap-5 lg:sticky lg:top-6">
              <SectionCard title={t("storeInfo.promptpay.title")} description={t("storeInfo.promptpay.description")} actions={editButton("promptpay")}>
                {promptpayFields(false)}
              </SectionCard>
            </div>
          </div>
        )}
      </div>

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
        {vm.editing && <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">{FIELDS[vm.editing](true)}</div>}
      </Modal>
    </ListPageLayout>
  );
}
