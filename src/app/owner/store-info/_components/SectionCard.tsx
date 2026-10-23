// การ์ดหัวข้อของหน้า "ข้อมูลร้าน" — ไอคอน + หัวเรื่อง + คำอธิบาย + ปุ่มของหัวข้อ (แก้ไข) มุมขวา
import { Card } from "@/components/base";

export function SectionCard({ icon: Icon, title, description, actions, children }: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brown-50 text-brown-700">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="m-0 text-base font-semibold text-brown-900">{title}</h2>
            {description && <p className="m-0 mt-1 text-sm text-gray-500">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}
