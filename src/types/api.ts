// ─────────────────────────────────────────────────────────────
// src/types/api.ts
// รูปแบบ response / request มาตรฐานที่ตกลงกับ backend — ดู docs/API_CONTRACT.md §1
// ─────────────────────────────────────────────────────────────

/** shape ที่ ViewModel ใช้ทั้งแอป (หลัง unwrap แล้ว — ดู http.getList ใน src/lib/http.ts) */
export interface ListResponse<T> {
  data: T[];
  meta: ListMeta;
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
}

/**
 * shape ดิบจริงที่ backend ส่งสำหรับ list endpoint (collectionRoutes → okList, src/lib/crudRoutes.ts)
 * — meta ซ้อนอยู่ใน data ด้วย (ไม่ใช่ sibling), และเป็น null ได้ถ้า endpoint นั้นไม่ paginate (เช่น units)
 * http.getList() แปลงร่างนี้ให้เป็น ListResponse<T> ก่อนคืนให้ service เสมอ — ห้ามเรียก http.get ตรง ๆ
 * กับ list endpoint
 */
export interface RawListResponse<T> {
  data: { items: T[]; meta: ListMeta | null };
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

/**
 * error code ที่ backend ส่งจริงใน `error.code` — อ้างอิงตรงจากฝั่ง backend เท่านั้น (ไม่ใช่เดา):
 *   - `HttpErrorCode` (backend `src/lib/httpError.ts`): BAD_REQUEST / UNAUTHORIZED / FORBIDDEN /
 *     NOT_FOUND / CONFLICT / UNPROCESSABLE / TOO_MANY_REQUESTS — โยนจาก service ผ่าน badRequest()
 *     / unauthorized() / forbidden() / notFound() / conflict() / unprocessable() / tooMany()
 *   - `toErrorResponse()` (backend `src/lib/apiResponse.ts:55-117`, error ที่ไม่ใช่ HttpError):
 *     VALIDATION_ERROR (mongoose ValidationError) / INVALID_VALUE (mongoose CastError) /
 *     DUPLICATE_KEY (Mongo duplicate index) / INTERNAL_ERROR (unhandled)
 *   - `middleware.ts` (backend `src/middleware.ts:31-38` ฟังก์ชัน `deny()`, เกิดก่อนถึง route handler):
 *     CROSS_ORIGIN (CSRF/CORS ปฏิเสธ) / SESSION_INVALID (cookie หมดอายุ/เสีย, เคลียร์คุกกี้ด้วย) /
 *     UNAUTHORIZED / FORBIDDEN (namespace guard หยาบ ๆ ก่อนเข้า /api/admin, /api/shop)
 * ไม่รู้จัก code ใหม่ที่ backend เพิ่มทีหลังไม่เป็นไร — เก็บเป็น string เฉย ๆ (union ด้านล่างช่วย autocomplete)
 */
export type BackendErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "TOO_MANY_REQUESTS"
  | "VALIDATION_ERROR"
  | "INVALID_VALUE"
  | "DUPLICATE_KEY"
  | "INTERNAL_ERROR"
  | "CROSS_ORIGIN"
  | "SESSION_INVALID"
  | (string & {});

/**
 * shape ดิบจริงที่ backend ส่งตอน error — ตรงกับ `toErrorResponse()` / middleware `deny()`
 * (backend `src/lib/apiResponse.ts:56-67`, `src/middleware.ts:31-38`) เสมอ ไม่มีข้อยกเว้น:
 *   { success:false, error:{ code, message, details } }
 * `details` เป็น `{ issues: FieldIssue[] }` เฉพาะตอน validation ไม่ผ่าน (backend `src/lib/validate.ts`
 * `toIssues()` — แต่ละ issue คือ `{ path, message, code }`) · เคสอื่น (DUPLICATE_KEY ฯลฯ) เป็นรูปอื่นหรือ null
 */
export interface BackendErrorBody {
  success: false;
  error: {
    code: BackendErrorCode;
    message: string;
    details: { issues?: { path: string; message: string; code: string }[] } | Record<string, unknown> | null;
  };
}

/** error ที่ interceptor แปลงมาให้ (unwrap จาก BackendErrorBody.error ของ backend) — ViewModel ใช้ตัวนี้ */
export interface ApiError {
  /** HTTP status (0 = network / timeout) */
  status: number;
  /** error.code ดิบจาก backend — ใช้แยกเคส เช่น TOO_MANY_REQUESTS / SESSION_INVALID ได้โดยไม่ต้องเทียบ status */
  code?: BackendErrorCode;
  /** ข้อความพร้อมโชว์ผู้ใช้ — จาก error.message ของ backend ตรง ๆ (ภาษาไทยพร้อมใช้อยู่แล้ว) */
  message: string;
  /** error ราย field (path → message) แปลงจาก error.details.issues[] ของ backend — มีเฉพาะตอน validation ไม่ผ่าน */
  fieldErrors?: Record<string, string>;
  /** error ดิบ เผื่อ debug */
  cause?: unknown;
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "status" in e && "message" in e;
}
