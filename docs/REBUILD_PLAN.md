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

### เฟส 0 — Setup ✅ (2026-08-31) — เพิ่มงานถอน backend
- [x] downgrade + deps + reactCompiler + globals.css + providers + i18n-ready layout
- [ ] **(ใหม่)** ถอน `mongoose`/`bcryptjs`/`jsonwebtoken`/`@types/*` · ลบ `src/models/` · เพิ่ม `NEXT_PUBLIC_API_BASE_URL` + `NEXT_PUBLIC_API_MOCK` ใน `.env.*`

### เฟส 0.5 — i18n foundation ✅ (2026-08-31)

### เฟส 1 — API layer + DTO + contract
1. `docs/API_CONTRACT.md` — ระบุ endpoint, envelope (`{data,meta}`), query params (page/limit/search/filter), error shape, auth endpoints — อิงจาก ~80 API route ต้นทาง (catalog เดิม)
2. `src/lib/http.ts` — axios: `baseURL = process.env.NEXT_PUBLIC_API_BASE_URL`, `withCredentials` (D15) · request interceptor (`Accept-Language` จาก locale) · response interceptor (unwrap envelope, 401→refresh, 403 toast, 409/422 ส่งต่อ, 5xx/network toast)
3. `src/lib/queryClient.ts` + provider ใน `providers.tsx` — `@tanstack/react-query` (D16)
4. `src/types/*` — DTO ต่อ resource (interface ตรงกับ JSON) — เริ่มจากที่ 27 screen ใช้
5. `src/services/<resource>.ts` — ฟังก์ชัน typed ต่อ endpoint (list/get/create/update/remove) เรียก `http.ts`
6. `src/constants/{menuKeys,enumConfig}.ts` + `src/utils/{fieldDiff,promotion,unitContext}.ts` — port pure helpers จากต้นทาง

### เฟส 2 — Auth + app shell
1. `src/lib/authClient.ts` — `login/logout/me/refresh/broadcastLogout`
2. interceptor 401→refresh→redirect (single-flight) + `alert.ts` port
3. `src/hooks/useCurrentUser.ts` (react-query + revalidate on focus) · `src/hooks/useIdleTimeout.ts`
4. `src/context/PermissionsContext.tsx` + `usePermission(key)` (ป้อนจาก `useCurrentUser().menuAccess`)
5. `src/proxy.ts` — cookie-presence guard + `config.matcher` (`/owner/:path*`, `/login`) + set `mmc_locale` จาก `Accept-Language` ถ้ายังไม่มี
6. templates: `components/shared/layout/AuthLayout.tsx` + `OwnerLayout.tsx` + `app/login/layout.tsx` + `app/owner/layout.tsx`
7. cross-tab `BroadcastChannel` + `visibilitychange`

### เฟส 2.5 — Mock API (MSW) — D17
1. `src/mocks/handlers/*.ts` — implement `API_CONTRACT.md` (list/get/create/update/remove + auth) ด้วย `msw`
2. `src/mocks/fixtures/*.ts` — ข้อมูลตัวอย่าง (seed จาก MOCK_* เดิมในต้นทาง + สร้างเพิ่มให้ครบ 27 screen)
3. `src/mocks/browser.ts` + init ใน `providers.tsx` เมื่อ `NEXT_PUBLIC_API_MOCK === "1"` · `src/mocks/server.ts` สำหรับ SSR (ถ้าจำเป็น)
4. `docs/MOCKS.md` — ทุก handler + วิธีปิด (ตั้ง `NEXT_PUBLIC_API_BASE_URL` จริง + `NEXT_PUBLIC_API_MOCK=0`)

### เฟส 3 — Component library
*(เหมือนแผนเดิม — ดู §6)* · `base/` + `shared/<concern>/` + page-local `_components/` · MVVM · ไม่มี literal ข้อความ (i18n) · `COMPONENT_MAP.md`

### เฟส 4 — Screens (27)
แต่ละหน้า: `page.tsx` (บาง) + `<X>View.tsx` + `use<X>ViewModel.ts` — ViewModel เรียก `useQuery`/`useMutation` ผ่าน `src/services/*` — ดู `CODE_STRUCTURE.md` + ตาราง §7
- ทำ 27 screen ใน reference (D5) · ข้อมูลจาก MSW จนกว่า backend พร้อม

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
