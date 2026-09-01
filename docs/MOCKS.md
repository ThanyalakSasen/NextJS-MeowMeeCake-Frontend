# Mock API (MSW) — ใช้ระหว่าง backend ยังไม่พร้อม

> **เอกสารนี้คืออะไร:** วิธีที่ frontend "แกล้ง" มี backend ด้วย MSW (Mock Service Worker) — ตอบข้อมูลตัวอย่างตาม `API_CONTRACT.md`
> **เปิดอ่านเมื่อ:** dev โดยยังไม่มี backend · จะเพิ่ม endpoint ให้ mock ตอบ · จะสลับไปต่อ backend จริง
> **ทำไมสำคัญ:** ทำให้ทีม frontend ทำงาน 27 หน้าได้เลยโดยไม่ต้องรอ backend · โค้ดจริง (`services/`, `http.ts`, หน้า) **ไม่รู้ตัว**ว่าคุยกับของปลอม → พอ backend มา ลบ `src/mocks/` ทิ้งได้สะอาด
> toggle: `NEXT_PUBLIC_API_MOCK=1` (dev default) → ใช้ MSW · `=0` + ตั้ง `NEXT_PUBLIC_API_BASE_URL` → ยิง backend จริง

---

## 0. MSW ทำงานยังไง

MSW ลงทะเบียน **service worker** ในเบราว์เซอร์ที่ดัก request ทุกอันก่อนออกเน็ต — ถ้า URL ตรงกับ handler ที่เราเขียน มันตอบแทนเลย ไม่ออกเน็ตจริง

```
ViewModel → productsService.list() → http.get("/products") → axios ส่ง request
                                                                   │
                                          ┌────────────────────────┤
                                MSW ดักไว้ (ถ้า API_MOCK=1)      ปล่อยผ่าน (ถ้า API_MOCK=0)
                                          │                        │
                          handlers/products.ts อ่าน mocks/db.ts   backend จริง
                          → ตอบ { data:[...], meta:{...} }
                                          │                        │
                                          └────────────────────────┤
                                    http.ts interceptor แกะ envelope → ViewModel ได้ข้อมูล (เหมือนกันทั้ง 2 ทาง)
```

**คุณสมบัติ:**
- handler = "backend ปลอม" ตอบตาม `API_CONTRACT.md` เป๊ะ (envelope `{data,meta}`, status code, query param)
- `db.ts` = array ในหน่วยความจำต่อ resource · POST/PATCH/DELETE แก้ array นั้นจริง → **ข้อมูลเปลี่ยนตามที่กดในแอป**
- **persist ลง `localStorage` (`mmc_mock_db`)** → ข้อมูลที่กด **อยู่ข้ามรีเฟรชหน้า** (เดินงาน POS/ออเดอร์ต่อเนื่องได้จริง)
  - กลับไป fixture เริ่มต้น: console → `__resetMockDb()` แล้วรีเฟรช
  - แก้ fixture แล้วอยากให้มีผล: bump `SEED_VERSION` ใน `src/mocks/db.ts` (เวอร์ชันไม่ตรง = ล้าง store ที่ persist ไว้อัตโนมัติ)
- ไม่มีคอมเมนต์ `// MOCK:` กระจายในโค้ด — mock อยู่รวมใน `src/mocks/` ที่เดียว

---

## 1. ตัวอย่าง handler (โค้ดจริง)

```ts
// src/mocks/db.ts  (ย่อ) — store กลาง
import { productsFixture } from "./fixtures/products";
export const db = {
  products: [...productsFixture],   // clone ไว้ ให้แก้ได้โดยไม่แตะ fixture
  // ... resource อื่น
};

// helper ใช้ซ้ำทุก handler
export function paginate<T>(rows: T[], url: URL) {
  const page  = Number(url.searchParams.get("page")  ?? 1);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const start = (page - 1) * limit;
  return { data: rows.slice(start, start + limit), meta: { page, limit, total: rows.length } };
}
```

```ts
// src/mocks/handlers/products.ts
import { http, HttpResponse } from "msw";
import { db, paginate } from "../db";

const base = process.env.NEXT_PUBLIC_API_BASE_URL;

export const productHandlers = [
  // GET /products?page=&limit=&search=
  http.get(`${base}/products`, ({ request }) => {
    const url = new URL(request.url);
    let rows = db.products.filter((p) => !p.deleted_at);
    const q = url.searchParams.get("search");
    if (q) rows = rows.filter((p) => p.product_name_th.includes(q));
    return HttpResponse.json(paginate(rows, url));         // { data, meta }
  }),

  // GET /products/:id
  http.get(`${base}/products/:id`, ({ params }) => {
    const found = db.products.find((p) => p._id === params.id && !p.deleted_at);
    return found
      ? HttpResponse.json({ data: found })
      : HttpResponse.json({ message: "not found" }, { status: 404 });
  }),

  // POST /products
  http.post(`${base}/products`, async ({ request }) => {
    const body = await request.json();
    const doc = { _id: crypto.randomUUID(), ...body, created_at: new Date().toISOString() };
    db.products.unshift(doc);
    return HttpResponse.json({ data: doc }, { status: 201 });
  }),
];
```

```ts
// src/mocks/handlers/index.ts
import { productHandlers } from "./products";
import { authHandlers } from "./auth";
export const handlers = [...authHandlers, ...productHandlers /* , ... */];
```

```ts
// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
export const worker = setupWorker(...handlers);

// เรียกใน src/app/providers.tsx:
//   if (process.env.NEXT_PUBLIC_API_MOCK === "1") await worker.start({ onUnhandledRequest: "bypass" });
```

> **ทำ ✅** handler ใหม่ = เขียนให้ตรง `API_CONTRACT.md` §3 (path, envelope, status) — ห้ามคิด shape เอง
> **อย่า ❌** ใส่ logic ธุรกิจซับซ้อนใน handler (mock ให้ "พอเดินหน้าได้" ไม่ใช่ backend จริง)

---

## Credential dev (โหมด mock)

```
email:    owner@meowmeecake.local
password: owner1234
```
→ login สำเร็จ MSW ตั้ง cookie `mmc_session` ผ่าน `document.cookie` (ให้ `proxy.ts` ฝั่ง Node อ่านเจอ) · `role = owner` → เห็นทุกเมนู

---

## โครง `src/mocks/`

| ไฟล์ | หน้าที่ | สถานะ |
|---|---|---|
| `db.ts` | store กลาง (in-memory + persist `localStorage`) + `seed`(idempotent) / `list`(paginate/filter/search/sort) / `getById` / `create` / `update` / `softDelete` / `resetMockDb` (+ `window.__resetMockDb`) | ✅ เฟส 2.5 · persist เฟส 4 |
| `browser.ts` | `setupWorker(...handlers)` + `startMockWorker()` (single-flight) | ✅ เฟส 2.5 |
| `server.ts` | `setupServer(...handlers)` — สำหรับ test (ยังไม่ถูกใช้) | ✅ เฟส 2.5 |
| `handlers/index.ts` | รวม handler + `seed()` fixtures | ✅ เฟส 2.5 |
| `handlers/_crud.ts` | **factory** `crudHandlers(name, basePath)` — GET list/id · POST · PATCH · DELETE ตาม `API_CONTRACT.md` §3 | ✅ เฟส 2.5 |
| `handlers/auth.ts` | `/auth/login\|logout\|me\|refresh` — login = credential dev, ตั้ง/ล้าง cookie ผ่าน `document.cookie`, `me` คืน owner + menuAccess เต็ม | ✅ เฟส 2.5 |
| `fixtures/auth.ts` | `DEV_CREDENTIALS`, `MOCK_USER`, `MOCK_MENU_ACCESS` (owner = full) | ✅ เฟส 2.5 |
| `fixtures/products.ts` | สินค้า 5 รายการ (reference) | ✅ เฟส 2.5 |
| `fixtures/<resource>.ts` | resource อื่น — เพิ่มพร้อม screen | ⏳ เฟส 4 |
| `handlers/reports.ts` | aggregate endpoints (dashboard, finance-summary, ...) — §4 | ⏳ เฟส 4 |

**init:** `src/components/providers/MSWReady.tsx` — เมื่อ `NEXT_PUBLIC_API_MOCK==="1"` → `import("@/mocks/browser")` + `startMockWorker()` แล้วค่อย render children · mock ปิด → `msw` ไม่เข้า bundle · `public/mockServiceWorker.js` = generated (`npx msw init public/`)

---

## รายการ handler

| resource | endpoints | fixtures | ใช้กับ screen | สถานะ |
|---|---|---|---|---|
| `auth` | `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` · `POST /auth/refresh` | owner 1 | ทุกหน้า | ✅ |
| `products` · `product-categories` | `crudHandlers` | 5 · 4 | Products, POS, Product Stock, Dashboard | ✅ |
| `orders` | `crudHandlers` (DTO เดียว รวม ready+preorder) | 9 | Manage Orders, POS, Dashboard | ✅ |
| `ingredients` · `ingredient-categories` · `ingredient-transactions` | `crudHandlers` | 10 · 5 · 10 | Ingredients List, Stock, History | ✅ |
| `units` | `crudHandlers` | 8 | Manage Units, Ingredients/Product forms | ✅ |
| `users` · `roles` | `crudHandlers` | 8 · 5 | Employees List (+ Add/Edit/Permissions/UserLog เฟสถัดไป) | ✅ |
| `notifications` | `crudHandlers` | — | Navbar, Notification History | ✅ |
| `GET /reports/dashboard` | `handlers/reports.ts` (ไม่ใช่ crud) | fixture เดียว | Dashboard | ✅ |
| resource อื่นที่เหลือ | `crudHandlers("<name>", ...)` + fixture | — | ตาม screen | ⏳ เฟส 4 |

**เพิ่ม resource ใหม่ (เฟส 4):** `src/mocks/handlers/index.ts` → `seed("orders", ordersFixture)` + `...crudHandlers("orders", `${API}/orders`)` (2 บรรทัด)

---

## จุดที่ frontend "ประกอบเอง" ชั่วคราว (ถ้า backend ยังไม่มี aggregate)

| endpoint | ถ้าไม่มีจริง | ต้องแก้ตอน backend พร้อม |
|---|---|---|
| `GET /reports/dashboard` | ประกอบจาก `/orders?limit=5`, `/ingredients?...`, `/production-orders?...` ใน ViewModel | เปลี่ยน `useDashboardViewModel` ไปเรียก endpoint เดียว |
| `GET /reports/finance-summary` | ประกอบจาก `/expenses` + `/orders` | เช่นเดียวกัน |
| `GET /reports/production-history` | ประกอบจาก `/production-orders?date_from=...` | เช่นเดียวกัน |

---

## Checklist ตอน backend พร้อม

- [ ] ตั้ง `NEXT_PUBLIC_API_BASE_URL` = URL backend จริง · `NEXT_PUBLIC_API_MOCK=0`
- [ ] เทียบ response จริงกับ `API_CONTRACT.md` — แก้ `src/types/*` + `src/services/*` ถ้าต่าง
- [ ] ตรวจ CORS + cookie (D15): `Access-Control-Allow-Credentials`, `SameSite`, `Secure`
- [ ] ลบโฟลเดอร์ `src/mocks/` + ถอน `msw` ออกจาก devDependencies + ลบ init ใน `providers.tsx`
- [ ] `grep -rn "API_MOCK\|src/mocks" src/` → ต้องไม่เหลือ
- [ ] เดินครบ 27 screen ด้วย backend จริง + สลับ locale th/en
- [ ] auth flow จริง: login → me → refresh (401) → logout (cross-tab)
