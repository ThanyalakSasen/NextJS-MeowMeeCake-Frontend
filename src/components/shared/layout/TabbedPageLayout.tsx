"use client";
// ─────────────────────────────────────────────────────────────
// TabbedPageLayout — เทมเพลตหน้าที่แบ่งเนื้อหาเป็นแท็บ (antd Tabs) ใต้หัวข้อเดียว
// ใช้กับ Production (แผนการผลิต/สถานะ/ประวัติ — ?tab= sync กับ URL ที่ ViewModel ของ consumer)
// เทมเพลตนี้ไม่รู้เรื่อง query string เอง — consumer ส่ง activeKey/onChange มาจาก ViewModel
// ─────────────────────────────────────────────────────────────
import { Tabs } from "antd";

export interface TabbedPageLayoutItem {
  key: string;
  label: string;
  children: React.ReactNode;
}

export function TabbedPageLayout({
  title,
  description,
  actions,
  activeKey,
  onChange,
  items,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  activeKey: string;
  onChange: (key: string) => void;
  items: TabbedPageLayoutItem[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-brown-900">{title}</h1>
          {description && <p className="mt-1 text-base text-gray-600">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <Tabs activeKey={activeKey} onChange={onChange} items={items} />
    </div>
  );
}
