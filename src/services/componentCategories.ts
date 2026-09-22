import { http } from "@/lib/http";
import type { ComponentCategory } from "@/types/componentCategory";

export const componentCategoriesService = {
  list: () => http.getList<ComponentCategory>("/admin/component-categories", { params: { limit: 100 } }),
};
