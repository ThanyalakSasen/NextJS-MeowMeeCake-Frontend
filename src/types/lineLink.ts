// ─────────────────────────────────────────────────────────────
// src/types/lineLink.ts
// สถานะการเชื่อมบัญชี LINE ของผู้ใช้ที่ login อยู่ — GET/DELETE /shop/me/line
// ─────────────────────────────────────────────────────────────

export interface LineLinkStatus {
  linked: boolean;
  /**
   * ลิงก์ไปหน้ายินยอมของ LINE — หมดอายุใน 10 นาที (ขอใหม่ทุกครั้งที่กดปุ่ม ห้าม cache)
   * null = backend ยังไม่ได้ตั้งค่า LINE Login → ปิดปุ่มเชื่อม · DELETE ไม่ส่งฟิลด์นี้มา
   */
  authorize_url?: string | null;
}

/** query ที่ backend แนบมาตอน redirect กลับหน้าโปรไฟล์ (LINE_LINK_RETURN_URL?line=...) */
export type LineLinkResult = "linked" | "cancelled" | "error";
