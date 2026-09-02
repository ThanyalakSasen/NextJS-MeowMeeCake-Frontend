// MOCK (D17)
import type { NotificationDTO } from "@/types/notification";

export const notificationsFixture: NotificationDTO[] = [
  {
    _id: "n1", title: "วัตถุดิบใกล้หมด", message: "แป้งเค้กเหลือน้อยกว่าจุดสั่งซื้อ", type: "warning",
    module: "ingredient", is_read: false, link: "/owner/ingredients", created_at: "2026-09-02T08:30:00.000Z", updated_at: "2026-09-02T08:30:00.000Z",
  },
  {
    _id: "n2", title: "ออเดอร์ใหม่", message: "ได้รับคำสั่งซื้อ #1042", type: "info",
    module: "order", is_read: false, link: "/owner/orders/manageOrders", created_at: "2026-09-02T07:15:00.000Z", updated_at: "2026-09-02T07:15:00.000Z",
  },
  {
    _id: "n3", title: "ผลิตเสร็จ", message: "ใบสั่งผลิต PO-0098 เสร็จแล้ว", type: "success",
    module: "production", is_read: true, link: "/owner/production", created_at: "2026-09-01T16:00:00.000Z", updated_at: "2026-09-01T16:00:00.000Z",
  },
  {
    _id: "n4", title: "ชำระเงินไม่สำเร็จ", message: "การชำระเงินออเดอร์ #1039 ถูกปฏิเสธ", type: "error",
    module: "finance", is_read: true, link: "/owner/orders/manageOrders", created_at: "2026-09-01T11:20:00.000Z", updated_at: "2026-09-01T11:20:00.000Z",
  },
  {
    _id: "n5", title: "พนักงานเช็คอิน", message: "กานดา แสงเพชร เช็คอินเข้างานแล้ว", type: "info",
    module: "employee", is_read: true, link: "/owner/attendance", created_at: "2026-09-01T09:02:00.000Z", updated_at: "2026-09-01T09:02:00.000Z",
  },
  {
    _id: "n6", title: "สต็อกสินค้าใกล้หมด", message: "มัทฉะเค้ก เหลือ 3 ชิ้น", type: "warning",
    module: "order", is_read: false, link: "/owner/products/productStock", created_at: "2026-08-31T18:40:00.000Z", updated_at: "2026-08-31T18:40:00.000Z",
  },
  {
    _id: "n7", title: "รับเข้าวัตถุดิบ", message: "รับเข้าน้ำตาลทราย 5,000 กรัม", type: "success",
    module: "ingredient", is_read: true, link: "/owner/ingredients/ingredientHistory", created_at: "2026-08-31T13:05:00.000Z", updated_at: "2026-08-31T13:05:00.000Z",
  },
  {
    _id: "n8", title: "ยอดขายวันนี้", message: "ยอดขายรวม ฿12,450 จาก 28 ออเดอร์", type: "info",
    module: "finance", is_read: true, link: "/owner/finance/summary", created_at: "2026-08-30T20:00:00.000Z", updated_at: "2026-08-30T20:00:00.000Z",
  },
  {
    _id: "n9", title: "อัปเดตระบบ", message: "ระบบจะปิดปรับปรุงวันอาทิตย์ 02:00–03:00 น.", type: "warning",
    module: "system", is_read: false, link: null, created_at: "2026-08-30T10:30:00.000Z", updated_at: "2026-08-30T10:30:00.000Z",
  },
  {
    _id: "n10", title: "พรีออเดอร์ครบกำหนด", message: "พรีออเดอร์ #PRE-0031 ถึงกำหนดรับพรุ่งนี้", type: "warning",
    module: "order", is_read: true, link: "/owner/orders/manageOrders", created_at: "2026-08-29T15:10:00.000Z", updated_at: "2026-08-29T15:10:00.000Z",
  },
  {
    _id: "n11", title: "ผลิตล่าช้า", message: "ใบสั่งผลิต PO-0095 เกินกำหนด 1 วัน", type: "error",
    module: "production", is_read: true, link: "/owner/production", created_at: "2026-08-29T09:45:00.000Z", updated_at: "2026-08-29T09:45:00.000Z",
  },
  {
    _id: "n12", title: "พนักงานลาป่วย", message: "วิชัย ศรีสมบัติ แจ้งลาป่วยวันนี้", type: "info",
    module: "employee", is_read: true, link: "/owner/attendance", created_at: "2026-08-28T08:20:00.000Z", updated_at: "2026-08-28T08:20:00.000Z",
  },
  {
    _id: "n13", title: "ค่าใช้จ่ายประจำ", message: "ครบกำหนดชำระค่าเช่าร้านเดือนกันยายน", type: "warning",
    module: "finance", is_read: true, link: "/owner/finance/expenses", created_at: "2026-08-28T07:00:00.000Z", updated_at: "2026-08-28T07:00:00.000Z",
  },
];
