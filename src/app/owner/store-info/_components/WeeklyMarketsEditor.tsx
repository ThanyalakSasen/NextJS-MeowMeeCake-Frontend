"use client";
// หน้าร้านประจำสัปดาห์ — หน้าร้านหลัก + จุดออกร้านประจำ พร้อมวัน-เวลาเปิด
// ลูกค้าเห็นที่ "ติดต่อเรา" และเลือกเป็นจุดรับสินค้าตอนสั่งแบบรับเอง (เฉพาะที่เปิดแสดง) · ต้องเปิดอย่างน้อย 1 แห่ง
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
  markets, editing, error, canCreate, canEdit, canRemove, onField, onToggleDay, onToggleActive, onAdd, onRemove,
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
              </span>
              {canRemove(m) && (
                <Button type="link" danger size="small" onClick={() => onRemove(i)}>
                  {t("common.delete")}
                </Button>
              )}
            </div>

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
                      className={`rounded-lg border px-2.5 py-1 text-xs transition disabled:cursor-not-allowed ${
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
