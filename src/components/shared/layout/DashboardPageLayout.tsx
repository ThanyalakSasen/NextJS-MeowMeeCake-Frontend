// ─────────────────────────────────────────────────────────────
// DashboardPageLayout — เทมเพลตหน้าแดชบอร์ด: หัวข้อ + คำบรรยาย + เนื้อหาเป็นแถว ๆ
// เนื้อหาข้างในจัดเป็นบล็อก (stat grid, section grid) วางซ้อนกันด้วย gap
// ─────────────────────────────────────────────────────────────
export function DashboardPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children}
    </div>
  );
}
