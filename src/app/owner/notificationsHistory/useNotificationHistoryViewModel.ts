"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Notification History — reuse notifications vertical (มีอยู่แล้ว)
// โหลดครั้งเดียว (limit 200) แล้วกรอง/สรุปฝั่ง client (แพทเทิร์นเดียวกับ Ingredient History)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { notificationsService } from "@/services/notifications";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { alert, confirmAlert } from "@/lib/alert";
import type { NotificationDTO, NotificationModule } from "@/types/notification";
import type { NotificationType } from "@/types";
import { isApiError } from "@/types/api";
import { NOTIFICATION_HISTORY_KEY, fetchNotificationHistory } from "./notificationsQuery";

type TabFilter = "all" | "unread" | "read";
type ModuleFilter = "all" | NotificationModule;
type TypeFilter = "all" | NotificationType;

/** ยิงทีละ BATCH_SIZE คำขอ (เดิมยิงพร้อมกันทุกรายการ — หลายร้อยคำขอทีเดียว) · ไม่หยุดเมื่อบางรายการล้ม · คืนจำนวนที่ล้ม */
const BATCH_SIZE = 10;
async function runInBatches<T>(items: T[], fn: (item: T) => Promise<unknown>): Promise<number> {
  let failed = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const results = await Promise.allSettled(items.slice(i, i + BATCH_SIZE).map(fn));
    failed += results.filter((r) => r.status === "rejected").length;
  }
  return failed;
}

export function useNotificationHistoryViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  // การแจ้งเตือนไม่มี menu_key ของตัวเอง (ROUTE_MENU_MAP ไม่ได้ผูก /owner/notificationsHistory)
  // backend: GET/PATCH แค่ล็อกอินก็พอ · แต่ DELETE เป็น requireRole(session, "owner")
  // → ปุ่มลบจึงเช็คด้วย role ไม่ใช่ usePermission (src/app/api/admin/notifications/[id]/route.ts)
  const { user } = useCurrentUser();
  const canDelete = user?.roleType === "owner";

  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const q = useQuery({
    queryKey: NOTIFICATION_HISTORY_KEY,
    queryFn: () => fetchNotificationHistory(),
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

  // ยอดจริงจาก backend — รายการที่โหลดอาจไม่ครบประวัติ (ดู fetchNotificationHistory)
  const stats = useMemo(
    () => ({
      total: q.data?.total ?? 0,
      unread: q.data?.unread ?? 0,
      read: (q.data?.total ?? 0) - (q.data?.unread ?? 0),
      warning: q.data?.warning ?? 0,
      error: q.data?.error ?? 0,
    }),
    [q.data],
  );
  const olderHidden = q.data?.olderHidden ?? false;

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
    // โหลดรายการใหม่เสมอ — เดิมล้มบางรายการแล้วไม่โหลดใหม่ หน้าจอค้างไม่ตรงกับที่ทำไปแล้วจริง
    const failed = await runInBatches(unread, (n) => notificationsService.markRead(n._id));
    invalidate();
    if (failed === 0) alert.success(t("notifications.markedAllRead"));
    else alert.error(t("notifications.partialFailed", { n: failed, total: unread.length }));
  };

  const onDelete = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => alert.success(t("notifications.deleted")),
      onError: (e) => alert.error(isApiError(e) ? e.message : t("notifications.deleteFailed")),
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
    const failed = await runInBatches(all, (n) => notificationsService.remove(n._id));
    invalidate();
    if (failed === 0) alert.success(t("notifications.cleared"));
    else alert.error(t("notifications.partialFailed", { n: failed, total: all.length }));
  };

  return {
    canDelete,
    rows: filtered,
    stats,
    /** มีการแจ้งเตือนที่อ่านแล้วเก่ากว่าที่โหลดไว้ — ลบทั้งหมดลบเฉพาะที่แสดง */
    olderHidden,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    isLoading: q.isPending,
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
