// MOCK (D17) — log การเคลื่อนไหวสต็อกวัตถุดิบ (ingredient_id อ้าง fixtures/ingredients.ts)
import type { IngredientTransaction } from "@/types/ingredientTransaction";

export const ingredientTransactionsFixture: IngredientTransaction[] = [
  { _id: "itx_1", ingredient_id: "ing_milk", type: "use", quantity: 200, note: "เบิกสำหรับเค้กวันเกิด", performed_by: "วิชัย", created_at: "2026-09-01T10:24:00.000Z", updated_at: "2026-09-01T10:24:00.000Z" },
  { _id: "itx_2", ingredient_id: "ing_flour", type: "receive", quantity: 1000, note: "รับจากซัพพลายเออร์", performed_by: "กานดา", created_at: "2026-09-01T08:15:00.000Z", updated_at: "2026-09-01T08:15:00.000Z" },
  { _id: "itx_3", ingredient_id: "ing_egg", type: "use", quantity: 6, note: "เบิกสำหรับเค้กชาไทย", performed_by: "วิชัย", created_at: "2026-08-31T14:30:00.000Z", updated_at: "2026-08-31T14:30:00.000Z" },
  { _id: "itx_4", ingredient_id: "ing_butter", type: "adjust", quantity: 50, note: "ปรับยอดตามนับสต็อกจริง", performed_by: "วิชัย", created_at: "2026-08-31T09:00:00.000Z", updated_at: "2026-08-31T09:00:00.000Z" },
  { _id: "itx_5", ingredient_id: "ing_dark_choc", type: "receive", quantity: 500, note: "รับเข้าสต็อก", performed_by: "กานดา", created_at: "2026-08-30T08:00:00.000Z", updated_at: "2026-08-30T08:00:00.000Z" },
  { _id: "itx_6", ingredient_id: "ing_flour", type: "use", quantity: 350, note: "เบิกสำหรับซาวโดว์", performed_by: "กานดา", created_at: "2026-08-29T11:00:00.000Z", updated_at: "2026-08-29T11:00:00.000Z" },
  { _id: "itx_7", ingredient_id: "ing_sugar", type: "use", quantity: 2, note: "", performed_by: "วิชัย", created_at: "2026-08-29T10:00:00.000Z", updated_at: "2026-08-29T10:00:00.000Z" },
  { _id: "itx_8", ingredient_id: "ing_cream", type: "receive", quantity: 400, note: "", performed_by: "กานดา", created_at: "2026-08-28T09:00:00.000Z", updated_at: "2026-08-28T09:00:00.000Z" },
  { _id: "itx_9", ingredient_id: "ing_strawberry", type: "use", quantity: 300, note: "เบิกจนหมดล็อต", performed_by: "วิชัย", created_at: "2026-08-27T13:00:00.000Z", updated_at: "2026-08-27T13:00:00.000Z" },
  { _id: "itx_10", ingredient_id: "ing_yeast", type: "receive", quantity: 100, note: "", performed_by: "กานดา", created_at: "2026-08-26T09:00:00.000Z", updated_at: "2026-08-26T09:00:00.000Z" },
];
