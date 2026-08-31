import { http } from "@/lib/http";
import type { ListResponse, ItemResponse, EmptyResponse } from "@/types/api";
import type { Unit, UnitListParams } from "@/types/unit";

export const unitsService = {
  list: (params: UnitListParams = {}) => http.get<ListResponse<Unit>>("/units", { params }),
  get: (id: string) => http.get<ItemResponse<Unit>>(`/units/${id}`),
  create: (body: Partial<Unit>) => http.post<ItemResponse<Unit>>("/units", body),
  update: (id: string, body: Partial<Unit>) => http.patch<ItemResponse<Unit>>(`/units/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`/units/${id}`),
};
