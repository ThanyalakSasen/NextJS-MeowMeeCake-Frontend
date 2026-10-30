"use client";
// หน้าร้านประจำสัปดาห์ (โหมดแก้ไข) — ทุกแห่งการ์ดเดียวกัน ช่องเหมือนกัน: ชื่อ · ที่อยู่แยกช่อง + พิกัด/ลิงก์แผนที่ · วัน · เวลา
// หน้าร้านหลัก (ป้าย/ปุ่ม "ตั้งเป็นหน้าร้านหลัก" · อยู่ลำดับแรก) — ที่อยู่ของหน้าร้านหลัก = ที่อยู่ร้าน (ตั้งแห่งไหนเป็นหลัก ที่อยู่แห่งนั้นเป็นที่อยู่ร้าน)
// โหมดดู = MarketsRead (ReadView.tsx)
// ลูกค้าเห็นที่ "ติดต่อเรา" และเลือกเป็นจุดรับสินค้าตอนสั่งแบบรับเอง (เฉพาะที่เปิดแสดง) · ต้องเปิดอย่างน้อย 1 แห่ง
// แก้/ลบได้ตามสิทธิ์ (canEdit/canRemove จาก ViewModel) · รายการใหม่แก้ได้เสมอ
import { useTranslations } from "next-intl";
import { Button, Input, Switch } from "@/components/base";
import { FormField } from "@/components/shared/form";
import type { WeekDay } from "@/services/storeInfo";
import type { AdminWeeklyMarket } from "@/types/storeAdmin";
import { DAY_ORDER, MAX_WEEKLY_MARKETS } from "../storeInfoForm";
import { TimeSelect } from "./TimeSelect";
import { StoreAddressFields } from "./StoreAddressFields";
import type { StoreSettings } from "@/types/storeAdmin";
import { marketAddressOf } from "../storeInfoForm";
import { actionIcon } from "@/components/shared/actions";

export function WeeklyMarketsEditor({
  markets, editing, error, canCreate, canEdit, canRemove, onField, onToggleDay, onToggleActive, onAdd, onRemove, onSetMain,
  canEditAddress, onAddressField, onCoordinates, onResolveShortLink, fieldError,
}: {
  markets: AdminWeeklyMarket[];
  editing: boolean;
  error?: string;
  canCreate: boolean;
  canEdit: (m: AdminWeeklyMarket) => boolean;
  canRemove: (m: AdminWeeklyMarket) => boolean;
  onField: <K extends keyof AdminWeeklyMarket>(i: number, key: K, value: AdminWeeklyMarket[K]) => void;
  onToggleDay: (i: number, day: WeekDay) => void;
  onToggleActive: (i: number, active: boolean) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onSetMain: (i: number) => void;
  /** แก้ที่อยู่ของแห่งนี้ได้ไหม (หน้าร้านหลัก = ที่อยู่ร้าน — เจ้าของร้านเท่านั้น) */
  canEditAddress: (m: AdminWeeklyMarket) => boolean;
  onAddressField: <K extends keyof StoreSettings>(i: number, key: K, value: StoreSettings[K]) => void;
  onCoordinates: (i: number, lat: number | null, lng: number | null) => void;
  onResolveShortLink: (url: string) => Promise<{ lat: number; lng: number }>;
  /** แจ้งเตือนรายช่อง — key "m<ลำดับ>.<ช่อง>" */
  fieldError: (name: string) => string | undefined;
}) {
  const t = useTranslations();
  const noneActive = !markets.some((m) => m.is_active);

  return (
    <div className="flex flex-col gap-3">
      {noneActive && (
        <p className="m-0 text-xs text-amber-600">
          {markets.length === 0 ? t("storeInfo.markets.empty") : t("storeInfo.markets.noneActive")}
          {!editing && ` ${t("storeInfo.markets.editHint")}`}
        </p>
      )}

      {markets.map((m, i) => {
        const editable = canEdit(m);
        const addressEditable = canEditAddress(m);
        const hasAddress = !!m.address && Object.values(m.address).some((v) => v !== "" && v != null);
        return (
          <div key={m._id ?? `new-${i}`} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Switch
                  size="small"
                  checked={m.is_active}
                  disabled={!editable}
                  aria-label={t("storeInfo.markets.activeAria", { n: i + 1 })}
                  onChange={(v) => onToggleActive(i, v)}
                />
                <span className="text-xs text-gray-500">{m.is_active ? t("storeInfo.markets.active") : t("storeInfo.markets.hidden")}</span>
                {m.is_main ? (
                  <span className="rounded-full bg-brown-800 px-2 py-0.5 text-xs font-semibold text-white">{t("storeInfo.markets.main")}</span>
                ) : (
                  editable && (
                    <Button type="link" size="small" onClick={() => onSetMain(i)}>
                      {t("storeInfo.markets.setMain")}
                    </Button>
                  )
                )}
              </span>
              {canRemove(m) && (
                <Button type="link" danger size="small" onClick={() => onRemove(i)}>
                  {t("common.delete")}
                </Button>
              )}
            </div>

            <FormField label={t("storeInfo.markets.name")} required>
              <Input
                value={m.name}
                maxLength={100}
                disabled={!editable}
                placeholder={editable ? t("storeInfo.markets.namePlaceholder") : t("storeInfo.notSet")}
                onChange={(e) => onField(i, "name", e.target.value)}
              />
            </FormField>

            {/* ที่อยู่ — ช่องเดียวกันทุกแห่ง · หน้าร้านหลัก = ที่อยู่ร้าน */}
            <div className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3">
              <p className="m-0 text-xs text-gray-600">
                {m.is_main ? t("storeInfo.markets.mainAddressHint") : t("storeInfo.markets.addressHint")}
              </p>
              {/* รายการเก่าที่มีแค่ที่ตั้งแบบข้อความ — แสดงไว้ให้กรอกที่อยู่แยกช่องตาม */}
              {!hasAddress && m.location && (
                <p className="m-0 text-xs text-amber-700">{t("storeInfo.markets.oldLocation", { location: m.location })}</p>
              )}
              {m.is_main && !addressEditable && editable ? (
                <p className="m-0 rounded-lg bg-brown-50 px-3 py-2 text-xs leading-relaxed text-brown-800">{t("storeInfo.markets.mainUsesAddress")}</p>
              ) : (
                <StoreAddressFields
                  address={marketAddressOf(m)}
                  editable={addressEditable}
                  onField={(key, value) => onAddressField(i, key, value)}
                  onCoordinates={(lat, lng) => onCoordinates(i, lat, lng)}
                  onResolveShortLink={onResolveShortLink}
                  fieldError={(name) => fieldError(`m${i}.${name}`)}
                  embedded
                  required={m.is_main}
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-brown-800">
                {t("storeInfo.markets.days")}
                <span className="text-red-500"> *</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DAY_ORDER.map((day) => {
                  const on = m.days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={!editable}
                      aria-pressed={on}
                      onClick={() => onToggleDay(i, day)}
                      className={`h-[36px] rounded-lg border px-3 text-sm transition disabled:cursor-not-allowed ${
                        on ? "border-brown-800 bg-brown-800 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                      } ${editable ? "" : "opacity-70"}`}
                    >
                      {t(`storeInfo.days.${day}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-brown-800">
                  {t("storeInfo.markets.hours")}
                  <span className="text-red-500"> *</span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <TimeSelect value={m.open_time} disabled={!editable} ariaLabel={t("storeInfo.markets.openTime")}
                    onChange={(v) => onField(i, "open_time", v)} />
                  <span className="text-xs text-gray-500">{t("storeInfo.markets.to")}</span>
                  <TimeSelect value={m.close_time} disabled={!editable} ariaLabel={t("storeInfo.markets.closeTime")}
                    onChange={(v) => onField(i, "close_time", v)} />
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {error && <span className="text-xs text-red-500">{error}</span>}

      {canCreate && markets.length < MAX_WEEKLY_MARKETS && (
        <Button className="self-start" type="dashed" icon={actionIcon("add")} onClick={onAdd}>
          {t("storeInfo.markets.add")}
        </Button>
      )}
    </div>
  );
}
