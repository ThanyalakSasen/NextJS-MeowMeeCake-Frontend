// MOCK (D17)
import type { Unit } from "@/types/unit";
export const unitsFixture: Unit[] = [
  { _id: "u_piece", unit_name: "ชิ้น", unit_abbr: "ชิ้น", unit_type: "ProductCount", usage_context: ["Product"], created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-01T00:00:00.000Z" },
  { _id: "u_box", unit_name: "กล่อง", unit_abbr: "กล่อง", unit_type: "Package", usage_context: ["Product"], created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-01T00:00:00.000Z" },
  { _id: "u_pound", unit_name: "ปอนด์", unit_abbr: "ปอนด์", unit_type: "ProductWeight", usage_context: ["Product"], created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-01T00:00:00.000Z" },
  { _id: "u_gram", unit_name: "กรัม", unit_abbr: "ก.", unit_type: "IngredientWeight", usage_context: ["Ingredient"], created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-01T00:00:00.000Z" },
];
