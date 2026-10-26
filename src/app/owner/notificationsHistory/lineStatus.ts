// ผลการส่ง LINE ของแจ้งเตือนแต่ละรายการ — อ่านจาก line_sent / line_error ที่ backend บันทึกตอน notify()
// (backend src/services/notificationService.ts · src/lib/line.ts)
import type { LineDeliveryStatus } from "@/constants/enumConfig";
import type { NotificationDTO } from "@/types/notification";

export function lineDeliveryStatus(n: Pick<NotificationDTO, "line_sent" | "line_error">): LineDeliveryStatus {
  if (n.line_sent) return "sent";
  if (n.line_error) return "failed";
  return "webOnly";
}

/** สาเหตุที่ส่งไม่สำเร็จ → key ใน notifications.lineReason.* · "other" = แสดงข้อความดิบจาก backend */
export type LineFailReason = "quota" | "notConfigured" | "other";

export function lineFailReason(error: string): LineFailReason {
  // LINE ตอบ 429 เมื่อโควตาข้อความรายเดือนของ OA หมด (backend lib/lineQuota isQuotaExceededError)
  if (/LINE API 429/.test(error)) return "quota";
  // pushLineMessage คืนข้อความนี้เมื่อไม่มี LINE_CHANNEL_ACCESS_TOKEN / LINE_TARGET_ID
  if (error.includes("LINE_CHANNEL_ACCESS_TOKEN")) return "notConfigured";
  return "other";
}
