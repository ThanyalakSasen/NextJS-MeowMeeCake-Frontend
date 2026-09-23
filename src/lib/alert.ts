// ─────────────────────────────────────────────────────────────
// src/lib/alert.ts
// popup แจ้งเตือน/ยืนยัน กลาง — modal ของแอปเอง (เดิมครอบ sweetalert2 toast)
// ไฟล์นี้เป็นแค่ "คิว" (ไม่ใช่ React) เรียกได้จากทุกที่ (ViewModel, onError ของ react-query, try/catch)
// ตัวแสดงผลคือ <AlertHost /> (src/components/shared/feedback/AlertHost.tsx) ที่วางไว้ใน providers.tsx จุดเดียว
// ข้อความทั้งหมด "ส่งเข้ามา" จากผู้เรียก (ผ่าน t()) — หัวข้อ/ปุ่มเริ่มต้นแปลที่ AlertHost (namespace "alert")
//
// ประเภท (ดู docs/ALERTS.md):
//   alert.success  ✓ สำเร็จ               — บันทึก/เพิ่ม/แก้ไข/ลบ/เปลี่ยนสถานะ/ส่งออก สำเร็จ
//   alert.error    ✕ ทำรายการไม่สำเร็จ     — แสดงเหตุผลจาก backend (isApiError(e) ? e.message : t("...Failed"))
//   alert.warning  ⚠ กรุณาตรวจสอบข้อมูล    — ฟอร์มไม่ครบ/ไม่ถูกต้อง (ตรวจก่อนส่ง) · เงื่อนไขธุรกิจ (เช่น สินค้าหมด)
//   alert.info     ℹ แจ้งให้ทราบ          — แจ้งผลที่ไม่ใช่ทั้งสำเร็จ/ผิดพลาด (เช่น ไม่มีข้อมูลให้ส่งออก)
//   confirmAlert   ? ยืนยัน               — คืน true เมื่อกดยืนยัน · variant "delete" = ยืนยันการลบ (ConfirmDeletePopup)
// ทุกประเภทต้องกดปุ่มปิดเอง (ไม่ปิดอัตโนมัติ) · มาพร้อมกันหลายอัน = ขึ้นทีละอันตามลำดับ
// ─────────────────────────────────────────────────────────────

export type AlertKind = "success" | "error" | "warning" | "info" | "confirm";

export interface AlertRequest {
  id: number;
  kind: AlertKind;
  text: string;
  /** ไม่ส่ง = หัวข้อมาตรฐานของประเภทนั้น (alert.title*) */
  title?: string;
  /** ข้อความรองใต้ข้อความหลัก (ตัวเล็ก สีจาง) */
  note?: string;
  confirmText?: string;
  cancelText?: string;
  /** ปุ่มยืนยันเป็นสีแดง (confirm เท่านั้น) */
  danger?: boolean;
  /** "delete" = ไอคอนถังขยะ + ปุ่มยืนยันไอคอนลบ (confirm เท่านั้น) */
  variant?: "default" | "delete";
  /** false = ปิดด้วย Esc / คลิกนอกกล่อง / ปุ่ม ✕ มุมบนไม่ได้ — ต้องกดปุ่มใดปุ่มหนึ่ง */
  dismissible: boolean;
  resolve: (confirmed: boolean) => void;
}

// ── คิว + subscribe (ใช้กับ useSyncExternalStore ใน AlertHost) ──
let queue: AlertRequest[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const alertStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** อันที่กำลังแสดง (หัวคิว) — reference เดิมจนกว่าจะปิด (useSyncExternalStore ต้องการ snapshot ที่คงที่) */
  current(): AlertRequest | null {
    return queue[0] ?? null;
  },
  close(id: number, confirmed: boolean) {
    const item = queue.find((q) => q.id === id);
    if (!item) return;
    queue = queue.filter((q) => q.id !== id);
    emit();
    item.resolve(confirmed);
  },
};

function push(req: Omit<AlertRequest, "id" | "resolve" | "dismissible"> & { dismissible?: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    queue = [...queue, { ...req, dismissible: req.dismissible ?? true, id: ++seq, resolve }];
    emit();
  });
}

type NoticeOpts = { title?: string; note?: string };

const notice = (kind: Exclude<AlertKind, "confirm">) => (text: string, opts?: NoticeOpts) =>
  push({ kind, text, ...opts }).then(() => undefined);

/** แจ้งเตือน — เช่น alert.success(t("products.saved")) · คืน Promise ที่ resolve เมื่อผู้ใช้กดปิด */
export const alert = {
  success: notice("success"),
  error: notice("error"),
  warning: notice("warning"),
  info: notice("info"),
};

/**
 * popup ยืนยันกลางจอ — คืน true เมื่อกดยืนยัน
 * ผู้เรียกส่งข้อความที่แปลแล้วมาทาง opts เสมอ เช่น
 *   confirmAlert(t("notifications.clearAllConfirm"), { title: t("notifications.clearAll"),
 *     confirmText: t("common.delete"), cancelText: t("common.cancel"), danger: true })
 */
export function confirmAlert(
  text: string,
  opts?: {
    title?: string;
    note?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    variant?: "default" | "delete";
    /** false = ปิดด้วย Esc / คลิกนอกกล่องไม่ได้ — ต้องกดปุ่มใดปุ่มหนึ่งเท่านั้น (ค่าเริ่มต้น true)
     *  ใช้เมื่อปุ่มยกเลิกมีผลจริง (เช่น "ออกจากระบบ") ไม่ใช่แค่ "ไม่ทำอะไร" — กันผู้ใช้กด Esc แล้วโดนผลนั้นโดยไม่ตั้งใจ */
    dismissible?: boolean;
  },
): Promise<boolean> {
  return push({ kind: "confirm", text, ...opts });
}
