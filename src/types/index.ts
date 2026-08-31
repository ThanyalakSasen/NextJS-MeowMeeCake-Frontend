// ─────────────────────────────────────────────────────────────
// src/types/index.ts
// shared type ที่ใช้ข้ามหลายโดเมน · re-export api + auth
// DTO เฉพาะ resource (Product, Order, ...) อยู่ไฟล์แยก เช่น @/types/product
// ─────────────────────────────────────────────────────────────

export * from "@/types/api";
export * from "@/types/auth";

/** ชิ้น breadcrumb — labelKey ชี้ไป i18n namespace "nav" (ไม่ใช่ข้อความตรง ๆ) */
export interface BreadcrumbItem {
  labelKey: string;
  href?: string; // ไม่มี href = หน้าปัจจุบัน (ไม่ clickable)
}

export type NotificationType = "warning" | "info" | "success" | "error";

/** shape ที่ frontend ใช้ หลัง map จาก GET /notifications */
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  /** เวลาแบบ relative ที่ map ไว้แล้ว เช่น "5 นาทีที่แล้ว" */
  time: string;
  read: boolean;
  link?: string | null;
}
