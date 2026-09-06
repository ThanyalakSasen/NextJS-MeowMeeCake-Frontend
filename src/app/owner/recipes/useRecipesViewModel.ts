"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Recipes — โหลด recipes + components + products + units + ingredients ครั้งเดียว
// 2 แท็บ (สูตรหลัก/สูตรส่วนประกอบ) ใช้ TabbedPageLayout (promote จาก Production — consumer ที่ 2)
// filter/pagination ฝั่ง client (แพทเทิร์นเดียวกับ Manage Orders/Production)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { recipesService } from "@/services/recipes";
import { recipeComponentsService } from "@/services/recipeComponents";
import { productsService } from "@/services/products";
import { productCategoriesService } from "@/services/productCategories";
import { unitsService } from "@/services/units";
import { ingredientsService } from "@/services/ingredients";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isProductUnit } from "@/utils/unitContext";
import type { RecipeCategory } from "@/constants/enumConfig";
import type { Recipe, RecipeInput } from "@/types/recipe";
import type { RecipeComponent, RecipeComponentInput } from "@/types/recipeComponent";
import type { RecipeSubmitValue } from "./_components/MainRecipeModal";
import type { ComponentSubmitValue } from "./_components/ComponentFormModal";

export type RecipeTab = "main" | "components";

export function useRecipesViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("recipes");

  const [activeTab, setActiveTab] = useState<RecipeTab>("main");

  const recipesQ = useQuery({ queryKey: ["recipes"], queryFn: () => recipesService.list({ limit: 200 }) });
  const componentsQ = useQuery({ queryKey: ["components"], queryFn: () => recipeComponentsService.list({ limit: 200 }) });
  const productsQ = useQuery({ queryKey: ["products"], queryFn: () => productsService.list({ limit: 200 }) });
  const productCategoriesQ = useQuery({ queryKey: ["product-categories"], queryFn: () => productCategoriesService.list() });
  const unitsQ = useQuery({ queryKey: ["units"], queryFn: () => unitsService.list() });
  const ingredientsQ = useQuery({ queryKey: ["ingredients"], queryFn: () => ingredientsService.list({ limit: 200 }) });

  const recipes = useMemo(() => recipesQ.data?.data ?? [], [recipesQ.data]);
  const components = useMemo(() => componentsQ.data?.data ?? [], [componentsQ.data]);
  const products = useMemo(() => productsQ.data?.data ?? [], [productsQ.data]);
  const productCategories = productCategoriesQ.data?.data ?? [];
  const units = useMemo(() => unitsQ.data?.data ?? [], [unitsQ.data]);
  const ingredients = useMemo(() => ingredientsQ.data?.data ?? [], [ingredientsQ.data]);

  const isLoading = recipesQ.isLoading || componentsQ.isLoading;
  const isError = recipesQ.isError || componentsQ.isError;
  const refetch = () => { recipesQ.refetch(); componentsQ.refetch(); };

  // ── ตัวเลือกฟอร์ม (join ไว้ล่วงหน้า — modal/View ไม่ join เอง) ──
  const ingredientOptions = useMemo(() => {
    const unitMap = new Map(units.map((u) => [u._id, u.unit_abbr || u.unit_name]));
    return ingredients.map((i) => ({
      _id: i._id, name: i.ingredient_name,
      unit_id: i.unit_id ?? "", unit_abbr: (i.unit_id && unitMap.get(i.unit_id)) || "",
    }));
  }, [ingredients, units]);

  const productYieldUnitOptions = useMemo(
    () => units.filter((u) => isProductUnit(u.usage_context)).map((u) => ({ value: u._id, label: `${u.unit_name} (${u.unit_abbr})` })),
    [units],
  );
  const allUnitOptions = useMemo(
    () => units.map((u) => ({ value: u._id, label: `${u.unit_name} (${u.unit_abbr})` })),
    [units],
  );
  const componentOptions = useMemo(() => components.map((c) => ({ _id: c._id, name: c.component_name })), [components]);

  /** สินค้าที่ยังไม่มีสูตรหลักผูกอยู่ */
  const productsWithoutRecipe = useMemo(
    () => products.filter((p) => !recipes.some((r) => r.product_id === p._id)),
    [products, recipes],
  );

  /** สูตรหลักที่ใช้สูตรส่วนประกอบแต่ละอัน — คำนวณสด ไม่ใช่ field ที่ fixture เก็บ (กันข้อมูลค้าง) */
  const usedInMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of recipes) {
      for (const c of r.components) map.set(c.component_id, [...(map.get(c.component_id) ?? []), r.recipe_name]);
    }
    return map;
  }, [recipes]);

  // ── แท็บ 1: สูตรหลัก ──
  const [mainSearch, setMainSearch] = useState("");
  const [mainCategoryFilter, setMainCategoryFilter] = useState("all");
  const [recipeFormOpen, setRecipeFormOpen] = useState(false);
  const [recipeEditTarget, setRecipeEditTarget] = useState<Recipe | null>(null);
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /** ตัวเลือกสินค้าในฟอร์ม — สินค้าที่ยังไม่มีสูตร + สินค้าของสูตรที่กำลังแก้ไข (กัน Select โชว์ label ว่างตอน edit) */
  const eligibleProductOptions = useMemo(() => {
    const editingProductId = recipeEditTarget?.product_id ?? null;
    const list = editingProductId
      ? products.filter((p) => p._id === editingProductId || !recipes.some((r) => r.product_id === p._id))
      : productsWithoutRecipe;
    return list.map((p) => ({ _id: p._id, name: p.product_name_th, type: p.product_type }));
  }, [products, recipes, productsWithoutRecipe, recipeEditTarget]);

  const filteredRecipes = useMemo(() => {
    const q = mainSearch.trim().toLowerCase();
    return recipes.filter((r) => {
      const matchSearch = !q || r.recipe_name.toLowerCase().includes(q) || r.product_name.toLowerCase().includes(q);
      const product = products.find((p) => p._id === r.product_id);
      const matchCategory = mainCategoryFilter === "all" || product?.category_id === mainCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [recipes, products, mainSearch, mainCategoryFilter]);

  const mainStats = useMemo(() => ({
    total: recipes.length,
    withComponents: recipes.filter((r) => r.components.length > 0).length,
    avgCost: recipes.length > 0 ? Math.round(recipes.reduce((s, r) => s + r.estimated_cost_per_batch, 0) / recipes.length) : 0,
    withoutRecipe: productsWithoutRecipe.length,
  }), [recipes, productsWithoutRecipe]);

  // ── แท็บ 2: สูตรส่วนประกอบ ──
  const [subSearch, setSubSearch] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState<RecipeCategory | "all">("all");
  const [componentFormOpen, setComponentFormOpen] = useState(false);
  const [componentEditTarget, setComponentEditTarget] = useState<RecipeComponent | null>(null);

  const componentRows = useMemo(
    () => components.map((c) => ({ ...c, usedIn: usedInMap.get(c._id) ?? [] })),
    [components, usedInMap],
  );

  const filteredComponents = useMemo(() => {
    const q = subSearch.trim().toLowerCase();
    return componentRows.filter((c) => {
      const matchSearch = !q || c.component_name.toLowerCase().includes(q);
      const matchCategory = subCategoryFilter === "all" || c.category === subCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [componentRows, subSearch, subCategoryFilter]);

  const subStats = useMemo(() => ({
    total: components.length,
    used: components.filter((c) => (usedInMap.get(c._id) ?? []).length > 0).length,
    avgCost: components.length > 0 ? Math.round(components.reduce((s, c) => s + c.estimated_cost_per_batch, 0) / components.length) : 0,
  }), [components, usedInMap]);

  // ── mutations: สูตรหลัก ──
  const invalidateRecipes = () => qc.invalidateQueries({ queryKey: ["recipes"] });

  const saveRecipe = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: RecipeInput }) =>
      id ? recipesService.update(id, body) : recipesService.create(body),
    onSuccess: (_res, vars) => {
      alert.success(vars.id ? t("recipes.recipeSaved") : t("recipes.recipeAdded"));
      invalidateRecipes();
      setRecipeFormOpen(false);
      setRecipeEditTarget(null);
    },
    onError: () => alert.error(t("recipes.recipeSaveFailed")),
  });

  const deleteRecipe = useMutation({
    mutationFn: (id: string) => recipesService.remove(id),
    onSuccess: () => { alert.success(t("recipes.recipeDeleted")); invalidateRecipes(); },
    onError: () => alert.error(t("recipes.recipeDeleteFailed")),
  });

  const onSaveRecipe = (v: RecipeSubmitValue) => {
    const product = products.find((p) => p._id === v.product_id);
    const unit = units.find((u) => u._id === v.yield_unit_id);
    saveRecipe.mutate({
      id: recipeEditTarget?._id ?? null,
      body: {
        recipe_name: v.recipe_name.trim(),
        product_id: v.product_id,
        product_name: product?.product_name_th ?? "",
        product_type: product?.product_type ?? "ready",
        components: v.components,
        ingredients: v.ingredients,
        steps: v.steps,
        yield_qty: v.yield_qty,
        yield_unit_id: v.yield_unit_id,
        yield_unit_abbr: unit?.unit_abbr ?? "",
        estimated_cost_per_batch: v.estimated_cost_per_batch,
        duration_minutes: v.duration_minutes,
        note: v.note ?? null,
      },
    });
  };

  // ── mutations: สูตรส่วนประกอบ ──
  const invalidateComponents = () => qc.invalidateQueries({ queryKey: ["components"] });

  const saveComponent = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: RecipeComponentInput }) =>
      id ? recipeComponentsService.update(id, body) : recipeComponentsService.create(body),
    onSuccess: (_res, vars) => {
      alert.success(vars.id ? t("recipes.componentSaved") : t("recipes.componentAdded"));
      invalidateComponents();
      setComponentFormOpen(false);
      setComponentEditTarget(null);
    },
    onError: () => alert.error(t("recipes.componentSaveFailed")),
  });

  const deleteComponent = useMutation({
    mutationFn: (id: string) => recipeComponentsService.remove(id),
    onSuccess: () => { alert.success(t("recipes.componentDeleted")); invalidateComponents(); },
    onError: () => alert.error(t("recipes.componentDeleteFailed")),
  });

  const onSaveComponent = (v: ComponentSubmitValue) => {
    const unit = units.find((u) => u._id === v.yield_unit_id);
    saveComponent.mutate({
      id: componentEditTarget?._id ?? null,
      body: {
        component_name: v.component_name.trim(),
        category: v.category,
        ingredients: v.ingredients,
        steps: v.steps,
        yield_qty: v.yield_qty,
        yield_unit_id: v.yield_unit_id,
        yield_unit_abbr: unit?.unit_abbr ?? "",
        estimated_cost_per_batch: v.estimated_cost_per_batch,
        note: v.note ?? null,
      },
    });
  };

  return {
    perm, activeTab, setActiveTab,
    isLoading, isError, refetch,

    productCategories, ingredientOptions, productYieldUnitOptions, allUnitOptions, componentOptions,

    // แท็บ 1: สูตรหลัก
    mainSearch, setMainSearch,
    mainCategoryFilter, setMainCategoryFilter,
    filteredRecipes, mainStats, productsWithoutRecipe, eligibleProductOptions,
    recipeFormOpen, recipeEditTarget,
    openAddRecipe: () => { setRecipeEditTarget(null); setRecipeFormOpen(true); },
    openEditRecipe: (r: Recipe) => { setRecipeEditTarget(r); setRecipeFormOpen(true); },
    closeRecipeForm: () => { setRecipeFormOpen(false); setRecipeEditTarget(null); },
    onSaveRecipe, savingRecipe: saveRecipe.isPending,
    onDeleteRecipe: (id: string) => deleteRecipe.mutate(id),

    detailRecipe, drawerOpen,
    onViewRecipe: (r: Recipe) => { setDetailRecipe(r); setDrawerOpen(true); },
    closeDrawer: () => setDrawerOpen(false),

    // แท็บ 2: สูตรส่วนประกอบ
    subSearch, setSubSearch,
    subCategoryFilter, setSubCategoryFilter: (v: RecipeCategory | "all") => setSubCategoryFilter(v),
    filteredComponents, subStats,
    componentFormOpen, componentEditTarget,
    openAddComponent: () => { setComponentEditTarget(null); setComponentFormOpen(true); },
    openEditComponent: (c: RecipeComponent) => { setComponentEditTarget(c); setComponentFormOpen(true); },
    closeComponentForm: () => { setComponentFormOpen(false); setComponentEditTarget(null); },
    onSaveComponent, savingComponent: saveComponent.isPending,
    onDeleteComponent: (id: string) => deleteComponent.mutate(id),
  };
}
