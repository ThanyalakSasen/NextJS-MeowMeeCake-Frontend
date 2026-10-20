// ─────────────────────────────────────────────────────────────
// ลืมรหัสผ่านด้วยบัญชี Google — ใช้ร่วมกันระหว่างหน้า /login กับ /customer/forgot-password
//   กด "ลืมรหัสผ่าน?" → หน้าต่างเลือกบัญชี Google ทันที → ส่งลิงก์ตั้งรหัสใหม่ไปที่อีเมลนั้น → แจ้งเตือนว่าส่งแล้ว
// ─────────────────────────────────────────────────────────────
import { requestPasswordReset } from "@/lib/authClient";
import { pickGoogleEmail } from "./googleAccountPicker";

export const FORGOT_PASSWORD_PATH = "/customer/forgot-password";

export type GoogleResetResult =
  | { status: "sent"; email: string }
  | { status: "cancelled" }
  /** เปิด/ใช้หน้าต่างเลือกบัญชีไม่ได้ */
  | { status: "pickFailed" }
  /** backend ปฏิเสธ (บัญชีไม่มีรหัสผ่าน · ขอถี่เกิน ฯลฯ) — error เดิมของ http client */
  | { status: "sendFailed"; error: unknown };

/** เปิดหน้าต่างเลือกบัญชี Google แล้วส่งลิงก์ตั้งรหัสใหม่ — ต้องเรียกจาก event คลิกของผู้ใช้ (กันเบราว์เซอร์บล็อก popup) */
export async function resetPasswordWithGoogle(): Promise<GoogleResetResult> {
  let email: string | null;
  try {
    email = await pickGoogleEmail();
  } catch {
    return { status: "pickFailed" };
  }
  if (!email) return { status: "cancelled" };
  try {
    await requestPasswordReset(email);
  } catch (error) {
    return { status: "sendFailed", error };
  }
  return { status: "sent", email };
}
