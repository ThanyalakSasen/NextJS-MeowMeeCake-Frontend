"use client";
// View ของ Notification History — ตารางประวัติแจ้งเตือน + drawer รายละเอียด
import { useTranslations, useLocale } from "next-intl";
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Button, Select, Tag } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { DetailDrawer, ConfirmDeletePopup } from "@/components/shared/feedback";
import { DataTable, FilterToolbar, SearchInput, TypeTabBar, type Column } from "@/components/shared/data";
import { formatDate } from "@/i18n/format";
import { NOTIFICATION_TYPE_COLOR } from "@/constants/enumConfig";
import type { NotificationDTO, NotificationModule } from "@/types/notification";
import type { NotificationType } from "@/types";
import type { useNotificationHistoryViewModel } from "./useNotificationHistoryViewModel";
import { NotificationDetailContent } from "./_components/NotificationDetailContent";

type VM = ReturnType<typeof useNotificationHistoryViewModel>;

const MODULES: NotificationModule[] = ["order", "ingredient", "production", "employee", "finance", "system"];
const TYPES: NotificationType[] = ["warning", "info", "success", "error"];

export function NotificationHistoryView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<NotificationDTO>[] = [
    {
      key: "dot",
      title: "",
      width: 8,
      render: (n) => (!n.is_read ? <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> : null),
    },
    {
      key: "type",
      title: t("notifications.colType"),
      render: (n) => (
        <span className="text-sm font-medium" style={{ color: NOTIFICATION_TYPE_COLOR[n.type] }}>
          {t(`enums.notificationType.${n.type}`)}
        </span>
      ),
    },
    {
      key: "content",
      title: t("notifications.colContent"),
      render: (n) => (
        <div>
          <p className={n.is_read ? "text-gray-600" : "font-semibold text-brown-800"}>{n.title}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{n.message}</p>
        </div>
      ),
    },
    {
      key: "module",
      title: t("notifications.colModule"),
      render: (n) => <Tag>{t(`enums.notificationModule.${n.module}`)}</Tag>,
    },
    {
      key: "time",
      title: t("notifications.colTime"),
      render: (n) => formatDate(n.created_at, locale, { withTime: true }),
    },
    {
      key: "status",
      title: t("notifications.colStatus"),
      render: (n) => (
        <Tag color={n.is_read ? "default" : "processing"}>
          {n.is_read ? t("notifications.statusRead") : t("notifications.statusUnread")}
        </Tag>
      ),
    },
  ];

  return (
    <ListPageLayout
      title={t("notifications.historyTitle")}
      description={t("notifications.historyDescription")}
      actions={
        <>
          {vm.stats.unread > 0 && (
            <Button icon={<CheckCircleIcon className="h-4 w-4" />} onClick={vm.onMarkAllRead}>
              {t("notifications.markAllRead")}
            </Button>
          )}
          {vm.stats.total > 0 && (
            <Button danger icon={<TrashIcon className="h-4 w-4" />} onClick={vm.onClearAll}>
              {t("notifications.clearAll")}
            </Button>
          )}
        </>
      }
      toolbar={
        <FilterToolbar
          left={
            <>
              <TypeTabBar
                value={vm.tab}
                onChange={vm.setTab}
                options={[
                  { value: "all", label: t("notifications.tabAll") },
                  { value: "unread", label: t("notifications.tabUnread") },
                  { value: "read", label: t("notifications.tabRead") },
                ]}
              />
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("notifications.searchPlaceholder")} />
              <div style={{ minWidth: 150 }}>
                <Select
                  value={vm.moduleFilter}
                  onChange={(v) => vm.setModuleFilter(v as VM["moduleFilter"])}
                  options={[
                    { value: "all", label: t("notifications.allModules") },
                    ...MODULES.map((m) => ({ value: m, label: t(`enums.notificationModule.${m}`) })),
                  ]}
                />
              </div>
              <div style={{ minWidth: 140 }}>
                <Select
                  value={vm.typeFilter}
                  onChange={(v) => vm.setTypeFilter(v as VM["typeFilter"])}
                  options={[
                    { value: "all", label: t("notifications.allTypes") },
                    ...TYPES.map((ty) => ({ value: ty, label: t(`enums.notificationType.${ty}`) })),
                  ]}
                />
              </div>
            </>
          }
        />
      }
    >
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <Button onClick={() => vm.refetch()}>{t("common.retry")}</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <StatCardsGrid>
            <StatCard label={t("notifications.statTotal")} value={vm.stats.total} sub={t("notifications.statTotalSub")} />
            <StatCard label={t("notifications.statUnread")} value={vm.stats.unread} sub={t("notifications.statUnreadSub")} tone="warn" />
            <StatCard label={t("enums.notificationType.warning")} value={vm.stats.warning} sub={t("notifications.statWarningSub")} tone="warn" />
            <StatCard label={t("enums.notificationType.error")} value={vm.stats.error} sub={t("notifications.statErrorSub")} tone="down" />
          </StatCardsGrid>

          <DataTable
            columns={columns}
            rows={vm.rows}
            loading={vm.isLoading}
            emptyText={t("notifications.empty")}
            onRowClick={vm.openDetail}
            actions={(n) => (
              <ConfirmDeletePopup title={t("notifications.deleteConfirm")} onConfirm={() => vm.onDelete(n._id)}>
                <Button size="small" danger>{t("common.delete")}</Button>
              </ConfirmDeletePopup>
            )}
          />
        </div>
      )}

      <DetailDrawer
        open={vm.drawerOpen}
        title={t("notifications.detailTitle")}
        onClose={vm.closeDrawer}
        footer={
          vm.selected?.link ? (
            <Button type="primary" block href={vm.selected.link}>
              {t("notifications.goToLink")}
            </Button>
          ) : undefined
        }
      >
        {vm.selected && <NotificationDetailContent notif={vm.selected} />}
      </DetailDrawer>
    </ListPageLayout>
  );
}
