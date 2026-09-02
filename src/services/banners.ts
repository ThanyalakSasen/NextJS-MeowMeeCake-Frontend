// เรียก endpoint /banners (docs/API_CONTRACT.md §3) — แพทเทิร์นเดียวกับ services/products.ts
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse, EmptyResponse } from "@/types/api";
import type { Banner, BannerInput, BannerListParams } from "@/types/banner";

const BASE = "/banners";

export const bannersService = {
  list: (params: BannerListParams = {}) => http.get<ListResponse<Banner>>(BASE, { params }),
  get: (id: string) => http.get<ItemResponse<Banner>>(`${BASE}/${id}`),
  create: (body: BannerInput) => http.post<ItemResponse<Banner>>(BASE, body),
  update: (id: string, body: Partial<BannerInput>) => http.patch<ItemResponse<Banner>>(`${BASE}/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),
};
