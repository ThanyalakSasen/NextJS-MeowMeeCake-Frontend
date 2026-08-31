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
  const toneCls = { up: "text-green-600", down: "text-red-600", warn: "text-amber-600", muted: "text-gray-600" }[tone];
  return (
    <Card className="p-5">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brown-900">{value}</p>
      {sub && <p className={`mt-1 text-sm ${toneCls}`}>{sub}</p>}
    </Card>
  );
}
