// รูปแบบข้อความของข้อมูลร้าน (ติดต่อเรา D8 · ค่าส่ง/ข้อมูลร้าน D9) — ข้อมูลจาก services/storeInfo.ts
// ที่อยู่ใช้รูปแบบที่อยู่ไทย (ต./อ./จ. · แขวง/เขต) ทั้ง 2 ภาษา — เป็นรูปแบบข้อมูล ไม่ใช่ข้อความ UI (ยกเว้นใน check-i18n)
import type { useTranslations } from "next-intl";
import type { StoreAddress, StoreInfo, WeekDay } from "@/services/storeInfo";
import { resolveUploadUrl } from "@/lib/uploads";
import { guessShipsNationwide } from "@/constants/shipping";

const DAY_ORDER: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** รวมวันที่ติดกัน — [จ,อ,พ] → "ทุกจันทร์ - พุธ" · [ศ,ส] → "ทุกศุกร์, เสาร์" · ครบ 7 วัน → "ทุกวัน" · t = useTranslations("shop.store") */
export function formatMarketDays(days: WeekDay[], t: ReturnType<typeof useTranslations<"shop.store">>): string {
  const on = DAY_ORDER.map((d) => days.includes(d));
  if (on.every(Boolean)) return t("everyDay");
  if (!on.some(Boolean)) return t("noDays");
  const parts: string[] = [];
  for (let i = 0; i < 7; i++) {
    if (!on[i]) continue;
    let j = i;
    while (j + 1 < 7 && on[j + 1]) j++;
    const from = t(`days.${DAY_ORDER[i]}`);
    const to = t(`days.${DAY_ORDER[j]}`);
    parts.push(j - i >= 2 ? `${from} - ${to}` : j === i ? from : `${from}, ${to}`);
    i = j;
  }
  return t("every", { days: parts.join(", ") });
}

/** เติมคำนำหน้าเฉพาะเมื่อยังไม่มี (กัน "อ.อำเภอเมือง") · ค่าว่าง/"-" = ข้าม */
function withPrefix(value: string, prefix: string, existing: RegExp): string {
  const v = value.trim();
  if (!v || v === "-") return "";
  return existing.test(v) ? v : `${prefix}${v}`;
}

/** ที่อยู่แบบไทย — กรุงเทพฯ ใช้ แขวง/เขต · จังหวัดอื่นใช้ ต./อ./จ. · ไม่มีข้อมูลเลย = "" */
export function formatStoreAddress(a: StoreAddress): string {
  const bangkok = a.province.includes("กรุงเทพ");
  const houseNo = a.house_no.trim() === "-" ? "" : a.house_no.trim();
  return [
    houseNo,
    withPrefix(a.sub_district, bangkok ? "แขวง" : "ต.", /^(ต\.|ตำบล|แขวง)/),
    withPrefix(a.district, bangkok ? "เขต" : "อ.", /^(อ\.|อำเภอ|เขต)/),
    bangkok ? a.province.trim() : withPrefix(a.province, "จ.", /^(จ\.|จังหวัด)/),
    a.zip_code.trim(),
  ]
    .filter(Boolean)
    .join(" ");
}

/** ลิงก์ Google Maps — พิกัดก่อน ไม่มีค่อยค้นจากที่อยู่ · ไม่มีทั้งคู่ = null (ใช้ลิงก์แทน iframe: ไม่มีคุกกี้ third-party จนกว่าจะกด) */
export function storeMapUrl(info: Pick<StoreInfo, "location" | "address">): string | null {
  const query = info.location ? `${info.location.latitude},${info.location.longitude}` : formatStoreAddress(info.address);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

const DEFAULT_LOGO = "/pictures/logoMoewMeeCake.png";

/**
 * src ของโลโก้ร้าน — ยังไม่อัปโหลด/โหลดไม่ได้ = โลโก้เริ่มต้นใน public/ ของหน้าเว็บ (backend ส่ง path เดียวกันมา)
 * ไฟล์ที่ร้านอัปโหลดอยู่ที่ backend (คนละ origin) + ?v=<updated_at> — อัปโหลดใหม่แล้วเห็นทันที ไม่ติด cache
 */
export function storeLogoSrc(logo: { url: string; updated_at: string | null } | undefined): string {
  if (!logo?.url || logo.url === DEFAULT_LOGO) return DEFAULT_LOGO;
  const src = resolveUploadUrl(logo.url) ?? DEFAULT_LOGO;
  return logo.updated_at ? `${src}${src.includes("?") ? "&" : "?"}v=${encodeURIComponent(logo.updated_at)}` : src;
}

/**
 * ชื่อหมวดที่ส่งทั่วประเทศได้ — ตั้งไว้ = ใช้ค่านั้น · ยังไม่ตั้ง (null) = เดาจากชื่อหมวดแบบเดียวกับ backend
 * (src/lib/shipping.ts categoryShipsNationwide) ไม่งั้นหน้าค่าส่งบอกขอบเขตไม่ตรงกับที่ checkout คิดจริง
 */
export function nationwideCategoryNames(cats: { product_category_name: string; ships_nationwide?: boolean | null }[]): string[] {
  return cats
    .filter((c) => (typeof c.ships_nationwide === "boolean" ? c.ships_nationwide : guessShipsNationwide(c.product_category_name)))
    .map((c) => c.product_category_name);
}
