import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { Unit, UnitListParams } from "@/types/unit";

const BASE = "/admin/units";

export const unitsService = {
  list: (params: UnitListParams = {}) => http.getList<Unit>(BASE, { params }),
  get: (id: string) => http.get<ItemResponse<Unit>>(`${BASE}/${id}`),
  create: (body: Partial<Unit>) => http.post<ItemResponse<Unit>>(BASE, body),
  update: (id: string, body: Partial<Unit>) => http.patch<ItemResponse<Unit>>(`${BASE}/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
