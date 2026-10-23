"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ User Activity Log — audit log (อ่านอย่างเดียว)
//
// แบ่งหน้าที่ backend: ตารางดึงทีละหน้าพร้อมตัวกรองที่ backend รองรับ (พนักงาน · ประเภท · ช่วงวันที่) ·
// การ์ดสถิติ = meta.total ของคำขอ limit 1 · ชื่อผู้ทำรายการ backend populate มาให้ · ตำแหน่งจากรายชื่อพนักงาน
// ค้นหาข้อความ backend ไม่รองรับ → พิมพ์ค้นหาเมื่อไหร่ ดึงทั้งหมดที่ตรงตัวกรองแล้วกรอง/แบ่งหน้าฝั่ง browser (แบบเดิม)
// เดิมดึงทุกรายการ + ผู้ใช้ทั้งระบบตอนเปิดหน้า — ช้าเกินเพดาน prefetch ฝั่ง server (Lighthouse SI 5.3 วิ)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import type { Dayjs } from "dayjs";
import { userLogsService } from "@/services/userLogs";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { exportToCsv, forceText } from "@/lib/exportCsv";
import { refId } from "@/lib/refId";
import { formatDate } from "@/i18n/format";
import { sortOptionsThai } from "@/lib/thaiSort";
import type { UserLog } from "@/types/userLog";
import type { UserLogAction } from "@/constants/enumConfig";
import {
  ROLES_KEY, STAFF_KEY, STAFF_PARAMS, USER_LOG_PAGE_SIZE,
  userLogAllKey, userLogAllParams, userLogCountQueries, userLogPageKey, userLogPageParams, userLogTodayRange,
  type UserLogFilters,
} from "../employeesQuery";

export interface LogRow extends UserLog {
  userName: string;
  roleName: string;
}

type ActionFilter = "all" | UserLogAction;
type DateRange = [Dayjs, Dayjs] | null;

export function useUserLogViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const perm = usePermission("user_log");

  const [search, setSearch] = useState("");
  const [employeeId, setEmployeeId] = useState<string>("all");
  const [actionType, setActionType] = useState<ActionFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(USER_LOG_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filters: UserLogFilters = {
    employeeId,
    actionType,
    dateFrom: dateRange ? dateRange[0].startOf("day").toISOString() : null,
    dateTo: dateRange ? dateRange[1].endOf("day").toISOString() : null,
  };
  const q = search.trim().toLowerCase();
  const searching = q.length > 0;

  // ── ตาราง: หน้าละ pageSize จาก backend (ไม่ค้นหา) · ทั้งหมดที่ตรงตัวกรองแล้วกรองคำค้นฝั่ง browser (ค้นหา) ──
  const pageParams = userLogPageParams(filters, page, pageSize);
  const pageQ = useQuery({
    queryKey: userLogPageKey(pageParams),
    queryFn: () => userLogsService.list(pageParams),
    enabled: !searching,
    placeholderData: keepPreviousData,
  });
  const allParams = userLogAllParams(filters);
  const allQ = useQuery({
    queryKey: userLogAllKey(allParams),
    queryFn: () => userLogsService.list(allParams),
    enabled: searching,
    placeholderData: keepPreviousData,
  });

  // ── การ์ดสถิติ (ทั้งระบบ ไม่ขึ้นกับตัวกรอง — เหมือนเดิม) ──
  const [today] = useState(userLogTodayRange);
  const [totalDef, todayDef, updateDef, removeDef] = userLogCountQueries(today);
  const totalQ = useQuery({ queryKey: totalDef.key, queryFn: () => userLogsService.list(totalDef.params) });
  const todayQ = useQuery({ queryKey: todayDef.key, queryFn: () => userLogsService.list(todayDef.params) });
  const updateQ = useQuery({ queryKey: updateDef.key, queryFn: () => userLogsService.list(updateDef.params) });
  const removeQ = useQuery({ queryKey: removeDef.key, queryFn: () => userLogsService.list(removeDef.params) });
  const stats = {
    total: totalQ.data?.meta.total ?? 0,
    today: todayQ.data?.meta.total ?? 0,
    update: updateQ.data?.meta.total ?? 0,
    remove: removeQ.data?.meta.total ?? 0,
  };

  // ── ชื่อ/ตำแหน่ง: ชื่อมากับ log แล้ว · ตำแหน่งจากรายชื่อพนักงาน (ลูกค้า/บัญชีที่ไม่ใช่พนักงาน = "—") ──
  const staffQ = useQuery({ queryKey: STAFF_KEY, queryFn: () => usersService.list(STAFF_PARAMS) });
  const rolesQ = useQuery({ queryKey: ROLES_KEY, queryFn: () => rolesService.list() });
  const staffRole = useMemo(() => {
    const roleName = new Map((rolesQ.data?.data ?? []).map((r) => [r._id, r.role_name]));
    return new Map((staffQ.data?.data ?? []).map((u) => [u._id, (u.role_id && roleName.get(refId(u.role_id))) || "—"]));
  }, [staffQ.data, rolesQ.data]);
  const toRow = (l: UserLog): LogRow => ({ ...l, userName: l.user_name || "—", roleName: staffRole.get(l.user_id) ?? "—" });

  const searchRows = searching
    ? (allQ.data?.data ?? []).map(toRow).filter((r) => r.userName.toLowerCase().includes(q) || r.action.toLowerCase().includes(q))
    : [];
  const rows: LogRow[] = searching
    ? searchRows.slice((page - 1) * pageSize, page * pageSize)
    : (pageQ.data?.data ?? []).map(toRow);
  const total = searching ? searchRows.length : (pageQ.data?.meta.total ?? 0);

  const employeeOptions = useMemo(
    () => sortOptionsThai((staffQ.data?.data ?? []).map((u) => ({ value: u._id, label: u.user_fullname }))),
    [staffQ.data],
  );

  const selectedLog = rows.find((r) => r._id === selectedId) ?? null;

  // ส่งออก CSV: ทุกรายการที่ตรงตัวกรอง (+ คำค้น) — ดึงตอนกดเท่านั้น
  const [exporting, setExporting] = useState(false);
  const onExport = async () => {
    setExporting(true);
    try {
      const all = searching ? searchRows : (await userLogsService.list(allParams)).data.map(toRow);
      if (all.length === 0) {
        alert.info(t("systemLog.exportEmpty"));
        return;
      }
      const headers = [
        t("systemLog.colTime"), t("systemLog.colEmployee"), t("employees.colRole"),
        t("systemLog.colType"), t("systemLog.colDetail"), t("fields.type"), t("systemLog.colIp"),
      ];
      const body = all.map((r) => [
        forceText(formatDate(r.created_at, locale, { withTime: true })),
        r.userName,
        r.roleName,
        t(`enums.systemLogAction.${r.action_type}`),
        r.action,
        r.entity ? (t.has(`entities.${r.entity}`) ? t(`entities.${r.entity}`) : t("entities.fallback")) : "",
        r.ip_address ?? "",
      ]);
      exportToCsv(`user-logs_${new Date().toISOString().slice(0, 10)}`, headers, body);
      alert.success(t("systemLog.exportSuccess", { n: all.length }));
    } catch {
      alert.error(t("common.loadFailed"));
    } finally {
      setExporting(false);
    }
  };

  // เปลี่ยนตัวกรอง/คำค้น → กลับหน้าแรก
  const resetting = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const listQ = searching ? allQ : pageQ;
  return {
    perm,
    rows,
    stats,
    employeeOptions,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    isLoading: listQ.isPending,
    isError: listQ.isError,
    refetch: () => listQ.refetch(),

    pagination: {
      page,
      pageSize,
      total,
      onChange: (p: number, ps: number) => {
        setPage(ps === pageSize ? p : 1);
        setPageSize(ps);
      },
    },

    search, setSearch: resetting(setSearch),
    employeeId, setEmployeeId: resetting(setEmployeeId),
    actionType, setActionType: resetting(setActionType),
    dateRange, setDateRange: resetting(setDateRange),

    selectedLog,
    drawerOpen,
    onView: (r: LogRow) => { setSelectedId(r._id); setDrawerOpen(true); },
    closeDrawer: () => setDrawerOpen(false),

    onExport,
    exporting,
  };
}
