"use client";
// ─────────────────────────────────────────────────────────────
// useRecipientContact — ชื่อ/เบอร์ผู้รับของหน้า checkout (ปกติ + พรีออเดอร์)
// เติมจากข้อมูลบัญชี (GET /shop/me — user_fullname · user_phone) ให้อัตโนมัติ ลูกค้าไม่ต้องพิมพ์ใหม่ทุกครั้ง
// เติมครั้งเดียวตอนโปรไฟล์โหลดเสร็จ และเฉพาะช่องที่ยังว่าง — ไม่ทับที่ลูกค้าแก้เอง (ส่งของให้คนอื่นได้)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { shopProfileService } from "@/services/shopProfile";
import { shopProfileKey } from "../lib/shopQueries";

/** เบอร์ในโปรไฟล์อาจมีขีด/เว้นวรรค/+66 — ทำเป็นตัวเลข 0xxxxxxxxx แบบที่ช่องกรอกรับ */
function toLocalPhone(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.startsWith("66") && digits.length === 11 ? `0${digits.slice(2)}` : digits.slice(0, 10);
}

export function useRecipientContact() {
  const { user } = useCustomerSession();
  const profileQ = useQuery({ queryKey: shopProfileKey, queryFn: () => shopProfileService.get() });
  const [recipientName, setRecipientName] = useState(user?.fullname ?? "");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  // ปรับ state ระหว่าง render (แทน useEffect) — ครั้งเดียวเมื่อโปรไฟล์มาถึง
  const profile = profileQ.data;
  if (!prefilled && profile) {
    setPrefilled(true);
    if (!recipientName.trim() && profile.user_fullname) setRecipientName(profile.user_fullname);
    if (!recipientPhone.trim() && profile.user_phone) setRecipientPhone(toLocalPhone(profile.user_phone));
  }

  return { recipientName, setRecipientName, recipientPhone, setRecipientPhone };
}
