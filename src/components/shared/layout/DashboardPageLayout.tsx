// ─────────────────────────────────────────────────────────────
// DashboardPageLayout — เทมเพลตหน้าแดชบอร์ด: หัวข้อ + เนื้อหาเป็นแถว ๆ
// เนื้อหาข้างในจัดเป็นบล็อก (stat grid, section grid) วางซ้อนกันด้วย gap
// ─────────────────────────────────────────────────────────────
export function DashboardPageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="page-title">{title}</h1>
      </div>
      {children}
    </div>
  );
}
