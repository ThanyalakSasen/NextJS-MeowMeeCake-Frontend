// ─────────────────────────────────────────────────────────────
// src/mocks/fixtures/recipes.ts  — MOCK (D17)
// สูตรหลัก 4 สูตร ผูกกับ productsFixture — **ตั้งใจเว้น p_matcha_roll ไว้ไม่มีสูตร**
// (โชว์ alert "สินค้าที่ยังไม่มีสูตร" ในหน้า Recipes)
// ─────────────────────────────────────────────────────────────
import type { Recipe } from "@/types/recipe";

export const recipesFixture: Recipe[] = [
  {
    _id: "rcp_choco_lava", recipe_name: "สูตรเค้กช็อกโกแลตลาวา",
    product_id: "p_choco_lava", product_name: "เค้กช็อกโกแลตลาวา", product_type: "ready",
    components: [
      { component_id: "comp_choco_base", component_name: "เนื้อเค้กช็อกโกแลต", quantity: 1 },
      { component_id: "comp_choco_cream", component_name: "ครีมช็อกโกแลต", quantity: 1 },
    ],
    ingredients: [],
    steps: [
      { order: 1, title: "เตรียมเนื้อเค้ก", description: "ใช้สูตรส่วนประกอบเนื้อเค้กช็อกโกแลต อบที่ 180°C", duration_minutes: 45 },
      { order: 2, title: "อบที่ 180°C", description: "อบนาน 30 นาทีจนขึ้นฟู", duration_minutes: 30 },
      { order: 3, title: "ทำครีมช็อกโกแลต", description: "ใช้สูตรส่วนประกอบครีมช็อกโกแลต", duration_minutes: 20 },
      { order: 4, title: "ประกอบเค้ก", description: "วางชั้นเค้กสลับครีม พร้อมไส้ลาวาตรงกลาง", duration_minutes: 15 },
      { order: 5, title: "ตกแต่งและแช่เย็น", description: "แช่เย็นอย่างน้อย 30 นาทีก่อนเสิร์ฟ", duration_minutes: 30 },
    ],
    yield_qty: 1, yield_unit_id: "u_piece", yield_unit_abbr: "ชิ้น", estimated_cost_per_batch: 95, duration_minutes: 150,
    note: null,
    created_at: "2026-08-16T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z",
  },
  {
    _id: "rcp_vanilla_cup", recipe_name: "สูตรคัพเค้กวานิลลา",
    product_id: "p_vanilla_cup", product_name: "คัพเค้กวานิลลา", product_type: "ready",
    components: [
      { component_id: "comp_vanilla_base", component_name: "เนื้อเค้กวานิลลา", quantity: 1 },
      { component_id: "comp_vanilla_cream", component_name: "ครีมวานิลลา", quantity: 1 },
    ],
    ingredients: [],
    steps: [
      { order: 1, title: "เตรียม + อบเนื้อเค้ก", description: "ใช้สูตรส่วนประกอบเนื้อเค้กวานิลลา อบ 170°C 20 นาที", duration_minutes: 35 },
      { order: 2, title: "บีบครีม", description: "บีบครีมวานิลลาลงบนคัพเค้กที่เย็นแล้ว", duration_minutes: 10 },
    ],
    yield_qty: 12, yield_unit_id: "u_piece", yield_unit_abbr: "ชิ้น", estimated_cost_per_batch: 42, duration_minutes: 60,
    note: null,
    created_at: "2026-08-14T09:00:00.000Z", updated_at: "2026-08-29T09:00:00.000Z",
  },
  {
    _id: "rcp_strawberry_short", recipe_name: "สูตรสตรอว์เบอร์รีชอร์ตเค้ก",
    product_id: "p_strawberry_short", product_name: "สตรอว์เบอร์รีชอร์ตเค้ก", product_type: "preorder",
    components: [
      { component_id: "comp_vanilla_base", component_name: "เนื้อเค้กวานิลลา", quantity: 1 },
      { component_id: "comp_vanilla_cream", component_name: "ครีมวานิลลา", quantity: 1 },
      { component_id: "comp_strawberry_filling", component_name: "ไส้สตรอว์เบอร์รี", quantity: 1 },
    ],
    ingredients: [],
    steps: [
      { order: 1, title: "เตรียมทุกสูตรส่วนประกอบ", description: "เนื้อเค้กวานิลลา + ครีมวานิลลา + ไส้สตรอว์เบอร์รี", duration_minutes: 60 },
      { order: 2, title: "ประกอบและตกแต่ง", description: "ชั้นเค้ก > ไส้ > ครีม สลับกัน 3 ชั้น", duration_minutes: 20 },
    ],
    yield_qty: 1, yield_unit_id: "u_pound", yield_unit_abbr: "ปอนด์", estimated_cost_per_batch: 78, duration_minutes: 120,
    note: "รับออเดอร์ล่วงหน้า 2 วัน",
    created_at: "2026-08-13T09:00:00.000Z", updated_at: "2026-08-28T09:00:00.000Z",
  },
  {
    _id: "rcp_sourdough", recipe_name: "สูตรขนมปังซาวโดว์",
    product_id: "p_sourdough", product_name: "ขนมปังซาวโดว์", product_type: "ready",
    components: [
      { component_id: "comp_sourdough_starter", component_name: "แป้งซาวโดว์ Starter", quantity: 2 },
    ],
    ingredients: [
      { ingredient_id: "ing_flour", ingredient_name: "แป้งสาลีอเนกประสงค์", quantity: 350, unit_id: "u_gram", unit_abbr: "ก." },
      { ingredient_id: "ing_yeast", ingredient_name: "ยีสต์แห้ง", quantity: 1, unit_id: "u_gram", unit_abbr: "ก." },
    ],
    steps: [
      { order: 1, title: "ผสมแป้งหลัก", description: "ผสม Starter กับแป้งและยีสต์เพิ่มเติม", duration_minutes: 15 },
      { order: 2, title: "หมักตัว", description: "หมัก 8-12 ชั่วโมงที่อุณหภูมิห้อง", duration_minutes: 480 },
      { order: 3, title: "อบ", description: "อบที่ 230°C 35 นาที", duration_minutes: 35 },
    ],
    yield_qty: 1, yield_unit_id: "u_piece", yield_unit_abbr: "ชิ้น", estimated_cost_per_batch: 25, duration_minutes: 530,
    note: null,
    created_at: "2026-08-11T09:00:00.000Z", updated_at: "2026-08-27T09:00:00.000Z",
  },
];
