"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "ข้อมูลร้าน" (BACKLOG4 E2) — ยกจาก FrontOffice owner/store-info (เขียนใหม่แบบ MVVM + i18n)
// เจ้าของร้าน: ทุกหัวข้อ — ข้อมูลทั่วไป + โลโก้ · ติดต่อ (เบอร์ = พนักงานที่เลือก · อีเมล · โซเชียล) · พร้อมเพย์ (QR ชำระเงิน)
//              · ที่อยู่ร้าน + พิกัด + หน้าร้านประจำสัปดาห์ (= จุดรับสินค้า C3/D3)
// พนักงาน: เฉพาะหน้าร้านประจำสัปดาห์ ตามสิทธิ์ store_info (ส่วนอื่น backend ให้ owner เท่านั้น)
// ดูอย่างเดียวก่อนเสมอ — กด "แก้ไข" ทีละหัวข้อ (แก้ได้ครั้งละหัวข้อ) · บันทึกส่งเฉพาะ field ของหัวข้อนั้น · เตือนก่อนทิ้งที่ยังไม่บันทึก
// หน้าร้านประจำสัปดาห์บันทึกผ่าน /admin/weekly-markets ทั้ง owner และพนักงาน (backend กันแก้ชนกัน — 409)
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
import { LIST_ALL } from "@/lib/http";
import { resolveUploadUrl } from "@/lib/uploads";
import { isApiError } from "@/types/api";
import type { AdminWeeklyMarket, StoreSettings } from "@/types/storeAdmin";
import type { SocialKey, WeekDay } from "@/services/storeInfo";
import { pickupLocationsKey } from "@/app/customer/lib/shopQueries";
import { storeInfoKey, storeLogoKey } from "@/app/customer/lib/catalogQueries";
import {
  DAY_ORDER, EMPTY_PROFILE, EMPTY_SETTINGS, NEW_MARKET, logoError, marketsPayload, profilePayload, profileToForm, sameValue,
  sectionChanged, validateAddress, validateMarkets, validateProfile,
  type FieldError, type FormErrors, type ProfileForm, type SectionKey,
} from "./storeInfoForm";

const PROFILE_KEY = ["store-admin", "profile"] as const;
const SETTINGS_KEY = ["store-admin", "settings"] as const;
const MARKETS_KEY = ["store-admin", "weekly-markets"] as const;
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

  const profileQ = useQuery({ queryKey: PROFILE_KEY, queryFn: storeAdminService.profile, enabled: isOwner });
  const settingsQ = useQuery({ queryKey: SETTINGS_KEY, queryFn: storeAdminService.settings, enabled: isOwner });
  const marketsQ = useQuery({ queryKey: MARKETS_KEY, queryFn: storeAdminService.weeklyMarkets, enabled: perm.view });
  const usersQ = useQuery({
    queryKey: ["users", "staff"],
    queryFn: () => usersService.list({ limit: LIST_ALL, role_type: "owner,staff" }),
    enabled: isOwner,
  });
  const rolesQ = useQuery({ queryKey: ["roles"], queryFn: () => rolesService.list(), enabled: isOwner });

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
      }));
  }, [usersQ.data, rolesQ.data, savedProfile.phone_primary_user_id, savedProfile.phone_secondary_user_id]);

  // ── แก้ไขทีละหัวข้อ ──
  const [editing, setEditing] = useState<SectionKey | null>(null);
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [address, setAddress] = useState<StoreSettings>(EMPTY_SETTINGS);
  const [markets, setMarkets] = useState<AdminWeeklyMarket[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [marketsError, setMarketsError] = useState<FieldError | null>(null);

  const dirty = (() => {
    if (editing === null) return false;
    if (editing === "markets") {
      return !sameValue(marketsPayload(markets), marketsPayload(savedMarkets)) || (isOwner && !sameValue(address, savedSettings));
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
    setAddress(savedSettings);
    setMarkets(savedMarkets);
    setLogoFile(null);
    setLogoPreview(null);
    setErrors({});
    setMarketsError(null);
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
        if (!sameValue(marketsPayload(markets), marketsPayload(savedMarkets))) {
          qc.setQueryData(MARKETS_KEY, await storeAdminService.updateWeeklyMarkets(marketsPayload(markets)));
        }
        if (isOwner && !sameValue(address, savedSettings)) {
          qc.setQueryData(SETTINGS_KEY, await storeAdminService.updateSettings(address));
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

  const onSave = () => {
    const section = editing;
    if (!section) return;
    if (section === "markets") {
      const mErr = validateMarkets(markets);
      const aErr = isOwner ? validateAddress(address) : {};
      setMarketsError(mErr);
      setErrors(aErr);
      if (mErr || Object.keys(aErr).length > 0) return void alert.error(t("storeInfo.checkFields"));
    } else {
      const pErr = validateProfile(section, profile);
      setErrors(pErr);
      if (Object.keys(pErr).length > 0) return void alert.error(t("storeInfo.checkFields"));
    }
    if (!dirty) return setEditing(null);
    save.mutate(section);
  };

  // ── ฟิลด์ ──
  const setProfileField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => setProfile((p) => ({ ...p, [key]: value }));
  const setSocial = (key: SocialKey, value: string) => setProfile((p) => ({ ...p, social_links: { ...p.social_links, [key]: value } }));
  const setAddressField = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => setAddress((a) => ({ ...a, [key]: value }));
  const setCoordinates = (latitude: number | null, longitude: number | null) => setAddress((a) => ({ ...a, latitude, longitude }));

  const pickLogo = (file: File) => {
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
    setMarketsError(null);
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
    isLoading: (isOwner && (profileQ.isLoading || settingsQ.isLoading)) || marketsQ.isLoading,
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

    profile: shownProfile,
    systemEmail: profileQ.data?.system_email ?? "",
    staffOptions,
    setProfileField,
    setSocial,
    logoSrc: (editing === "general" && logoPreview) || savedLogoSrc,
    pickLogo,

    address: editing === "markets" ? address : savedSettings,
    setAddressField,
    setCoordinates,
    resolveMapLink: storeAdminService.resolveMapLink,

    markets: editing === "markets" ? markets : savedMarkets,
    marketsError: errorText(marketsError),
    canCreateMarket: editing === "markets" && canCreateMarket,
    canEditMarket,
    canRemoveMarket,
    setMarketField,
    toggleMarketDay,
    toggleMarketActive,
    addMarket,
    removeMarket,

    fieldError: (name: string) => errorText(errors[name]),
  };
}
