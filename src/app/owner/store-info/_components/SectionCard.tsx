// การ์ดหัวข้อของหน้า "ข้อมูลร้าน" — หัวเรื่อง + คำอธิบาย + ปุ่มของหัวข้อ (แก้ไข / ยกเลิก / บันทึก) มุมขวา
import { Card } from "@/components/base";

export function SectionCard({ title, description, actions, children }: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="min-w-0">
          <h2 className="m-0 text-base font-semibold text-brown-900">{title}</h2>
          {description && <p className="m-0 mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}
