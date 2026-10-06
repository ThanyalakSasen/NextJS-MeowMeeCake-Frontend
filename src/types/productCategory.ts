// field ตรงกับ backend จริง (src/models/productCategoryModel.ts) — ไม่ใช่ "category_name" เฉยๆ
export interface ProductCategory {
  _id: string;
  product_category_name: string;
  /** ออเดอร์เว็บส่งทั่วประเทศได้ไหม · ไม่ตั้ง = backend เดาจากชื่อหมวด ("ซาวโดว์" = ได้) — customer-backend-merge.md §8.7 */
  ships_nationwide?: boolean;
  created_at: string;
  updated_at: string;
}
