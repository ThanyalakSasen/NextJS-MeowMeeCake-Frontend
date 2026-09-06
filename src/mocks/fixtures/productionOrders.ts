// ─────────────────────────────────────────────────────────────
// src/mocks/fixtures/productionOrders.ts  — MOCK (D17)
// ครบ 4 สถานะ (planned/in_progress/done/cancelled) × 2 ประเภท (manual/preorder)
// product_id อ้างอิง productsFixture จริง — unit_abbr ตรงกับ unitsFixture (u_piece/u_pound)
// ─────────────────────────────────────────────────────────────
import type { ProductionOrder } from "@/types/productionOrder";

export const productionOrdersFixture: ProductionOrder[] = [
  {
    _id: "po_2001", production_no: "PO-260902-0021",
    production_date: "2026-09-02T00:00:00.000Z",
    source_type: "preorder", production_status: "in_progress",
    assigned_to: "u_baker1", assignee_name: "กานดา แสงเพชร",
    production_note: 'ข้อความบนเค้ก "Happy Birthday Tom" ตกแต่งดอกไม้สีชมพู',
    items: [
      { product_id: "p_strawberry_short", product_name: "สตรอว์เบอร์รีชอร์ตเค้ก", planned_qty: 2, unit_abbr: "ปอนด์" },
    ],
    started_at: "2026-09-02T02:00:00.000Z", completed_at: null,
    created_at: "2026-09-01T14:30:00.000Z", updated_at: "2026-09-02T02:00:00.000Z",
  },
  {
    _id: "po_2000", production_no: "PO-260902-0020",
    production_date: "2026-09-02T00:00:00.000Z",
    source_type: "manual", production_status: "planned",
    assigned_to: "u_baker2", assignee_name: "วิชัย ศรีสมบัติ",
    production_note: "ผลิตเพิ่มเติมสต็อก",
    items: [
      { product_id: "p_matcha_roll", product_name: "โรลเค้กชาเขียว", planned_qty: 8, unit_abbr: "ชิ้น" },
      { product_id: "p_sourdough", product_name: "ขนมปังซาวโดว์", planned_qty: 15, unit_abbr: "ชิ้น" },
    ],
    started_at: null, completed_at: null,
    created_at: "2026-09-01T15:00:00.000Z", updated_at: "2026-09-01T15:00:00.000Z",
  },
  {
    _id: "po_1999", production_no: "PO-260901-0019",
    production_date: "2026-09-01T00:00:00.000Z",
    source_type: "manual", production_status: "planned",
    assigned_to: null, assignee_name: null,
    production_note: null,
    items: [
      { product_id: "p_vanilla_cup", product_name: "คัพเค้กวานิลลา", planned_qty: 24, unit_abbr: "ชิ้น" },
    ],
    started_at: null, completed_at: null,
    created_at: "2026-08-31T18:00:00.000Z", updated_at: "2026-08-31T18:00:00.000Z",
  },
  {
    _id: "po_1998", production_no: "PO-260831-0018",
    production_date: "2026-08-31T00:00:00.000Z",
    source_type: "preorder", production_status: "done",
    assigned_to: "u_baker1", assignee_name: "กานดา แสงเพชร",
    production_note: null,
    items: [
      { product_id: "p_strawberry_short", product_name: "สตรอว์เบอร์รีชอร์ตเค้ก", planned_qty: 1, unit_abbr: "ปอนด์" },
    ],
    started_at: "2026-08-31T07:00:00.000Z", completed_at: "2026-08-31T11:30:00.000Z",
    created_at: "2026-08-30T16:00:00.000Z", updated_at: "2026-08-31T11:30:00.000Z",
  },
  {
    _id: "po_1997", production_no: "PO-260830-0017",
    production_date: "2026-08-30T00:00:00.000Z",
    source_type: "manual", production_status: "done",
    assigned_to: "u_baker2", assignee_name: "วิชัย ศรีสมบัติ",
    production_note: "เติมสต็อกเช้าวันเสาร์",
    items: [
      { product_id: "p_choco_lava", product_name: "เค้กช็อกโกแลตลาวา", planned_qty: 10, unit_abbr: "ชิ้น" },
      { product_id: "p_vanilla_cup", product_name: "คัพเค้กวานิลลา", planned_qty: 30, unit_abbr: "ชิ้น" },
    ],
    started_at: "2026-08-30T05:00:00.000Z", completed_at: "2026-08-30T09:00:00.000Z",
    created_at: "2026-08-29T20:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z",
  },
  {
    _id: "po_1996", production_no: "PO-260829-0016",
    production_date: "2026-08-29T00:00:00.000Z",
    source_type: "manual", production_status: "done",
    assigned_to: "u_baker1", assignee_name: "กานดา แสงเพชร",
    production_note: null,
    items: [
      { product_id: "p_matcha_roll", product_name: "โรลเค้กชาเขียว", planned_qty: 6, unit_abbr: "ชิ้น" },
    ],
    started_at: "2026-08-29T06:00:00.000Z", completed_at: "2026-08-29T09:15:00.000Z",
    created_at: "2026-08-28T17:00:00.000Z", updated_at: "2026-08-29T09:15:00.000Z",
  },
  {
    _id: "po_1995", production_no: "PO-260828-0015",
    production_date: "2026-08-28T00:00:00.000Z",
    source_type: "manual", production_status: "cancelled",
    assigned_to: "u_baker2", assignee_name: "วิชัย ศรีสมบัติ",
    production_note: "ยกเลิก — เปลี่ยนแผนผลิตกะทันหัน",
    items: [
      { product_id: "p_sourdough", product_name: "ขนมปังซาวโดว์", planned_qty: 20, unit_abbr: "ชิ้น" },
    ],
    started_at: null, completed_at: null,
    created_at: "2026-08-27T19:00:00.000Z", updated_at: "2026-08-28T08:00:00.000Z",
  },
  {
    _id: "po_1994", production_no: "PO-260726-0014",
    production_date: "2026-07-26T00:00:00.000Z",
    source_type: "preorder", production_status: "done",
    assigned_to: "u_baker1", assignee_name: "กานดา แสงเพชร",
    production_note: null,
    items: [
      { product_id: "p_strawberry_short", product_name: "สตรอว์เบอร์รีชอร์ตเค้ก", planned_qty: 3, unit_abbr: "ปอนด์" },
      { product_id: "p_choco_lava", product_name: "เค้กช็อกโกแลตลาวา", planned_qty: 4, unit_abbr: "ชิ้น" },
    ],
    started_at: "2026-07-26T06:00:00.000Z", completed_at: "2026-07-26T12:00:00.000Z",
    created_at: "2026-07-25T15:00:00.000Z", updated_at: "2026-07-26T12:00:00.000Z",
  },
];
