import { http } from "@/lib/http";
import type { ListResponse } from "@/types/api";
import type { ProductCategory } from "@/types/productCategory";

export const productCategoriesService = {
  list: () => http.get<ListResponse<ProductCategory>>("/product-categories", { params: { limit: 100 } }),
};
