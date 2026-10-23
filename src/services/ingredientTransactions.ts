// เรียก endpoint /ingredient-transactions (docs/API_CONTRACT.md §3)
import { http, type HttpReader } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type {
  IngredientTransaction,
  IngredientTransactionInput,
  IngredientTransactionListParams,
} from "@/types/ingredientTransaction";

const BASE = "/admin/ingredient-transactions";

export const ingredientTransactionsService = {
  /** h = http client (ค่าเริ่มต้น http ปกติ) — ฝั่ง server ส่ง withConfig(cookie + no-store) เข้ามา (ingredients/ingredientHistory/page.tsx) */
  list: (params: IngredientTransactionListParams = {}, h: HttpReader = http) =>
    h.getList<IngredientTransaction>(BASE, { params }),
  create: (body: IngredientTransactionInput) =>
    http.post<ItemResponse<IngredientTransaction>>(BASE, body),
};
