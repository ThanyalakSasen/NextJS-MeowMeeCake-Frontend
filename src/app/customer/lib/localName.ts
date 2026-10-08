// ชื่อตามภาษาของหน้า (สินค้า · หัวข้อรีวิว) — backend เก็บชื่อไทย + อังกฤษ
// ไทย: ชื่อหลัก = ไทย · ชื่อรอง = อังกฤษ · อังกฤษ: ชื่อหลัก = อังกฤษ (ไม่มี = ไทย) · ชื่อรอง = ไทย (เฉพาะเมื่อมีชื่ออังกฤษ)
import { useLocale } from "next-intl";

type Name = string | null | undefined;

export function localNames(th: Name, eng: Name, locale: string): { primary: string; secondary: string | null } {
  const thName = th?.trim() ?? "";
  const engName = eng?.trim() ?? "";
  if (locale === "en" && engName) return { primary: engName, secondary: thName && thName !== engName ? thName : null };
  return { primary: thName || engName, secondary: engName && engName !== thName ? engName : null };
}

/** hook สำหรับ component — `name(th, eng)` = ชื่อหลัก · `names(th, eng)` = ชื่อหลัก + ชื่อรอง */
export function useLocalName() {
  const locale = useLocale();
  return {
    name: (th: Name, eng: Name) => localNames(th, eng, locale).primary,
    names: (th: Name, eng: Name) => localNames(th, eng, locale),
  };
}
