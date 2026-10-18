import { Card } from "@/components/base";
/** การ์ดตัวเลขสถิติ 1 ค่า */
export function StatCard({
  label,
  value,
  sub,
  tone = "muted",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "up" | "down" | "warn" | "muted";
}) {
  // green/amber ใช้เฉด 700 — เฉด 600 บนพื้นขาวคอนทราสต์ ~3.2:1 ไม่ถึง 4.5:1 (Lighthouse Accessibility) · red-600 = 4.8 ผ่านแล้ว
  const toneCls = { up: "text-green-700", down: "text-red-600", warn: "text-amber-700", muted: "text-gray-600" }[tone];
  return (
    <Card className="p-5">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brown-900">{value}</p>
      {sub && <p className={`mt-1 text-sm ${toneCls}`}>{sub}</p>}
    </Card>
  );
}
