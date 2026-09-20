// field ตรงกับ backend จริง (src/models/ingredientCategoryModel.ts) — ไม่ใช่ "category_name" เฉยๆ
export interface IngredientCategory {
  _id: string;
  ingredient_category_name: string;
  created_at: string;
  updated_at: string;
}
