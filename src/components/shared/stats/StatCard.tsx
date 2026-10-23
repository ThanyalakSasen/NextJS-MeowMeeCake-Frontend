import { Card } from "@/components/base";
import { InfoTip } from "./InfoTip";
/** การ์ดตัวเลขสถิติ 1 ค่า · info = คำอธิบายว่าตัวเลขนี้คืออะไร (ไอคอน ⓘ ข้างป้าย — ชี้/แตะ/โฟกัสแล้วขึ้น) · badge = ป้ายมุมบนขวา (เช่น สถานะ ดี/แย่) */
export function StatCard({
  label,
  value,
  sub,
  tone = "muted",
  extra,
  info,
  badge,
}: {
  /** บรรทัดเพิ่มใต้ sub (เช่น เทียบกับช่วงก่อนหน้า) */
  extra?: React.ReactNode;
  info?: string;
  badge?: React.ReactNode;
  /** ข้อความ หรือ node (เช่น ชื่อ 2 บรรทัด) */
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: string;
  tone?: "up" | "down" | "warn" | "muted";
}) {
  // green/amber ใช้เฉด 700 — เฉด 600 บนพื้นขาวคอนทราสต์ ~3.2:1 ไม่ถึง 4.5:1 (Lighthouse Accessibility) · red-600 = 4.8 ผ่านแล้ว
  const toneCls = { up: "text-green-700", down: "text-red-600", warn: "text-amber-700", muted: "text-gray-600" }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        {/* items-start + mt — ⓘ อยู่บรรทัดแรกเสมอเมื่อชื่อยาว 2 บรรทัด */}
        <p className="flex min-w-0 items-start gap-1 text-sm text-gray-600">
          {label}
          {info && (
            <span className="mt-0.5 flex">
              <InfoTip text={info} />
            </span>
          )}
        </p>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      <p className="mt-1 text-2xl font-semibold text-brown-900">{value}</p>
      {sub && <p className={`mt-1 text-sm ${toneCls}`}>{sub}</p>}
      {extra}
    </Card>
  );
}
