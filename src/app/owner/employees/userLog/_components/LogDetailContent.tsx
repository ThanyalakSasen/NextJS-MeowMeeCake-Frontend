"use client";
// เนื้อหาใน DetailDrawer ของหน้า User Log — แสดงรายละเอียด log 1 รายการ + diff ก่อน/หลัง
import { useTranslations, useLocale, useMessages } from "next-intl";
import { Divider } from "@/components/base";
import { formatDate } from "@/i18n/format";
import { USER_LOG_ACTION_CONFIG } from "@/constants/enumConfig";
import type { LogRow } from "../useUserLogViewModel";

export function LogDetailContent({ log }: { log: LogRow }) {
  const t = useTranslations();
  const locale = useLocale();
  // field key → label จาก namespace "fields" ถ้ามี · ไม่มีก็โชว์ key ดิบ
  const fieldMsgs = (useMessages() as { fields?: Record<string, string> }).fields ?? {};
  const fieldLabel = (field: string) => fieldMsgs[field] ?? field;
  const cfg = USER_LOG_ACTION_CONFIG[log.action_type];

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
          {t(`entities.${log.entity}`)}
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

      {log.changes && log.changes.length > 0 && (
        <>
          <Divider className="!my-0" />
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">{t("userLog.changesTitle")}</p>
            <div className="flex flex-col gap-2">
              {log.changes.map((c) => (
                <div key={c.field} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="mb-1 text-xs text-gray-400">{fieldLabel(c.field)}</p>
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="text-red-500 line-through decoration-red-300">{c.before}</span>
                    <span className="shrink-0 text-gray-300">→</span>
                    <span className="font-medium text-green-700">{c.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
