// เรียก endpoint /ingredient-transactions (docs/API_CONTRACT.md §3)
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type {
  IngredientTransaction,
  IngredientTransactionInput,
  IngredientTransactionListParams,
} from "@/types/ingredientTransaction";

const BASE = "/admin/ingredient-transactions";

export const ingredientTransactionsService = {
  list: (params: IngredientTransactionListParams = {}) =>
    http.getList<IngredientTransaction>(BASE, { params }),
  create: (body: IngredientTransactionInput) =>
    http.post<ItemResponse<IngredientTransaction>>(BASE, body),
};
