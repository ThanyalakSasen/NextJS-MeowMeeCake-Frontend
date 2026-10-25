// ─────────────────────────────────────────────────────────────
// DashboardPageLayout — เทมเพลตหน้าแดชบอร์ด: หัวข้อ (+ ปุ่ม action ชิดขวา) + เนื้อหาเป็นแถว ๆ
// เนื้อหาข้างในจัดเป็นบล็อก (stat grid, section grid) วางซ้อนกันด้วย gap
// ─────────────────────────────────────────────────────────────
export function DashboardPageLayout({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <h1 className="page-title">{title}</h1>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
