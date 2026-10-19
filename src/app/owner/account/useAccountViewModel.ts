"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "บัญชีของฉัน" หลังร้าน (เจ้าของร้าน/พนักงาน) — 3 แท็บ
//   ข้อมูลของฉัน   GET/PATCH /shop/me (ชื่อ · เบอร์ · วันเกิด — อีเมล/ตำแหน่งแก้ที่หน้าจัดการพนักงาน)
//   เปลี่ยนรหัสผ่าน PATCH /shop/me/password (เครื่องอื่นหลุด · เครื่องนี้ได้ cookie ใหม่)
//   ประวัติการทำงาน GET /shop/me/activity (เฉพาะของตัวเอง — ไม่ต้องมีสิทธิ์ employees)
// state ทุกแท็บอยู่ที่นี่ (TabbedPageLayout render เฉพาะแท็บที่เปิด) สลับแท็บแล้วค่าไม่หาย
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { shopProfileService } from "@/services/shopProfile";
import { userLogsService } from "@/services/userLogs";
import { shopProfileKey } from "@/app/customer/lib/shopQueries";
import { CURRENT_USER_KEY, useCurrentUser } from "@/hooks/useCurrentUser";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";
import type { UserLogAction } from "@/constants/enumConfig";
import { alert } from "@/lib/alert";
import { LIST_ALL } from "@/lib/http";
import { isApiError } from "@/types/api";
import type { LogRow } from "../employees/userLog/useUserLogViewModel";

export type AccountTab = "profile" | "password" | "logs";
type ActionFilter = "all" | UserLogAction;
type DateRange = [Dayjs, Dayjs] | null;

const PHONE_RE = /^0\d{8,9}$/;
const MAX_PASSWORD = 72;
const EMPTY_PASSWORDS = { current: "", next: "", confirm: "" };

export function useAccountViewModel() {
  const t = useTranslations("myAccount");
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<AccountTab>("profile");

  // ── ข้อมูลของฉัน ──
  const profileQ = useQuery({ queryKey: shopProfileKey, queryFn: () => shopProfileService.get() });
  const profile = profileQ.data;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", birthday: null as Dayjs | null });

  const startEdit = () => {
    if (!profile) return;
    setForm({
      name: profile.user_fullname,
      phone: profile.user_phone ?? "",
      birthday: profile.user_birthdate ? dayjs(profile.user_birthdate) : null,
    });
    setEditing(true);
  };

  const profileError = (() => {
    if (!editing) return null;
    const name = form.name.trim();
    if (!name || name.length > 120) return { field: "name", message: t("nameRequired") };
    if (form.phone && !PHONE_RE.test(form.phone.trim())) return { field: "phone", message: t("phoneInvalid") };
    if (form.birthday && form.birthday.isAfter(dayjs(), "day")) return { field: "birthday", message: t("birthdayFuture") };
    return null;
  })();

  const saveProfile = useMutation({
    mutationFn: () =>
      shopProfileService.update({
        user_fullname: form.name.trim(),
        user_phone: form.phone.trim() || null,
        user_birthdate: form.birthday ? form.birthday.format("YYYY-MM-DD") : null,
      }),
    onSuccess: (p) => {
      qc.setQueryData(shopProfileKey, p);
      // ชื่อบนแถบบน/เมนูผู้ใช้มาจาก /auth/me
      qc.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      setEditing(false);
      alert.success(t("profileSaved"));
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("profileSaveFailed")),
  });

  // ── เปลี่ยนรหัสผ่าน ──
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const passwordError = (() => {
    const { current, next, confirm } = passwords;
    if (next && (next.length < MIN_PASSWORD_LENGTH || next.length > MAX_PASSWORD))
      return t("passwordLength", { min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD });
    if (confirm && next !== confirm) return t("passwordMismatch");
    if (current && next && current === next) return t("passwordSame");
    return null;
  })();
  const canChangePassword =
    !!passwords.current && !!passwords.next && !!passwords.confirm && !passwordError;

  const changePassword = useMutation({
    mutationFn: () => shopProfileService.changePassword(passwords.current, passwords.next),
    onSuccess: () => {
      setPasswords(EMPTY_PASSWORDS);
      alert.success(t("passwordChanged"));
    },
    // รหัสเดิมผิด / ถี่เกิน — ข้อความของ backend
    onError: (e) => alert.error(isApiError(e) ? e.message : t("passwordChangeFailed")),
  });

  // ── ประวัติการทำงาน (โหลดเมื่อเปิดแท็บครั้งแรก) ──
  const logsQ = useQuery({
    queryKey: ["user-logs", "me"],
    queryFn: () => userLogsService.listMine({ limit: LIST_ALL }),
    enabled: tab === "logs",
  });
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState<ActionFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const logRows = useMemo<LogRow[]>(
    () =>
      (logsQ.data?.data ?? [])
        .map((l) => ({ ...l, userName: user?.fullname ?? "—", roleName: user?.roleName ?? "—" }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [logsQ.data, user?.fullname, user?.roleName],
  );

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logRows.filter(
      (r) =>
        (!q || r.action.toLowerCase().includes(q)) &&
        (actionType === "all" || r.action_type === actionType) &&
        (!dateRange ||
          (dayjs(r.created_at).isAfter(dateRange[0].startOf("day")) &&
            dayjs(r.created_at).isBefore(dateRange[1].endOf("day")))),
    );
  }, [logRows, search, actionType, dateRange]);

  return {
    tab,
    setTab: (k: string) => setTab(k as AccountTab),
    roleName: user?.roleName ?? "",

    profile,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    profileLoading: profileQ.isPending,
    profileFailed: profileQ.isError,
    refetchProfile: () => profileQ.refetch(),
    editing,
    form,
    setFormField: <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    profileError,
    startEdit,
    cancelEdit: () => setEditing(false),
    onSaveProfile: () => saveProfile.mutate(),
    savingProfile: saveProfile.isPending,

    passwords,
    setPassword: (key: keyof typeof EMPTY_PASSWORDS, value: string) =>
      setPasswords((p) => ({ ...p, [key]: value })),
    passwordError,
    canChangePassword,
    onChangePassword: () => changePassword.mutate(),
    changingPassword: changePassword.isPending,
    maxPassword: MAX_PASSWORD,

    logs: filteredLogs,
    logsLoading: logsQ.isLoading,
    logsFailed: logsQ.isError,
    refetchLogs: () => logsQ.refetch(),
    search, setSearch,
    actionType, setActionType,
    dateRange, setDateRange,
    selectedLog: logRows.find((r) => r._id === selectedId) ?? null,
    drawerOpen,
    onViewLog: (r: LogRow) => { setSelectedId(r._id); setDrawerOpen(true); },
    closeDrawer: () => setDrawerOpen(false),
  };
}
