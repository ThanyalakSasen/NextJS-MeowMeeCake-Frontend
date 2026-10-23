"use client";
// เนื้อหาใน DetailModal (ป๊อปอัป) ของหน้า User Log — แสดงรายละเอียด log 1 รายการ
// มี before/after (log ใหม่) → ตาราง "ฟิลด์ · ก่อน → หลัง" (useLogChanges)
// ไม่มี (log เก่า/route ที่ยังไม่ส่ง) → โชว์ `details` รูปแบบไม่คงที่แบบ key/value ทั่วไปเหมือนเดิม
import { useTranslations, useLocale, useMessages } from "next-intl";
import { Divider } from "@/components/base";
import { formatDate } from "@/i18n/format";
import { USER_LOG_ACTION_CONFIG } from "@/constants/enumConfig";
import type { LogRow } from "../useUserLogViewModel";
import { useLogChanges } from "../useLogChanges";

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
  const { changesOf, contextOf, entityOf } = useLogChanges();
  const changes = changesOf(log);
  const context = contextOf(log);
  const changesTitle = !log.before ? t("systemLog.createdTitle") : !log.after ? t("systemLog.deletedTitle") : t("systemLog.changesTitle");

  // details: array ของชื่อ field ที่แก้ (ไม่มีค่าเก่า/ใหม่) หรือ object เก็บบาง field ของ body
  // แล้วแต่ route — สร้างเป็นคู่ [label, value] ให้ render ได้แบบเดียวกันทั้งสองแบบ
  const detailEntries: [string, string][] = (() => {
    const details = log.details;
    if (details == null || changes.length > 0) return [];
    if (Array.isArray(details)) {
      if (details.length === 0) return [];
      return [[t("systemLog.changedFields"), details.map((f) => fieldLabel(String(f))).join(", ")]];
    }
    if (typeof details === "object") {
      return Object.entries(details as Record<string, unknown>).map(([k, v]) => [fieldLabel(k), formatDetailValue(v)]);
    }
    return [[t("systemLog.colDetail"), String(details)]];
  })();

  const meta: [string, React.ReactNode][] = [
    [t("systemLog.colDetail"), log.action],
    [
      t("systemLog.colType"),
      <span
        key="type"
        className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium"
        style={{ backgroundColor: cfg.bg, color: cfg.color }}
      >
        {t(`enums.systemLogAction.${log.action_type}`)}
      </span>,
    ],
    [
      t("systemLog.colEntity"),
      log.entity ? (
        <span>
          {entityOf(log.entity)}
          {context && <span className="mt-0.5 block text-xs text-gray-500">{context}</span>}
        </span>
      ) : (
        "—"
      ),
    ],
    [t("systemLog.colIp"), <span key="ip" className="font-mono text-sm text-gray-500">{log.ip_address ?? "—"}</span>],
    [t("systemLog.colTime"), formatDate(log.created_at, locale, { withTime: true })],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-semibold text-brown-800">{log.userName}</p>
        <p className="text-sm text-gray-500">{log.roleName}</p>
      </div>

      <Divider className="!my-0" />

      <div className="flex flex-col gap-2.5">
        {meta.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3">
            <span className="w-28 shrink-0 text-sm text-gray-500">{label}</span>
            <div className="flex-1 text-right text-sm text-gray-700">{value}</div>
          </div>
        ))}
      </div>

      {changes.length > 0 && (
        <>
          <Divider className="!my-0" />
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">{changesTitle}</p>
            <div className="flex flex-col gap-2">
              {changes.map((c) => (
                <div key={c.field} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="mb-1 text-xs text-gray-500">{c.label}</p>
                  {c.before !== null && c.after !== null ? (
                    <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-2 gap-y-0.5 text-sm">
                      <span className="text-xs text-gray-500">{t("systemLog.before")}</span>
                      <span className="break-all text-gray-500 line-through decoration-gray-300">{c.before}</span>
                      <span className="text-xs text-gray-500">{t("systemLog.after")}</span>
                      <span className="break-all font-medium text-brown-800">{c.after}</span>
                    </div>
                  ) : (
                    <p className="break-all text-sm text-gray-700">{c.after ?? c.before}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {detailEntries.length > 0 && (
        <>
          <Divider className="!my-0" />
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">{t("systemLog.changesTitle")}</p>
            <div className="flex flex-col gap-2">
              {detailEntries.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="mb-1 text-xs text-gray-500">{label}</p>
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
