// MOCK (D17)
import type { IngredientCategory } from "@/types/ingredientCategory";

const T = "2026-08-01T00:00:00.000Z";

export const ingredientCategoriesFixture: IngredientCategory[] = [
  { _id: "ic_flour_dairy", category_name: "แป้ง / นม / ไข่", created_at: T, updated_at: T },
  { _id: "ic_sugar_butter", category_name: "น้ำตาล / เนย", created_at: T, updated_at: T },
  { _id: "ic_fruit_topping", category_name: "ผลไม้ / ท็อปปิ้ง", created_at: T, updated_at: T },
  { _id: "ic_chocolate", category_name: "ช็อกโกแลต", created_at: T, updated_at: T },
  { _id: "ic_packaging", category_name: "บรรจุภัณฑ์", created_at: T, updated_at: T },
];
