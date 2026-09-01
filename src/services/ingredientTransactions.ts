// เรียก endpoint /ingredient-transactions (docs/API_CONTRACT.md §3)
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse } from "@/types/api";
import type {
  IngredientTransaction,
  IngredientTransactionInput,
  IngredientTransactionListParams,
} from "@/types/ingredientTransaction";

const BASE = "/ingredient-transactions";

export const ingredientTransactionsService = {
  list: (params: IngredientTransactionListParams = {}) =>
    http.get<ListResponse<IngredientTransaction>>(BASE, { params }),
  create: (body: IngredientTransactionInput) =>
    http.post<ItemResponse<IngredientTransaction>>(BASE, body),
};
