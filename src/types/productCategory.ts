// field ตรงกับ backend จริง (src/models/productCategoryModel.ts) — ไม่ใช่ "category_name" เฉยๆ
export interface ProductCategory {
  _id: string;
  product_category_name: string;
  created_at: string;
  updated_at: string;
}
