// ─────────────────────────────────────────────────────────────
// src/types/api.ts
// รูปแบบ response / request มาตรฐานที่ตกลงกับ backend — ดู docs/API_CONTRACT.md §1
// ─────────────────────────────────────────────────────────────

/** GET collection → { data: T[], meta } */
export interface ListResponse<T> {
  data: T[];
  meta: ListMeta;
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
}

/** GET/POST/PATCH one → { data: T } */
export interface ItemResponse<T> {
  data: T;
}

/** DELETE → { data: null } */
export interface EmptyResponse {
  data: null;
}

/** query params ที่ทุก list endpoint รองรับ (ต่อ resource เพิ่ม filter เฉพาะได้) */
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string; // เช่น "-created_at"
  include?: string; // csv — ขอ field ที่ปกติถูกตัด
  [key: string]: string | number | boolean | undefined; // filter ตรงตัว
}

/** error ที่ interceptor แปลงมาให้ (จาก { message } ของ backend) — ViewModel ใช้ตัวนี้ */
export interface ApiError {
  /** HTTP status (0 = network / timeout) */
  status: number;
  /** ข้อความพร้อมโชว์ผู้ใช้ */
  message: string;
  /** error ราย field สำหรับ 422 */
  fieldErrors?: Record<string, string>;
  /** error ดิบ เผื่อ debug */
  cause?: unknown;
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "status" in e && "message" in e;
}
