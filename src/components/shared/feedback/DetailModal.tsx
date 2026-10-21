"use client";
// ─────────────────────────────────────────────────────────────
// DetailModal — หน้าต่างรายละเอียดแบบป๊อปอัปกลางจอ ใช้กับทุกหน้าที่กดดูรายละเอียด
// แทน DetailDrawer (แผงเลื่อนจากข้าง) ทั้งแอป — เจ้าของร้านเลือกป๊อปอัป (2026-10-22)
// เนื้อหายาวกว่าจอ = เลื่อนทั้งหน้าต่าง (antd เลื่อนที่ชั้นพื้นหลังให้) · ไม่ตั้ง max-height + overflow ที่ body
// เพราะความสูงเศษพิกเซลทำให้ scrollbar โผล่ทั้งที่เนื้อหาพอดี · จอแคบกว้างเต็มจอ (เว้นขอบ antd)
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
    >
      {children}
    </Modal>
  );
}
