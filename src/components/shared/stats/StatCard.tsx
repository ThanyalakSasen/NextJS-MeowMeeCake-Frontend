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
  const toneCls = { up: "text-green-500", down: "text-red-500", warn: "text-amber-500", muted: "text-gray-400" }[tone];
  return (
    <Card className="p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-medium text-brown-900">{value}</p>
      {sub && <p className={`mt-1 text-xs ${toneCls}`}>{sub}</p>}
    </Card>
  );
}
