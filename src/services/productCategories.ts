import { http } from "@/lib/http";
import type { ProductCategory } from "@/types/productCategory";

export const productCategoriesService = {
  list: () => http.getList<ProductCategory>("/admin/product-categories", { params: { limit: 100 } }),
};
