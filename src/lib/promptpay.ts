// ─────────────────────────────────────────────────────────────
// src/lib/promptpay.ts — เลขพร้อมเพย์รับเงินคืนของลูกค้า (backend schemas/user.ts refundPromptpayId · Q-BE12)
// ใช้ทั้งหน้าบัญชีลูกค้า (U9) และหลังร้านตอนโอนคืน (RefundSection · I2)
// ─────────────────────────────────────────────────────────────

/** ตัดขีด/ช่องว่างแบบเดียวกับ backend */
export const normalizePromptpayId = (raw: string): string => raw.replace(/[\s-]/g, "");

/** เบอร์มือถือ 10 หลัก (ขึ้นต้น 0) หรือเลขบัตรประชาชน 13 หลัก — ต้องตรงกับ regex ฝั่ง backend */
export const isPromptpayId = (id: string): boolean => /^(0\d{9}|\d{13})$/.test(id);

/** แสดงแบบอ่านง่าย: 081-234-5678 / 1-2345-67890-12-3 (รูปแบบอื่นคืนตามเดิม) */
export function formatPromptpayId(id: string): string {
  if (/^\d{10}$/.test(id)) return `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
  if (/^\d{13}$/.test(id)) return `${id[0]}-${id.slice(1, 5)}-${id.slice(5, 10)}-${id.slice(10, 12)}-${id[12]}`;
  return id;
}
