// รูปแบบข้อความของข้อมูลร้าน (ติดต่อเรา D8 · ค่าส่ง/ข้อมูลร้าน D9) — ข้อมูลจาก services/storeInfo.ts
import type { StoreAddress, StoreInfo, WeekDay } from "@/services/storeInfo";

const DAY_ORDER: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<WeekDay, string> = {
  mon: "จันทร์", tue: "อังคาร", wed: "พุธ", thu: "พฤหัสบดี", fri: "ศุกร์", sat: "เสาร์", sun: "อาทิตย์",
};

/** รวมวันที่ติดกัน — [จ,อ,พ] → "จันทร์ - พุธ" · [ศ,ส] → "ศุกร์, เสาร์" · ครบ 7 วัน → "ทุกวัน" */
export function formatMarketDays(days: WeekDay[]): string {
  const on = DAY_ORDER.map((d) => days.includes(d));
  if (on.every(Boolean)) return "ทุกวัน";
  if (!on.some(Boolean)) return "ยังไม่กำหนดวัน";
  const parts: string[] = [];
  for (let i = 0; i < 7; i++) {
    if (!on[i]) continue;
    let j = i;
    while (j + 1 < 7 && on[j + 1]) j++;
    const from = DAY_LABELS[DAY_ORDER[i]];
    const to = DAY_LABELS[DAY_ORDER[j]];
    parts.push(j - i >= 2 ? `${from} - ${to}` : j === i ? from : `${from}, ${to}`);
    i = j;
  }
  return `ทุก${parts.join(", ")}`;
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
