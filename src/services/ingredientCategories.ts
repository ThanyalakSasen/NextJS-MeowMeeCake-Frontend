import { http } from "@/lib/http";
import type { ListResponse } from "@/types/api";
import type { IngredientCategory } from "@/types/ingredientCategory";

export const ingredientCategoriesService = {
  list: () => http.get<ListResponse<IngredientCategory>>("/ingredient-categories", { params: { limit: 100 } }),
};
