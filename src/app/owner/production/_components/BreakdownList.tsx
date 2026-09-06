import { Card, ProgressBar } from "@/components/base";
/** การ์ดสรุปเป็นแถบ % — ใช้แสดง "สินค้าที่ผลิตมากสุด" / "ประสิทธิภาพทีม" ในแท็บประวัติการผลิต */
export function BreakdownList({
  title,
  entries,
  emptyText,
  color,
}: {
  title: string;
  entries: [string, number][];
  emptyText: string;
  color?: string;
}) {
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-brown-900">{title}</p>
      </div>
      <div className="px-4 py-3">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{emptyText}</p>
        ) : (
          entries.map(([label, value]) => (
            <div key={label} className="mb-2.5 last:mb-0">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 truncate">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
              <ProgressBar percent={Math.round((value / max) * 100)} color={color} />
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
