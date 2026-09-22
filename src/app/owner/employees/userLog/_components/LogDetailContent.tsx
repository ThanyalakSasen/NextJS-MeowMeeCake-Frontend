"use client";
// เนื้อหาใน DetailDrawer ของหน้า User Log — แสดงรายละเอียด log 1 รายการ
// backend ไม่มี before/after แบบ diff รายฟิลด์จริง (ดูคอมเมนต์ RawUserLog ใน types/userLog.ts)
// มีแค่ `details` รูปแบบไม่คงที่ต่อ route — โชว์เท่าที่มีแบบ key/value ทั่วไป
import { useTranslations, useLocale, useMessages } from "next-intl";
import { Divider } from "@/components/base";
import { formatDate } from "@/i18n/format";
import { USER_LOG_ACTION_CONFIG } from "@/constants/enumConfig";
import type { LogRow } from "../useUserLogViewModel";

function formatDetailValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function LogDetailContent({ log }: { log: LogRow }) {
  const t = useTranslations();
  const locale = useLocale();
  // field key → label จาก namespace "fields" ถ้ามี · ไม่มีก็โชว์ key ดิบ
  const fieldMsgs = (useMessages() as { fields?: Record<string, string> }).fields ?? {};
  const fieldLabel = (field: string) => fieldMsgs[field] ?? field;
  const cfg = USER_LOG_ACTION_CONFIG[log.action_type];

  // details: array ของชื่อ field ที่แก้ (ไม่มีค่าเก่า/ใหม่) หรือ object เก็บบาง field ของ body
  // แล้วแต่ route — สร้างเป็นคู่ [label, value] ให้ render ได้แบบเดียวกันทั้งสองแบบ
  const detailEntries: [string, string][] = (() => {
    const details = log.details;
    if (details == null) return [];
    if (Array.isArray(details)) {
      if (details.length === 0) return [];
      return [[t("userLog.changedFields"), details.map((f) => fieldLabel(String(f))).join(", ")]];
    }
    if (typeof details === "object") {
      return Object.entries(details as Record<string, unknown>).map(([k, v]) => [fieldLabel(k), formatDetailValue(v)]);
    }
    return [[t("userLog.colDetail"), String(details)]];
  })();

  const meta: [string, React.ReactNode][] = [
    [t("userLog.colDetail"), log.action],
    [
      t("userLog.colType"),
      <span
        key="type"
        className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium"
        style={{ backgroundColor: cfg.bg, color: cfg.color }}
      >
        {t(`enums.userLogAction.${log.action_type}`)}
      </span>,
    ],
    [
      t("userLog.colEntity"),
      log.entity ? (
        <span>
          {t.has(`entities.${log.entity}`) ? t(`entities.${log.entity}`) : t("entities.fallback")}
          {log.entity_id && <span className="ml-1 font-mono text-xs text-gray-400">{log.entity_id}</span>}
        </span>
      ) : (
        "—"
      ),
    ],
    [t("userLog.colIp"), <span key="ip" className="font-mono text-sm text-gray-500">{log.ip_address ?? "—"}</span>],
    [t("userLog.colTime"), formatDate(log.created_at, locale, { withTime: true })],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-semibold text-brown-800">{log.userName}</p>
        <p className="text-sm text-gray-400">{log.roleName}</p>
      </div>

      <Divider className="!my-0" />

      <div className="flex flex-col gap-2.5">
        {meta.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3">
            <span className="w-28 shrink-0 text-sm text-gray-400">{label}</span>
            <div className="flex-1 text-right text-sm text-gray-700">{value}</div>
          </div>
        ))}
      </div>

      {detailEntries.length > 0 && (
        <>
          <Divider className="!my-0" />
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">{t("userLog.changesTitle")}</p>
            <div className="flex flex-col gap-2">
              {detailEntries.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="mb-1 text-xs text-gray-400">{label}</p>
                  <p className="text-sm text-gray-700">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
