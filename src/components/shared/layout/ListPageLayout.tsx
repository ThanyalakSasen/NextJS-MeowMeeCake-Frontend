// ─────────────────────────────────────────────────────────────
// ListPageLayout — เทมเพลตหน้ารายการ: หัวข้อ + ปุ่ม action + toolbar + เนื้อหา
// ใช้กับ Products, Orders, Employees, Ingredients, Finance, Reports ฯลฯ
// ─────────────────────────────────────────────────────────────
export function ListPageLayout({
  title,
  description,
  actions,
  toolbar,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-brown-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {toolbar && <div>{toolbar}</div>}
      <div>{children}</div>
    </div>
  );
}
