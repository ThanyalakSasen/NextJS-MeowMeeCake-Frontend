// ─────────────────────────────────────────────────────────────
// src/mocks/fixtures/recipeComponents.ts  — MOCK (D17)
// สูตรส่วนประกอบ (sub-recipe) — ingredient_id อ้างอิง ingredientsFixture จริง
// ครบ 4/6 หมวดหมู่ (เนื้อเค้ก×2, ครีม×2, ไส้×1, แป้ง×1) — เว้น ท็อปปิ้ง/อื่นๆ ไว้ยังไม่มีตัวอย่าง
// ─────────────────────────────────────────────────────────────
import type { RecipeComponent } from "@/types/recipeComponent";

export const recipeComponentsFixture: RecipeComponent[] = [
  {
    _id: "comp_choco_base", component_name: "เนื้อเค้กช็อกโกแลต", category: "เนื้อเค้ก",
    ingredients: [
      { ingredient_id: "ing_flour", ingredient_name: "แป้งสาลีอเนกประสงค์", quantity: 200, unit_id: "u_gram", unit_abbr: "ก." },
      { ingredient_id: "ing_egg", ingredient_name: "ไข่ไก่", quantity: 3, unit_id: "u_egg", unit_abbr: "ฟอง" },
      { ingredient_id: "ing_butter", ingredient_name: "เนยสด", quantity: 100, unit_id: "u_gram", unit_abbr: "ก." },
      { ingredient_id: "ing_dark_choc", ingredient_name: "ช็อกโกแลตดาร์ก", quantity: 40, unit_id: "u_gram", unit_abbr: "ก." },
      { ingredient_id: "ing_sugar", ingredient_name: "น้ำตาลทราย", quantity: 0.15, unit_id: "u_kg", unit_abbr: "กก." },
      { ingredient_id: "ing_milk", ingredient_name: "นมสด", quantity: 80, unit_id: "u_ml", unit_abbr: "มล." },
    ],
    steps: [
      { order: 1, title: "ร่อนแป้ง", description: "ร่อนแป้ง ผงโกโก้ (จากช็อกโกแลตดาร์กละลาย) เข้าด้วยกัน", duration_minutes: 5 },
      { order: 2, title: "ตีเนย", description: "ตีเนยกับน้ำตาลจนฟูขาว", duration_minutes: 8 },
      { order: 3, title: "ใส่ไข่", description: "ใส่ไข่ทีละฟองตีจนเข้ากัน", duration_minutes: 5 },
      { order: 4, title: "ผสมแป้ง", description: "ใส่แป้งสลับนม คนเบามือ", duration_minutes: 5 },
    ],
    yield_qty: 1, yield_unit_id: "u_piece", yield_unit_abbr: "ชิ้น", estimated_cost_per_batch: 55, note: null,
    created_at: "2026-08-15T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z",
  },
  {
    _id: "comp_vanilla_base", component_name: "เนื้อเค้กวานิลลา", category: "เนื้อเค้ก",
    ingredients: [
      { ingredient_id: "ing_flour", ingredient_name: "แป้งสาลีอเนกประสงค์", quantity: 180, unit_id: "u_gram", unit_abbr: "ก." },
      { ingredient_id: "ing_egg", ingredient_name: "ไข่ไก่", quantity: 3, unit_id: "u_egg", unit_abbr: "ฟอง" },
      { ingredient_id: "ing_butter", ingredient_name: "เนยสด", quantity: 90, unit_id: "u_gram", unit_abbr: "ก." },
      { ingredient_id: "ing_sugar", ingredient_name: "น้ำตาลทราย", quantity: 0.13, unit_id: "u_kg", unit_abbr: "กก." },
      { ingredient_id: "ing_milk", ingredient_name: "นมสด", quantity: 100, unit_id: "u_ml", unit_abbr: "มล." },
    ],
    steps: [
      { order: 1, title: "ตีเนย", description: "ตีเนยกับน้ำตาลจนฟู", duration_minutes: 8 },
      { order: 2, title: "ผสมทุกอย่าง", description: "ใส่ไข่แล้วใส่แป้งสลับนม", duration_minutes: 8 },
    ],
    yield_qty: 12, yield_unit_id: "u_piece", yield_unit_abbr: "ชิ้น", estimated_cost_per_batch: 18, note: null,
    created_at: "2026-08-14T09:00:00.000Z", updated_at: "2026-08-29T09:00:00.000Z",
  },
  {
    _id: "comp_choco_cream", component_name: "ครีมช็อกโกแลต", category: "ครีม",
    ingredients: [
      { ingredient_id: "ing_dark_choc", ingredient_name: "ช็อกโกแลตดาร์ก", quantity: 150, unit_id: "u_gram", unit_abbr: "ก." },
      { ingredient_id: "ing_cream", ingredient_name: "วิปปิ้งครีม", quantity: 100, unit_id: "u_ml", unit_abbr: "มล." },
      { ingredient_id: "ing_butter", ingredient_name: "เนยสด", quantity: 30, unit_id: "u_gram", unit_abbr: "ก." },
      { ingredient_id: "ing_sugar", ingredient_name: "น้ำตาลทราย", quantity: 0.02, unit_id: "u_kg", unit_abbr: "กก." },
    ],
    steps: [
      { order: 1, title: "ละลายช็อกโกแลต", description: "ละลายช็อกโกแลตกับวิปปิ้งครีมด้วยวิธี double boiler", duration_minutes: 10 },
      { order: 2, title: "พักให้เย็น", description: "แช่เย็น 30 นาทีก่อนใช้", duration_minutes: 30 },
    ],
    yield_qty: 300, yield_unit_id: "u_gram", yield_unit_abbr: "ก.", estimated_cost_per_batch: 32, note: null,
    created_at: "2026-08-15T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z",
  },
  {
    _id: "comp_vanilla_cream", component_name: "ครีมวานิลลา", category: "ครีม",
    ingredients: [
      { ingredient_id: "ing_cream", ingredient_name: "วิปปิ้งครีม", quantity: 200, unit_id: "u_ml", unit_abbr: "มล." },
      { ingredient_id: "ing_sugar", ingredient_name: "น้ำตาลทราย", quantity: 0.03, unit_id: "u_kg", unit_abbr: "กก." },
    ],
    steps: [
      { order: 1, title: "ตีวิปปิ้งครีม", description: "ตีครีมกับน้ำตาลจนตั้งยอด", duration_minutes: 8 },
    ],
    yield_qty: 200, yield_unit_id: "u_gram", yield_unit_abbr: "ก.", estimated_cost_per_batch: 22, note: null,
    created_at: "2026-08-13T09:00:00.000Z", updated_at: "2026-08-28T09:00:00.000Z",
  },
  {
    _id: "comp_strawberry_filling", component_name: "ไส้สตรอว์เบอร์รี", category: "ไส้",
    ingredients: [
      { ingredient_id: "ing_strawberry", ingredient_name: "สตรอว์เบอร์รีสด", quantity: 200, unit_id: "u_gram", unit_abbr: "ก." },
      { ingredient_id: "ing_sugar", ingredient_name: "น้ำตาลทราย", quantity: 0.08, unit_id: "u_kg", unit_abbr: "กก." },
    ],
    steps: [
      { order: 1, title: "ต้มสตรอว์เบอร์รี", description: "ต้มกับน้ำตาลจนข้น", duration_minutes: 15 },
      { order: 2, title: "พักให้เย็น", description: "แช่เย็นจนเซ็ตตัว", duration_minutes: 60 },
    ],
    yield_qty: 250, yield_unit_id: "u_gram", yield_unit_abbr: "ก.", estimated_cost_per_batch: 28, note: null,
    created_at: "2026-08-12T09:00:00.000Z", updated_at: "2026-08-27T09:00:00.000Z",
  },
  {
    _id: "comp_sourdough_starter", component_name: "แป้งซาวโดว์ Starter", category: "แป้ง",
    ingredients: [
      { ingredient_id: "ing_flour", ingredient_name: "แป้งสาลีอเนกประสงค์", quantity: 300, unit_id: "u_gram", unit_abbr: "ก." },
      { ingredient_id: "ing_yeast", ingredient_name: "ยีสต์แห้ง", quantity: 2, unit_id: "u_gram", unit_abbr: "ก." },
    ],
    steps: [
      { order: 1, title: "ผสม Starter", description: "ผสมแป้งกับยีสต์แห้ง คนให้เข้ากัน", duration_minutes: 5 },
      { order: 2, title: "หมักในอุณหภูมิห้อง", description: "หมัก 8-12 ชั่วโมงที่อุณหภูมิห้อง", duration_minutes: 480 },
    ],
    yield_qty: 200, yield_unit_id: "u_gram", yield_unit_abbr: "ก.", estimated_cost_per_batch: 8, note: "ต้อง refresh ทุก 24 ชม.",
    created_at: "2026-08-10T09:00:00.000Z", updated_at: "2026-08-24T09:00:00.000Z",
  },
];
