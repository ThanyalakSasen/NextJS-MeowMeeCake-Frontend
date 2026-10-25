"use client";
// หน้าร้าน / จุดรับสินค้า — รายการเดียว: 1. หน้าร้านหลัก (ที่อยู่ร้าน) + จุดออกร้านประจำอื่น ๆ พร้อมวัน-เวลาเปิด
// ลูกค้าเห็นที่ "ติดต่อเรา" และเลือกเป็นจุดรับสินค้าตอนสั่งแบบรับเอง (เฉพาะที่เปิดแสดง) · ต้องเปิดอย่างน้อย 1 แห่ง
// หน้าร้านหลัก (is_main): สถานที่/แผนที่ใช้ที่อยู่ร้าน (mainSlot = ช่องที่อยู่ + พิกัด ของเจ้าของร้าน) — backend เติมให้ตอนบันทึก
// ยังไม่มีหน้าร้านหลักในรายการ → แสดงที่อยู่ร้านไว้บนสุด + ปุ่มเปิดให้รับสินค้าที่หน้าร้านหลัก (ตั้งวัน-เวลา)
// แก้/ลบได้ตามสิทธิ์ (canEdit/canRemove จาก ViewModel) · รายการใหม่แก้ได้เสมอ
import { useTranslations } from "next-intl";
import { Button, Input, Switch } from "@/components/base";
import { FormField } from "@/components/shared/form";
import type { WeekDay } from "@/services/storeInfo";
import type { AdminWeeklyMarket } from "@/types/storeAdmin";
import { DAY_ORDER, MAX_WEEKLY_MARKETS } from "../storeInfoForm";
import { TimeSelect } from "./TimeSelect";
import { actionIcon } from "@/components/shared/actions";

export function WeeklyMarketsEditor({
  markets, editing, error, canCreate, canEdit, canRemove, onField, onToggleDay, onToggleActive, onAdd, onRemove, mainSlot, onEnableMain,
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
  /** ช่องที่อยู่ร้าน + พิกัด (เจ้าของร้าน) — แสดงในการ์ดหน้าร้านหลัก */
  mainSlot?: React.ReactNode;
  /** ยังไม่มีหน้าร้านหลักในรายการ → เพิ่ม (เฉพาะตอนแก้ไข · มีสิทธิ์เพิ่ม) */
  onEnableMain?: () => void;
}) {
  const t = useTranslations();
  const noneActive = !markets.some((m) => m.is_active);
  // หน้าร้านหลักขึ้นก่อน — callback ยังใช้ index เดิมของรายการ
  const ordered = markets.map((m, i) => ({ m, i })).sort((a, b) => Number(!!b.m.is_main) - Number(!!a.m.is_main));
  const hasMain = markets.some((m) => m.is_main);

  const dayButtons = (m: AdminWeeklyMarket, i: number, editable: boolean) => (
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
  );

  const hours = (m: AdminWeeklyMarket, i: number, editable: boolean) => (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-brown-800">
        {t("storeInfo.markets.hours")}
        <span className="text-red-500"> *</span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <TimeSelect value={m.open_time} disabled={!editable} ariaLabel={t("storeInfo.markets.openTime")} onChange={(v) => onField(i, "open_time", v)} />
        <span className="text-xs text-gray-500">{t("storeInfo.markets.to")}</span>
        <TimeSelect value={m.close_time} disabled={!editable} ariaLabel={t("storeInfo.markets.closeTime")} onChange={(v) => onField(i, "close_time", v)} />
      </span>
    </div>
  );

  const header = (m: AdminWeeklyMarket, i: number, n: number, editable: boolean) => (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brown-800 text-xs font-bold text-white">{n}</span>
        {m.is_main && <span className="rounded-full bg-brown-50 px-2 py-0.5 text-xs font-semibold text-brown-800">{t("storeInfo.markets.mainBadge")}</span>}
        <Switch size="small" checked={m.is_active} disabled={!editable} aria-label={t("storeInfo.markets.activeAria", { n })} onChange={(v) => onToggleActive(i, v)} />
        <span className="text-xs text-gray-500">{m.is_active ? t("storeInfo.markets.active") : t("storeInfo.markets.hidden")}</span>
      </span>
      {canRemove(m) && (
        <Button type="link" danger size="small" onClick={() => onRemove(i)}>
          {t("common.delete")}
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {noneActive && (
        <p className="m-0 text-xs text-amber-600">
          {markets.length === 0 ? t("storeInfo.markets.empty") : t("storeInfo.markets.noneActive")}
          {!editing && ` ${t("storeInfo.markets.editHint")}`}
        </p>
      )}

      {/* ยังไม่มีหน้าร้านหลักในรายการ — ที่อยู่ร้านอยู่บนสุดเหมือนรายการที่ 1 */}
      {!hasMain && mainSlot && (
        <div className="flex flex-col gap-3 rounded-lg border border-brown-200 bg-brown-50/40 p-3">
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-brown-50 px-2 py-0.5 text-xs font-semibold text-brown-800">{t("storeInfo.markets.mainBadge")}</span>
            <span className="text-xs text-gray-500">{t("storeInfo.markets.mainNotOpen")}</span>
          </span>
          {mainSlot}
          {editing && onEnableMain && (
            <Button className="self-start" type="dashed" icon={actionIcon("add")} onClick={onEnableMain}>
              {t("storeInfo.markets.enableMain")}
            </Button>
          )}
        </div>
      )}

      {ordered.map(({ m, i }, pos) => {
        const editable = canEdit(m);
        const n = pos + 1 + (!hasMain && mainSlot ? 1 : 0);
        if (m.is_main) {
          return (
            <div key={m._id ?? `new-${i}`} className="flex flex-col gap-3 rounded-lg border border-brown-200 bg-brown-50/40 p-3">
              {header(m, i, n, editable)}
              <FormField label={t("storeInfo.markets.name")} required>
                <Input
                  value={m.name}
                  maxLength={100}
                  disabled={!editable}
                  placeholder={editable ? t("storeInfo.markets.mainName") : t("storeInfo.notSet")}
                  onChange={(e) => onField(i, "name", e.target.value)}
                />
              </FormField>
              {mainSlot ?? (
                // พนักงาน (ไม่เห็นช่องที่อยู่) — แสดงสถานที่ที่ระบบเติมจากที่อยู่ร้าน
                <FormField label={t("storeInfo.markets.location")}>
                  <Input value={m.location} disabled placeholder="—" />
                </FormField>
              )}
              <p className="m-0 text-xs text-gray-500">{t("storeInfo.markets.mainHint")}</p>
              {dayButtons(m, i, editable)}
              {hours(m, i, editable)}
            </div>
          );
        }
        return (
          <div key={m._id ?? `new-${i}`} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3">
            {header(m, i, n, editable)}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label={t("storeInfo.markets.name")} required>
                <Input
                  value={m.name}
                  maxLength={100}
                  disabled={!editable}
                  placeholder={editable ? t("storeInfo.markets.namePlaceholder") : t("storeInfo.notSet")}
                  onChange={(e) => onField(i, "name", e.target.value)}
                />
              </FormField>
              <FormField label={t("storeInfo.markets.location")}>
                <Input
                  value={m.location}
                  maxLength={200}
                  disabled={!editable}
                  placeholder={editable ? t("storeInfo.markets.locationPlaceholder") : "—"}
                  onChange={(e) => onField(i, "location", e.target.value)}
                />
              </FormField>
            </div>
            {dayButtons(m, i, editable)}
            <div className="grid grid-cols-1 gap-3">
              {hours(m, i, editable)}
              <FormField label={t("storeInfo.markets.mapUrl")}>
                <Input
                  type="url"
                  value={m.map_url}
                  disabled={!editable}
                  placeholder={editable ? "https://maps.app.goo.gl/..." : "—"}
                  onChange={(e) => onField(i, "map_url", e.target.value)}
                />
              </FormField>
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
