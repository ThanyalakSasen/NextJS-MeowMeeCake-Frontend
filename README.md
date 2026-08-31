# MeowMeeCake — Frontend

ระบบจัดการร้านเบเกอรี่ (ฝั่งเจ้าของร้าน/พนักงาน) — โปรเจกต์นี้เป็น **frontend อย่างเดียว**
Backend เป็นคนละโปรเจกต์ คุยกันผ่าน REST API

> เอกสารนี้เขียนให้คนที่เพิ่งเข้าโปรเจกต์อ่านจบแล้ว **แก้โค้ดได้เลย** — อ่านจากบนลงล่างครั้งเดียวพอ

---

## สารบัญ

1. [ภาพรวม 1 นาที](#1-ภาพรวม-1-นาที)
2. [ติดตั้ง & รัน](#2-ติดตั้ง--รัน)
3. [ศัพท์ที่ต้องรู้ก่อน](#3-ศัพท์ที่ต้องรู้ก่อน)
4. [โครงสร้างโฟลเดอร์](#4-โครงสร้างโฟลเดอร์)
5. [เส้นทางของ 1 request (สำคัญที่สุด)](#5-เส้นทางของ-1-request)
6. [อยากทำ X ต้องแก้ตรงไหน](#6-อยากทำ-x-ต้องแก้ตรงไหน)
7. [เจาะลึก 6 เรื่องหลัก](#7-เจาะลึก-6-เรื่องหลัก)
   - [7.1 โครงสร้าง Component](#71-โครงสร้าง-component)
   - [7.2 i18n — 2 ภาษา](#72-i18n--2-ภาษา)
   - [7.3 MVVM — โครงโค้ดในแต่ละหน้า](#73-mvvm--โครงโค้ดในแต่ละหน้า)
   - [7.4 Auth — ล็อกอิน & สิทธิ์](#74-auth--ล็อกอิน--สิทธิ์)
   - [7.5 API Contract — คุยกับ backend](#75-api-contract--คุยกับ-backend)
   - [7.6 Inventory — มีอะไรในระบบ](#76-inventory--มีอะไรในระบบ)
8. [เครื่องมือที่ใช้ & ทำไม](#8-เครื่องมือที่ใช้--ทำไม)
9. [เอกสารใน `docs/` — เส้นทางการอ่าน + อันไหนไว้ทำอะไร](#9-เอกสารใน-docs)
10. [กติกาการเขียนโค้ด (cheat sheet)](#10-กติกาการเขียนโค้ด)
11. [คำสั่ง npm](#11-คำสั่ง-npm)

---

## 1. ภาพรวม 1 นาที

- **แอปนี้ทำอะไร:** หน้าเว็บหลังบ้านของร้านเค้ก — จัดการสินค้า, คำสั่งซื้อ, POS หน้าร้าน, วัตถุดิบ, สูตร, การผลิต, พนักงาน, การเงิน, แบนเนอร์, แจ้งเตือน (รวม **27 หน้า**)
- **ใครใช้:** เจ้าของร้าน (เห็นทุกอย่าง) และพนักงาน (เห็นเฉพาะที่ได้รับสิทธิ์)
- **โครงใหญ่:** เบราว์เซอร์ → **Next.js (โปรเจกต์นี้)** → เรียก API → **Backend (คนละโปรเจกต์)** → ฐานข้อมูล
- **โปรเจกต์นี้ไม่มี:** ฐานข้อมูล, การเข้ารหัสรหัสผ่าน, การออก token — พวกนี้อยู่ที่ backend ทั้งหมด
- **2 ภาษา:** ไทย (ค่าเริ่มต้น) / อังกฤษ สลับได้ทุกหน้า
- **ตอนนี้ยัง dev อยู่:** backend ยังไม่พร้อม → ใช้ **MSW** (backend ปลอม) ตอบแทนไปก่อน

---

## 2. ติดตั้ง & รัน

```bash
npm install
cp .env.example .env.local     # แล้วแก้ค่า 2 ตัวด้านล่าง
npm run dev                     # http://localhost:3000
```

`.env.local`:

| ตัวแปร | ใส่อะไร | ถ้าไม่ใส่ |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL ของ backend เช่น `https://api.meowmeecake.local` | request ยิงไปที่ path ว่าง — ต้องเปิด mock |
| `NEXT_PUBLIC_API_MOCK` | `1` = ใช้ backend ปลอม (MSW) · `0` = ยิง backend จริง | ถือว่า `1` ตอน dev |

**ทำงานครั้งแรกทำอะไร:** ตั้ง `NEXT_PUBLIC_API_MOCK=1` → `npm run dev` → เปิดหน้าเว็บ → login ด้วย credential ปลอม (ดู `docs/MOCKS.md`) → เดินดูหน้าต่าง ๆ ได้เลย

---

## 3. ศัพท์ที่ต้องรู้ก่อน

| คำ | แปลเป็นภาษาคน |
|---|---|
| **App Router** | ระบบ routing ของ Next.js รุ่นใหม่ — โฟลเดอร์ใน `src/app/` = URL (เช่น `app/owner/products/page.tsx` → `/owner/products`) |
| **Server Component / Client Component** | ไฟล์ที่ไม่มี `"use client"` = รันบน server (เร็ว, ไม่มี state) · มี `"use client"` = รันบนเบราว์เซอร์ (มี `useState`, `onClick` ได้) |
| **DTO** (Data Transfer Object) | หน้าตาของ JSON ที่ backend ส่งกลับ — เราเขียนเป็น `interface` ไว้ใน `src/types/` เพื่อให้ TypeScript ช่วยเช็ค |
| **Service** | ฟังก์ชันเรียก API 1 endpoint (เช่น `productsService.list()`) — อยู่ใน `src/services/` |
| **ViewModel** | custom hook ที่เก็บ "สมอง" ของหน้า (state, เรียก API, ปุ่มกดทำอะไร) — ไม่มี JSX |
| **View** | component ที่เอา ViewModel มา "วาด" เป็นหน้าจอ — มีแต่ JSX |
| **Interceptor** | โค้ดที่ดักทุก request/response ของ axios ไว้จัดการรวมศูนย์ (เช่น เจอ error 401 ให้เด้งไป login) |
| **Envelope** | รูปแบบตายตัวที่ backend ห่อข้อมูลมา: `{ data: ..., meta: ... }` |
| **namespace** (i18n) | กลุ่มของข้อความแปล เช่น `common`, `products` — เวลาเรียกใช้ `t("products.title")` |
| **Permission gate** | การซ่อน/โชว์ปุ่มตามสิทธิ์ผู้ใช้ ผ่าน `usePermission("orders")` |
| **MSW** (Mock Service Worker) | ไลบรารีที่ทำ "backend ปลอม" ดักrequest ในเบราว์เซอร์ ตอบข้อมูลตัวอย่างกลับ |
| **proxy.ts** | ไฟล์ที่รันก่อนทุกหน้า (เหมือน middleware) — ที่นี่ใช้เช็คว่า login หรือยัง |

---

## 4. โครงสร้างโฟลเดอร์

```
src/
  app/                     ทุกหน้าเว็บ (Next.js App Router)
    layout.tsx             โครงนอกสุด — ครอบ i18n + antd + React Query ให้ทั้งแอป
    page.tsx               หน้าแรก "/" — เด้งไป dashboard หรือ login
    login/                 หน้า login (ใช้ AuthLayout — ไม่มีเมนู)
    owner/                 หน้าหลังบ้านทั้งหมด (ใช้ OwnerLayout — มี Sidebar + Navbar)
      layout.tsx           โหลดข้อมูลผู้ใช้, ประกอบ Sidebar/Navbar, จับ idle timeout
      products/            1 หน้า = page.tsx + useProductsViewModel.ts + ProductsView.tsx
        _components/        component ที่ "หน้านี้เท่านั้น" ใช้
  proxy.ts                 ด่านหน้า: ยังไม่ login → เด้ง /login

  lib/                     เครื่องมือระดับแอป
    http.ts                axios instance + interceptor (จุดเดียวที่คุยกับ network)
    authClient.ts          login / logout / me / refresh
    queryClient.ts         ตั้งค่า React Query
    alert.ts               popup แจ้งเตือน (ครอบ sweetalert2)
    exportCsv.ts           ดาวน์โหลดตารางเป็น CSV

  services/                1 ไฟล์ต่อ 1 resource — ฟังก์ชันเรียก API (productsService, ordersService...)
  types/                   DTO — หน้าตา JSON จาก backend
  constants/               menuKeys (คีย์เมนู/สิทธิ์) · enumConfig (สีของสถานะ/badge)
  utils/                   ฟังก์ชันช่วยล้วน ๆ (คำนวณส่วนลด, diff ก่อน/หลัง, แปลงหน่วย)

  i18n/                    ตั้งค่าภาษา + messages/{th,en}.json (ไฟล์คำแปล)
  context/                 PermissionsContext — เก็บสิทธิ์ผู้ใช้ให้ทั้งแอปเรียกใช้
  hooks/                   useCurrentUser · useIdleTimeout · hook ที่ใช้หลายที่

  components/
    base/                  ปุ่ม / input / badge พื้นฐาน (ครอบ antd ให้หน้าตาเหมือนกันทั้งแอป)
    shared/                component ที่ใช้ ≥ 2 หน้า — แบ่ง layout / data / feedback / stats / charts / form

  mocks/                   MSW — backend ปลอมสำหรับ dev (ลบทั้งโฟลเดอร์ได้เมื่อ backend พร้อม)

docs/                      เอกสารรายละเอียด (ดูข้อ 9)
scripts/check-i18n.mjs     สคริปต์เช็คว่าไม่มีข้อความ hard-code
```

---

## 5. เส้นทางของ 1 request

**ตัวอย่าง: ผู้ใช้เปิดหน้า `/owner/products`**

```
1. proxy.ts          มี auth cookie ไหม? ── ไม่มี → เด้ง /login จบ
                                          └─ มี → ปล่อยผ่าน
2. app/owner/layout.tsx   โหลด useCurrentUser() → GET /auth/me → ได้ user + สิทธิ์ (menuAccess)
                          ประกอบ Sidebar + Navbar รอบ ๆ เนื้อหา
3. app/owner/products/page.tsx      เรียก useProductsViewModel()  แล้วส่งผลให้ <ProductsView/>
4. useProductsViewModel.ts          useQuery(['products', filters], () => productsService.list(filters))
5. src/services/products.ts         http.get('/products', { params: filters })
6. src/lib/http.ts (interceptor)    - แนบ header Accept-Language ตามภาษาปัจจุบัน
                                    - ส่ง request ออกไปที่ NEXT_PUBLIC_API_BASE_URL
7a. ถ้า NEXT_PUBLIC_API_MOCK=1  →  MSW (src/mocks/handlers/products.ts) ดักไว้ ตอบข้อมูลตัวอย่าง
7b. ถ้า =0                      →  ยิง backend จริง
8. response กลับมา              interceptor แกะ envelope { data, meta } ออก
                                ถ้า error 401 → เรียก refresh 1 ครั้ง → สำเร็จ retry / ล้มเหลว → เด้ง login
9. useQuery ได้ data → ViewModel ส่งต่อเป็น props → <ProductsView/> วาดตาราง (ข้อความทุกคำผ่าน t())
```

**จุดสำคัญ:** หน้า (`page.tsx`/`View`) **ไม่เคย** เรียก `fetch`/`axios` เอง — เรียกผ่าน ViewModel → service → `http.ts` เสมอ

---

## 6. อยากทำ X ต้องแก้ตรงไหน

| อยากทำ... | ไปที่ | ทำยังไง (ย่อ) |
|---|---|---|
| เพิ่มหน้าใหม่ | `src/app/owner/<ชื่อ>/` | สร้าง 3 ไฟล์: `page.tsx` + `use<ชื่อ>ViewModel.ts` + `<ชื่อ>View.tsx` (ดู 7.3) |
| เพิ่ม/แก้ข้อความบนจอ | `src/i18n/messages/th.json` + `en.json` | เติม key เดียวกันทั้ง 2 ไฟล์ แล้วเรียก `t("...")` |
| เรียก API endpoint ใหม่ | `src/services/<resource>.ts` (+ `src/types/`) | เพิ่มฟังก์ชันที่เรียก `http.get/post/...` + เขียน DTO |
| สร้าง component ใช้ซ้ำ | `src/components/base/` หรือ `shared/<หมวด>/` | ดูกติกา "ใช้กี่หน้า?" ใน 7.1 |
| component เฉพาะหน้าเดียว | `src/app/owner/<หน้า>/_components/` | สร้างไฟล์ในโฟลเดอร์นั้นได้เลย |
| ซ่อนปุ่มถ้าไม่มีสิทธิ์ | ใน ViewModel | `const perm = usePermission("orders")` → `{perm.create && <ปุ่มเพิ่ม/>}` |
| เปลี่ยนสีของ badge สถานะ | `src/constants/enumConfig.ts` | แก้ hex ในตารางสถานะ (label อยู่คนละที่ — i18n) |
| เพิ่ม endpoint ให้ mock ตอบ | `src/mocks/handlers/` + `src/mocks/fixtures/` | เขียน handler ตาม `docs/API_CONTRACT.md` |
| เปลี่ยนธีมสี/ฟอนต์ | `src/app/globals.css` + `src/app/providers.tsx` | ตัวแปรสีน้ำตาล (coffee) + antd token |
| แก้เมนู Sidebar | `src/components/shared/layout/Sidebar*` + `src/constants/menuKeys.ts` | เพิ่ม/ลบรายการ + คีย์สิทธิ์ |

---

## 7. เจาะลึก 6 เรื่องหลัก

### 7.1 โครงสร้าง Component

component มีได้ **3 ที่เท่านั้น** ตัดสินด้วยคำถามเดียว — *"ใช้กี่หน้า?"*

| ที่วาง | ใช้เมื่อ | ตัวอย่าง | เหตุผล |
|---|---|---|---|
| `src/components/base/` | UI พื้นฐาน **ไม่มี logic ธุรกิจ** | `Button`, `Input`, `Badge`, `DatePicker`, `Logo` | ครอบ antd ไว้ที่เดียว → เปลี่ยนธีม/ขนาดตัวอักษรทีเดียวได้ทั้งแอป |
| `src/components/shared/<หมวด>/` | ใช้ **≥ 2 หน้า** | `DataTable`, `Navbar`, `Sidebar`, `StatCard`, `LoadingSpin`, `DetailDrawer` | ไม่เขียนซ้ำ · หมวด = `layout` `data` `feedback` `stats` `charts` `form` |
| `src/app/owner/<หน้า>/_components/` | ใช้ **หน้าเดียว** | `KanbanBoard` (มีแค่ Production), `CartPanel` (มีแค่ POS) | อยู่ใกล้ที่ใช้ → หาง่าย · `_` ขึ้นต้น = Next.js ไม่ทำเป็น URL |

**กติกาสำคัญ:**
- **ห้ามเรียก antd ตรง ๆ จากหน้า** — เรียกผ่าน `base/` เสมอ
- component หน้าเดียว วันหนึ่งมีหน้าที่ 2 มาใช้ → **ย้ายขึ้น** `shared/`
- component ที่มี state/logic เยอะ → **แตกเป็น View + ViewModel** (ดู 7.3) · ถ้าแค่แสดงผล เช่น `Badge` → ไฟล์เดียวพอ
- **ทำไมไม่ใช้ Atomic Design (atoms/molecules/organisms):** เส้นแบ่งเถียงกันไม่จบ + มี component ที่ใช้หน้าเดียวเยอะมาก → แบบ "ใช้กี่หน้า" ตัดสินง่ายกว่า

> รายละเอียด: `docs/REBUILD_PLAN.md` §6 · ตารางว่า component ไหนอยู่ไหน: `docs/COMPONENT_MAP.md` (สร้างตอนเฟส 3)

---

### 7.2 i18n — 2 ภาษา

ใช้ [`next-intl`](https://next-intl.dev) แบบ **ไม่มี `/th` `/en` ใน URL** — ภาษาปัจจุบันเก็บใน cookie `mmc_locale`

**ทำงานยังไง:**
```
cookie mmc_locale  ──►  src/i18n/request.ts  ──►  โหลด src/i18n/messages/<ภาษา>.json  ──►  t("...") ใช้ได้ทุกที่
```

**ใช้ในโค้ด — กฎเดียว: `t` ตัวเดียว, key = path เต็ม**
```tsx
// client component
import { useTranslations } from "next-intl";
const t = useTranslations();                  // ไม่ใส่ namespace
return <h1>{t("products.title")}</h1>;        // key ตรงกับ path ใน messages json เป๊ะ
// ค่าแทรก: t("products.stock", { n: 12 })   // json: "stock": "สต็อก {n}"

// server component
import { getTranslations } from "next-intl/server";
const t = await getTranslations();
```

**เพิ่มข้อความใหม่ = 2 ขั้น:** (1) เติม key **เดียวกันทั้ง** `th.json` + `en.json` → (2) เรียก `t("path.to.key")`

**3 อย่างที่กันพลาด:**
- พิมพ์ key ผิด → editor autocomplete + **build error** (ผ่าน `src/i18n/messages.d.ts`)
- ลืมเติมอีกไฟล์ → `npm run lint:i18n` เช็ค key ของ th/en ให้ตรงกัน
- เผลอเขียนข้อความไทยตรง ๆ ใน `.tsx` → `npm run lint:i18n` จับ (ยกเว้น `i18n/` `types/` `constants/` `mocks/`)

**key จากตัวแปร/config:** ต้อง type ให้แคบ (เช่น `menu.ts` `labelKey: NavKey`) หรือ cast `t(key as Parameters<typeof t>[0])`

**สลับภาษา:** component `<LocaleSwitcher/>` (ปุ่ม TH/EN) → เขียน cookie + `router.refresh()` · antd (ปฏิทิน, ปุ่ม "วันนี้") กับ dayjs สลับตามให้อัตโนมัติผ่าน `src/app/providers.tsx`

**namespace มีอะไรบ้าง:** `common` (ปุ่มทั่วไป) · `nav` (เมนู) · `auth` · `errors` · `fields` (ชื่อฟิลด์ ~130 คำ) · `enums` (ค่าสถานะ 20 กลุ่ม) · และ 1 อันต่อ 1 กลุ่มหน้า (`products`, `orders`, `ingredients`, ...)

**ทำไมสำคัญ:** ข้อความอยู่ที่เดียว → นักแปลแก้ได้โดยไม่แตะโค้ด · เพิ่มภาษาที่ 3 ในอนาคตแค่เพิ่มไฟล์ json

> รายละเอียด: `docs/I18N_PLAN.md`

---

### 7.3 MVVM — โครงโค้ดในแต่ละหน้า

แยก **"สิ่งที่คิด"** (ViewModel) ออกจาก **"สิ่งที่แสดง"** (View) — ใน React ทำผ่าน "custom hook + presentational component" (บางทีเรียก Container/Presentational)

**1 หน้า = 3 ไฟล์:**
```
app/owner/products/
  page.tsx                 ← จุดเชื่อม บาง ๆ (5 บรรทัด): เรียก hook แล้วส่งให้ View
  useProductsViewModel.ts  ← state, เรียก API, handler, คำนวณ, เช็คสิทธิ์  — ไม่มี JSX
  ProductsView.tsx         ← JSX ล้วน รับ props จาก ViewModel  — ไม่มี fetch / useEffect
```

```tsx
// page.tsx — เท่านี้จริง ๆ
"use client";
export default function ProductsPage() {
  const vm = useProductsViewModel();
  return <ProductsView {...vm} />;
}
```

| อยู่ใน **ViewModel** (`use...ts`) | อยู่ใน **View** (`...View.tsx`) |
|---|---|
| `useState`, `useQuery` / `useMutation` (React Query) | JSX + ประกอบ component จาก `base/` `shared/` |
| เรียก `services/*` (API) | `t()` ทุกข้อความ |
| handler: `handleSave`, `handleDelete` | render ตาม props: `loading ? <Spin/> : <Table/>` |
| `useMemo` คำนวณ (filter, ยอดรวม) | ปุ่มโชว์/ซ่อนตาม `perm.create` ที่รับมาเป็น prop |
| `usePermission("products")` | **ห้าม** fetch / เรียก API / business logic |

**ทำไมสำคัญ:**
- View ทดสอบง่าย (ไม่มี network) · ViewModel ทดสอบง่าย (ไม่มี DOM)
- อ่านโค้ดหน้าไหนก็รู้ทันทีว่า "logic อยู่ไฟล์ `use...`, หน้าตาอยู่ไฟล์ `...View`"
- component เล็ก ๆ ที่แค่แสดงผล → **ไม่ต้อง**แตก ทำไฟล์เดียวพอ (อย่าทำเกินจำเป็น)

> รายละเอียด + naming convention: `docs/CODE_STRUCTURE.md`

---

### 7.4 Auth — ล็อกอิน & สิทธิ์

**Backend เป็นเจ้าของทุกอย่างที่สำคัญ:** ตรวจรหัสผ่าน, ออก/หมุน token, อายุ session, ล็อกตอนกรอกผิดหลายครั้ง, **บังคับสิทธิ์จริง**

**Frontend ทำแค่ 6 อย่าง:**

| ส่วน | ไฟล์ | หน้าที่ |
|---|---|---|
| เรียก API auth | `lib/authClient.ts` | `login` / `logout` / `me` / `refresh` |
| ดักทุก response | `lib/http.ts` (interceptor) | เจอ `401` → เรียก `refresh` 1 ครั้ง → สำเร็จ retry / ล้มเหลว → เด้ง `/login?reason=expired` |
| ข้อมูลผู้ใช้ปัจจุบัน | `hooks/useCurrentUser.ts` | `GET /auth/me` → ได้ `user` + `menuAccess` (สิทธิ์แต่ละเมนู) |
| เก็บสิทธิ์ให้ทั้งแอป | `context/PermissionsContext` | `usePermission("orders")` → `{ view, create, update, delete, approve }` |
| หมดเวลา idle | `hooks/useIdleTimeout.ts` | ไม่ขยับ 30 นาที → เตือน 60 วิ → logout |
| ด่านหน้า | `proxy.ts` | ไม่มี auth cookie → เด้ง `/login` (แค่เช็คว่า *มี* cookie — ไม่ verify signature) |

**Flow ล็อกอิน:**
```
กรอก email/password → POST /auth/login (backend set cookie)
                    → GET /auth/me → เก็บ user + สิทธิ์ ใน PermissionsContext
                    → เข้า /owner/dashboard
```

**สิทธิ์ = แค่ UX:** frontend ซ่อนปุ่ม/เมนูตาม `menuAccess` เพื่อความสวยงาม — **ตัวบังคับจริงอยู่ที่ backend** (ต่อให้ผู้ใช้เรียก API ตรง ๆ ก็โดน backend ปฏิเสธ)

**ทำไมสำคัญ:** ถ้าเข้าใจผิดว่า "ซ่อนปุ่ม = ปลอดภัย" จะเกิดช่องโหว่ · จำไว้ว่า frontend เชื่อถือไม่ได้เสมอ

> รายละเอียด (interceptor, refresh, cross-tab logout): `docs/AUTH_PLAN.md`

---

### 7.5 API Contract — คุยกับ backend

ทุก request ยิงไปที่ `NEXT_PUBLIC_API_BASE_URL` ผ่าน `services/*` — **หน้าไม่เรียก `fetch`/`axios` ตรง**

**หน้าตา response (ตกลงกับ backend ไว้แล้ว):**
```jsonc
// list:  GET /products?page=1&limit=50
{ "data": [ ...สินค้า... ], "meta": { "page": 1, "limit": 50, "total": 120 } }

// item:  GET /products/:id   ·   POST /products   ·   PATCH /products/:id
{ "data": { ...สินค้า 1 ชิ้น... } }

// error (ทุก status ≥ 400)
{ "message": "ข้อความบอกผู้ใช้" }
```

**query params มาตรฐาน:** `?page=` `?limit=` `?search=` `?sort=-created_at` + filter ตรงตัว เช่น `?order_status=pending`

**ตัวอย่าง service:**
```ts
// src/services/products.ts
import { http } from "@/lib/http";
export const productsService = {
  list:   (params) => http.get("/products", { params }),      // → { data, meta }
  get:    (id)     => http.get(`/products/${id}`),
  create: (body)   => http.post("/products", body),
  update: (id, body) => http.patch(`/products/${id}`, body),
  remove: (id)     => http.delete(`/products/${id}`),
};
```

**ตอน backend ยังไม่พร้อม:** `NEXT_PUBLIC_API_MOCK=1` → MSW (`src/mocks/`) ตอบตาม contract เดียวกัน → **โค้ดหน้าไม่ต้องแก้เลย** พอ backend พร้อมก็แค่สลับ env

**ทำไมสำคัญ:** contract คือ "สัญญา" ระหว่าง 2 ทีม — frontend เขียนตามนี้, backend ทำให้ตรงนี้, MSW เลียนแบบนี้ ทั้งหมดอ้างเอกสารเดียว

> รายการ endpoint ทั้งหมด (40 resource) + สิ่งที่ frontend ไม่ทำ: `docs/API_CONTRACT.md`

---

### 7.6 Inventory — มีอะไรในระบบ

จากระบบเดิม (fullstack) — โปรเจกต์นี้เอามาเป็น **สเปคของ DTO + หน้าจอ** ไม่ใช่โค้ด backend

| หมวด | จำนวน | มีอะไรบ้าง |
|---|---|---|
| Resource / entity | ~38 | สินค้า · ออเดอร์ · พรีออเดอร์ · วัตถุดิบ · หน่วยนับ · สูตร · การผลิต · พนักงาน · role · สิทธิ์ · โปรโมชัน · แบนเนอร์ · ค่าใช้จ่าย · แจ้งเตือน · รีวิว ... |
| หน้าจอ | 27 | Login + 26 หน้าหลังบ้าน (Dashboard, Products, Orders/POS, Ingredients, Production, Recipes, Employees, Finance, Store Design, Notifications, Access Denied) |
| ภาษา | 2 | ไทย (ค่าเริ่มต้น) / อังกฤษ |
| กลุ่มเมนู (สิทธิ์) | 11 | `dashboard products orders payments ingredients stock recipes production employees promotions reports` × 5 action (view/create/update/delete/approve) |

**ทำไมสำคัญ:** ก่อนสร้างหน้าใหม่หรือ DTO ใหม่ เปิด `INVENTORY.md` ดูก่อนว่ามี entity/field นั้นอยู่แล้วไหม ชื่ออะไร enum มีค่าอะไรบ้าง

> แจกแจงเต็มทุก entity + field + enum: `docs/INVENTORY.md`

---

## 8. เครื่องมือที่ใช้ & ทำไม

| เครื่องมือ | ใช้ทำอะไร | ทำไมเลือกตัวนี้ |
|---|---|---|
| **Next.js 16** (App Router) | framework หลัก — routing, SSR, build | มาตรฐาน React · โฟลเดอร์ = URL · มี `proxy.ts` ทำด่านหน้าได้ |
| **React 18 + TypeScript** | UI + type safety | TS จับ bug ตั้งแต่เขียน (DTO ผิด shape จะ error ทันที) |
| **antd 6** | component สำเร็จรูป (Table, Form, DatePicker, Modal) | ครบ, เสถียร, มี locale ไทย/อังกฤษในตัว |
| **Tailwind 4** | จัด layout/spacing/สี ด้วย class | เร็ว, ไม่ต้องตั้งชื่อ CSS class · ใช้คู่ antd (antd = component, Tailwind = จัดวาง) |
| **next-intl 4** | ระบบ 2 ภาษา | ทำงานได้ทั้ง server + client component · เก็บภาษาใน cookie ไม่ต้องมี `/th` `/en` |
| **axios** | เรียก HTTP | มี interceptor รวมศูนย์ (จัดการ 401/error ที่เดียว) |
| **@tanstack/react-query** | จัดการข้อมูลจาก API (loading/error/cache/refetch) | ไม่ต้องเขียน `useState`+`useEffect` ซ้ำทุกหน้า · refetch อัตโนมัติเมื่อกลับมาโฟกัสแท็บ |
| **MSW** | backend ปลอมตอน dev | ดักที่ network layer → โค้ดจริงไม่รู้ตัว → พอ backend มาก็ลบทิ้งได้สะอาด |
| **sweetalert2** | popup แจ้งเตือน/ยืนยัน | หน้าตาสวย, เรียกผ่าน `lib/alert.ts` ที่เดียว |
| **dayjs** | จัดการวันที่ | เบา, antd ใช้ตัวนี้อยู่แล้ว, สลับ locale ได้ |
| **recharts** | กราฟ (ยอดขาย, การผลิต) | API เป็น React component ตรงไปตรงมา |
| **React Compiler** (`reactCompiler: true`) | ทำ memoization ให้อัตโนมัติ | ไม่ต้องใส่ `useMemo`/`useCallback` เองทุกที่ (build ช้าลงนิดหน่อย แลกมา) |

---

## 9. เอกสารใน `docs/`

### 9.1 เส้นทางการอ่าน (Learning Path)

อ่านเป็น **ด่าน** — จบด่านหนึ่งค่อยไปด่านถัดไป ไม่ต้องอ่านทุกไฟล์รวดเดียว

| ด่าน | อ่านอะไร | เวลา | จบแล้วทำอะไรได้ |
|---|---|---|---|
| **0 · ปฐมนิเทศ** | README นี้ทั้งไฟล์ → `REBUILD_PLAN.md` §1–3 (เป้าหมาย + สถานะ + สถาปัตยกรรม) | ~30 นาที | รู้ว่าแอปทำอะไร ใครใช้ โครงใหญ่ ตอนนี้ทำถึงเฟสไหน |
| **1 · วิธีเขียนหน้า** | `CODE_STRUCTURE.md` ทั้งไฟล์ → ทวน README §5 (เส้นทาง request) + §7.3 (MVVM) | ~45 นาที | สร้างหน้าใหม่ที่ดึงข้อมูลมาแสดง + มีปุ่ม/ฟอร์มได้ |
| **2 · ต่อกับ backend** | `API_CONTRACT.md` §0–3 → `MOCKS.md` | ~30 นาที | เขียน `service` ใหม่ + เขียน mock handler ให้ endpoint นั้นได้ |
| **3 · เฉพาะเรื่อง** *(อ่านตอนถึงงานนั้น)* | ดูตารางด้านล่าง | — | — |

**ด่าน 3 — อ่านเมื่อถึงงาน:**

| จะทำงานเรื่อง... | เปิดอ่าน |
|---|---|
| สร้าง/จัดระเบียบ component ที่ใช้หลายหน้า | `REBUILD_PLAN.md` §6 + `COMPONENT_MAP.md` |
| แตะข้อความบนจอ / เพิ่มภาษา / enum แปลไม่ครบ | `I18N_PLAN.md` |
| แตะ login / session / refresh token / สิทธิ์ | `AUTH_PLAN.md` |
| หาว่ามี entity/field/enum อะไรบ้าง ชื่ออะไร | `INVENTORY.md` *(เปิดหาเป็นจุด ๆ ไม่ต้องอ่านรวด)* |
| อยากรู้ว่าทำไมโปรเจกต์ตัดสินใจแบบนี้ | `PROMPT_HISTORY.md` + `REBUILD_PLAN.md` §8 |

### 9.2 เอกสารทั้งหมด (เรียงตามลำดับที่ควรเจอ)

| ไฟล์ | คืออะไร | เปิดอ่านเมื่อ | ทำไมสำคัญ |
|---|---|---|---|
| **`REBUILD_PLAN.md`** | แผนแม่บท — เป้าหมาย, สถาปัตยกรรม frontend, 8 เฟส, การตัดสินใจ D1–D19 พร้อมเหตุผล | วันแรก / อยากรู้ทำถึงไหน / จะเริ่มเฟสใหม่ | เห็นภาพรวมทั้งโปรเจกต์ในไฟล์เดียว — ทุก decision มี "ทำไม" กำกับ |
| **`CODE_STRUCTURE.md`** | กติกา MVVM — View/ViewModel วางยังไง ตั้งชื่ออะไร แตกไฟล์เมื่อไหร่ + ตัวอย่างเต็ม | ก่อนสร้างหน้า/component ที่มี logic | ทุกหน้าโครงโค้ดเหมือนกัน → เปิดหน้าไหนก็อ่านออกทันที |
| **`API_CONTRACT.md`** | สัญญา REST กับ backend — envelope, params, status, auth, 40 resource, ตัวอย่าง request/response | ก่อนเขียน `service` / `mock` / DTO ใหม่ | frontend + backend + MSW อ้างเอกสารเดียว → ไม่หลุดกัน |
| **`MOCKS.md`** | MSW ทำงานยังไง + handler ที่มี + credential dev + checklist ปิด mock ตอน backend พร้อม | dev โดยไม่มี backend / จะต่อ backend จริง | เตือนว่าข้อมูลที่เห็นตอนนี้เป็นของปลอม + บอกวิธีสลับ |
| **`I18N_PLAN.md`** | ระบบ 2 ภาษา — โครง namespace, การจัดการ enum ที่ DB เก็บเป็นภาษาไทย | เพิ่มภาษา / ข้อความแปลไม่ครบ / งง key | เข้าใจว่าทำไมข้อความอยู่ใน json ไม่อยู่ในโค้ด |
| **`AUTH_PLAN.md`** | auth ฝั่ง frontend — interceptor 401→refresh, idle timeout, cross-tab logout + ตารางว่าอะไรเป็นหน้าที่ frontend/backend | แตะโค้ด login / session / permission | auth ผิด = ช่องโหว่ · ไฟล์นี้กันเข้าใจผิดว่า "ซ่อนปุ่ม = ปลอดภัย" |
| **`INVENTORY.md`** | แจกแจงทุก entity / field / enum / util จากระบบเดิม (fullstack) | ก่อนสร้าง DTO / หน้าใหม่ / หา enum | กันสร้างของซ้ำ + ตั้งชื่อฟิลด์ให้ตรงกับ backend |
| **`COMPONENT_MAP.md`** | ตาราง: component ชื่อนี้ → อยู่ `base`/`shared`/หน้าไหน → ใช้กี่หน้า → split ไหม | หา component / ตัดสินใจสร้างใหม่หรือใช้ของเดิม | *(สร้างตอนเฟส 3)* กัน component ซ้ำซ้อน |
| **`PROMPT_HISTORY.md`** | ไทม์ไลน์การพัฒนา — แต่ละครั้งสั่งอะไร ทำอะไรไป ติดปัญหาอะไร | อยากรู้ที่มาของโค้ด / เฟสไหนเสร็จแล้ว | context การตัดสินใจที่ไม่ได้อยู่ในโค้ดหรือ git log |

### 9.3 มาตรฐานการเขียนเอกสาร (ทุกไฟล์ใหม่ใน `docs/` ทำตามนี้)

1. **กล่องเปิด** (blockquote บนสุด) — บอก 3 อย่าง: *เอกสารนี้คืออะไร · เปิดอ่านเมื่อไหร่ · ทำไมสำคัญ*
2. **"ทำงานยังไง"** — อธิบายเป็นขั้น 1→2→3 + ผัง ASCII ถ้ามี flow (เช่น `cookie → request.ts → messages.json → t()`)
3. **ตัวอย่างโค้ดจริงอย่างน้อย 1 ชุด** — copy ไปใช้ได้เลย ไม่ใช่ pseudo-code
4. **"ทำ ✅ / อย่า ❌"** — ถ้ามี gotcha ที่คนพลาดบ่อย
5. ภาษาไทยเป็นหลัก · ศัพท์เทคนิค + ชื่อไฟล์/ฟังก์ชัน เป็นภาษาอังกฤษ · ตาราง/bullet มากกว่าย่อหน้ายาว

---

## 10. กติกาการเขียนโค้ด

**ทำ ✅**
- หน้าใหม่ = `page.tsx` (บาง) + `use<X>ViewModel.ts` + `<X>View.tsx`
- ข้อความทุกคำผ่าน `t("...")` — เติมทั้ง `th.json` + `en.json`
- เรียก API ผ่าน `services/*` → `http.ts` เท่านั้น
- ใช้ปุ่ม/input จาก `components/base/` ไม่เรียก antd ตรง
- ซ่อนปุ่มด้วย `usePermission(...)` ใน ViewModel
- ตั้งชื่อไฟล์/hook ตาม `CODE_STRUCTURE.md`

**อย่า ❌**
- เขียนข้อความไทย/อังกฤษตรง ๆ ใน `.tsx` (`npm run lint:i18n` จะจับ)
- `fetch`/`axios` ใน `page.tsx` หรือ `*View.tsx`
- `useState`/`useEffect` โหลดข้อมูลใน `*View.tsx` (ย้ายไป ViewModel)
- แก้ `src/models/` (กำลังจะลบ — เป็นของ backend เดิม)
- คิดว่า "ซ่อนปุ่ม = ปลอดภัย"

**ก่อน commit:** `npm run lint` · `npm run lint:i18n` · `npm run build` ต้องผ่านทั้งหมด

---

## 11. คำสั่ง npm

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รัน dev server (hot reload) ที่ `:3000` |
| `npm run build` | build production + เช็ค TypeScript ทั้งโปรเจกต์ |
| `npm run start` | รัน build ที่ทำไว้ |
| `npm run lint` | ESLint |
| `npm run lint:i18n` | เช็คว่าไม่มีข้อความ hard-code นอกไฟล์คำแปล |
