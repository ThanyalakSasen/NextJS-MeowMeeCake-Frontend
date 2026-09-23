"use client";
// ─────────────────────────────────────────────────────────────
// ปุ่ม action มาตรฐาน — ไอคอน + คำเสมอ (รูปแบบเดียวกับปุ่ม "+ สร้างคูปองใหม่")
// ใช้แทน <Button>{t("common.edit")}</Button> / <Button danger>{t("common.delete")}</Button> ที่มีแต่คำ
// รายการจุดที่เปลี่ยนมาใช้ + ตารางไอคอนต่อความหมาย: docs/ACTION_BUTTONS.md
//
// ส่ง props ของ Button ต่อทั้งหมด (size / block / type / href / onClick / disabled / htmlType ...) — ครอบด้วย
// <ConfirmDeletePopup> ได้เหมือนเดิม (ConfirmDeletePopup ฉีด onClick เข้ามาทาง props แล้วเราส่งต่อให้ Button)
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpTrayIcon,
  ArrowUturnLeftIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  EyeIcon,
  FunnelIcon,
  MinusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button, type ButtonProps } from "@/components/base";

// ── ไอคอนต่อ "ความหมาย" — ใช้ร่วมกันทั้งปุ่มกลางด้านล่าง ปุ่มเฉพาะหน้า (icon={actionIcon(...)}) และปุ่มท้าย Modal ──
const ICONS = {
  edit: PencilSquareIcon,
  delete: TrashIcon,
  add: PlusIcon, // solid — ให้เหมือนปุ่มเพิ่ม/สร้างเดิมทั้งแอป (หัวหน้า เช่น "+ สร้างคูปองใหม่")
  save: CheckIcon,
  cancel: XMarkIcon, // ยกเลิก = ปิดฟอร์ม/ไม่บันทึก
  cancelAction: XCircleIcon, // ยกเลิก "รายการ" (ออเดอร์/รอบ/ใบสั่งผลิต) — danger แยกจาก cancel ปิดฟอร์ม
  retry: ArrowPathIcon,
  view: EyeIcon,
  next: ArrowRightIcon, // เลื่อนไปสถานะถัดไป
  confirm: CheckCircleIcon, // ยืนยัน (รับเงิน POS / เปิดทั้งหมด)
  verify: CheckBadgeIcon, // ตรวจสอบ/อนุมัติ (สลิปชำระเงิน)
  reset: ArrowUturnLeftIcon,
  filter: FunnelIcon,
  external: ArrowTopRightOnSquareIcon,
  receive: ArrowDownTrayIcon, // รับเข้าสต็อก
  use: ArrowUpTrayIcon, // เบิกใช้
  adjust: AdjustmentsHorizontalIcon, // ปรับสต็อก
  off: MinusCircleIcon, // ปิดทั้งหมด
} as const;

export type ActionIconKind = keyof typeof ICONS;

/** ขนาดไอคอนตาม size ของปุ่ม — small ตรงกับ PlusIcon ของปุ่มเพิ่มขนาดเล็กที่มีอยู่ (h-3.5 w-3.5) */
const iconClass = (size: ButtonProps["size"]) => (size === "small" ? "h-3.5 w-3.5" : "h-4 w-4");

/** ไอคอนของความหมายนั้น สำหรับใส่ icon={...} ของ <Button> ตรง ๆ (ปุ่มเฉพาะหน้าที่ไม่มีปุ่มกลาง) */
export function actionIcon(kind: ActionIconKind, size?: ButtonProps["size"]) {
  const Icon = ICONS[kind];
  return <Icon className={iconClass(size)} />;
}

/** ไอคอนปุ่มท้าย antd <Modal> (ฟอร์มเพิ่ม/แก้ไข) — spread ลงบน Modal:
 *  <Modal {...modalButtonIcons(editTarget ? "save" : "add")} okText=... cancelText=...>
 *  ปุ่ม OK ได้ไอคอนตาม ok · ปุ่ม Cancel ได้ ✕ เสมอ */
export function modalButtonIcons(ok: ActionIconKind, size?: ButtonProps["size"]) {
  return {
    okButtonProps: { icon: actionIcon(ok, size) },
    cancelButtonProps: { icon: actionIcon("cancel", size) },
  };
}

type ActionButtonProps = Omit<ButtonProps, "icon" | "children"> & {
  /** คำบนปุ่ม — ไม่ส่ง = คำมาตรฐานของปุ่มนั้น (common.*) */
  label?: React.ReactNode;
};

/** คีย์ใน namespace "common" ของ messages — next-intl ตรวจชนิดคีย์ จึงรับเฉพาะคีย์ที่มีจริง */
type CommonLabelKey = "edit" | "delete" | "save" | "cancel" | "retry" | "view";

function makeActionButton(kind: ActionIconKind, labelKey: CommonLabelKey, fixed?: Partial<ButtonProps>) {
  function ActionButton({ label, size, ...props }: ActionButtonProps) {
    const t = useTranslations("common");
    return (
      <Button size={size} {...fixed} icon={actionIcon(kind, size)} {...props}>
        {label ?? t(labelKey)}
      </Button>
    );
  }
  return ActionButton;
}

/** ✏️ แก้ไข */
export const EditButton = makeActionButton("edit", "edit");
/** 🗑 ลบ — danger เสมอ */
export const DeleteButton = makeActionButton("delete", "delete", { danger: true });
/** ✓ บันทึก — ไม่กำหนด type (ส่ง type="primary" / htmlType="submit" เองตามที่ใช้) */
export const SaveButton = makeActionButton("save", "save");
/** ✕ ยกเลิก (ปิดฟอร์ม/กลับ ไม่บันทึก) — ไม่ใช่ "ยกเลิกออเดอร์" (ใช้ actionIcon("cancelAction")) */
export const CancelButton = makeActionButton("cancel", "cancel");
/** ↻ ลองใหม่ — ใช้ในสถานะโหลดไม่สำเร็จ */
export const RetryButton = makeActionButton("retry", "retry");
/** 👁 ดู */
export const ViewButton = makeActionButton("view", "view");
