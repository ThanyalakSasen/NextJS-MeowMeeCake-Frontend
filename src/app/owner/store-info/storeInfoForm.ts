// ─────────────────────────────────────────────────────────────
// ฟอร์มหน้า "ข้อมูลร้าน" (BACKLOG4 E2) — ค่าเริ่มต้น · แปลงจาก DTO · ตรวจข้อมูลให้ตรงกับ backend storeService
// error คืนเป็น key ใต้ storeInfo.errors.* (+ ค่าแทรก) — ViewModel แปลด้วย t()
// ─────────────────────────────────────────────────────────────
import type { SocialKey, WeekDay } from "@/services/storeInfo";
import type { AdminStoreProfile, AdminWeeklyMarket, StoreProfileInput, StoreSettings } from "@/types/storeAdmin";

/** หัวข้อที่แก้/บันทึกแยกกัน (ทีละหัวข้อ) */
export type SectionKey = "general" | "contact" | "markets" | "promptpay";

export const DAY_ORDER: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const SOCIAL_KEYS: SocialKey[] = ["facebook", "line", "instagram", "website"];
export const MAX_WEEKLY_MARKETS = 15;
export const LOGO_MAX_BYTES = 5 * 1024 * 1024;
export const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const PROMPTPAY_RE = /^(\d{10}|\d{13})$/;
const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface ProfileForm {
  store_name: string;
  phone_primary_user_id: string;
  phone_secondary_user_id: string;
  contact_email: string;
  social_links: Record<SocialKey, string>;
  promptpay_id: string;
  promptpay_account_name: string;
}

export const EMPTY_PROFILE: ProfileForm = {
  store_name: "",
  phone_primary_user_id: "",
  phone_secondary_user_id: "",
  contact_email: "",
  social_links: { facebook: "", line: "", instagram: "", website: "" },
  promptpay_id: "",
  promptpay_account_name: "",
};

export const EMPTY_SETTINGS: StoreSettings = {
  house_no: "", sub_district: "", district: "", province: "", zip_code: "", latitude: null, longitude: null,
};

export const NEW_MARKET: AdminWeeklyMarket = {
  name: "", location: "", days: [], open_time: "17:00", close_time: "22:00", map_url: "", is_active: true,
};

export function profileToForm(p: AdminStoreProfile): ProfileForm {
  return {
    store_name: p.store_name,
    phone_primary_user_id: p.phone_primary?._id ?? "",
    phone_secondary_user_id: p.phone_secondary?._id ?? "",
    contact_email: p.contact_email,
    social_links: { ...p.social_links },
    promptpay_id: p.promptpay_id,
    promptpay_account_name: p.promptpay_account_name,
  };
}

/** field ของแต่ละหัวข้อ — ส่งเฉพาะหัวข้อที่บันทึก (PUT store-profile เป็น partial) */
export function profilePayload(section: "general" | "contact" | "promptpay", f: ProfileForm): StoreProfileInput {
  if (section === "general") return { store_name: f.store_name.trim() };
  if (section === "promptpay") {
    return { promptpay_id: f.promptpay_id.replace(/[\s-]/g, ""), promptpay_account_name: f.promptpay_account_name.trim() };
  }
  return {
    phone_primary_user_id: f.phone_primary_user_id || null,
    phone_secondary_user_id: f.phone_secondary_user_id || null,
    contact_email: f.contact_email.trim(),
    social_links: Object.fromEntries(SOCIAL_KEYS.map((k) => [k, f.social_links[k].trim()])) as Record<SocialKey, string>,
  };
}

export const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** หัวข้อนี้ในฟอร์มต่างจากที่บันทึกไว้ไหม */
export function sectionChanged(section: "general" | "contact" | "promptpay", form: ProfileForm, saved: ProfileForm): boolean {
  return !sameValue(profilePayload(section, form), profilePayload(section, saved));
}

export interface FieldError {
  key: string;
  values?: Record<string, string | number>;
}
export type FormErrors = Record<string, FieldError>;

export function validateProfile(section: "general" | "contact" | "promptpay", f: ProfileForm): FormErrors {
  const e: FormErrors = {};
  if (section === "general") {
    if (!f.store_name.trim()) e.store_name = { key: "storeNameRequired" };
    else if (f.store_name.trim().length > 100) e.store_name = { key: "storeNameTooLong" };
  }
  if (section === "contact") {
    const email = f.contact_email.trim();
    if (email && (email.length > 254 || !EMAIL_RE.test(email))) e.contact_email = { key: "emailInvalid" };
    for (const k of SOCIAL_KEYS) {
      const url = f.social_links[k].trim();
      if (url && (url.length > 500 || !URL_RE.test(url))) e[`social_${k}`] = { key: "urlInvalid" };
    }
  }
  if (section === "promptpay") {
    const id = f.promptpay_id.replace(/[\s-]/g, "");
    if (id && !PROMPTPAY_RE.test(id)) e.promptpay_id = { key: "promptpayInvalid" };
    if (id && !f.promptpay_account_name.trim()) e.promptpay_account_name = { key: "promptpayNameRequired" };
  }
  return e;
}

export const ADDRESS_FIELDS = ["house_no", "sub_district", "district", "province", "zip_code"] as const;

/** ที่อยู่ต้องครบ (จังหวัด = ขอบเขตจัดส่งของสินค้าที่ส่งทั่วประเทศไม่ได้) · รหัสไปรษณีย์ 5 หลัก · พิกัดไม่บังคับ */
export function validateAddress(a: StoreSettings): FormErrors {
  const e: FormErrors = {};
  for (const k of ADDRESS_FIELDS) if (!a[k].trim()) e[k] = { key: "required" };
  if (a.zip_code.trim() && !/^\d{5}$/.test(a.zip_code.trim())) e.zip_code = { key: "zipInvalid" };
  return e;
}

/** ตรวจเหมือน backend normalizeWeeklyMarkets — คืนปัญหาแรก (ลำดับเริ่มที่ 1) หรือ null */
export function validateMarkets(markets: AdminWeeklyMarket[]): FieldError | null {
  if (markets.length > MAX_WEEKLY_MARKETS) return { key: "marketsTooMany", values: { max: MAX_WEEKLY_MARKETS } };
  if (!markets.some((m) => m.is_active)) return { key: "marketsNeedActive" };
  for (const [i, m] of markets.entries()) {
    const n = i + 1;
    if (!m.name.trim()) return { key: "marketName", values: { n } };
    if (m.days.length === 0) return { key: "marketDays", values: { n } };
    if (!TIME_RE.test(m.open_time) || !TIME_RE.test(m.close_time)) return { key: "marketTimeFormat", values: { n } };
    if (m.open_time >= m.close_time) return { key: "marketTimeOrder", values: { n } };
    if (m.map_url.trim() && !URL_RE.test(m.map_url.trim())) return { key: "marketMapUrl", values: { n } };
  }
  return null;
}

/** ค่าที่ส่ง — ตัดช่องว่าง · วันเรียงจันทร์→อาทิตย์ · คง _id เดิม */
export function marketsPayload(markets: AdminWeeklyMarket[]): AdminWeeklyMarket[] {
  return markets.map((m) => ({
    ...(m._id ? { _id: m._id } : {}),
    name: m.name.trim(),
    location: m.location.trim(),
    days: DAY_ORDER.filter((d) => m.days.includes(d)),
    open_time: m.open_time,
    close_time: m.close_time,
    map_url: m.map_url.trim(),
    is_active: m.is_active,
  }));
}

/** ตรวจไฟล์โลโก้ — คืน key ของ error หรือ null */
export function logoError(file: File): string | null {
  if (!LOGO_TYPES.includes(file.type)) return "logoType";
  if (file.size > LOGO_MAX_BYTES) return "logoSize";
  return null;
}
