"use client";
// ─────────────────────────────────────────────────────────────
// DetailDrawer — เปลือก antd Drawer ที่ให้ค่าเริ่มต้นเหมือนกันทั้งแอป
// เนื้อหาข้างในเป็นหน้าที่ของแต่ละ consumer (Manage Orders, Ingredient History, User Log, Notification History)
// ─────────────────────────────────────────────────────────────
import { Drawer } from "antd";

export function DetailDrawer({
  open,
  title,
  onClose,
  size = 400,
  footer,
  children,
}: {
  open: boolean;
  title?: React.ReactNode;
  onClose: () => void;
  /** px หรือ antd preset ("default" | "large") — antd v6 เลิกใช้ prop `width` แล้ว */
  size?: number | "default" | "large";
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Drawer open={open} title={title} onClose={onClose} size={size} footer={footer} destroyOnHidden>
      {children}
    </Drawer>
  );
}
