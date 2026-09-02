"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ User Activity Log — audit log (อ่านอย่างเดียว)
// โหลด user-logs + users + roles ครั้งเดียว แล้วกรอง/สรุปฝั่ง client
// (แพทเทิร์นเดียวกับ Ingredient History #11)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { userLogsService } from "@/services/userLogs";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { exportToCsv, forceText } from "@/lib/exportCsv";
import { formatDate } from "@/i18n/format";
import type { UserLog } from "@/types/userLog";
import type { UserLogAction } from "@/constants/enumConfig";

export interface LogRow extends UserLog {
  userName: string;
  roleName: string;
}

type ActionFilter = "all" | UserLogAction;
type DateRange = [Dayjs, Dayjs] | null;

export function useUserLogViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const perm = usePermission("employees");

  const [search, setSearch] = useState("");
  const [employeeId, setEmployeeId] = useState<string>("all");
  const [actionType, setActionType] = useState<ActionFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const logsQ = useQuery({
    queryKey: ["user-logs"],
    queryFn: () => userLogsService.list({ limit: 200 }),
  });
  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.list({ limit: 100 }),
  });
  const rolesQ = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesService.list(),
  });

  const rows = useMemo<LogRow[]>(() => {
    const roleName = new Map((rolesQ.data?.data ?? []).map((r) => [r._id, r.role_name]));
    const userInfo = new Map(
      (usersQ.data?.data ?? []).map((u) => [
        u._id,
        { name: u.user_fullname, role: (u.role_id && roleName.get(u.role_id)) || "—" },
      ]),
    );
    return (logsQ.data?.data ?? [])
      .map((l) => {
        const info = userInfo.get(l.user_id);
        return { ...l, userName: info?.name ?? "—", roleName: info?.role ?? "—" };
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [logsQ.data, usersQ.data, rolesQ.data]);

  const employeeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) if (!seen.has(r.user_id)) seen.set(r.user_id, r.userName);
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.userName.toLowerCase().includes(q) || r.action.toLowerCase().includes(q);
      const matchEmployee = employeeId === "all" || r.user_id === employeeId;
      const matchType = actionType === "all" || r.action_type === actionType;
      const matchDate =
        !dateRange ||
        (dayjs(r.created_at).isAfter(dateRange[0].startOf("day")) &&
          dayjs(r.created_at).isBefore(dateRange[1].endOf("day")));
      return matchSearch && matchEmployee && matchType && matchDate;
    });
  }, [rows, search, employeeId, actionType, dateRange]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      today: rows.filter((r) => dayjs(r.created_at).isSame(dayjs(), "day")).length,
      update: rows.filter((r) => r.action_type === "UPDATE").length,
      remove: rows.filter((r) => r.action_type === "DELETE").length,
    }),
    [rows],
  );

  const selectedLog = rows.find((r) => r._id === selectedId) ?? null;

  const onExport = () => {
    if (filtered.length === 0) {
      alert.info(t("userLog.exportEmpty"));
      return;
    }
    const headers = [
      t("userLog.colTime"), t("userLog.colEmployee"), t("employees.colRole"),
      t("userLog.colType"), t("userLog.colDetail"), t("fields.type"), t("userLog.colIp"),
    ];
    const body = filtered.map((r) => [
      forceText(formatDate(r.created_at, locale, { withTime: true })),
      r.userName,
      r.roleName,
      t(`enums.userLogAction.${r.action_type}`),
      r.action,
      r.entity ? t(`entities.${r.entity}`) : "",
      r.ip_address ?? "",
    ]);
    exportToCsv(`user-logs_${new Date().toISOString().slice(0, 10)}`, headers, body);
    alert.success(t("userLog.exportSuccess", { n: filtered.length }));
  };

  return {
    perm,
    rows: filtered,
    stats,
    employeeOptions,
    isLoading: logsQ.isLoading || usersQ.isLoading || rolesQ.isLoading,
    isError: logsQ.isError,
    refetch: () => logsQ.refetch(),

    search, setSearch,
    employeeId, setEmployeeId,
    actionType, setActionType,
    dateRange, setDateRange,

    selectedLog,
    drawerOpen,
    onView: (r: LogRow) => { setSelectedId(r._id); setDrawerOpen(true); },
    closeDrawer: () => setDrawerOpen(false),

    onExport,
  };
}
