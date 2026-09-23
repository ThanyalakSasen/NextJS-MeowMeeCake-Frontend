// เรียก endpoint /banners (docs/API_CONTRACT.md §3) — แพทเทิร์นเดียวกับ services/products.ts
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type { Banner, BannerInput, BannerListParams } from "@/types/banner";

const BASE = "/admin/banners";

export const bannersService = {
  list: (params: BannerListParams = {}) => http.getList<Banner>(BASE, { params }),
  get: (id: string) => http.get<ItemResponse<Banner>>(`${BASE}/${id}`),
  create: (body: BannerInput) => http.post<ItemResponse<Banner>>(BASE, body),
  update: (id: string, body: Partial<BannerInput>) => http.patch<ItemResponse<Banner>>(`${BASE}/${id}`, body),
  remove: (id: string) => http.delete<EmptyResponse>(`${BASE}/${id}`),

  /**
   * POST /admin/banners/images — อัปโหลดไฟล์รูปจริง (multipart) คืน URL จริง ที่ต้องเอาไปใส่ field
   * banner_img ตอน create/update (ห้ามส่ง base64 ตรง ๆ เหมือนเดิม — backend ไม่รับ base64 อีกแล้ว
   * ตั้งแต่แก้ docs/BACKLOG.md §5/§8 — แพทเทิร์นเดียวกับ productsService.uploadImages แต่แบนเนอร์มี
   * รูปเดียว ไม่ใช่ array)
   */
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await http.post<ItemResponse<{ url: string }>>(`${BASE}/images`, form);
    return res.data.url;
  },
};
