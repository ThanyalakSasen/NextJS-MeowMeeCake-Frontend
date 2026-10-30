import { Card } from "@/components/base";
import { InfoTip } from "@/components/shared/feedback/InfoTip";

export type StatCardTone = "up" | "down" | "warn" | "muted";
/** ป้ายสถานะมุมขวาบน — ดี / ควรระวัง / แย่ (ใช้คู่กับ tone) */
export type StatCardStatus = "good" | "warn" | "bad";

const STATUS_CLS: Record<StatCardStatus, string> = {
  good: "bg-green-50 text-green-700 border-green-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  bad: "bg-red-50 text-red-700 border-red-200",
};

/**
 * การ์ดตัวเลขสถิติ 1 ค่า
 * - info = ไอคอน ⓘ ข้างชื่อ อธิบายว่าตัวเลขคิดจากอะไร
 * - status + statusLabel = ป้ายสถานะมุมขวาบน (ดี / ควรระวัง / แย่) — ผู้เรียกส่งข้อความที่แปลแล้ว
 * - onClick = ทั้งใบกดได้ (เช่น ไปหน้ารายการที่กรองไว้)
 */
export function StatCard({
  label,
  value,
  sub,
  tone = "muted",
  extra,
  info,
  status,
  statusLabel,
  onClick,
  wrapLabel = false,
}: {
  /** true = ชื่อการ์ดขึ้นบรรทัดใหม่ได้ (เห็นข้อความครบบนจอแคบ) แทนการตัด … */
  wrapLabel?: boolean;
  /** บรรทัดเพิ่มใต้ sub (เช่น เทียบกับช่วงก่อนหน้า) */
  extra?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: StatCardTone;
  info?: string;
  status?: StatCardStatus;
  statusLabel?: string;
  onClick?: () => void;
}) {
  // green/amber ใช้เฉด 700 — เฉด 600 บนพื้นขาวคอนทราสต์ ~3.2:1 ไม่ถึง 4.5:1 (Lighthouse Accessibility) · red-600 = 4.8 ผ่านแล้ว
  const toneCls = { up: "text-green-700", down: "text-red-600", warn: "text-amber-700", muted: "text-gray-600" }[tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 flex min-w-0 items-center gap-1 text-sm text-gray-600">
          <span className={wrapLabel ? "break-words" : "truncate"}>{label}</span>
          {/* relative z-10 = อยู่เหนือปุ่มที่คลุมการ์ด (onClick) — ชี้/กด ⓘ ได้โดยไม่ไปกดการ์ด */}
          {info && <InfoTip text={info} className="relative z-10" />}
        </p>
        {status && statusLabel && (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_CLS[status]}`}>{statusLabel}</span>
        )}
      </div>
      <p className="m-0 mt-1 text-2xl font-semibold text-brown-900">{value}</p>
      {sub && <p className={`m-0 mt-1 text-sm ${toneCls}`}>{sub}</p>}
      {extra}
    </>
  );
  // กดได้ทั้งใบ: ปุ่มโปร่งใสคลุมการ์ด (ไม่ห่อเนื้อหาด้วย <button> — ข้างในมีปุ่ม ⓘ · ปุ่มซ้อนปุ่ม = HTML ผิด → hydration error)
  return (
    <Card className={`relative p-5 ${onClick ? "hover:bg-brown-50" : ""}`}>
      {onClick && (
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="absolute inset-0 cursor-pointer rounded-[inherit] border-none bg-transparent p-0"
        />
      )}
      {body}
    </Card>
  );
}
