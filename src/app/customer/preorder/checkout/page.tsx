// ─────────────────────────────────────────────────────────────
// /customer/preorder/checkout — เดิมเป็นหน้ายืนยันพรีออเดอร์แยก · ตะกร้ารวม (2026-10-27) ยืนยันทุกบิลที่ /customer/checkout แล้ว
// เก็บ route ไว้ให้ลิงก์/บุ๊กมาร์กเดิมยังใช้ได้ → พาไปหน้ายืนยันเดียว
// ─────────────────────────────────────────────────────────────
import { redirect } from "next/navigation";

export default function PreorderCheckoutRedirect() {
  redirect("/customer/checkout");
}
