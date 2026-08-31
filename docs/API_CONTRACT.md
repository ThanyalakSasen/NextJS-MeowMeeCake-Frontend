# API Contract — Frontend ↔ Backend

> **เอกสารนี้คืออะไร:** "สัญญา" ว่า backend จะส่งข้อมูลหน้าตาแบบไหนกลับมา และ frontend จะเรียกยังไง
> **เปิดอ่านเมื่อ:** ก่อนเขียน `src/services/*` ใหม่ · ก่อนเขียน mock handler · ก่อนสร้าง DTO ใน `src/types/`
> **ทำไมสำคัญ:** frontend, backend, และ MSW (backend ปลอม) ทั้ง 3 ฝ่ายเขียนตามไฟล์นี้ไฟล์เดียว — ถ้าเอกสารตรง งานก็ต่อกันได้โดยไม่ต้องคุย
> **สถานะ: DRAFT** — อิงพฤติกรรมของระบบเดิม (`-MeowMeeCake-NextJS5`) · ปรับได้เมื่อ backend team ยืนยัน
> ทุก path ข้างล่างต่อท้าย `NEXT_PUBLIC_API_BASE_URL` (เช่น `https://api.meowmeecake.local` + `/products`)

---

## 0. ตัวอย่างเต็ม 1 รอบ (อ่านอันนี้ก่อน)

**frontend อยากได้รายการสินค้าหน้า 1:**

```http
GET https://api.meowmeecake.local/products?page=1&limit=2&sort=-created_at
Cookie: <auth cookie ที่ backend ตั้งไว้ตอน login>
Accept-Language: th
```

**backend ตอบ (200):**
```jsonc
{
  "data": [
    { "_id": "665f0a...", "product_name_th": "เค้กช็อกโกแลต", "product_price": 450,
      "product_type": "ready", "product_stock_quantity": 12, "is_visible": true,
      "created_at": "2026-08-30T10:00:00.000Z", "updated_at": "2026-08-30T10:00:00.000Z" },
    { "_id": "665f0b...", "product_name_th": "คัพเค้กวานิลลา", "product_price": 60,
      "product_type": "ready", "product_stock_quantity": 40, "is_visible": true,
      "created_at": "2026-08-29T09:00:00.000Z", "updated_at": "2026-08-29T09:00:00.000Z" }
  ],
  "meta": { "page": 1, "limit": 2, "total": 118 }
}
```

**ถ้า cookie หมดอายุ (401):**
```jsonc
{ "message": "unauthorized" }
```
→ `src/lib/http.ts` interceptor เห็น 401 → เรียก `POST /auth/refresh` 1 ครั้ง → สำเร็จก็ยิง `GET /products` ซ้ำ / ล้มเหลวก็เด้ง `/login`

**สังเกต 3 อย่าง:**
1. ข้อมูลถูกห่อใน `{ "data": ..., "meta": ... }` เสมอ — เรียกว่า **envelope**
2. รูปสินค้า (`product_img`) **ไม่มา** ในลิสต์ (ข้อมูลใหญ่ — ขอเพิ่มด้วย `?include=product_img`)
3. error ทุกแบบมี `{ "message": ... }` — frontend เอาไปโชว์ผู้ใช้ได้เลย

---

## 1. รูปแบบทั่วไป

### Envelope
| กรณี | body |
|---|---|
| list (GET collection) | `{ "data": T[], "meta": { "page": number, "limit": number, "total": number } }` |
| item (GET/POST/PATCH one) | `{ "data": T }` |
| delete | `{ "data": null }` |
| error | `{ "message": string }` (+ optional `{ "errors": { field: string }[] }` สำหรับ 422) |

### Query params (list endpoints)
| param | ค่า | ความหมาย |
|---|---|---|
| `page` | int ≥ 1 (default 1) | หน้า |
| `limit` | int 1–100 (default 50) | ต่อหน้า |
| `search` | string | ค้นหา (backend กำหนดว่า field ไหน) |
| `include` | csv | ขอ field ที่ปกติถูกตัด (เช่น `product_img`) |
| `sort` | e.g. `-created_at` | เรียง (`-` = จากมากไปน้อย) |
| `<field>` | value | filter ตรงตัว (เช่น `?order_status=pending`) |

### ข้อกำหนด
- soft delete: backend กรอง `deleted_at != null` ออกให้เสมอ · DELETE = soft (set `deleted_at`)
- timestamp: ISO 8601 string (`created_at`, `updated_at`)
- id: `_id` (string, Mongo ObjectId)
- `product_img` / รูป base64: **ตัดออกจาก list** เป็น default · ขอทีละชิ้นด้วย `?include=product_img` หรือจาก GET item

### HTTP status
`200` ok · `201` created · `400` bad request · `401` ไม่มี/หมด session · `403` ไม่มีสิทธิ์ · `404` ไม่พบ · `409` ซ้ำ (unique) · `422` validation · `429` rate limit · `5xx` server

---

## 2. Auth

| method | path | body | response |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ data: { id, email, fullname, roleId } }` + set auth cookie (D15) |
| POST | `/auth/logout` | — | `{ data: null }` + clear cookie |
| GET | `/auth/me` | — | `{ data: { id, email, fullname, roleId, roleName, menuAccess } }` · `401` ถ้าไม่ login |
| POST | `/auth/refresh` | — | `{ data: { ... } }` + set cookie ใหม่ · `401` ถ้า refresh หมดอายุ (absolute cap) |

`menuAccess`: `Record<MenuKey, { view, create, update, delete, approve }>` — owner/admin = true หมด
`MenuKey` = `dashboard | products | orders | payments | ingredients | stock | recipes | production | employees | promotions | reports`

**Auth errors** (`/auth/login`): 400 = กรอกไม่ครบ · 401 = อีเมล/รหัสผิด (ข้อความรวม กัน enumeration) · 403 = บัญชีถูกปิด / เป็น role customer · 429 = ล็อก (`{ message }` มีนาทีที่ต้องรอ)

---

## 3. Resource endpoints (CRUD มาตรฐาน)

ทุกตัวมี: `GET /<res>` (list) · `GET /<res>/:id` · `POST /<res>` · `PATCH /<res>/:id` · `DELETE /<res>/:id`
เว้นแต่ระบุเพิ่มในคอลัมน์ "พิเศษ"

| resource path | ใช้ที่ screen | พิเศษ |
|---|---|---|
| `/products` | Products, POS, Dashboard, Production, Recipes | `?include=product_img` |
| `/product-categories` | Products (filter/chip) | |
| `/product-variants` `/product-options` | Add/Edit Product | |
| `/orders` | Manage Orders, Dashboard | `?order_status=` `?order_type=` `?date_from=&date_to=` |
| `/order-items` | Manage Orders (drawer) | |
| `/payments` | Manage Orders (slip) | `PATCH /payments/:id` → verify/reject |
| `/preorders` `/preorder-items` `/preorder-rounds` `/preorder-round-items` | Orders (preorder tab) | |
| `/carts` `/cart-items` | POS | POS สร้าง order ผ่าน `POST /orders` |
| `/ingredients` | Ingredients List, Stock, Recipes | `?ingredient_category_id=` |
| `/ingredient-categories` | Ingredients (filter) | |
| `/ingredient-transactions` | Ingredient History, Stock | `?ingredient_id=` `?type=` `?date_from=&date_to=` · POST = บันทึก receive/use/adjust |
| `/units` | Manage Units, forms | `?usage_context=Ingredient|Product` |
| `/recipes` | Recipes (main) | |
| `/components` | Recipes (sub-recipe) | |
| `/component-categories` | Recipes | |
| `/production-orders` | Production (ทุก tab) | `PATCH` → เปลี่ยน status (kanban) |
| `/production-items` | Production | |
| `/users` | Employees, Add/Edit Employee | `?role_id=` `?emp_status=` |
| `/roles` | Permissions, Add/Edit Employee | |
| `/permissions` | Permissions Mgmt | `?role_id=` · bulk `PATCH /permissions` (clone/toggle-all) |
| `/user-logs` | User Activity Log | `?user_id=` `?date_from=&date_to=` (read-only — ไม่มี POST/PATCH/DELETE) |
| `/attendances` | Attendance | `POST /attendances/check-in` · `POST /attendances/check-out` · `GET /attendances/today` |
| `/promotions` `/promotion-usages` | (นอก 27 screen — เฟสหลัง) | |
| `/bundles` | (นอก 27 screen) | |
| `/banners` | Store Design | `?date_from=&date_to=` (ช่วงแสดงผล) |
| `/expenses` | Finance — Expenses | `?month=YYYY-MM` `?category=` `?is_recurring=` |
| `/notifications` | Navbar dropdown, Notification History | `?limit=5` (dropdown) · `?is_read=` `?module=` `?type=` · `PATCH /notifications/:id` → mark read |
| `/reviews` `/aspects` `/semantic-terms` `/sentiment-results` | (Reviews report — นอก 27 screen) | |

---

## 4. Report / aggregate endpoints (อ่านอย่างเดียว)

| path | ใช้ที่ | response (คร่าว) |
|---|---|---|
| `GET /reports/sales?period=&date_from=&date_to=` | (Sales report — นอก 27) | daily/product stats |
| `GET /reports/order-in-store?date=` | POS (สรุปวันนี้) | `{ data: { count, total, byMethod } }` |
| `GET /reports/dashboard` | Dashboard | `{ data: { revenueToday, orders, lowStock[], topProducts[], productionStatus[] } }` *(หรือ Dashboard ประกอบจากหลาย endpoint — backend เลือก)* |
| `GET /reports/finance-summary?period=&date_from=&date_to=` | Finance P&L | `{ data: { pl, kpi, monthly[], topProducts[] } }` |
| `GET /reports/production-history?months=6` | Production History | `{ data: { monthly[], teamPerformance[], topProduced[] } }` |

> Dashboard / Finance / Production-History เป็น aggregate — ถ้า backend ยังไม่มี ให้ frontend ประกอบจาก endpoint พื้นฐานชั่วคราว (mark ใน `MOCKS.md`)

---

## 5. สิ่งที่ frontend **ไม่** ทำ (เป็นหน้าที่ backend)

- ตรวจรหัสผ่าน (bcrypt) · ออก/เซ็น/หมุน JWT · อายุ token · brute-force lockout
- permission enforcement (`can_view/create/...`) — frontend แค่ซ่อน UI ตาม `menuAccess`
- soft-delete filter, unique check, audit log (`user-logs` เขียนโดย backend เอง)
- คำนวณราคาโปรโมชันสุดท้าย (frontend preview ได้ แต่ backend เป็น source of truth ตอน `POST /orders`)
- Omise / payment gateway · ส่งอีเมล

---

## 6. frontend ใช้ contract นี้ยังไง (โค้ดจริง)

**ชั้นที่ 1 — `src/lib/http.ts`** (เขียนครั้งเดียว ใช้ทั้งแอป): axios + interceptor แกะ envelope + จัดการ error

```ts
// src/lib/http.ts  (ย่อ)
import axios from "axios";

const raw = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,               // ส่ง auth cookie ไปด้วย (ดู D15)
});

// แนบภาษาปัจจุบันทุก request
raw.interceptors.request.use((cfg) => {
  cfg.headers["Accept-Language"] = getLocaleFromCookie();   // "th" | "en"
  return cfg;
});

// แกะ { data, meta } + จัดการ error รวมศูนย์
raw.interceptors.response.use(
  (res) => res.data,                    // <-- ต่อจากนี้ service ได้ { data, meta } ตรง ๆ
  async (err) => {
    if (err.response?.status === 401) return tryRefreshThenRetry(err);
    if (err.response?.status === 403) alert.error(t("errors.forbidden"));
    throw err;                          // ให้ ViewModel จัดการต่อ (เช่น โชว์ message ในฟอร์ม)
  },
);

export const http = raw;
```

**ชั้นที่ 2 — `src/services/<resource>.ts`** (1 ไฟล์ต่อ resource): map endpoint ในตาราง §3 เป็นฟังก์ชัน

```ts
// src/services/products.ts
import { http } from "@/lib/http";
import type { Product, ListResponse } from "@/types/product";

export const productsService = {
  list:   (params: ProductListParams) => http.get<ListResponse<Product>>("/products", { params }),
  get:    (id: string)                => http.get<{ data: Product }>(`/products/${id}`),
  create: (body: ProductInput)        => http.post<{ data: Product }>("/products", body),
  update: (id: string, body: Partial<ProductInput>) => http.patch(`/products/${id}`, body),
  remove: (id: string)                => http.delete(`/products/${id}`),
};
```

**ชั้นที่ 3 — DTO ใน `src/types/`**: หน้าตา `T` ในตาราง §3 (ดูฟิลด์จริงใน `INVENTORY.md`)

```ts
// src/types/product.ts
export interface Product {
  _id: string;
  product_name_th: string;
  product_price: number;
  product_type: "ready" | "preorder";       // ← ค่า enum ดูใน INVENTORY.md / i18n enums
  product_stock_quantity: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}
export interface ListResponse<T> { data: T[]; meta: { page: number; limit: number; total: number } }
```

**ชั้นที่ 4 — ViewModel เรียกผ่าน React Query**:

```ts
// app/owner/products/useProductsViewModel.ts  (ย่อ)
const { data, isLoading } = useQuery({
  queryKey: ["products", filters],
  queryFn: () => productsService.list(filters),   // → { data: Product[], meta }
});
```

> **ทำ ✅** เพิ่ม endpoint ใหม่ = แก้ 3 ที่: ตาราง §3 (contract) → `src/types/` (DTO) → `src/services/` (ฟังก์ชัน)
> **อย่า ❌** เรียก `http`/`axios` ตรงจาก component หรือ ViewModel — เรียกผ่าน `service` เสมอ (เพื่อให้ mock/เปลี่ยน backend ได้ที่เดียว)
