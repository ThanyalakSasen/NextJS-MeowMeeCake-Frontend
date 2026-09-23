# Mock API (MSW) — ใช้ระหว่าง backend ยังไม่พร้อม

> **เอกสารนี้คืออะไร:** วิธีที่ frontend "แกล้ง" มี backend ด้วย MSW (Mock Service Worker) — ตอบข้อมูลตัวอย่างตาม `API_CONTRACT.md`
> **เปิดอ่านเมื่อ:** dev โดยยังไม่มี backend · จะเพิ่ม endpoint ให้ mock ตอบ · จะสลับไปต่อ backend จริง
> **ทำไมสำคัญ:** ทำให้ทีม frontend ทำงาน 27 หน้าได้เลยโดยไม่ต้องรอ backend · โค้ดจริง (`services/`, `http.ts`, หน้า) **ไม่รู้ตัว**ว่าคุยกับของปลอม → พอ backend มา ลบ `src/mocks/` ทิ้งได้สะอาด
> toggle: `NEXT_PUBLIC_API_MOCK=1` → ใช้ MSW · `=0` + ตั้ง `NEXT_PUBLIC_API_BASE_URL` → ยิง backend จริง

> ⚠️ **สถานะ (2026-09-23): ต่อ backend จริงแล้ว — mock ล้าหลังและใช้งานจริงไม่ได้**
> - `.env.local` ตั้ง `NEXT_PUBLIC_API_MOCK=0` + `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api` · ตรวจ login / `me` / CORS + cookie ผ่านแล้ว
> - `src/services/*` ย้ายไปใช้ path `/admin/...` แล้ว (commit `cf647c6` "align the data layer … with the real backend") แต่ handler ใน `src/mocks/` ยังดัก path เดิม (`/products`, `/orders`, `/reports/dashboard` …) → ถ้าเปิด `API_MOCK=1` **ตรงกันแค่ `/auth/*`** นอกนั้นหลุดเป็น "unhandled" (MSW เตือนใน console แล้วปล่อยผ่านไป backend) — ดูตาราง [path ของ mock vs service](#path-ของ-mock-vs-service-จริง)
> - แผน: ถอด mock ตาม [Checklist](#checklist-ถอด-mock-ออก)

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

## 1. ตัวอย่าง handler (แนวคิด)

> โค้ดชุดนี้เป็น **ตัวอย่างอธิบายหลักการ** จากตอนออกแบบ — ไม่มีไฟล์ `handlers/products.ts` จริง · ของจริงใช้ factory `crudHandlers()` ใน `handlers/_crud.ts` + store ใน `db.ts` (`seed`/`list`/`getById`/`create`/`update`/`softDelete`) · `worker.start()` จริงอยู่ใน `browser.ts` (`onUnhandledRequest` = เตือนแล้วปล่อยผ่าน ไม่ใช่ `"bypass"`) ถูกเรียกจาก `MSWReady.tsx`

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
email:    thanyalak.sas@kkumail.com
password: 123456789
```
(ค่าจาก `DEV_CREDENTIALS` ใน `src/mocks/fixtures/auth.ts` — **ไม่ใช่** บัญชีใน backend จริง; backend จริงใช้ owner ที่สร้างจาก `npm run seed` ฝั่ง backend)
→ login สำเร็จ MSW ตั้ง cookie `mmc_session` (`MOCK_AUTH_COOKIE`) ผ่าน `document.cookie` (ให้ `proxy.ts` ฝั่ง Node อ่านเจอ) · `role = owner` → เห็นทุกเมนู
> ⚠️ backend จริงใช้ cookie ชื่อ `session` และ `.env.local` ตั้ง `NEXT_PUBLIC_AUTH_COOKIE=session` → ถ้าจะเปิด mock ต้องเปลี่ยนเป็น `mmc_session` ด้วย ไม่งั้น `proxy.ts` มองไม่เห็น cookie

---

## โครง `src/mocks/`

ไฟล์ทั้งหมด 28 ไฟล์ (ตรวจกับ working tree 2026-09-23)

### แกนกลาง

| ไฟล์ | หน้าที่ |
|---|---|
| `src/mocks/db.ts` | store กลาง (in-memory + persist `localStorage` key `mmc_mock_db`) · `seed` (idempotent + `SEED_VERSION`) / `list` (paginate/filter/search/sort) / `getById` / `create` / `update` / `softDelete` / `resetMockDb` (+ `window.__resetMockDb`) |
| `src/mocks/browser.ts` | `setupWorker(...handlers)` + `startMockWorker()` (single-flight) · `onUnhandledRequest` = `print.warning()` แล้วปล่อยผ่าน (ยกเว้น `/_next`) |
| `src/mocks/server.ts` | `setupServer(...handlers)` — สำหรับ test (ยังไม่มีเทสเรียกใช้) |

### handlers (`src/mocks/handlers/`)

| ไฟล์ | หน้าที่ |
|---|---|
| `index.ts` | `seed()` fixture 18 resource + รวม handler ทั้งหมดเป็น `handlers` |
| `_crud.ts` | factory `crudHandlers(name, basePath)` — GET list / GET `:id` / POST / PATCH / DELETE (+ 404) ตาม `API_CONTRACT.md` §3 |
| `auth.ts` | `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` · `POST /auth/refresh` |
| `reports.ts` | `GET /reports/dashboard` → `fixtures/dashboard.ts` |
| `attendances.ts` | `GET /attendances/today` · `POST /attendances/check-in` · `POST /attendances/check-out` · `GET /attendances` |

### fixtures (`src/mocks/fixtures/`)

จำนวน = นับจาก `_id:` ในไฟล์ (โดยประมาณ — บางไฟล์มี `_id` ซ้อนใน object ลูก)

| ไฟล์ | export | seed เป็น resource | ~จำนวน `_id` |
|---|---|---|---|
| `auth.ts` | `DEV_CREDENTIALS`, `MOCK_USER`, `MOCK_MENU_ACCESS`, `MOCK_AUTH_COOKIE` | — (ใช้ใน `handlers/auth.ts`) | — |
| `dashboard.ts` | `dashboardFixture` | — (ใช้ใน `handlers/reports.ts`) | 15 |
| `attendances.ts` | `attendancesFixture` | `attendances` | 1 |
| `banners.ts` | `bannersFixture` | `banners` | 5 |
| `expenses.ts` | `expensesFixture` | `expenses` | 13 |
| `ingredientCategories.ts` | `ingredientCategoriesFixture` | `ingredient-categories` | 5 |
| `ingredients.ts` | `ingredientsFixture` | `ingredients` | 10 |
| `ingredientTransactions.ts` | `ingredientTransactionsFixture` | `ingredient-transactions` | 10 |
| `notifications.ts` | `notificationsFixture` | `notifications` | 13 |
| `orders.ts` | `ordersFixture` | `orders` | 6 |
| `permissions.ts` | `permissionsFixture` | `permissions` | 1 |
| `productCategories.ts` | `productCategoriesFixture` | `product-categories` | 4 |
| `productionOrders.ts` | `productionOrdersFixture` | `production-orders` | 19 |
| `products.ts` | `productsFixture` | `products` | 5 |
| `recipeComponents.ts` | `recipeComponentsFixture` | `components` | 6 |
| `recipes.ts` | `recipesFixture` | `recipes` | 4 |
| `roles.ts` | `rolesFixture` | `roles` | 5 |
| `units.ts` | `unitsFixture` | `units` | 8 |
| `userLogs.ts` | `userLogsFixture` | `user-logs` | 12 |
| `users.ts` | `usersFixture` | `users` | 8 |

### ไฟล์นอก `src/mocks/` ที่ผูกกับ mock

| ไฟล์ | เกี่ยวยังไง |
|---|---|
| `src/components/providers/MSWReady.tsx` | `NEXT_PUBLIC_API_MOCK==="1"` → `import("@/mocks/browser")` + `startMockWorker()` แล้วค่อย render children · mock ปิด → `msw` ไม่เข้า bundle |
| `src/app/providers.tsx` (บรรทัด 15, 41–42) | import + ครอบ `<MSWReady>{children}</MSWReady>` |
| `public/mockServiceWorker.js` | generated (`npx msw init public/`) |
| `package.json` | `devDependencies.msw` + field `"msw": { "workerDirectory": ["public"] }` |
| `eslint.config.mjs` (บรรทัด 16) | ignore `public/mockServiceWorker.js` |
| `.env.example` / `.env.local` | `NEXT_PUBLIC_API_MOCK` |
| `README.md` (บรรทัด ~137, ~159, ~327) · `src/services/README.md` (บรรทัด 26) | อธิบายการใช้ mock |
| `docs/OVERVIEW.md`, `docs/INVENTORY.md` | อ้างถึง `src/mocks/` (ประวัติ/ภาพรวม) — `docs/REBUILD_PLAN.md`, `docs/PROMPT_HISTORY.md` เป็นบันทึกประวัติ ไม่ต้องแก้ |

---

## รายการ handler

ลงทะเบียนใน `handlers/index.ts` — `crudHandlers(name, `${API}/<name>`)` ทุกตัวได้ GET list · GET `:id` · POST · PATCH · DELETE

| resource | handler | fixture |
|---|---|---|
| `auth` | `handlers/auth.ts` (login / logout / me / refresh) | `fixtures/auth.ts` |
| `reports/dashboard` | `handlers/reports.ts` | `fixtures/dashboard.ts` |
| `attendances` | `handlers/attendances.ts` (today / check-in / check-out / list) | `fixtures/attendances.ts` |
| `products` · `product-categories` | `crudHandlers` | `products.ts` · `productCategories.ts` |
| `orders` | `crudHandlers` | `orders.ts` |
| `ingredients` · `ingredient-categories` · `ingredient-transactions` | `crudHandlers` | `ingredients.ts` · `ingredientCategories.ts` · `ingredientTransactions.ts` |
| `units` | `crudHandlers` | `units.ts` |
| `users` · `roles` · `permissions` · `user-logs` | `crudHandlers` | `users.ts` · `roles.ts` · `permissions.ts` · `userLogs.ts` |
| `notifications` | `crudHandlers` | `notifications.ts` |
| `banners` | `crudHandlers` | `banners.ts` |
| `production-orders` | `crudHandlers` | `productionOrders.ts` |
| `components` · `recipes` | `crudHandlers` | `recipeComponents.ts` · `recipes.ts` |
| `expenses` | `crudHandlers` | `expenses.ts` |

### path ของ mock vs service จริง

`BASE` ใน `src/services/*.ts` ตอนนี้ (ต่อจาก `NEXT_PUBLIC_API_BASE_URL`) เทียบกับ path ที่ mock ดัก:

| service (`src/services/`) | path ที่ service เรียก | path ที่ mock ดัก | ตรงไหม |
|---|---|---|---|
| `authClient.ts` (`src/lib/`) | `/auth/login` · `/auth/logout` · `/auth/me` | `/auth/*` | ✅ |
| `products.ts` | `/admin/products` | `/products` | ❌ |
| `orders.ts` | `/admin/orders` | `/orders` | ❌ |
| `ingredients.ts` · `ingredientTransactions.ts` | `/admin/ingredients` · `/admin/ingredient-transactions` | `/ingredients` · `/ingredient-transactions` | ❌ |
| `units.ts` | `/admin/units` | `/units` | ❌ |
| `users.ts` · `roles.ts` · `permissions.ts` · `userLogs.ts` | `/admin/users` · `/admin/roles` · `/admin/permissions` · `/admin/user-logs` | ไม่มี `/admin` | ❌ |
| `notifications.ts` · `banners.ts` · `expenses.ts` | `/admin/notifications` · `/admin/banners` · `/admin/expenses` | ไม่มี `/admin` | ❌ |
| `productionOrders.ts` · `recipes.ts` · `recipeComponents.ts` | `/admin/production-orders` · `/admin/recipes` · `/admin/components` | ไม่มี `/admin` | ❌ |
| `attendances.ts` | `/admin/attendances` (+ `/check-in`, `/check-out`) | `/attendances` | ❌ |
| dashboard | `/admin/dashboard/overview` · `/revenue-by-type` · `/top-products` | `/reports/dashboard` | ❌ |
| หมวดหมู่ | `/admin/product-categories` · `/admin/ingredient-categories` · `/admin/component-categories` | `/product-categories` · `/ingredient-categories` · (ไม่มี) | ❌ |
| `payments.ts` · `preorders.ts` · `preorderRounds.ts` · `promotions.ts` · `reviews.ts` · POS `/admin/pos/scan` | `/admin/...` | **ไม่มี handler** | ❌ |

---

## จุดที่ frontend "ประกอบเอง" ชั่วคราว (ถ้า backend ยังไม่มี aggregate)

> ล้าสมัยแล้ว — backend จริงมี endpoint dashboard (`/admin/dashboard/overview` · `/revenue-by-type` · `/top-products`) และ service ใช้แล้ว · เก็บตารางไว้เป็นประวัติ

| endpoint | ถ้าไม่มีจริง | ต้องแก้ตอน backend พร้อม |
|---|---|---|
| `GET /reports/dashboard` | ประกอบจาก `/orders?limit=5`, `/ingredients?...`, `/production-orders?...` ใน ViewModel | เปลี่ยน `useDashboardViewModel` ไปเรียก endpoint เดียว |
| `GET /reports/finance-summary` | ประกอบจาก `/expenses` + `/orders` | เช่นเดียวกัน |
| `GET /reports/production-history` | ประกอบจาก `/production-orders?date_from=...` | เช่นเดียวกัน |

---

## Checklist ถอด mock ออก

**ต่อ backend จริง**
- [x] ตั้ง `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api` · `NEXT_PUBLIC_API_MOCK=0` (2026-09-23)
- [x] ตรวจ CORS + cookie (D15): `Access-Control-Allow-Origin=http://localhost:3001` · `Access-Control-Allow-Credentials=true` · cookie `session` (`Secure; HttpOnly; SameSite=none`) · login → `me` = 200 (2026-09-23)
- [ ] เทียบ response จริงกับ `API_CONTRACT.md` — แก้ `src/types/*` + `src/services/*` ถ้าต่าง
- [ ] เดินครบ 27 screen ด้วย backend จริง + สลับ locale th/en
- [ ] auth flow จริง: login → me → refresh (401) → logout (cross-tab)

**ลบไฟล์ / config**
- [ ] ลบโฟลเดอร์ `src/mocks/` (28 ไฟล์ตาม [โครง](#โครง-srcmocks))
- [ ] ลบ `src/components/providers/MSWReady.tsx` + เอา import/`<MSWReady>` ออกจาก `src/app/providers.tsx` (render `{children}` ตรง ๆ)
- [ ] ลบ `public/mockServiceWorker.js`
- [ ] `npm uninstall msw` + ลบ field `"msw": { "workerDirectory": ... }` ใน `package.json`
- [ ] เอา `"public/mockServiceWorker.js"` ออกจาก ignore ใน `eslint.config.mjs`
- [ ] ลบ `NEXT_PUBLIC_API_MOCK` ออกจาก `.env.example` และ `.env.local`
- [ ] แก้ `README.md` + `src/services/README.md` ส่วนที่พูดถึง mock · ปรับ `docs/OVERVIEW.md` / `docs/INVENTORY.md` · ย้าย/ปิดเอกสารนี้
- [ ] `grep -rn "API_MOCK\|src/mocks\|@/mocks\|msw\|MSWReady" src/ public/ package.json eslint.config.mjs .env.example` → ต้องไม่เหลือ
- [ ] `npm run check` ผ่าน · `npm run build` ผ่าน