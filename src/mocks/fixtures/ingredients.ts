// MOCK (D17) — คละสถานะ: ปกติ / ใกล้หมด (< reorder_point) / หมดสต็อก (<= 0)
import type { Ingredient } from "@/types/ingredient";

export const ingredientsFixture: Ingredient[] = [
  {
    _id: "ing_flour", ingredient_name: "แป้งสาลีอเนกประสงค์", ingredient_category_id: "ic_flour_dairy", unit_id: "u_gram",
    current_stock: 2400, reorder_point: 500, max_stock: 5000, cost_per_unit: 0.04, supplier: "ตลาดสด A",
    created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-30T08:00:00.000Z",
  },
  {
    _id: "ing_milk", ingredient_name: "นมสด", ingredient_category_id: "ic_flour_dairy", unit_id: "u_ml",
    current_stock: 350, reorder_point: 500, max_stock: 2000, cost_per_unit: 0.05, supplier: "ซีพี",
    created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-29T09:00:00.000Z",
  },
  {
    _id: "ing_egg", ingredient_name: "ไข่ไก่", ingredient_category_id: "ic_flour_dairy", unit_id: "u_egg",
    current_stock: 4, reorder_point: 12, max_stock: 60, cost_per_unit: 5, supplier: "ตลาดสด A",
    created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-29T09:00:00.000Z",
  },
  {
    _id: "ing_butter", ingredient_name: "เนยสด", ingredient_category_id: "ic_sugar_butter", unit_id: "u_gram",
    current_stock: 800, reorder_point: 200, max_stock: 2000, cost_per_unit: 0.18, supplier: "ซีพี",
    created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-28T10:00:00.000Z",
  },
  {
    _id: "ing_sugar", ingredient_name: "น้ำตาลทราย", ingredient_category_id: "ic_sugar_butter", unit_id: "u_kg",
    current_stock: 30, reorder_point: 5, max_stock: 50, cost_per_unit: 32, supplier: "ตลาดสด A",
    created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-27T11:00:00.000Z",
  },
  {
    _id: "ing_strawberry", ingredient_name: "สตรอว์เบอร์รีสด", ingredient_category_id: "ic_fruit_topping", unit_id: "u_gram",
    current_stock: 0, reorder_point: 200, max_stock: 1000, cost_per_unit: 0.15, supplier: "ตลาดสด B",
    created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-26T08:00:00.000Z",
  },
  {
    _id: "ing_dark_choc", ingredient_name: "ช็อกโกแลตดาร์ก", ingredient_category_id: "ic_chocolate", unit_id: "u_gram",
    current_stock: 1200, reorder_point: 300, max_stock: 3000, cost_per_unit: 0.25, supplier: "นำเข้า",
    created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-26T08:00:00.000Z",
  },
  {
    _id: "ing_cream", ingredient_name: "วิปปิ้งครีม", ingredient_category_id: "ic_flour_dairy", unit_id: "u_ml",
    current_stock: 600, reorder_point: 800, max_stock: 3000, cost_per_unit: 0.12, supplier: "ซีพี",
    created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-25T09:00:00.000Z",
  },
  {
    _id: "ing_cake_box", ingredient_name: "กล่องเค้ก 1 ปอนด์", ingredient_category_id: "ic_packaging", unit_id: "u_piece",
    current_stock: 45, reorder_point: 30, max_stock: 200, cost_per_unit: 12, supplier: "โรงงานบรรจุภัณฑ์",
    created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-24T09:00:00.000Z",
  },
  {
    _id: "ing_yeast", ingredient_name: "ยีสต์แห้ง", ingredient_category_id: "ic_flour_dairy", unit_id: "u_gram",
    current_stock: 80, reorder_point: 50, max_stock: 500, cost_per_unit: 0.1, supplier: "ตลาดสด A",
    created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-24T09:00:00.000Z",
  },
];
