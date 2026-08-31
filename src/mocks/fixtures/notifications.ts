// MOCK (D17)
import type { NotificationDTO } from "@/types/notification";

export const notificationsFixture: NotificationDTO[] = [
  {
    _id: "n1", title: "วัตถุดิบใกล้หมด", message: "แป้งเค้กเหลือน้อยกว่าจุดสั่งซื้อ", type: "warning",
    module: "ingredient", is_read: false, link: "/owner/ingredients", created_at: "2026-09-01T08:30:00.000Z", updated_at: "2026-09-01T08:30:00.000Z",
  },
  {
    _id: "n2", title: "ออเดอร์ใหม่", message: "ได้รับคำสั่งซื้อ #1042", type: "info",
    module: "order", is_read: false, link: "/owner/orders/manageOrders", created_at: "2026-09-01T07:15:00.000Z", updated_at: "2026-09-01T07:15:00.000Z",
  },
  {
    _id: "n3", title: "ผลิตเสร็จ", message: "ใบสั่งผลิต PO-0098 เสร็จแล้ว", type: "success",
    module: "production", is_read: true, link: "/owner/production", created_at: "2026-08-31T16:00:00.000Z", updated_at: "2026-08-31T16:00:00.000Z",
  },
  {
    _id: "n4", title: "ชำระเงินไม่สำเร็จ", message: "การชำระเงินออเดอร์ #1039 ถูกปฏิเสธ", type: "error",
    module: "finance", is_read: true, link: "/owner/orders/manageOrders", created_at: "2026-08-31T11:20:00.000Z", updated_at: "2026-08-31T11:20:00.000Z",
  },
  {
    _id: "n5", title: "พนักงานเช็คอิน", message: "สมชาย เช็คอินเข้างานแล้ว", type: "info",
    module: "employee", is_read: true, link: "/owner/attendance", created_at: "2026-08-31T09:02:00.000Z", updated_at: "2026-08-31T09:02:00.000Z",
  },
];
