"use client";

// ─────────────────────────────────────────────────────────────
// src/hooks/useCategoryManager.ts
// เพิ่ม/เปลี่ยนชื่อ/ลบหมวดหมู่ 3 ชนิด (สินค้า · วัตถุดิบ · ส่วนประกอบ) — BACKLOG2 §15.2 ข้อ 1
// ใช้คู่กับ <CategoryManagerDialog> · สิทธิ์ตามหมวดของ backend: products / ingredients / recipes
//
// กันลบหมวดที่ยังมีของใช้อยู่:
//  - วัตถุดิบ / ส่วนประกอบ: backend ตอบ 409 เอง ("ลบไม่ได้ เพราะยังมี...ที่ใช้หมวดหมู่นี้อยู่")
//  - สินค้า: backend ยังไม่กัน (ลบแล้วสินค้าเหลือหมวดที่ไม่มีอยู่จริง) → นับสินค้าในหมวดก่อนลบที่นี่
//    (GET /admin/products?category_id=&limit=1 แล้วดู meta.total) — แจ้ง backend ให้กันฝั่ง API ด้วย
// ─────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productCategoriesService } from "@/services/productCategories";
import { ingredientCategoriesService } from "@/services/ingredientCategories";
import { componentCategoriesService } from "@/services/componentCategories";
import { productsService } from "@/services/products";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { MenuKey } from "@/constants/menuKeys";

export type CategoryKind = "product" | "ingredient" | "component";

export interface CategoryItem {
  id: string;
  name: string;
}

interface KindConfig {
  queryKey: readonly string[];
  menu: MenuKey;
  list: () => Promise<CategoryItem[]>;
  create: (name: string) => Promise<unknown>;
  rename: (id: string, name: string) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  /** จำนวนของที่ยังใช้หมวดนี้ — มีเฉพาะชนิดที่ backend ยังไม่กันเอง */
  usageCount?: (id: string) => Promise<number>;
}

const byName = (a: CategoryItem, b: CategoryItem) => a.name.localeCompare(b.name, "th");

// queryKey ต้องตรงกับที่หน้าอื่นใช้อยู่ (["product-categories"] ฯลฯ) — แก้หมวดแล้วตัวกรอง/ฟอร์มทุกหน้าอัปเดตตาม
const CONFIG: Record<CategoryKind, KindConfig> = {
  product: {
    queryKey: ["product-categories"],
    menu: "products",
    list: async () =>
      (await productCategoriesService.list()).data.map((c) => ({ id: c._id, name: c.product_category_name })).sort(byName),
    create: (name) => productCategoriesService.create({ product_category_name: name }),
    rename: (id, name) => productCategoriesService.update(id, { product_category_name: name }),
    remove: (id) => productCategoriesService.remove(id),
    usageCount: async (id) => (await productsService.list({ category_id: id, limit: 1 })).meta.total,
  },
  ingredient: {
    queryKey: ["ingredient-categories"],
    menu: "ingredients",
    list: async () =>
      (await ingredientCategoriesService.list()).data
        .map((c) => ({ id: c._id, name: c.ingredient_category_name }))
        .sort(byName),
    create: (name) => ingredientCategoriesService.create({ ingredient_category_name: name }),
    rename: (id, name) => ingredientCategoriesService.update(id, { ingredient_category_name: name }),
    remove: (id) => ingredientCategoriesService.remove(id),
  },
  component: {
    queryKey: ["component-categories"],
    menu: "recipes",
    list: async () =>
      (await componentCategoriesService.list()).data
        .map((c) => ({ id: c._id, name: c.component_category_name }))
        .sort(byName),
    create: (name) => componentCategoriesService.create({ component_category_name: name }),
    rename: (id, name) => componentCategoriesService.update(id, { component_category_name: name }),
    remove: (id) => componentCategoriesService.remove(id),
  },
};

export function useCategoryManager(kind: CategoryKind, { enabled = true }: { enabled?: boolean } = {}) {
  const t = useTranslations();
  const qc = useQueryClient();
  const cfg = CONFIG[kind];
  const perm = usePermission(cfg.menu);

  // queryKey แยกจากที่หน้าอื่นใช้ (data คนละรูป) แต่ขึ้นต้นเหมือนกัน — invalidate ชุดเดียวครอบทั้งสองแบบ
  const q = useQuery({ queryKey: [...cfg.queryKey, "manager"], queryFn: cfg.list, enabled });
  const invalidate = () => qc.invalidateQueries({ queryKey: cfg.queryKey });
  const onError = (fallbackKey: "categories.saveFailed" | "categories.deleteFailed") => (e: unknown) =>
    alert.error(isApiError(e) ? e.message : t(fallbackKey));

  const create = useMutation({
    mutationFn: (name: string) => cfg.create(name.trim()),
    onSuccess: () => {
      alert.success(t("categories.created"));
      invalidate();
    },
    onError: onError("categories.saveFailed"),
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => cfg.rename(id, name.trim()),
    onSuccess: () => {
      alert.success(t("categories.renamed"));
      invalidate();
      // ชื่อหมวดที่ populate ไว้ในรายการสินค้า/วัตถุดิบ/ส่วนประกอบต้องดึงใหม่ด้วย
      qc.invalidateQueries({ queryKey: kind === "product" ? ["products"] : kind === "ingredient" ? ["ingredients"] : ["components"] });
    },
    onError: onError("categories.saveFailed"),
  });

  const remove = useMutation({
    mutationFn: async (item: CategoryItem) => {
      if (cfg.usageCount) {
        const used = await cfg.usageCount(item.id);
        if (used > 0) throw new Error(t("categories.inUse", { name: item.name, n: used }));
      }
      await cfg.remove(item.id);
    },
    onSuccess: () => {
      alert.success(t("categories.deleted"));
      invalidate();
    },
    onError: (e) =>
      alert.error(isApiError(e) ? e.message : e instanceof Error && e.message ? e.message : t("categories.deleteFailed")),
  });

  return {
    perm,
    items: q.data ?? [],
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => q.refetch(),
    onCreate: (name: string) => create.mutateAsync(name).then(() => true, () => false),
    onRename: (id: string, name: string) => rename.mutateAsync({ id, name }).then(() => true, () => false),
    onDelete: (item: CategoryItem) => remove.mutate(item),
    creating: create.isPending,
    savingId: rename.isPending ? rename.variables?.id ?? null : null,
    deletingId: remove.isPending ? remove.variables?.id ?? null : null,
  };
}
