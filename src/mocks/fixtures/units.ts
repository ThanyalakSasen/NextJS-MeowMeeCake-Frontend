// MOCK (D17)
import type { Unit } from "@/types/unit";

const T = "2026-08-01T00:00:00.000Z";

export const unitsFixture: Unit[] = [
  // ── หน่วยสินค้า ──
  { _id: "u_piece", unit_name: "ชิ้น", unit_abbr: "ชิ้น", unit_type: "ProductCount", usage_context: ["Product"], created_at: T, updated_at: T },
  { _id: "u_box", unit_name: "กล่อง", unit_abbr: "กล่อง", unit_type: "Package", usage_context: ["Product"], created_at: T, updated_at: T },
  { _id: "u_pound", unit_name: "ปอนด์", unit_abbr: "ปอนด์", unit_type: "ProductWeight", usage_context: ["Product"], created_at: T, updated_at: T },
  // ── หน่วยวัตถุดิบ / สูตร ──
  { _id: "u_gram", unit_name: "กรัม", unit_abbr: "ก.", unit_type: "IngredientWeight", usage_context: ["Ingredient"], created_at: T, updated_at: T },
  { _id: "u_kg", unit_name: "กิโลกรัม", unit_abbr: "กก.", unit_type: "IngredientWeight", usage_context: ["Ingredient"], created_at: T, updated_at: T },
  { _id: "u_ml", unit_name: "มิลลิลิตร", unit_abbr: "มล.", unit_type: "IngredientVolume", usage_context: ["Ingredient"], created_at: T, updated_at: T },
  { _id: "u_liter", unit_name: "ลิตร", unit_abbr: "ล.", unit_type: "IngredientVolume", usage_context: ["Ingredient"], created_at: T, updated_at: T },
  { _id: "u_egg", unit_name: "ฟอง", unit_abbr: "ฟอง", unit_type: "Piece", usage_context: ["Ingredient"], created_at: T, updated_at: T },
];
