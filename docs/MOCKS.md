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
- `db.ts` = array ในหน่วยความจำต่อ resource · POST/PATCH/DELETE แก้ array นั้นจริง → **ข้อมูลเปลี่ยนตามที่กดในแอป** (แต่หายเมื่อรีเฟรชหน้า)
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

## โครง `src/mocks/`

| ไฟล์ | หน้าที่ | สถานะ |
|---|---|---|
| `browser.ts` | `setupWorker(...handlers)` — เรียกใน `providers.tsx` เมื่อ `NEXT_PUBLIC_API_MOCK==="1"` | ⏳ เฟส 2.5 |
| `server.ts` | `setupServer(...handlers)` — สำหรับ SSR / test (ถ้าจำเป็น) | ⏳ เฟส 2.5 |
| `handlers/index.ts` | รวม handler ทุก resource | ⏳ เฟส 2.5 |
| `handlers/<resource>.ts` | CRUD handler ต่อ resource ตาม `API_CONTRACT.md` §3 | ⏳ เฟส 2.5 |
| `handlers/auth.ts` | `/auth/login|logout|me|refresh` — login ผ่านด้วย credential dev, `me` คืน owner + menuAccess เต็ม | ⏳ เฟส 2.5 |
| `handlers/reports.ts` | aggregate endpoints (dashboard, finance-summary, ...) — §4 | ⏳ เฟส 2.5 |
| `fixtures/<resource>.ts` | ข้อมูลตัวอย่าง (seed จาก `MOCK_*` ในต้นทาง + เพิ่มให้ครบ 27 screen) | ⏳ เฟส 2.5–4 |
| `db.ts` | in-memory store กลาง (Map<resource, Doc[]>) + helper list/paginate/filter/softDelete | ⏳ เฟส 2.5 |

---

## รายการ handler (เติมตอนทำ)

| resource | endpoints | fixture count | ใช้กับ screen | หมายเหตุ |
|---|---|---|---|---|
| `auth` | login/logout/me/refresh | user owner 1 | ทุกหน้า | credential dev: (จะกำหนดตอนทำ) |
| _(เพิ่มตอนเฟส 2.5–4)_ | | | | |

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
