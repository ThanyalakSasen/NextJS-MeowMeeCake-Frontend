// ─────────────────────────────────────────────────────────────
// src/lib/alert.ts
// popup แจ้งเตือน/ยืนยัน กลาง — ครอบ sweetalert2 (port จากระบบเดิม)
// ข้อความทั้งหมด "ส่งเข้ามา" จากผู้เรียก (ผ่าน t()) — ไม่ hard-code ในไฟล์นี้
// default ของ confirm เป็น English fallback เท่านั้น (ผู้เรียกควรส่ง t() มาเสมอ)
// ─────────────────────────────────────────────────────────────
import Swal from "sweetalert2";

type ToastIcon = "success" | "error" | "warning" | "info";

function toast(icon: ToastIcon, text: string) {
  return Swal.fire({
    icon,
    text,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: icon === "error" ? 3500 : 2500,
    timerProgressBar: true,
  });
}

/** แทน message.success/error/warning/info — เช่น alert.success(t("saved")) */
export const alert = {
  success: (text: string) => toast("success", text),
  error: (text: string) => toast("error", text),
  warning: (text: string) => toast("warning", text),
  info: (text: string) => toast("info", text),
};

/**
 * popup ยืนยันกลางจอ — คืน true เมื่อกดยืนยัน
 * ผู้เรียกส่งข้อความที่แปลแล้วมาทาง opts เสมอ เช่น
 *   confirmAlert(t("confirmDeleteBody"), { title: t("common.confirmDelete"),
 *     confirmText: t("common.delete"), cancelText: t("common.cancel"), danger: true })
 */
export async function confirmAlert(
  text: string,
  opts?: { title?: string; confirmText?: string; cancelText?: string; danger?: boolean },
): Promise<boolean> {
  const result = await Swal.fire({
    icon: "warning",
    title: opts?.title ?? "Please confirm",
    text,
    showCancelButton: true,
    confirmButtonText: opts?.confirmText ?? "Confirm",
    cancelButtonText: opts?.cancelText ?? "Cancel",
    confirmButtonColor: opts?.danger ? "#dc2626" : "#4B2E2B",
    reverseButtons: true,
  });
  return result.isConfirmed;
}
