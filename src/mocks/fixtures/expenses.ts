// ─────────────────────────────────────────────────────────────
// src/mocks/fixtures/expenses.ts  — MOCK (D17)
// คละ 3 เดือน (ก.ค.-ก.ย. 2569) · ทุกหมวดหมู่ · บางรายการยังไม่แนบใบเสร็จ · มีรายจ่ายประจำ 3 รายการ
// (ค่าเช่า/ค่าไฟ ครบกำหนด 1 ต.ค. · ค่าเน็ตครบกำหนดวันนี้พอดี — โชว์เคส "ใกล้ครบกำหนด")
// ─────────────────────────────────────────────────────────────
import type { Expense } from "@/types/expense";

export const expensesFixture: Expense[] = [
  {
    _id: "exp_2409", date: "2026-09-05T00:00:00.000Z",
    description: "ซื้อแป้งสาลี 20kg + วัตถุดิบเบเกอรี่", category: "วัตถุดิบ",
    amount: 2400, payment_method: "โอนเงิน", vendor: "ตลาดสด A",
    receipt_url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23F1E4DC'/%3E%3Ctext x='50%25' y='50%25' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%234B2E2B' font-family='sans-serif'%3EReceipt%3C/text%3E%3C/svg%3E",
    is_recurring: false,
    created_at: "2026-09-05T10:00:00.000Z", updated_at: "2026-09-05T10:00:00.000Z",
  },
  {
    _id: "exp_2408", date: "2026-09-03T00:00:00.000Z",
    description: "กล่องเค้ก + ถุงกระดาษ", category: "บรรจุภัณฑ์",
    amount: 1800, payment_method: "เงินสด", vendor: "โรงงานบรรจุภัณฑ์",
    receipt_url: null, is_recurring: false,
    created_at: "2026-09-03T09:00:00.000Z", updated_at: "2026-09-03T09:00:00.000Z",
  },
  {
    _id: "exp_2407", date: "2026-09-01T00:00:00.000Z",
    description: "ค่าเช่าร้านเดือนกันยายน", category: "ค่าเช่า",
    amount: 15000, payment_method: "โอนเงิน", vendor: "เจ้าของอาคาร",
    receipt_url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23F1E4DC'/%3E%3Ctext x='50%25' y='50%25' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%234B2E2B' font-family='sans-serif'%3EReceipt%3C/text%3E%3C/svg%3E",
    is_recurring: true,
    created_at: "2026-09-01T08:00:00.000Z", updated_at: "2026-09-01T08:00:00.000Z",
  },
  {
    _id: "exp_2406", date: "2026-09-01T00:00:00.000Z",
    description: "ค่าไฟฟ้าเดือนสิงหาคม", category: "ค่าสาธารณูปโภค",
    amount: 3200, payment_method: "QR Code", vendor: "การไฟฟ้านครหลวง",
    receipt_url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23F1E4DC'/%3E%3Ctext x='50%25' y='50%25' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%234B2E2B' font-family='sans-serif'%3EReceipt%3C/text%3E%3C/svg%3E",
    is_recurring: true,
    created_at: "2026-09-01T08:10:00.000Z", updated_at: "2026-09-01T08:10:00.000Z",
  },
  {
    _id: "exp_2405", date: "2026-08-28T00:00:00.000Z",
    description: "ค่าจ้างพนักงานพาร์ทไทม์", category: "ค่าจ้างแรงงาน",
    amount: 9000, payment_method: "โอนเงิน", vendor: "",
    receipt_url: null, is_recurring: false,
    created_at: "2026-08-28T17:00:00.000Z", updated_at: "2026-08-28T17:00:00.000Z",
  },
  {
    _id: "exp_2404", date: "2026-08-25T00:00:00.000Z",
    description: "โฆษณา Facebook Ads", category: "ค่าการตลาด",
    amount: 1500, payment_method: "บัตรเครดิต", vendor: "Meta",
    receipt_url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23F1E4DC'/%3E%3Ctext x='50%25' y='50%25' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%234B2E2B' font-family='sans-serif'%3EReceipt%3C/text%3E%3C/svg%3E",
    is_recurring: false,
    created_at: "2026-08-25T11:00:00.000Z", updated_at: "2026-08-25T11:00:00.000Z",
  },
  {
    _id: "exp_2403", date: "2026-08-20T00:00:00.000Z",
    description: "ซ่อมเตาอบ", category: "ค่าซ่อมบำรุง",
    amount: 2200, payment_method: "เงินสด", vendor: "ช่างซ่อมเครื่องครัว",
    receipt_url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23F1E4DC'/%3E%3Ctext x='50%25' y='50%25' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%234B2E2B' font-family='sans-serif'%3EReceipt%3C/text%3E%3C/svg%3E",
    is_recurring: false,
    created_at: "2026-08-20T14:00:00.000Z", updated_at: "2026-08-20T14:00:00.000Z",
  },
  {
    _id: "exp_2402", date: "2026-08-15T00:00:00.000Z",
    description: "ซื้อน้ำตาลทราย + เนยสด", category: "วัตถุดิบ",
    amount: 3100, payment_method: "เงินสด", vendor: "ซีพี",
    receipt_url: null, is_recurring: false,
    created_at: "2026-08-15T09:30:00.000Z", updated_at: "2026-08-15T09:30:00.000Z",
  },
  {
    _id: "exp_2401", date: "2026-08-10T00:00:00.000Z",
    description: "ค่าน้ำประปา", category: "ค่าสาธารณูปโภค",
    amount: 450, payment_method: "QR Code", vendor: "การประปานครหลวง",
    receipt_url: null, is_recurring: false,
    created_at: "2026-08-10T08:00:00.000Z", updated_at: "2026-08-10T08:00:00.000Z",
  },
  {
    _id: "exp_2400", date: "2026-08-07T00:00:00.000Z",
    description: "ค่าอินเทอร์เน็ตร้าน", category: "ค่าสาธารณูปโภค",
    amount: 700, payment_method: "โอนเงิน", vendor: "AIS Fibre",
    receipt_url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23F1E4DC'/%3E%3Ctext x='50%25' y='50%25' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%234B2E2B' font-family='sans-serif'%3EReceipt%3C/text%3E%3C/svg%3E",
    is_recurring: true,
    created_at: "2026-08-07T08:00:00.000Z", updated_at: "2026-08-07T08:00:00.000Z",
  },
  {
    _id: "exp_2399", date: "2026-08-05T00:00:00.000Z",
    description: "ถุงใส่ขนมปัง", category: "บรรจุภัณฑ์",
    amount: 900, payment_method: "เงินสด", vendor: "โรงงานบรรจุภัณฑ์",
    receipt_url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23F1E4DC'/%3E%3Ctext x='50%25' y='50%25' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%234B2E2B' font-family='sans-serif'%3EReceipt%3C/text%3E%3C/svg%3E",
    is_recurring: false,
    created_at: "2026-08-05T10:00:00.000Z", updated_at: "2026-08-05T10:00:00.000Z",
  },
  {
    _id: "exp_2398", date: "2026-07-15T00:00:00.000Z",
    description: "ค่าธรรมเนียมธนาคาร", category: "อื่นๆ",
    amount: 300, payment_method: "โอนเงิน", vendor: "ธนาคาร",
    receipt_url: null, is_recurring: false,
    created_at: "2026-07-15T09:00:00.000Z", updated_at: "2026-07-15T09:00:00.000Z",
  },
  {
    _id: "exp_2397", date: "2026-07-01T00:00:00.000Z",
    description: "ค่าเช่าร้านเดือนกรกฎาคม", category: "ค่าเช่า",
    amount: 15000, payment_method: "โอนเงิน", vendor: "เจ้าของอาคาร",
    receipt_url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23F1E4DC'/%3E%3Ctext x='50%25' y='50%25' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%234B2E2B' font-family='sans-serif'%3EReceipt%3C/text%3E%3C/svg%3E",
    is_recurring: false,
    created_at: "2026-07-01T08:00:00.000Z", updated_at: "2026-07-01T08:00:00.000Z",
  },
];
