"use client";
// ─────────────────────────────────────────────────────────────
// DetailModal — หน้าต่างรายละเอียดแบบป๊อปอัปกลางจอ (props เดียวกับ DetailDrawer สลับกันได้ทันที)
// ใช้กับรายละเอียดคำสั่งซื้อ / พรีออเดอร์ / ใบสั่งผลิต — เจ้าของร้านเลือกป๊อปอัปแทนแผงเลื่อนจากข้าง (2026-10-21)
// เนื้อหายาวเลื่อนในตัวหน้าต่าง หัวข้อค้างอยู่ด้านบน · จอแคบกว้างเต็มจอ (เว้นขอบ antd)
// ─────────────────────────────────────────────────────────────
import { Modal } from "antd";

export function DetailModal({
  open,
  title,
  onClose,
  size = 640,
  footer,
  children,
}: {
  open: boolean;
  title?: React.ReactNode;
  onClose: () => void;
  /** ความกว้าง px */
  size?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      width={size}
      footer={footer ?? null}
      centered
      destroyOnHidden
      styles={{ body: { maxHeight: "calc(100vh - 180px)", overflowY: "auto", paddingRight: 4 } }}
    >
      {children}
    </Modal>
  );
}
