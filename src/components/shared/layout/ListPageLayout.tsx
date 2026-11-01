// ─────────────────────────────────────────────────────────────
// ListPageLayout — เทมเพลตหน้ารายการ: หัวข้อ + ปุ่ม action + toolbar + เนื้อหา
// ใช้กับ Products, Orders, Employees, Ingredients, Finance, Reports ฯลฯ
// ─────────────────────────────────────────────────────────────
export function ListPageLayout({
  title,
  actions,
  filters,
  toolbar,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  /** ตัวกรองในแถวเดียวกับหัวข้อ (หน้าที่แถบกรองมีแต่ตัวกรอง) — ไม่พอก็ลงบรรทัดใหม่ ชิดขวา แทนการล้นจอ */
  filters?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* จอแคบ: ปุ่ม action ขึ้นบรรทัดใหม่แทนการบีบหัวข้อ
          มี filters: ชิดขอบล่าง + pb-1 ให้หัวข้อ (สูง 31.5px) อยู่กึ่งกลางช่องกรอง (สูง 40px) ไม่นับป้ายเหนือช่อง */}
      <div className={`flex flex-wrap justify-between gap-x-4 gap-y-3 ${filters ? "items-end" : "items-start"}`}>
        <div className={filters ? "pb-1" : undefined}>
          <h1 className="text-xl font-semibold text-brown-900">{title}</h1>
        </div>
        {filters && <div className="ml-auto min-w-0 max-w-full">{filters}</div>}
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {toolbar && <div>{toolbar}</div>}
      <div>{children}</div>
    </div>
  );
}
