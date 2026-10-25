// ─────────────────────────────────────────────────────────────
// deletedResources.ts — resource หลังร้านที่ลบแล้วกู้คืนได้ (backend มี POST /admin/<x>/:id/restore ทุกตัว)
// path = endpoint · queryKey = key ขึ้นต้นที่หน้าอื่นใช้อยู่ (กู้คืนแล้ว invalidate ให้รายการกลับมาทันที)
// entity = ชื่อกลุ่มจาก messages "entities" · label = field ชื่อของ resource นั้น
// โซนค่าส่ง + หัวข้อรีวิว มีส่วน "ที่ลบแล้ว" ในหน้าของตัวเองอยู่แล้ว — ไม่อยู่ในนี้
// ─────────────────────────────────────────────────────────────
import type { TrashRow } from "@/services/trash";
import type th from "@/i18n/messages/th.json";

type EntityKey = Exclude<keyof (typeof th)["entities"], "fallback">;

export interface DeletedResource {
  path: string;
  queryKey: readonly string[];
  entity: EntityKey;
  /** query เพิ่มตอนดึงรายการ (เช่น พนักงานเท่านั้น ไม่รวมลูกค้า) */
  params?: Record<string, unknown>;
  label: (r: TrashRow) => string;
}

const field = (name: string) => (r: TrashRow) => String(r[name] ?? "") || r._id;

const RESOURCES = {
  products: { path: "/admin/products", queryKey: ["products"], entity: "Product", label: field("product_name_th") },
  productCategories: {
    path: "/admin/product-categories",
    queryKey: ["product-categories"],
    entity: "ProductCategory",
    label: field("product_category_name"),
  },
  banners: { path: "/admin/banners", queryKey: ["banners"], entity: "Banner", label: field("banner_name") },
  ingredients: { path: "/admin/ingredients", queryKey: ["ingredients"], entity: "Ingredient", label: field("ingredient_name") },
  ingredientCategories: {
    path: "/admin/ingredient-categories",
    queryKey: ["ingredient-categories"],
    entity: "IngredientCategory",
    label: field("ingredient_category_name"),
  },
  units: { path: "/admin/units", queryKey: ["units"], entity: "Unit", label: field("unit_name") },
  recipes: { path: "/admin/recipes", queryKey: ["recipes"], entity: "Recipe", label: field("recipe_name") },
  components: { path: "/admin/components", queryKey: ["components"], entity: "Component", label: field("component_name") },
  componentCategories: {
    path: "/admin/component-categories",
    queryKey: ["component-categories"],
    entity: "ComponentCategory",
    label: field("component_category_name"),
  },
  expenses: { path: "/admin/expenses", queryKey: ["expenses"], entity: "Expense", label: field("description") },
  promotions: { path: "/admin/promotions", queryKey: ["promotions"], entity: "Promotion", label: field("promotion_name") },
  preorderRounds: { path: "/admin/preorder-rounds", queryKey: ["preorder-rounds"], entity: "PreorderRound", label: field("round_name") },
  // ตรงกับ STAFF_PARAMS ของหน้าพนักงาน — บัญชีลูกค้าที่ลบตัวเองไม่ต้องโผล่ที่นี่
  staff: { path: "/admin/users", queryKey: ["users"], entity: "User", params: { role_type: "owner,staff" }, label: field("user_fullname") },
  roles: { path: "/admin/roles", queryKey: ["roles"], entity: "Role", label: field("role_name") },
  semanticTerms: { path: "/admin/semantic-terms", queryKey: ["semantic-terms"], entity: "SemanticTerm", label: field("term") },
} as const satisfies Record<string, DeletedResource>;

export type DeletedResourceKey = keyof typeof RESOURCES;
export const DELETED_RESOURCES: Record<DeletedResourceKey, DeletedResource> = RESOURCES;
