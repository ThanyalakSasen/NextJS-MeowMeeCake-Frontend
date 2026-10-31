"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "ข้อมูลร้าน" (BACKLOG4 E2) — ยกจาก FrontOffice owner/store-info (เขียนใหม่แบบ MVVM + i18n)
// เจ้าของร้าน: ทุกหัวข้อ — ข้อมูลทั่วไป + โลโก้ · ติดต่อ (เบอร์ = พนักงานที่เลือก · อีเมล · โซเชียล) · พร้อมเพย์ (QR ชำระเงิน)
//              · ที่อยู่ร้าน + พิกัด + หน้าร้านประจำสัปดาห์ (= จุดรับสินค้า C3/D3)
// พนักงาน: เฉพาะหน้าร้านประจำสัปดาห์ ตามสิทธิ์ store_info (ส่วนอื่น backend ให้ owner เท่านั้น)
// ดูอย่างเดียวก่อนเสมอ — กด "แก้ไข" ทีละหัวข้อ (แก้ได้ครั้งละหัวข้อ) · บันทึกส่งเฉพาะ field ของหัวข้อนั้น · เตือนก่อนทิ้งที่ยังไม่บันทึก
// หน้าร้านประจำสัปดาห์บันทึกผ่าน /admin/weekly-markets ทั้ง owner และพนักงาน (backend กันแก้ชนกัน — 409)
// ทุกหน้าร้านมีช่องที่อยู่เหมือนกัน · ที่อยู่ของหน้าร้านหลัก = ที่อยู่ร้าน (owner บันทึกไป /admin/store-settings ด้วย)
//   ตั้งแห่งไหนเป็นหน้าร้านหลัก = ที่อยู่ของแห่งนั้นกลายเป็นที่อยู่ร้านตอนบันทึก · พนักงานแก้ที่อยู่หน้าร้านหลักไม่ได้ (ไม่มีสิทธิ์ที่อยู่ร้าน)
// บันทึกแล้วล้าง cache ของหน้าร้าน (ติดต่อเรา · ค่าส่ง · Footer · โลโก้ · จุดรับ) ในแท็บเดียวกันด้วย
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { storeAdminService } from "@/services/storeAdmin";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermission } from "@/context/PermissionsContext";
import { isUnrestrictedRole } from "@/constants/menuKeys";
import { alert, confirmAlert } from "@/lib/alert";
import { resolveUploadUrl } from "@/lib/uploads";
import { compressImage } from "@/lib/compressImage";
import { isApiError } from "@/types/api";
import type { AdminWeeklyMarket, StoreSettings } from "@/types/storeAdmin";
import type { SocialKey, WeekDay } from "@/services/storeInfo";
import { pickupLocationsKey } from "@/app/customer/lib/shopQueries";
import { storeInfoKey, storeLogoKey } from "@/app/customer/lib/catalogQueries";
import { thaiCompare } from "@/lib/thaiSort";
import {
  DAY_ORDER, EMPTY_PROFILE, EMPTY_SETTINGS, NEW_MARKET, logoError, marketsPayload, profilePayload, profileToForm, sameValue,
  marketAddressOf, sectionChanged, syncMarketLocations, validateMarketAddresses, validateMarkets, validateProfile, withStoreAddress,
  type FieldError, type FormErrors, type ProfileForm, type SectionKey,
} from "./storeInfoForm";
import { MARKETS_KEY, PROFILE_KEY, SETTINGS_KEY } from "./storeInfoQuery";
import { ROLES_KEY, STAFF_KEY, STAFF_PARAMS } from "../employees/employeesQuery";

const DEFAULT_LOGO = "/pictures/logoMoewMeeCake.png";

export interface StaffOption {
  value: string;
  label: string;
  phone: string;
}

export function useStoreInfoViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const isOwner = isUnrestrictedRole(user?.roleType);
  const perm = usePermission("store_info");

  // page.tsx ดึงไว้ฝั่ง server แล้ว (key ที่ storeInfoQuery.ts / employeesQuery.ts) · queryFn ต้องห่อ () => (ดู storeAdminService)
  const profileQ = useQuery({ queryKey: PROFILE_KEY, queryFn: () => storeAdminService.profile(), enabled: isOwner });
  const settingsQ = useQuery({ queryKey: SETTINGS_KEY, queryFn: () => storeAdminService.settings(), enabled: isOwner });
  const marketsQ = useQuery({ queryKey: MARKETS_KEY, queryFn: () => storeAdminService.weeklyMarkets(), enabled: perm.view });
  const usersQ = useQuery({ queryKey: STAFF_KEY, queryFn: () => usersService.list(STAFF_PARAMS), enabled: isOwner });
  const rolesQ = useQuery({ queryKey: ROLES_KEY, queryFn: () => rolesService.list(), enabled: isOwner });

  const savedProfile = useMemo(() => (profileQ.data ? profileToForm(profileQ.data) : EMPTY_PROFILE), [profileQ.data]);
  const savedSettings = settingsQ.data ?? EMPTY_SETTINGS;
  const savedMarkets = useMemo(() => marketsQ.data ?? [], [marketsQ.data]);

  // พนักงานที่เลือกเป็นเบอร์ร้านได้ — ใช้งานอยู่ · รวมคนที่เลือกไว้แล้วแม้ถูกระงับ (ไม่ให้ค่าเดิมหายจาก dropdown)
  const staffOptions = useMemo<StaffOption[]>(() => {
    const roleName = new Map((rolesQ.data?.data ?? []).map((r) => [r._id, r.role_name]));
    const selected = new Set([savedProfile.phone_primary_user_id, savedProfile.phone_secondary_user_id]);
    return (usersQ.data?.data ?? [])
      .filter((u) => u.is_active || selected.has(u._id))
      .map((u) => ({
        value: u._id,
        label: `${u.user_fullname} (${(u.role_id && roleName.get(u.role_id)) || "—"})`,
        phone: u.user_phone ?? "",
      }))
      .sort((a, b) => thaiCompare(a.label, b.label));
  }, [usersQ.data, rolesQ.data, savedProfile.phone_primary_user_id, savedProfile.phone_secondary_user_id]);

  // ── แก้ไขทีละหัวข้อ ──
  const [editing, setEditing] = useState<SectionKey | null>(null);
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [markets, setMarkets] = useState<AdminWeeklyMarket[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  /** แจ้งเตือนที่ไม่ได้มาจากค่าในฟอร์ม (ไฟล์โลโก้ผิดชนิด/ใหญ่เกิน) — ที่เหลือตรวจสดจากร่าง (liveErrors) */
  const [errors, setErrors] = useState<FormErrors>({});

  // หน้าร้านที่บันทึก (มุมมองของหน้านี้): owner = หน้าร้านหลักใช้ที่อยู่ร้าน · พนักงาน = ตามที่ backend ส่งมา
  const savedMarketsView = useMemo(
    () => (isOwner ? withStoreAddress(savedMarkets, savedSettings) : savedMarkets),
    [isOwner, savedMarkets, savedSettings],
  );
  // ที่ตั้ง/ลิงก์แผนที่ของทุกแห่งมาจากที่อยู่แยกช่อง (ครบแล้ว)
  const marketsToSave = syncMarketLocations(markets);
  /** ที่อยู่ร้านใหม่ = ที่อยู่ของหน้าร้านหลักในร่าง (owner) */
  const mainDraft = markets.find((m) => m.is_main);
  const storeAddressDraft = mainDraft ? marketAddressOf(mainDraft) : savedSettings;

  const dirty = (() => {
    if (editing === null) return false;
    if (editing === "markets") {
      // เทียบกับค่าเดิมที่ sync แล้วด้วย — ไม่งั้นแค่เปิดแก้ (ที่ตั้งเดิมยังไม่ตรงที่อยู่) ก็ขึ้นเตือน "ยังไม่บันทึก"
      return (
        !sameValue(marketsPayload(marketsToSave), marketsPayload(syncMarketLocations(savedMarketsView))) ||
        (isOwner && !sameValue(storeAddressDraft, savedSettings))
      );
    }
    return sectionChanged(editing, profile, savedProfile) || (editing === "general" && logoFile !== null);
  })();

  // เตือนก่อนปิด/รีเฟรชแท็บถ้ายังไม่บันทึก
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // object URL ของพรีวิวโลโก้ — ล้างเมื่อเปลี่ยน/ออกจากหน้า
  useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const resetDrafts = () => {
    setProfile(savedProfile);
    setMarkets(savedMarketsView);
    setLogoFile(null);
    setLogoPreview(null);
    setErrors({});
  };

  const startEdit = (section: SectionKey) => {
    resetDrafts();
    setEditing(section);
  };

  const cancelEdit = async () => {
    if (dirty) {
      const ok = await confirmAlert(t("storeInfo.unsavedConfirm"), {
        title: t("storeInfo.unsavedTitle"),
        confirmText: t("storeInfo.discard"),
        cancelText: t("storeInfo.keepEditing"),
        danger: true,
      });
      if (!ok) return;
    }
    resetDrafts();
    setEditing(null);
  };

  const invalidateStorefront = () => {
    void qc.invalidateQueries({ queryKey: storeInfoKey });
    void qc.invalidateQueries({ queryKey: storeLogoKey });
    void qc.invalidateQueries({ queryKey: pickupLocationsKey });
  };

  const save = useMutation({
    mutationFn: async (section: SectionKey) => {
      if (section === "markets") {
        // ที่อยู่ร้านก่อน (= ที่อยู่ของหน้าร้านหลัก) · ถ้าที่อยู่บันทึกไม่ผ่าน หน้าร้านยังไม่ถูกแตะ
        // (หน้าร้านล้มทีหลัง = เปิดแก้ครั้งหน้า หน้าร้านหลักได้ที่อยู่ร้านใหม่ให้เอง — withStoreAddress)
        if (isOwner && !sameValue(storeAddressDraft, savedSettings)) {
          qc.setQueryData(SETTINGS_KEY, await storeAdminService.updateSettings(storeAddressDraft));
        }
        if (!sameValue(marketsPayload(marketsToSave), marketsPayload(savedMarkets))) {
          // บันทึกที่อยู่ของหน้าร้านหลักลงรายการด้วย (ตรงกับที่อยู่ร้าน)
          qc.setQueryData(MARKETS_KEY, await storeAdminService.updateWeeklyMarkets(marketsPayload(marketsToSave)));
        }
        return;
      }
      if (sectionChanged(section, profile, savedProfile) || logoFile) {
        const logo = section === "general" ? logoFile : null;
        qc.setQueryData(PROFILE_KEY, await storeAdminService.updateProfile(profilePayload(section, profile), logo));
      }
    },
    onSuccess: () => {
      alert.success(t("storeInfo.saved"));
      invalidateStorefront();
      setEditing(null);
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: (e) => {
      // แก้ชนกับคนอื่น (409) — โหลดรายการล่าสุดมาให้เทียบ
      if (isApiError(e) && e.status === 409) void qc.invalidateQueries({ queryKey: MARKETS_KEY });
      alert.error(isApiError(e) ? e.message : t("storeInfo.saveFailed"));
    },
  });

  // ตรวจสดทุกครั้งที่แก้ — ขึ้นเตือนใต้ช่องทันทีที่กรอกผิด/ว่าง และปุ่มบันทึกกดไม่ได้จนกว่าจะถูกครบ (ผู้ใช้ขอ 2026-10-31)
  // หน้าร้าน: หน้าร้านหลักต้องกรอกที่อยู่ครบ (owner — เป็นที่อยู่ร้าน) · แห่งอื่นกรอกแล้วต้องครบ
  const liveErrors: FormErrors =
    editing === null
      ? {}
      : editing === "markets"
        ? validateMarketAddresses(marketsToSave, isOwner)
        : validateProfile(editing, profile);
  const marketsError = editing === "markets" ? validateMarkets(marketsToSave) : null;
  const allErrors: FormErrors = { ...liveErrors, ...errors };
  const canSave = editing !== null && !marketsError && Object.keys(allErrors).length === 0;

  const onSave = () => {
    const section = editing;
    if (!section) return;
    // ปุ่มถูก disable อยู่แล้วถ้ายังผิด — กันไว้อีกชั้น (เช่น กด Enter)
    if (!canSave) return void alert.error(t("storeInfo.checkFields"));
    // ไม่ได้แก้อะไร แต่ที่ตั้งหน้าร้านหลักยังไม่ตรงที่อยู่ร้าน → บันทึกให้ตรงด้วย
    const mainOutOfSync = section === "markets" && !sameValue(marketsPayload(marketsToSave), marketsPayload(savedMarkets));
    if (!dirty && !mainOutOfSync) return setEditing(null);
    save.mutate(section);
  };

  // ── ฟิลด์ ──
  const setProfileField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => setProfile((p) => ({ ...p, [key]: value }));
  const setSocial = (key: SocialKey, value: string) => setProfile((p) => ({ ...p, social_links: { ...p.social_links, [key]: value } }));
  // ที่อยู่ของหน้าร้านลำดับ i (ช่องเดียวกับที่อยู่ร้าน) — แก้แล้วล้างแจ้งเตือนของช่องนั้น
  const setMarketAddress = (i: number, patch: Partial<StoreSettings>) => {
    setMarkets((ms) => ms.map((m, j) => (j === i ? { ...m, address: { ...marketAddressOf(m), ...patch } } : m)));
  };
  const setMarketAddressField = <K extends keyof StoreSettings>(i: number, key: K, value: StoreSettings[K]) =>
    setMarketAddress(i, { [key]: value } as Partial<StoreSettings>);
  const setMarketCoordinates = (i: number, latitude: number | null, longitude: number | null) => setMarketAddress(i, { latitude, longitude });

  const pickLogo = async (raw: File) => {
    // ชนิดไฟล์ผิดไม่ต้องย่อ · ที่เหลือย่อก่อนตรวจขนาด (รูปมือถือ 5–15 MB ย่อแล้วผ่าน)
    const file = logoError(raw) === "logoType" ? raw : await compressImage(raw);
    const err = logoError(file);
    if (err) return setErrors((e) => ({ ...e, logo: { key: err } }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== "logo")));
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // ── หน้าร้านประจำสัปดาห์ ──
  const canCreateMarket = isOwner || perm.create;
  /** รายการใหม่ (ยังไม่มี _id) แก้/เอาออกได้เสมอ · รายการเดิมตามสิทธิ์ update/delete */
  const canEditMarket = (m: AdminWeeklyMarket) => editing === "markets" && (!m._id || isOwner || perm.update);
  const canRemoveMarket = (m: AdminWeeklyMarket) => editing === "markets" && (!m._id || isOwner || perm.delete);
  const isLastActive = (i: number) => markets[i]?.is_active && !markets.some((m, j) => j !== i && m.is_active);

  const setMarketField = <K extends keyof AdminWeeklyMarket>(i: number, key: K, value: AdminWeeklyMarket[K]) => {
    setMarkets((ms) => ms.map((m, j) => (j === i ? { ...m, [key]: value } : m)));
  };
  const toggleMarketDay = (i: number, day: WeekDay) =>
    setMarkets((ms) =>
      ms.map((m, j) => {
        if (j !== i) return m;
        const days = m.days.includes(day) ? m.days.filter((d) => d !== day) : [...m.days, day];
        return { ...m, days: DAY_ORDER.filter((d) => days.includes(d)) };
      }),
    );
  const toggleMarketActive = (i: number, active: boolean) => {
    if (!active && isLastActive(i)) return void alert.warning(t("storeInfo.markets.lastActive"));
    setMarketField(i, "is_active", active);
  };
  const addMarket = () => setMarkets((ms) => [...ms, { ...NEW_MARKET }]);
  /** ตั้งเป็นหน้าร้านหลัก (แห่งเดียว) แล้วย้ายขึ้นลำดับแรก — ตรงกับที่ backend บันทึก · ที่อยู่ของแห่งนี้จะเป็นที่อยู่ร้านตอนบันทึก */
  const setMainMarket = (i: number) => {
    setMarkets((ms) => {
      const next = ms.map((m, j) => ({ ...m, is_main: j === i }));
      return [next[i], ...next.filter((_, j) => j !== i)];
    });
  };
  const removeMarket = async (i: number) => {
    if (isLastActive(i)) return void alert.warning(t("storeInfo.markets.lastActive"));
    const name = markets[i]?.name.trim();
    const ok = await confirmAlert(t("storeInfo.markets.removeConfirm", { name: name || t("storeInfo.markets.thisOne") }), {
      title: t("storeInfo.markets.removeTitle"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      danger: true,
    });
    if (ok) setMarkets((ms) => ms.filter((_, j) => j !== i));
  };

  const errorText = (e: FieldError | null | undefined) =>
    e ? t(`storeInfo.errors.${e.key}` as Parameters<typeof t>[0], e.values) : undefined;

  const shownProfile = editing && editing !== "markets" ? profile : savedProfile;
  const logoUrl = profileQ.data?.logo_url;
  const savedLogoSrc =
    !logoUrl || logoUrl === DEFAULT_LOGO
      ? DEFAULT_LOGO
      : `${resolveUploadUrl(logoUrl)}${profileQ.data?.logo_updated_at ? `?v=${encodeURIComponent(profileQ.data.logo_updated_at)}` : ""}`;

  return {
    isOwner,
    canView: isOwner || perm.view,
    // isPending (ไม่ใช่ isLoading) — ตอน SSR ไม่มีข้อมูลจะเป็น "กำลังโหลด" ตรงกับ browser (หน้านี้ render ฝั่ง server)
    // query ที่ปิดอยู่ (enabled: false) isPending ค้างเป็น true — นับเฉพาะก้อนที่เปิดใช้จริง
    isLoading: (isOwner && (profileQ.isPending || settingsQ.isPending)) || (perm.view && marketsQ.isPending),
    isError: (isOwner && (profileQ.isError || settingsQ.isError)) || marketsQ.isError,
    refetch: () => {
      void profileQ.refetch();
      void settingsQ.refetch();
      void marketsQ.refetch();
    },

    editing,
    saving: save.isPending,
    startEdit,
    cancelEdit,
    onSave,
    canSave,

    profile: shownProfile,
    systemEmail: profileQ.data?.system_email ?? "",
    staffOptions,
    setProfileField,
    setSocial,
    logoSrc: (editing === "general" && logoPreview) || savedLogoSrc,
    pickLogo,

    /** ที่อยู่ร้าน (= ที่อยู่ของหน้าร้านหลัก) — แสดงในโหมดดู */
    address: savedSettings,
    setMarketAddressField,
    setMarketCoordinates,
    resolveMapLink: storeAdminService.resolveMapLink,
    /** แก้ที่อยู่ของหน้าร้านนี้ได้ไหม — หน้าร้านหลัก = ที่อยู่ร้าน (เจ้าของร้านเท่านั้น) */
    canEditMarketAddress: (m: AdminWeeklyMarket) => canEditMarket(m) && (isOwner || !m.is_main),

    markets: editing === "markets" ? markets : savedMarketsView,
    marketsError: errorText(marketsError),
    canCreateMarket: editing === "markets" && canCreateMarket,
    canEditMarket,
    canRemoveMarket,
    setMarketField,
    toggleMarketDay,
    toggleMarketActive,
    setMainMarket,
    addMarket,
    removeMarket,

    fieldError: (name: string) => errorText(allErrors[name]),
  };
}
