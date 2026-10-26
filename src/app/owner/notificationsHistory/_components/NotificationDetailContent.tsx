"use client";
// เนื้อหาใน DetailModal (ป๊อปอัป) ของหน้า Notification History
import { useTranslations, useLocale } from "next-intl";
import { Divider, Tag } from "@/components/base";
import { formatDate } from "@/i18n/format";
import { NOTIFICATION_TYPE_COLOR, READ_STATUS_CONFIG } from "@/constants/enumConfig";
import type { NotificationDTO } from "@/types/notification";
import { lineFailReason } from "../lineStatus";
import { LineStatusTag } from "./LineStatusTag";

export function NotificationDetailContent({ notif }: { notif: NotificationDTO }) {
  const t = useTranslations();
  const locale = useLocale();
  const color = NOTIFICATION_TYPE_COLOR[notif.type];

  const meta: [string, React.ReactNode][] = [
    [t("fields.type"), <span key="t" style={{ color }} className="font-medium">{t(`enums.notificationType.${notif.type}`)}</span>],
    [t("fields.module"), <Tag key="m">{t(`enums.notificationModule.${notif.module}`)}</Tag>],
    [
      t("fields.status"),
      <Tag key="s" color={READ_STATUS_CONFIG[notif.is_read ? "read" : "unread"].antColor}>
        {notif.is_read ? t("notifications.statusRead") : t("notifications.statusUnread")}
      </Tag>,
    ],
    [t("systemLog.colTime"), formatDate(notif.created_at, locale, { withTime: true })],
    [t("notifications.colLine"), <LineStatusTag key="l" notif={notif} />],
  ];
  const lineError = notif.line_sent ? null : notif.line_error;
  const reason = lineError ? lineFailReason(lineError) : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-semibold text-brown-800">{notif.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">{notif.message}</p>
      </div>

      <Divider className="!my-0" />

      <div className="flex flex-col gap-2.5">
        {meta.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="w-24 shrink-0 text-sm text-gray-500">{label}</span>
            <div className="flex-1 text-right text-sm text-gray-700">{value}</div>
          </div>
        ))}
      </div>

      {lineError && reason && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {reason === "other" ? t("notifications.lineReason.other", { error: lineError }) : t(`notifications.lineReason.${reason}`)}
        </p>
      )}
    </div>
  );
}
