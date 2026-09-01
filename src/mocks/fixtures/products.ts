// ─────────────────────────────────────────────────────────────
// src/mocks/fixtures/products.ts  — MOCK (D17)
// ข้อมูลสินค้าตัวอย่าง — เพิ่มให้ครบตามที่ screen ต้องใช้ตอนเฟส 4
// ─────────────────────────────────────────────────────────────
import type { Product } from "@/types/product";

export const productsFixture: Product[] = [
  {
    _id: "p_choco_lava", product_name_th: "เค้กช็อกโกแลตลาวา", product_name_eng: "Chocolate Lava Cake",
    category_id: "c_cake_slice", unit_id: "u_piece",
    product_price: 450, sale_price: 399, product_type: "ready", product_stock_quantity: 12,
    avg_rating: 4.8, review_count: 42, is_visible: true, is_active: true,
    created_at: "2026-08-30T10:00:00.000Z", updated_at: "2026-08-30T10:00:00.000Z",
  },
  {
    _id: "p_vanilla_cup", product_name_th: "คัพเค้กวานิลลา", product_name_eng: "Vanilla Cupcake",
    category_id: "c_cupcake", unit_id: "u_piece",
    product_price: 60, product_type: "ready", product_stock_quantity: 40,
    avg_rating: 4.5, review_count: 20, is_visible: true, is_active: true,
    created_at: "2026-08-29T09:00:00.000Z", updated_at: "2026-08-29T09:00:00.000Z",
  },
  {
    _id: "p_strawberry_short", product_name_th: "สตรอว์เบอร์รีชอร์ตเค้ก", product_name_eng: "Strawberry Shortcake",
    category_id: "c_cake_pound", unit_id: "u_pound",
    product_price: 520, product_type: "preorder", product_stock_quantity: 0,
    avg_rating: 4.9, review_count: 15, is_visible: true, is_active: true,
    created_at: "2026-08-28T14:00:00.000Z", updated_at: "2026-08-28T14:00:00.000Z",
  },
  {
    _id: "p_sourdough", product_name_th: "ขนมปังซาวโดว์", product_name_eng: "Sourdough Bread",
    category_id: "c_bread", unit_id: "u_piece",
    product_price: 150, product_type: "ready", product_stock_quantity: 0,
    avg_rating: 4.6, review_count: 33, is_visible: false, is_active: true,
    created_at: "2026-08-27T08:00:00.000Z", updated_at: "2026-08-27T08:00:00.000Z",
  },
  {
    _id: "p_matcha_roll", product_name_th: "โรลเค้กชาเขียว", product_name_eng: "Matcha Roll Cake",
    category_id: "c_cake_slice", unit_id: "u_piece",
    product_price: 320, sale_price: 280, product_type: "ready", product_stock_quantity: 5,
    avg_rating: 4.7, review_count: 28, is_visible: true, is_active: true,
    created_at: "2026-08-26T11:00:00.000Z", updated_at: "2026-08-26T11:00:00.000Z",
  },
];
