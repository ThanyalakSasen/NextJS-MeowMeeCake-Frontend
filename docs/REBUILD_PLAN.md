# แผนโปรเจกต์ `NextJS-MeowMeeCake-Frontend` — **Frontend อย่างเดียว**

> **เอกสารนี้คืออะไร:** แผนแม่บท — เป้าหมาย, สถาปัตยกรรม, 8 เฟสของงาน, และการตัดสินใจทั้งหมด (D1–D19) พร้อมเหตุผล
> **เปิดอ่านเมื่อ:** วันแรกที่เข้าโปรเจกต์ · อยากรู้ว่าตอนนี้ทำถึงเฟสไหน · จะเริ่มเฟสใหม่ · สงสัยว่าทำไมเลือกแนวทางนี้
> **ทำไมสำคัญ:** เป็นแหล่งอ้างอิงเดียวของ "ทำอะไร ทำไม และลำดับไหน" — เฟสที่เสร็จแล้วมี ✅ + สรุปว่าทำอะไรไป
> **วิธีอ่าน:** §1–3 = ภาพรวม (อ่านก่อน) · §5 = รายละเอียดแต่ละเฟส · §8 = การตัดสินใจ (เปิดหาเป็นจุด ๆ)
>
> อัปเดตล่าสุด: 2026-09-01
> **PIVOT (2026-09-01):** โปรเจกต์นี้เป็น **frontend เท่านั้น** — backend แยกเป็นอีกโปรเจกต์ เชื่อมผ่าน REST API · ตัดส่วน backend ทั้งหมด (mongoose models, controllers, `app/api/*`, JWT signing, dbConnect ฯลฯ)

**เอกสารในชุด `docs/`:**
- `REBUILD_PLAN.md` (นี้) — แผนรวม + การตัดสินใจ D1–D19
- `API_CONTRACT.md` — สัญญา REST ที่ frontend คุยกับ backend (สร้างเฟส 1)
- `I18N_PLAN.md` — i18n 2 ภาษา (เฟส 0.5 ✅)
- `CODE_STRUCTURE.md` — MVVM: View + ViewModel (D10)
- `AUTH_PLAN.md` — auth ฝั่ง frontend (interceptor / refresh / idle) — §FRONTEND PIVOT
- `INVENTORY.md` — DTO / constant / util — §FRONTEND PIVOT
- `MOCKS.md` — mock API ด้วย MSW (D17)
- `COMPONENT_MAP.md` — (เฟส 3) map component → ที่วาง → ไฟล์ต้นทาง
- `PROMPT_HISTORY.md` — ประวัติคำสั่ง

---

## 1. เป้าหมาย

| ประเด็น | รายละเอียด |
|---|---|
| ต้นทาง (feature/layout reference) | `D:\Cream\MeowMeeCake\-MeowMeeCake-NextJS5` (fullstack Next.js เดิม) |
| โปรเจกต์นี้ | `D:\Cream\MeowMeeCake-Frontend\NextJS-MeowMeeCake-Frontend` — **frontend only** |
| Backend | โปรเจกต์แยก (ยังไม่มี) — frontend เรียกผ่าน REST ตาม `API_CONTRACT.md` |
| Component reference | `D:\Cream\MeowMeeCake_Components.html` (18 Atoms / 40 Molecules / 53 Organisms / 5 Templates / 8 Global / 27 Screens) |
| จุดประสงค์ | feature + layout เหมือนต้นทาง 1:1 · จัด component เป็น library (reuse-based, D8) · i18n 2 ภาษา · MVVM (D10) · **ไม่มีโค้ด server-side นอกจาก Next rendering + proxy guard บาง ๆ** |

---

## 2. สถานะปัจจุบัน (2026-09-01)

**เสร็จแล้ว (เฟส 0 + 0.5):**
- Next 16.2.6 / React 18.3.1 / antd 6.6.2 / Tailwind 4 / `reactCompiler:true`
- i18n: `next-intl@4.14.1` (cookie `mmc_locale`, no URL routing) · `src/i18n/*` + `messages/{th,en}.json` · `providers.tsx` antd/dayjs locale-aware · `LocaleSwitcher` · `scripts/check-i18n.mjs`
- app shell: `layout.tsx` (async, `NextIntlClientProvider`, `<html lang>`) · `globals.css` ธีมกาแฟ · `page.tsx` placeholder

**ต้องลบ (backend residue จาก clone):**
- `src/models/*` — 38 mongoose model → **ลบ** (แทนด้วย DTO ใน `src/types/`)
- deps: `mongoose`, `bcryptjs`, `jsonwebtoken`, `@types/bcryptjs`, `@types/jsonwebtoken` → **ถอน**
- โฟลเดอร์ว่าง `src/lib` `src/constants` `src/mocks` (residue เฟส 1 เดิมที่ revert) → เติมใหม่ตามแผนนี้

**ยังไม่มี:** `src/lib/http.ts`, `src/services/*`, `src/types/*` (DTO), `src/context`, `src/hooks`, `src/proxy.ts`, component library, 27 screens

---

## 3. สถาปัตยกรรมเป้าหมาย (frontend only)

```
Browser ──HTTP──> Next.js (โปรเจกต์นี้: SSR/CSR + proxy guard บาง ๆ)
                     │
                     └── axios (src/lib/http.ts) ──REST──> Backend API (โปรเจกต์แยก)
                                                             /auth/*  /products  /orders ...
```

```
src/
  app/
    layout.tsx · providers.tsx · page.tsx · globals.css
    login/           (AuthLayout)
    owner/
      layout.tsx     (OwnerLayout: Sidebar+Navbar+PermissionsProvider+idle)
      <27 screens>
  proxy.ts           ← guard บาง ๆ: เช็ค "มี" auth cookie ไหม (ไม่ verify JWT, ไม่แตะ DB) — D18
  lib/
    http.ts          ← axios instance (baseURL = NEXT_PUBLIC_API_BASE_URL) + interceptors
    authClient.ts     ← login / logout / me / refresh / broadcastLogout
    queryClient.ts    ← @tanstack/react-query config (D16)
    alert.ts          ← sweetalert2 wrapper (port)
    exportCsv.ts      ← client CSV (port)
  services/           ← 1 ไฟล์/resource — เรียก http.ts, คืน DTO (ViewModel เรียกใช้)
  types/              ← API DTO (interface ตรงกับ JSON ของ backend — ดู API_CONTRACT.md)
  constants/
    menuKeys.ts       ← MenuKey, resolveMenuKey, isUnrestrictedRole (port, pure)
    enumConfig.ts     ← สี/flow ของ enum (ไม่มี label — label อยู่ i18n)
  utils/
    fieldDiff.ts      ← formatFieldValue + computeFieldDiff (port, สำหรับ userLog)
    promotion.ts      ← isPromotionCurrentlyValid / calcPromotionDiscount (port, POS preview)
    unitContext.ts    ← isIngredientUnit / isProductUnit (port)
  i18n/               ← ✅ เฟส 0.5
  context/            ← PermissionsContext + usePermission
  hooks/              ← useCurrentUser · useIdleTimeout · shared hooks
  components/
    base/             ← atoms (antd wrapper / primitive)
    shared/ layout|data|feedback|stats|charts|form
  mocks/              ← MSW handlers + fixtures (D17) — ปิดได้ด้วย env
```

**ไม่มีในโปรเจกต์นี้แล้ว:** `src/models/`, `src/controllers/`, `src/app/api/**`, `dbConnect`, `createCrudController`, server-side `session.ts` (JWT signing), `menuAccess.ts` (DB), `omise.ts` → **ทั้งหมดเป็นหน้าที่ backend**

---

## 4. Auth ฝั่ง frontend (สรุป — เต็มใน `AUTH_PLAN.md`)

- **Backend เป็นเจ้าของ**: ตรวจรหัสผ่าน, ออก/เซ็น/หมุน JWT, อายุ token, brute-force lockout, permission source of truth
- **Frontend ทำ**:
  - `authClient.login()` → `POST {API}/auth/login` → backend set cookie / คืน token (ตาม D15)
  - `useCurrentUser()` → `GET {API}/auth/me` → `{ user, roleName, menuAccess }` → ป้อน `PermissionsContext`
  - interceptor 401 → เรียก `POST {API}/auth/refresh` ครั้งเดียว (single-flight) → สำเร็จ replay / ล้มเหลว → `logout()` + redirect `/login?reason=expired` (D12)
  - `useIdleTimeout` → เตือน 60 วิ ก่อน idle หมด → ไม่ตอบ → logout (D11 — ค่าเวลาจริงอยู่ที่ backend, frontend แค่ UX + หยุดเรียก refresh)
  - cross-tab `BroadcastChannel("mmc-auth")` + `visibilitychange` → revalidate
  - `proxy.ts` = เช็คว่ามี auth cookie ไหม (เร็ว, กัน logged-out) — **ไม่** verify signature, **ไม่** เช็ค `can_view` (ย้ายไป client `usePermission`) — D18

---

## 5. เฟส

### เฟส 0 — Setup ✅ (2026-08-31) + ถอน backend ✅ (2026-09-01)
- [x] downgrade + deps + reactCompiler + globals.css + providers + i18n-ready layout
- [x] ถอน `mongoose`/`bcryptjs`/`jsonwebtoken`/`@types/bcryptjs`/`@types/jsonwebtoken` · เพิ่ม `@tanstack/react-query@5` · ลบ `src/models/` (38 ไฟล์) · `.env.*` → `NEXT_PUBLIC_API_BASE_URL` + `NEXT_PUBLIC_API_MOCK` (ตัด env backend ทิ้ง) · เพิ่ม `.gitattributes` · `npm install` (532 pkg)

### เฟส 0.5 — i18n foundation ✅ (2026-08-31)

### เฟส 1 — API layer + DTO + contract  ✅ **เสร็จ 2026-09-01** (`build` + `lint` + `lint:i18n` ผ่าน)
> ทำจริง:
> 1. `docs/API_CONTRACT.md` — ✅ (เขียนก่อนหน้า + เพิ่ม §0 ตัวอย่างเต็ม + §6 โค้ดจริง 4 ชั้น)
> 2. `src/types/api.ts` — `ListResponse<T>` · `ItemResponse<T>` · `EmptyResponse` · `ListMeta` · `ListParams` · `ApiError` + `isApiError()`
> 3. `src/types/auth.ts` — `MenuAction` · `MenuAccess` · `CurrentUser` · `LoginInput` · `src/types/index.ts` (`BreadcrumbItem.labelKey`, `NotificationItem`, re-export)
> 4. `src/constants/menuKeys.ts` — port (`MenuKey`, `ALL_MENU_KEYS`, `MenuPermissionSet`, `FULL/NO_MENU_ACCESS`, `resolveMenuKey`, `isUnrestrictedRole`) · `src/constants/enumConfig.ts` — สี/flow enum (ไม่มี label)
> 5. `src/lib/cookies.ts` (readCookie/writeCookie, SSR-guard) · `src/lib/http.ts` — axios instance + `withCredentials` (D15) + request interceptor (`Accept-Language`) + response interceptor (แปลง error → `ApiError`, 401 → `setUnauthorizedHandler` hook สำหรับเฟส 2) + facade `http.get/post/patch/delete<T>` คืน body ตรง
> 6. `src/lib/queryClient.ts` — `makeQueryClient()` (staleTime 30s, retry เฉพาะ network/5xx) · wire `<QueryClientProvider>` ใน `providers.tsx` (D16)
> 7. `src/lib/alert.ts` — port (sweetalert2, default เป็น English fallback — ผู้เรียกส่ง `t()`) · `src/lib/exportCsv.ts` — port
> 8. **reference pattern:** `src/types/product.ts` + `src/services/products.ts` + `src/services/README.md` (แพตเทิร์นให้ resource อื่น copy)
> 9. `scripts/check-i18n.mjs` — allow `src/constants`
>
> **เลื่อนไปเฟสที่มี consumer:** `src/utils/{fieldDiff,promotion,unitContext}` → เฟส 4 (fieldDiff คู่ userLog · promotion คู่ POS + ต้อง refactor reason เป็น code แทนข้อความไทย · unitContext คู่ units/ingredients) · DTO + service ของ resource อื่น (Order, Recipe, ...) → เฟส 4 คู่ screen (copy จาก products)

### เฟส 2 — Auth + app shell  ✅ **เสร็จ 2026-09-01** (`build` + `lint` + `lint:i18n` ผ่าน · runtime ทดสอบไม่ได้จน MSW เฟส 2.5)
> ทำจริง:
> - `src/constants/auth.ts` (`AUTH_COOKIE` จาก `NEXT_PUBLIC_AUTH_COOKIE` default `mmc_session`, `LOGIN_PATH`/`HOME_PATH`/`ACCESS_DENIED_PATH`, `AUTH_BROADCAST_CHANNEL`) · `src/constants/session.ts` (`IDLE_TIMEOUT_MS` 30 นาที, `IDLE_WARN_MS` 60 วิ, `ACTIVITY_EVENTS`)
> - `src/lib/authClient.ts` — `me/login/logout/refresh` (single-flight) · `onAuthBroadcast` (BroadcastChannel) · `installAuthInterceptor(onFail)` ต่อ 401 hook ของ `http.ts` → refresh → retry request เดิม / fail → `onFail`
> - `src/hooks/useCurrentUser.ts` (react-query `["auth","me"]`, retry:false, refetchOnWindowFocus) · `src/hooks/useIdleTimeout.ts` (throttle 5 วิ, latest-ref pattern)
> - `src/context/PermissionsContext.tsx` — `PermissionsProvider` + `usePermission(key)` (fail closed = `NO_MENU_ACCESS`) + `useMenuAccess()`
> - `src/proxy.ts` — เช็ค `AUTH_COOKIE` presence (D18): `/owner/*` ไม่มี → redirect `/login?next=` · `/login` มี → redirect `/owner/dashboard` · ตั้ง `mmc_locale` จาก `Accept-Language` ถ้ายังไม่มี · matcher `["/owner/:path*","/login"]`
> - `src/components/shared/layout/AuthLayout.tsx` (centered) · `OwnerLayout.tsx` (client — `useCurrentUser` gate + `useIdleTimeout` + warn modal ผ่าน `confirmAlert` + `PermissionsProvider` + **placeholder** Sidebar/Navbar → เฟส 3 ใส่ของจริง)
> - `src/components/providers/AuthBootstrap.tsx` — mount ใน `providers.tsx`: `installAuthInterceptor` (fail → `qc.clear()` + redirect) + ฟัง logout ข้ามแท็บ
> - route: `app/page.tsx` (redirect ตาม cookie) · `app/login/{layout,page}.tsx` (login form interim — เฟส 4 = Screen #1 เต็ม) · `app/owner/layout.tsx` (re-export OwnerLayout) · `app/owner/dashboard/page.tsx` (stub)
>
> **ยังไม่ทำ:** `visibilitychange` เพิ่ม explicit (react-query `refetchOnWindowFocus` ครอบอยู่แล้ว) · access-denied page → เฟส 4

### เฟส 2.5 — Mock API (MSW) — D17  ✅ **เสร็จ 2026-09-01** (`build` + `lint` + `lint:i18n` ผ่าน · proxy/routing curl-verified · MSW auth flow ต้องเทสในเบราว์เซอร์)
> ทำจริง:
> - ติดตั้ง `msw@2.15` (devDep) + `npx msw init public/` → `public/mockServiceWorker.js` + `package.json` `msw.workerDirectory`
> - `src/mocks/db.ts` — store กลาง: `seed` + `list` (page/limit/search/sort/filter ตรงตัว) / `getById` / `create` / `update` / `softDelete`
> - `src/mocks/handlers/_crud.ts` — `crudHandlers(name, basePath)` factory ตาม `API_CONTRACT.md` §3
> - `src/mocks/handlers/auth.ts` — `/auth/login|logout|me|refresh` · login = `DEV_CREDENTIALS` (`owner@meowmeecake.local` / `owner1234`) · ตั้ง/ล้าง cookie `mmc_session` ผ่าน `document.cookie` (ให้ `proxy.ts` Node อ่านเจอ)
> - `src/mocks/fixtures/{auth,products}.ts` · `handlers/index.ts` (seed + รวม) · `browser.ts` (`startMockWorker` single-flight) · `server.ts` (test — ยังไม่ใช้)
> - `src/components/providers/MSWReady.tsx` — mock on → รอ worker start ก่อน render children · mock off → `msw` ไม่เข้า bundle (dynamic import) · wire ใน `providers.tsx` (ครอบ `{children}`)
> - `proxy.ts` — เพิ่ม `/` เข้า matcher + redirect ที่ proxy (redirect ใน `page.tsx` เป็น meta-refresh ตอน streaming — Next 16 behavior)
> - `eslint.config.mjs` — ignore `public/mockServiceWorker.js`
> - `docs/MOCKS.md` — อัปเดตสถานะ + credential + วิธีเพิ่ม resource
>
> **curl verified:** `/` no-cookie → 307 `/login` · `/` cookie → 307 `/owner/dashboard` · `/owner/*` no-cookie → 307 `/login?next=` · `/login` cookie → 307 `/owner/dashboard` · `mockServiceWorker.js` เสิร์ฟ 200
> **ยังไม่ได้เทส (ต้องเบราว์เซอร์):** login form → MSW `/auth/login` → cookie → `/auth/me` → dashboard render — ทำในเฟส 6 หรือ `npm run dev` เทสมือ

### เฟส 3 — Component library  ✅ **แกนหลักเสร็จ 2026-09-01** (`build` + `lint` + `lint:i18n` ผ่าน · SSR shell curl-verified)
> ทำจริง:
> - **`base/` (19 atoms)** — Button, Input, PasswordInput, InputNumber, Select, Switch, Tag, Badge, Spinner, Divider, DatePicker/RangePicker, Avatar (+`initialsOf`), DotIndicator, ProgressBar, Card, Logo, EmptyState, ErrorMessage, LocaleSwitcher + `index.ts` barrel
> - **`shared/layout/`** — AuthLayout, **OwnerLayout** (rewrite: Sidebar+Navbar จริง + mobile drawer), Sidebar (กรอง permission ผ่าน `useMenuAccess`), MenuGroupItem, Navbar, BreadcrumbTrail, NotificationDropdown, NotificationItem, UserMenuDropdown, ListPageLayout
> - **`shared/feedback/`** LoadingSpin · ConfirmDeletePopup · **`shared/stats/`** StatCard · StatCardsGrid · StatusBadge (enumConfig + i18n) · **`shared/data/`** SearchInput · PaginationBar
> - `src/constants/menu.ts` (โครงเมนู labelKey) · `src/constants/breadcrumb.ts` (`buildBreadcrumbs`)
> - **notifications vertical:** `types/notification.ts` · `services/notifications.ts` · `hooks/useNotifications.ts` · `mocks/fixtures/notifications.ts` + handler (crud)
> - i18n: เพิ่ม `notifications.title` / `notifications.viewAll` (th+en) · `docs/COMPONENT_MAP.md`
>
> **เลื่อนไป เฟส 4 (shape จาก consumer แรก):** `data/{DataTable,FilterToolbar,TypeTabBar,SortDropdown,ViewToggle,AutoCompleteSearch}` · `feedback/DetailDrawer` · `charts/*` · `stats/KPIStatsRow` · `form/*` · `layout/{TabbedPageLayout,DashboardPageLayout}` · **page-local `_components/` ทั้งหมด**

### เฟส 4 — Screens (27)  🔄 **กำลังทำ** (5/27 + foundation — 2026-09-01)
แต่ละหน้า: `page.tsx` (บาง) + `<X>View.tsx` + `use<X>ViewModel.ts` — ViewModel เรียก `useQuery`/`useMutation` ผ่าน `src/services/*` — ดู `CODE_STRUCTURE.md` + ตาราง §7

> **เสร็จรอบนี้:**
> - **shared components ที่ Products บังคับให้เกิด:** `data/DataTable` (ตาราง generic: columns/loading/empty/rowAction/pagination, ใช้ `.data-table` CSS) · `data/FilterToolbar` · `data/TypeTabBar` · `data/SortDropdown` · `data/ViewToggle`
> - **product-categories vertical:** `types/productCategory.ts` · `services/productCategories.ts` · fixture + handler
> - **Screen #1 Login** ✅ — `login/_components/LoginForm.tsx` (Logo + `base/` + ErrorMessage) แทน interim
> - **Screen #3 Products List** ✅ — grid/table toggle · filter · toggle visibility + delete · pagination · **= reference หน้ารายการ**
> - **Screen #4 Add Product + #5 Edit Product** ✅ — **ใช้ antd `<Form>`** (ไม่ใช้ 3rd party — ดู `CODE_STRUCTURE.md §5.5`) · `base/Form` (wrap `Form`/`Form.Item`) · `shared/form/{FormField,UploadImageBox}` · `products/productForm.ts` (pure: `emptyProductForm`/`fromProduct`/`toInput`) · `_components/ProductFormFields.tsx` (`<FormItem rules>` ครอบ base/ input) · VM ถือแค่ `initialValues`+`onSubmit(values)` (Form ถือ state+validate) · edit render Form หลัง `useQuery` โหลดเสร็จ → ไม่มี effect/lint hack · **= reference หน้าฟอร์ม**
> - units vertical: `types/unit.ts` · `services/units.ts` · fixture + handler · `base/Input` เพิ่ม `TextArea`
> - i18n: `products.*` + `validation.{required,positive,nonNegative}` + `products.saleLtPrice` (th+en) · **แนวใหม่: `t` เดียว key path เต็ม + `messages.d.ts` type-safe + `lint:i18n` เช็ค key parity**
> - smoke: SSR ทั้ง 4 route ไม่ crash · MSW auth/data ต้องเทสในเบราว์เซอร์
>
> **เพิ่มรอบ 2026-09-01 (b):**
> - **Screen #2 Dashboard** ✅ — `DashboardPageLayout` (shared) · aggregate 1 query `GET /reports/dashboard` (ViewModel ไม่ประกอบเอง) · `types/dashboard.ts` + `services/reports.ts` + `mocks/fixtures/dashboard.ts` + `mocks/handlers/reports.ts` (custom handler ไม่ใช่ crudHandlers) · 4 widget presentational ใน `_components/` (RecentOrders/LowStock/TopProducts/ProductionStatus) ใช้ `.section-card`/`.stock-item`/`.product-item`/`.production-item` CSS + `StatusBadge` + `StatCard` · i18n `dashboard.*` (th+en) · verified ในเบราว์เซอร์ (MSW 200)
> - **theme refresh** — `globals.css` + `palette.ts` (neutral) + `tokens.ts` (layout mirror): shell โทนอุ่นขึ้น (sidebar tint `brown-50` + accent bar เมนู active), เส้นขอบ/พื้น warm, การ์ดมีเงา `--shadow-card`, sidebar-width → `17rem`, navbar → `4rem`, เพิ่ม `--content-max` 1400px, เอา `bg-pink-300` ออกจาก product bar
>
> **เหลือ 22 screen** — copy pattern: list→Products · form→Add Product · dashboard→Dashboard:
> Product Stock · Manage Orders · POS · Ingredients List · Ingredient Stock · Ingredient History · Manage Units · Production (3 tab) · Recipes · Employees List · Add/Edit Employee · Permissions · User Log · Attendance · Finance Expenses · Finance P&L · Store Design · Notification History · Access Denied

### เฟส 5 — Wiring
- `app/layout.tsx` → `NextIntlClientProvider` + `Providers` (antd + react-query + MSW init)
- `app/login/layout.tsx` → `AuthLayout` · `app/owner/layout.tsx` → `OwnerLayout` (breadcrumb + `useCurrentUser` + `useIdleTimeout` + notifications)
- `app/page.tsx` → redirect ตามการมี auth cookie
- `src/proxy.ts`
- `PermissionsProvider` + gate ปุ่ม/เมนู `usePermission`

### เฟส 6 — Verify
- `lint` · `build` · `lint:i18n` ผ่าน
- MVVM: ไม่มี fetch/data-`useEffect` ใน `*View.tsx` / `page.tsx`
- สลับ locale th↔en เดินครบ 27 screen
- เทียบ `MeowMeeCake_Components.html`: shared component มาจาก library ตัวเดียว
- auth: 401→refresh เนียน · idle→warn→logout · logout แท็บเดียว→ทุกแท็บ
- **สลับ MSW ออก → ชี้ `NEXT_PUBLIC_API_BASE_URL` ไป backend จริง → smoke test ตาม `API_CONTRACT.md`**

---

## 6. Component library — reuse-based (D8)

*(ไม่เปลี่ยนจากแผนเดิม)*

```
src/components/
  base/     Button, Input, PasswordInput, InputNumber, Select, Switch, Badge, Tag,
            ProgressBar, Avatar, Spinner, DotIndicator, Icon, Divider, ErrorMessage,
            EmptyState, DatePicker, Logo, Card, LocaleSwitcher
  shared/
    layout/    OwnerLayout, AuthLayout, ListPageLayout, TabbedPageLayout, DashboardPageLayout,
               Navbar, Sidebar, MenuGroupItem, BreadcrumbItem, NotificationDropdown,
               NotificationItem, UserMenuDropdown
    data/      DataTable, FilterToolbar, SearchInput, TypeTabBar, SortDropdown, ViewToggle,
               PaginationBar, AutoCompleteSearch
    feedback/  LoadingSpin, ConfirmDeletePopup, DetailDrawer
    stats/     StatCard, StatCardsGrid, StatusBadge, KPIStatsRow
    charts/    RevenueBarChart, AnalyticsBarChart
    form/      FormField, UploadImageBox, ToggleRow, MonthSelector, PasswordShuffleButton,
               AvatarUploader
app/owner/<route>/_components/   ← ที่ใช้ screen เดียว (ดูรายการในแผนเดิม/COMPONENT_MAP)
```

**กติกา:** UI ล้วน→`base/` · ≥2 screen→`shared/<concern>/` · 1 screen→`_components/` · consumer ที่ 2→promote
**เกณฑ์ผ่าน:** ไม่มี literal ข้อความ (i18n) · component มี logic → split View+ViewModel

---

## 7. ตาราง Screens (27)

*(ไม่เปลี่ยน — route/template/component เฉพาะหน้า เหมือนแผนเดิม)*

| # | Screen | Route | Template | Component เฉพาะหน้า |
|---|---|---|---|---|
| 1 | Login | `/login` | AuthLayout | LoginForm, PasswordInput, Logo |
| 2 | Dashboard | `/owner/dashboard` | DashboardPageLayout | RecentOrdersWidget, LowStockWidget, TopProductsWidget, ProductionStatusWidget |
| 3 | Products List | `/owner/products` | ListPageLayout | ProductCard, ProductGrid, CategoryChip, ViewToggle, SortDropdown, RatingDisplay |
| 4 | Add Product | `/owner/products/addProducts` | (form) | ProductFormFields |
| 5 | Edit Product | `/owner/products/[id]/edit` | (form) | ProductFormFields |
| 6 | Product Stock | `/owner/products/productStock` | ListPageLayout | AdjustStockModal, StockProgressRow |
| 7 | Manage Orders | `/owner/orders/manageOrders` | ListPageLayout | OrderStatusFilter, PaymentSlipPreview, OrderLifecycleSteps |
| 8 | POS — In-Store | `/owner/orders/OrderInStore` | (custom 2-pane) | ProductPickerGrid, CartPanel, QRPaymentModal |
| 9 | Ingredients List | `/owner/ingredients` | ListPageLayout | IngredientFormModal |
| 10 | Ingredient Stock Mgmt | `/owner/ingredients/ingredientStock` | (custom) | ReceiveModal, AdjustModal, BulkReceiveModal, IngredientStockCard, AutoCompleteSearch |
| 11 | Ingredient History | `/owner/ingredients/ingredientHistory` | (custom) | TransactionTimeline, HistoryItemCard, AnalyticsBarChart, LogTransactionModal |
| 12 | Manage Units | `/owner/ingredients/units` | (2-col) | UnitListCard, UnitFormModal |
| 13 | Production — Plan | `/owner/production?tab=plan` | TabbedPageLayout | ProductionOrderForm, ProductionStatCards |
| 14 | Production — Status Board | `/owner/production?tab=status` | TabbedPageLayout | KanbanBoard, ProductionOrderCard |
| 15 | Production — History | `/owner/production?tab=history` | TabbedPageLayout | RevenueBarChart, AnalyticsBarChart, TeamPerformanceCard |
| 16 | Recipes | `/owner/recipes` | ListPageLayout (2 tab) | RecipeCard, MainRecipeModal, SubRecipeModal, DetailDrawer, IngredientEditor, StepEditor |
| 17 | Employees List | `/owner/employees` | ListPageLayout | — (component กลางล้วน) |
| 18 | Add Employee | `/owner/employees/addEmployee` | (form) | EmployeeFormSections, AvatarUploader, ToggleRow, EmployeeSummaryCard, PasswordShuffleButton |
| 19 | Edit Employee | `/owner/employees/editEmployee` | (form) | + MetaChips, DangerZone |
| 20 | Permissions Mgmt | `/owner/employees/permissions` | (2-pane) | RoleList, PermissionCollapseSection, PermissionCheckboxGroup, RoleFormModal |
| 21 | User Activity Log | `/owner/employees/userLog` | ListPageLayout | DetailDrawer |
| 22 | Attendance | `/owner/attendance` | (custom) | ClockDisplay, CheckInOutButtons, AttendanceHistoryTable |
| 23 | Finance — Expenses | `/owner/finance/expenses` | ListPageLayout | ExpenseForm, CategoryBreakdownBar, RecurringReminderList, MonthSelector, ReceiptImagePreview |
| 24 | Finance — P&L Summary | `/owner/finance/summary` | (custom) | PLStatementTable, KPIStatsRow, RevenueBarChart, ProductRevenueTable, PeriodSelector |
| 25 | Store Design — Banners | `/owner/store-design` | ListPageLayout | BannerCard, BannerFormModal, BannerGrid |
| 26 | Notification History | `/owner/notificationsHistory` | ListPageLayout | DetailDrawer |
| 27 | Access Denied | `/owner/access-denied` | (none) | AccessDeniedCard |

---

## 8. การตัดสินใจ

### เดิม (ยังใช้)
| # | ผล |
|---|---|
| D1 | Next 16.2.6 / React 18.3.1 ✅ |
| D3 | `reactCompiler: true` ✅ |
| D4 | Tailwind ล้วน, ไม่เอา `@material-tailwind/react` ✅ |
| D5 | ทำ 27 screen ใน reference ก่อน |
| D7 | เอกสารใน `docs/` |
| D8 | component: `base/` + `shared/` + page-local `_components/` ✅ |
| D9 | i18n = `next-intl` (cookie, no routing) · DB-enum แนวทาง A ✅ |
| D10 | MVVM: `page.tsx` + `View` + `ViewModel` |

### เปลี่ยน/ยกเลิกจาก pivot
| # | เดิม | ตอนนี้ |
|---|---|---|
| D2 | 5 model CRLF | **ยกเลิก** — `src/models/` ถูกลบทั้งหมด |
| D6 | mock DB layer | **แทนด้วย D17** (MSW) |
| D11 | short token + refresh + cap (frontend คุมเวลา) | **backend คุมเวลา** · frontend = interceptor refresh + idle warn เท่านั้น |
| D12 | 401 → refresh ก่อน redirect | คงไว้ (interceptor) |
| D13 | cookie `sameSite=lax` | ขึ้นกับ D15 (cross-origin อาจต้อง `none`) |
| D14 | `requireSession` ทุก GET | **ย้ายไป backend** — ไม่ใช่หน้าที่ frontend |

### ใหม่ (pivot — **ค่าแนะนำ รอยืนยัน**)
| # | หัวข้อ | ตัวเลือก | แนะนำ |
|---|---|---|---|
| **D15** | Auth transport กับ backend แยก origin | (a) httpOnly cookie + CORS credentials · (b) access token ใน memory + `Authorization` header, refresh token ใน httpOnly cookie · (c) token คู่ ใน httpOnly cookie | **(a)** ถ้า backend เป็น subdomain เดียวกัน (`api.` / `app.`) → cookie `SameSite=Lax` · ถ้า cross-origin จริง → **(b)** · abstract ไว้ใน `http.ts`+`authClient.ts` สลับได้ |
| **D16** | Server-state / data fetching | (a) manual (useState ใน ViewModel) · (b) `@tanstack/react-query` · (c) `swr` | **(b)** — 27 screen × หลาย hook ต้อง loading/error/cache/refetch/invalidate เอง = boilerplate เยอะ · ViewModel wrap `useQuery`/`useMutation` |
| **D17** | Mock ระหว่าง backend ยังไม่พร้อม | (a) **MSW** (Mock Service Worker) · (b) route-handler mock ใน frontend · (c) axios mock adapter | **(a) MSW** — intercept ที่ network layer, contract-first, `NEXT_PUBLIC_API_MOCK` toggle, ลบสะอาด |
| **D18** | `proxy.ts` (edge guard) | (a) ลบทิ้ง (client guard อย่างเดียว) · (b) เช็ค "มี" auth cookie เท่านั้น · (c) verify JWT signature ด้วย `jose` + shared key | **(b)** — กัน logged-out เร็ว ๆ โดยไม่ผูกกับ internal ของ backend · `can_view` ต่อ route → client `usePermission` |
| **D19** | ลบ backend residue | — | **ลบ** `src/models/` (38) · ถอน `mongoose`/`bcryptjs`/`jsonwebtoken`/`@types/*` · `src/types/` = API DTO |

---

## 9. ความเสี่ยง / ข้อควรระวัง

- **API contract ยังไม่นิ่ง** — backend เป็นโปรเจกต์ใหม่ · เขียน `API_CONTRACT.md` เป็นข้อตกลง แล้ว MSW implement ตามนั้น · ถ้า backend จริงต่างจาก contract → แก้ที่ `services/` + `types/` จุดเดียว
- **CORS + cookie cross-origin** (D15) — ถ้า backend คนละ origin: cookie ต้อง `SameSite=None; Secure`, frontend `withCredentials`, backend `Access-Control-Allow-Credentials: true` + origin ระบุชัด (ห้าม `*`)
- **Next.js เวอร์ชันนี้ต่างจากที่รู้จัก** — อ่าน `node_modules/next/dist/docs/` ก่อนแตะโค้ด (proxy vs middleware ✅ ตรวจแล้ว, `params` เป็น Promise, `PageProps<>`)
- component ต้นทางผูกกับ CSS class ใน `globals.css` — port CSS พร้อม component
- `reactCompiler:true` — build ช้าลงบ้าง (ใช้ Babel)
- base64 image (`product_img`) — backend ควรมี list projection ตัดออก · frontend ขอทีละชิ้นตอนต้องใช้รูป
- react-query + SSR (Next App Router) — ระวัง hydration · ใช้ `HydrationBoundary` หรือ fetch ฝั่ง client อย่างเดียวในรอบแรก

---

## 10. ลำดับลงมือ

1. **เฟส 0 (ปิดงานค้าง)** — ถอน backend deps + ลบ `src/models/` + เพิ่ม `NEXT_PUBLIC_API_*` env
2. **เฟส 1** — `API_CONTRACT.md` + `http.ts` + `queryClient` + `types/` DTO + `services/` + `constants/` + `utils/`
3. **เฟส 2** — `authClient` + interceptor + `useCurrentUser`/`useIdleTimeout` + `PermissionsContext` + `proxy.ts` + `AuthLayout`/`OwnerLayout`
4. **เฟส 2.5** — MSW handlers + fixtures (D17)
5. **เฟส 3** — component library
6. **เฟส 4** — 27 screens
7. **เฟส 5** — wiring → **เฟส 6** — verify (+ ชี้ backend จริง)
