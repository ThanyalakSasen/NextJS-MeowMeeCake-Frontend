"use client";
// ─────────────────────────────────────────────────────────────
// แปลง before/after ของ UserLog เป็นแถว "ฟิลด์ · ก่อน · หลัง" ที่อ่านได้
// ใช้ร่วมกัน: ตารางบันทึกการทำงาน (สรุปใต้ข้อความ) · drawer รายละเอียด · ประวัติการทำงานในบัญชีของฉัน
//
// ชื่อฟิลด์จาก namespace "fields" (ไม่มีก็โชว์ key ดิบ) — ชื่อซ้อนจาก backend (lib/auditDiff.ts):
//   "social_links.facebook"                 → "โซเชียล · Facebook"
//   "weekly_markets[ตลาดเช้า].close_time"   → "หน้าร้านประจำสัปดาห์ "ตลาดเช้า" · เวลาปิด"
// ค่า: ว่าง = "—" · true/false = ใช่/ไม่ใช่ · วันที่ ISO = วันที่ไทย · สถานะ/ประเภท = ชื่อจาก enums
//      object (แถวที่เพิ่ม/ลบทั้งแถว) = "ฟิลด์: ค่า · ฟิลด์: ค่า"
// ─────────────────────────────────────────────────────────────
import { useLocale, useMessages, useTranslations } from "next-intl";
import { formatDate } from "@/i18n/format";
import type { UserLog } from "@/types/userLog";

export interface ChangeRow {
  field: string;
  label: string;
  /** null = ไม่มีฝั่งนั้น (สร้าง = ไม่มีก่อน · ลบ = ไม่มีหลัง) */
  before: string | null;
  after: string | null;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
/** ฟิลด์ → namespace ใน enums (ค่าเป็นรหัสอังกฤษจาก backend) */
const ENUM_OF_FIELD: Record<string, string> = {
  order_status: "orderStatus",
  payment_status: "paymentStatus",
  status: "paymentStatus",
  delivery_status: "deliveryStatus",
  order_type: "orderType",
  employment_type: "employmentType",
  discount_type: "discountType",
  auth_provider: "authProvider",
  menu_key: "menuKey",
  round_status: "roundStatus",
  production_status: "productionStatus",
  item_status: "productionItemStatus",
};

type Messages = {
  fields?: Record<string, string>;
  enums?: Record<string, Record<string, string>>;
  entities?: Record<string, string>;
  storeInfo?: { days?: Record<string, string> };
  reviews?: { status?: Record<string, string> };
};

export function useLogChanges() {
  const t = useTranslations();
  const locale = useLocale();
  const messages = useMessages() as Messages;
  const fieldMsgs = messages.fields ?? {};
  const dayMsgs = messages.storeInfo?.days ?? {};
  const enumMsgs = messages.enums ?? {};
  const entityMsgs = messages.entities ?? {};

  /** ตารางชื่อของค่าสถานะ — "status" ของรีวิว (approved/hidden/pending) คนละชุดกับของการชำระเงิน */
  const enumTable = (field: string, entity?: string | null): Record<string, string> | undefined =>
    entity === "Review" && field === "status" ? messages.reviews?.status : enumMsgs[ENUM_OF_FIELD[field]];

  /** "weekly_markets[ตลาดเช้า].close_time" → ["weekly_markets", "[ตลาดเช้า]", "close_time"] */
  const pathLabel = (path: string): string =>
    (path.match(/\[[^\]]*\]|[^.[\]]+/g) ?? [path])
      .map((seg) => (seg.startsWith("[") ? `"${seg.slice(1, -1)}"` : fieldMsgs[seg] ?? seg))
      .join(" · ")
      .replace(/ · "/g, ' "');

  /** ชื่อฟิลด์สุดท้ายของ path — ใช้เลือกวิธีแสดงค่า (สถานะ/วัน) */
  const leafOf = (path: string) => path.replace(/\[[^\]]*\]/g, "").split(".").pop() ?? path;

  const formatValue = (v: unknown, field = "", entity?: string | null): string => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? t("common.yes") : t("common.no");
    if (typeof v === "string") {
      const label = enumTable(field, entity)?.[v];
      if (label) return label;
      if (field === "days" && dayMsgs[v]) return dayMsgs[v];
      if (ISO_RE.test(v)) return formatDate(v, locale, { withTime: true });
      return v;
    }
    if (Array.isArray(v)) return v.length ? v.map((x) => formatValue(x, field, entity)).join(", ") : "—";
    if (typeof v === "object") {
      return Object.entries(v as Record<string, unknown>)
        .filter(([, x]) => x !== null && x !== "")
        .map(([k, x]) => `${fieldMsgs[k] ?? k}: ${formatValue(x, k, entity)}`)
        .join(" · ");
    }
    return typeof v === "number" ? v.toLocaleString(locale === "en" ? "en-US" : "th-TH") : String(v);
  };

  const changesOf = (log: Pick<UserLog, "before" | "after"> & { entity?: string | null }): ChangeRow[] => {
    const b = log.before ?? null;
    const a = log.after ?? null;
    if (!b && !a) return [];
    const fields = [...new Set([...Object.keys(b ?? {}), ...Object.keys(a ?? {})])];
    return fields.map((field) => ({
      field,
      label: pathLabel(field),
      before: b ? formatValue(b[field], leafOf(field), log.entity) : null,
      after: a ? formatValue(a[field], leafOf(field), log.entity) : null,
    }));
  };

  /** ฟิลด์ระบุตัวตน เช่น "ตำแหน่ง (Role): ผู้จัดการ · เมนู: POS" (null = ไม่มี) */
  const contextOf = (log: Pick<UserLog, "context">): string | null => {
    const ctx = log.context;
    if (!ctx || !Object.keys(ctx).length) return null;
    return Object.entries(ctx)
      .map(([k, v]) => `${fieldMsgs[k] ?? k}: ${formatValue(v, k)}`)
      .join(" · ");
  };

  /** ชื่อชนิดข้อมูล — log เก่าใช้ชื่อ collection พหูพจน์ ("Permissions") ลองตัด s ท้ายก่อนตกไปที่ "ข้อมูล" */
  const entityOf = (entity: string | null): string | null => {
    if (!entity) return null;
    const found = [entity, entity.replace(/s$/, "")].find((e) => e !== "fallback" && entityMsgs[e]);
    return found ? entityMsgs[found] : entityMsgs.fallback ?? entity;
  };

  /** ข้อความสั้นบรรทัดเดียวต่อฟิลด์ เช่น "มูลค่าส่วนลด: 20 → 50" */
  const summaryOf = (row: ChangeRow): string =>
    row.before !== null && row.after !== null
      ? `${row.label}: ${row.before} → ${row.after}`
      : `${row.label}: ${row.after ?? row.before}`;

  return { changesOf, summaryOf, contextOf, entityOf };
}
