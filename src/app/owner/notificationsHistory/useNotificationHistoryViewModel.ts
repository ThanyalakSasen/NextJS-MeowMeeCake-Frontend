"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Notification History — reuse notifications vertical (มีอยู่แล้ว)
// โหลดครั้งเดียว (limit 200) แล้วกรอง/สรุปฝั่ง client (แพทเทิร์นเดียวกับ Ingredient History)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { notificationsService } from "@/services/notifications";
import { alert, confirmAlert } from "@/lib/alert";
import type { NotificationDTO, NotificationModule } from "@/types/notification";
import type { NotificationType } from "@/types";

type TabFilter = "all" | "unread" | "read";
type ModuleFilter = "all" | NotificationModule;
type TypeFilter = "all" | NotificationType;

export function useNotificationHistoryViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();

  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const q = useQuery({
    queryKey: ["notifications", { history: true }],
    queryFn: () => notificationsService.list({ limit: 200, sort: "-created_at" }),
  });

  const all = useMemo(() => q.data?.data ?? [], [q.data]);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return all.filter((n) => {
      const matchTab = tab === "all" || (tab === "read" ? n.is_read : !n.is_read);
      const matchSearch =
        !kw || n.title.toLowerCase().includes(kw) || n.message.toLowerCase().includes(kw);
      const matchModule = moduleFilter === "all" || n.module === moduleFilter;
      const matchType = typeFilter === "all" || n.type === typeFilter;
      return matchTab && matchSearch && matchModule && matchType;
    });
  }, [all, tab, search, moduleFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: all.length,
      unread: all.filter((n) => !n.is_read).length,
      read: all.filter((n) => n.is_read).length,
      warning: all.filter((n) => n.type === "warning").length,
      error: all.filter((n) => n.type === "error").length,
    }),
    [all],
  );

  const selected = all.find((n) => n._id === selectedId) ?? null;

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => notificationsService.remove(id),
    onSuccess: invalidate,
  });

  const openDetail = (n: NotificationDTO) => {
    setSelectedId(n._id);
    setDrawerOpen(true);
    if (!n.is_read) markRead.mutate(n._id);
  };

  const onMarkAllRead = async () => {
    const unread = all.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map((n) => notificationsService.markRead(n._id)));
      invalidate();
      alert.success(t("notifications.markedAllRead"));
    } catch {
      alert.error(t("common.loadFailed"));
    }
  };

  const onDelete = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => alert.success(t("notifications.deleted")),
      onError: () => alert.error(t("notifications.deleteFailed")),
    });

  const onClearAll = async () => {
    if (all.length === 0) return;
    const ok = await confirmAlert(t("notifications.clearAllConfirm"), {
      title: t("notifications.clearAll"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
    try {
      await Promise.all(all.map((n) => notificationsService.remove(n._id)));
      invalidate();
      alert.success(t("notifications.cleared"));
    } catch {
      alert.error(t("notifications.deleteFailed"));
    }
  };

  return {
    rows: filtered,
    stats,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => q.refetch(),

    tab, setTab,
    search, setSearch,
    moduleFilter, setModuleFilter,
    typeFilter, setTypeFilter,

    selected,
    drawerOpen,
    openDetail,
    closeDrawer: () => setDrawerOpen(false),

    onMarkAllRead,
    onDelete,
    onClearAll,
  };
}
