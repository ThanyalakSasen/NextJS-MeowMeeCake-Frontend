import { http } from "@/lib/http";
import type { IngredientCategory } from "@/types/ingredientCategory";

export const ingredientCategoriesService = {
  list: () => http.getList<IngredientCategory>("/admin/ingredient-categories", { params: { limit: 100 } }),
};
