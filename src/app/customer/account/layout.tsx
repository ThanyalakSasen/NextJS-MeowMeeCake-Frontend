import { AntdProviders } from "@/components/providers/AntdProviders";

// บัญชีลูกค้าบางหน้าใช้ Modal ของ antd (ข้อมูลของฉัน · ที่อยู่) — ครอบ theme ของ antd เฉพาะส่วนบัญชี
// (หน้าร้านสาธารณะไม่โหลด antd · ข้อความ shop.* มาจาก customer/layout.tsx)
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AntdProviders>{children}</AntdProviders>;
}
