# Screen Map — สถานะการ wire ของ 27 หน้า

> **เอกสารนี้คืออะไร:** ความจริงเรื่อง **reachability/wiring** ของแต่ละหน้า — มี route ไหม เข้าถึงได้ทางไหน (sidebar/ปุ่ม/redirect) มี menuKey/permission/breadcrumb/i18n ครบไหม
> **เปิดอ่านเมื่อ:** ก่อนเริ่ม/หลังจบ screen ใดในเฟส 4 · สงสัยว่าทำไมกดเมนูแล้วไปหน้าอื่น/404 · เช็คว่าลืมต่อสายอะไรไหม
> **ความสัมพันธ์กับเอกสารอื่น:** `REBUILD_PLAN.md` §7 = route/template/component ต่อหน้า (ของ "จะสร้างอะไร") · `COMPONENT_MAP.md` = ทะเบียน component (ของ "component อยู่ไหน") · **เอกสารนี้ = เข้าถึงหน้านั้นได้จริงหรือยัง**
>
> อัปเดตล่าสุด: 2026-09-02 (10/27 ✅)

---

## 1. Checklist "หน้าถูก wire แล้ว"

หน้าหนึ่งนับว่า **wired** เมื่อครบทุกข้อ:

- [ ] มี folder + `page.tsx` ใต้ `src/app/…`
- [ ] `page.tsx` บาง — แยก `<X>View.tsx` + `use<X>ViewModel.ts` ตาม `CODE_STRUCTURE.md` (ยกเว้นหน้าจิ๋วยุบไฟล์เดียวได้)
- [ ] **เข้าถึงได้จริง**: มี leaf ใน `src/constants/menu.ts` **หรือ** ระบุ entry point อื่นชัดเจน (ปุ่ม, row action, navbar, redirect)
- [ ] `resolveMenuKey()` (`src/constants/menuKeys.ts` → `ROUTE_MENU_MAP`) คืน menuKey ได้ตรงกับที่ตั้งใจ **หรือ** ระบุว่า login-only โดยตั้งใจ
- [ ] ViewModel เรียก `usePermission(key)` ถ้าหน้ามี action create/update/delete/approve
- [ ] มี key ใน `src/constants/breadcrumb.ts` → `ROUTE_NAV_KEY` (path ตรงตัว) — หรือระบุข้อยกเว้น (dynamic route)
- [ ] มี namespace ใน `src/i18n/messages/{th,en}.json` ทั้งสองไฟล์ (`npm run lint:i18n` ผ่าน)
- [ ] มีแถวใน `REBUILD_PLAN.md` §7 + ตาราง §2 ของเอกสารนี้ตรงกัน

ใช้เช็คลิสต์นี้ **ทุกครั้งที่ปิดงาน 1 screen** ก่อน mark ✅

---

## 2. ตารางหลัก (27 หน้า)

**Status:** ✅ เสร็จ · 🔄 กำลังทำ · ⬜ ยังไม่เริ่ม
**Reach:** ทางเข้าจริงของหน้า (sidebar leaf ใน `menu.ts`, ปุ่ม/row action, navbar, redirect)

| # | Screen | Route | Status | Reach | menuKey | Breadcrumb key | Template | Files | _components (page-local) | Vertical |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Login | `/login` | ✅ | AuthLayout (public, ไม่ผ่าน sidebar) | N/A (auth) | — (AuthLayout ไม่มี breadcrumb) | AuthLayout | `page.tsx` + `_components/LoginForm.tsx` | LoginForm | auth (มีแล้ว) |
| 2 | Dashboard | `/owner/dashboard` | ✅ | ⚠️ ไม่มี sidebar leaf — เข้าได้แค่ breadcrumb "หน้าหลัก" / redirect หลัง login (**G1**) | — (login-only) | `dashboard` (crumb แรกเสมอ) | DashboardPageLayout | `page.tsx`+`DashboardView.tsx`+`useDashboardViewModel.ts` | RecentOrdersWidget, LowStockWidget, TopProductsWidget, ProductionStatusWidget | `reports.dashboard` (มีแล้ว) |
| 3 | Products List | `/owner/products` | ✅ | sidebar: `products` leaf | `products` | `products` | ListPageLayout | `page.tsx`+`ProductsView.tsx`+`useProductsViewModel.ts` | ProductCard, ProductGrid, CategoryChip, RatingDisplay | `products` (มีแล้ว) — **reference หน้ารายการ** |
| 4 | Add Product | `/owner/products/addProducts` | ✅ | ปุ่ม "เพิ่มสินค้า" บน Products List | `products` | `productsAdd` | (form) | `page.tsx`+`AddProductView.tsx`+`useAddProductViewModel.ts` | ProductFormFields (ใช้ร่วม edit) | `products` (มีแล้ว) — **reference หน้าฟอร์ม** |
| 5 | Edit Product | `/owner/products/[id]/edit` | ✅ | row action บน Products List | `products` | ❌ ไม่มี key ให้ dynamic route (**G5**) — โชว์แค่ crumb "products" | (form) | `page.tsx`+`EditProductView.tsx`+`useEditProductViewModel.ts` | ProductFormFields | `products` (มีแล้ว) |
| 6 | Product Stock | `/owner/products/productStock` | ✅ | ⚠️ ไม่มี sidebar leaf แม้ nav/breadcrumb/menuKey พร้อม (**G2**) | `stock` | `productStock` | ListPageLayout | `page.tsx`+`ProductStockView.tsx`+`useProductStockViewModel.ts` | AdjustStockModal, StockProgressRow | reuse: `products`+`productCategories`+`units` (ไม่มี resource ใหม่) |
| 7 | Manage Orders | `/owner/orders/manageOrders` | ✅ | sidebar: `ordersManage` leaf | `orders` | `ordersManage` | ListPageLayout | `page.tsx`+`ManageOrdersView.tsx`+`useManageOrdersViewModel.ts`+`orderStatus.ts` | OrderStatusFilter, PaymentSlipPreview, OrderLifecycleSteps, OrderDetailContent | `orders` (ใหม่ — DTO รวม ready+preorder) · `shared/feedback/DetailDrawer` (build) |
| 8 | POS หน้าร้าน | `/owner/orders/OrderInStore` | ✅ | sidebar: `ordersInStore` leaf | `orders` | `ordersInStore` | custom 2-pane (`DashboardPageLayout` shell) | `page.tsx`+`POSView.tsx`+`usePOSViewModel.ts`+`posCart.ts` | ProductPickerGrid, CartPanel, QRPaymentModal | reuse: `orders`+`products` (ไม่มี resource ใหม่) · QR = mock (`qrcode` lib) |
| 9 | Ingredients List | `/owner/ingredients` | ✅ | sidebar: `ingredients` leaf | `ingredients` | `ingredients` | ListPageLayout | `page.tsx`+`IngredientsView.tsx`+`useIngredientsViewModel.ts`+`ingredientStatus.ts` | IngredientFormModal | `ingredients`+`ingredient-categories` (ใหม่) · reuse `units` · `src/utils/unitContext.ts` (build) |
| 10 | Ingredient Stock | `/owner/ingredients/ingredientStock` | ⬜ | sidebar: `ingredientStock` leaf (พร้อมแล้ว) | `stock` | `ingredientStock` | (custom) | — | ReceiveModal, AdjustModal, BulkReceiveModal, IngredientStockCard, AutoCompleteSearch | → §4 ingredients (ใหม่) |
| 11 | Ingredient History | `/owner/ingredients/ingredientHistory` | ⬜ | sidebar: `ingredientHistory` leaf (พร้อมแล้ว) | `stock` | `ingredientHistory` | (custom) | — | TransactionTimeline, HistoryItemCard, AnalyticsBarChart, LogTransactionModal | → §4 ingredients (ใหม่) |
| 12 | Manage Units | `/owner/ingredients/units` | ✅ | sidebar: `units` leaf | `ingredients` | `units` | 2-col (`DashboardPageLayout` shell) | `page.tsx`+`UnitsView.tsx`+`useUnitsViewModel.ts` | UnitListCard, UnitFormModal | reuse: `units` (ไม่มี resource ใหม่) · `src/utils/unitContext.ts` |
| 13 | Production — Plan | `/owner/production?tab=plan` | ⬜ | sidebar: `production` leaf (route เดียว, สลับผ่าน `?tab=`) | `production` | `production` | TabbedPageLayout (build) | — | ProductionOrderForm, ProductionStatCards | → §4 production (ใหม่) |
| 14 | Production — Status | `/owner/production?tab=status` | ⬜ | เหมือน #13 | `production` | `production` | TabbedPageLayout (build) | — | KanbanBoard, ProductionOrderCard | → §4 production (ใหม่) |
| 15 | Production — History | `/owner/production?tab=history` | ⬜ | เหมือน #13 | `production` | `production` | TabbedPageLayout (build) | — | RevenueBarChart, AnalyticsBarChart, TeamPerformanceCard | → §4 production (ใหม่) |
| 16 | Recipes | `/owner/recipes` | ⬜ | sidebar: `recipes` leaf (พร้อมแล้ว) | `recipes` | `recipes` | ListPageLayout (2 tab) | — | RecipeCard, MainRecipeModal, SubRecipeModal, DetailDrawer, IngredientEditor, StepEditor | → §4 recipes (ใหม่) |
| 17 | Employees List | `/owner/employees` | ⬜ | sidebar: `employees` leaf (พร้อมแล้ว) | `employees` | `employees` | ListPageLayout | — | — (component กลางล้วน) | → §4 employees/roles (ใหม่) |
| 18 | Add Employee | `/owner/employees/addEmployee` | ⬜ | ปุ่มบน Employees List (แพทเทิร์นเดียวกับ Add Product) | `employees` | ❌ ไม่มี key (**G5**) — ต้องเติมตอนสร้าง | (form) | — | EmployeeFormSections, AvatarUploader, ToggleRow, EmployeeSummaryCard, PasswordShuffleButton | → §4 employees/roles (ใหม่) |
| 19 | Edit Employee | `/owner/employees/editEmployee` | ⬜ | row action บน Employees List | `employees` | ❌ ไม่มี key (**G5**) — ต้องเติมตอนสร้าง | (form) | — | + MetaChips, DangerZone | → §4 employees/roles (ใหม่) |
| 20 | Permissions Mgmt | `/owner/employees/permissions` | ⬜ | sidebar: `permissions` leaf (พร้อมแล้ว) | `employees` | `permissions` | (2-pane) | — | RoleList, PermissionCollapseSection, PermissionCheckboxGroup, RoleFormModal | → §4 employees/roles (ใหม่) |
| 21 | User Activity Log | `/owner/employees/userLog` | ⬜ | sidebar: `userLog` leaf (พร้อมแล้ว) | `employees` | `userLog` | ListPageLayout | — | DetailDrawer | → §4 employees/roles (ใหม่) · **unlock แท็บประวัติสต็อกของ #6** |
| 22 | Attendance | `/owner/attendance` | ⬜ | ⚠️ ไม่มี sidebar leaf (**G3**) | ⚠️ ไม่ map ใน `ROUTE_MENU_MAP` เลย (ไม่ใช่แค่ login-only เหมือน #2/#25/#26 — ไม่ถูกเขียนถึงในคอมเมนต์ด้วย) | `attendance` | (custom) | — | ClockDisplay, CheckInOutButtons, AttendanceHistoryTable | → §4 attendance (ใหม่) |
| 23 | Finance — Expenses | `/owner/finance/expenses` | ⬜ | sidebar: `financeExpenses` leaf (พร้อมแล้ว) | `reports` | `financeExpenses` | ListPageLayout | — | ExpenseForm, CategoryBreakdownBar, RecurringReminderList, MonthSelector, ReceiptImagePreview | → §4 finance (ใหม่) |
| 24 | Finance — P&L | `/owner/finance/summary` | ⬜ | sidebar: `financeSummary` leaf (พร้อมแล้ว) | `reports` | `financeSummary` | (custom) | — | PLStatementTable, KPIStatsRow, RevenueBarChart, ProductRevenueTable, PeriodSelector | → §4 finance (ใหม่) |
| 25 | Store Design | `/owner/store-design` | ⬜ | sidebar: `storeDesign` leaf (พร้อมแล้ว, ไม่มี menuKey) | — (login-only) | `storeDesign` | ListPageLayout | — | BannerCard, BannerFormModal, BannerGrid | → §4 store-design (ใหม่) |
| 26 | Notification History | `/owner/notificationsHistory` | ⬜ | navbar: ลิงก์ "ดูทั้งหมด" ใน NotificationDropdown (ตั้งใจไม่มีใน sidebar — **G7**) | — (login-only) | `notificationsHistory` | ListPageLayout | — | DetailDrawer | reuse: `notifications` (มีแล้ว) |
| 27 | Access Denied | `/owner/access-denied` | ⬜ | redirect ตอนถูกปฏิเสธสิทธิ์ (proxy/permission gate) — ตั้งใจไม่มีใน sidebar (**G7**) | N/A (หน้าปฏิเสธสิทธิ์ ไม่ควร gate ตัวเอง) | ❌ ไม่มี key (**G5**) | (none) | — | AccessDeniedCard | ไม่มี resource — หน้าไฟล์เดียว |

*(Production #13–15 ใช้ route เดียวกัน สลับด้วย `?tab=` — ไม่ใช่ 3 route แยก)*

---

## 3. ช่องโหว่ wiring ที่พบ (as of 2026-09-01)

> **สโคปตอนนี้: บันทึกไว้เป็น known state เท่านั้น ไม่แก้โค้ด** — ปล่อย `menu.ts`/`breadcrumb.ts`/route ไว้ตามเดิม

- **G1 — Dashboard (#2) ไม่มี sidebar leaf** — เข้าได้แค่ breadcrumb "หน้าหลัก" หรือ redirect หลัง login เท่านั้น ไม่มีทางกดจาก sidebar โดยตรง
  *ถ้าจะแก้ทีหลัง:* เพิ่มเป็น item แรกใน `sectionOverview` ของ `menu.ts` (ไม่ต้องใส่ `menuKey` = แสดงเสมอไม่ต้องเช็คสิทธิ์)
- **G2 — Product Stock (#6) ไม่มี sidebar leaf** — ทั้งที่ `nav.productStock`, breadcrumb key, และ `resolveMenuKey` (`/owner/products/productStock` → `stock`) พร้อมหมดแล้ว เข้าถึงได้แค่พิมพ์ URL ตรง ๆ
  *ถ้าจะแก้ทีหลัง:* เพิ่ม leaf เป็น child ของ node `products` ใน `menu.ts` พร้อม `menuKey: "stock"`
- **G3 — Attendance (#22) ไม่มี sidebar leaf และไม่มี menuKey mapping เลย** — ต่างจาก Dashboard/Store Design/Notification History ที่อย่างน้อยเป็น "login-only โดยตั้งใจ" (มีคอมเมนต์ระบุไว้ใน `menuKeys.ts`) — Attendance ไม่ถูกพูดถึงในคอมเมนต์นั้นเลย น่าจะเป็นจุดตกหล่นตอนเพิ่ม screen เข้าแผน มากกว่าตั้งใจ
  *ถ้าจะแก้ทีหลัง:* เพิ่ม leaf ใต้ `sectionEmployees` + เพิ่ม `{ prefix: "/owner/attendance", menuKey: ... }` ใน `ROUTE_MENU_MAP` (หรือย้ายไปกลุ่ม login-only ถ้าตั้งใจไม่ gate)
- **G4 — sidebar มีลิงก์ชี้ไปหน้านอกสโคป 27 หน้า** — `reportsSales`, `reportsReviews` (ใต้ node "reports"), `promotionsPricing`, `promotionsCoupons` (ใต้ node "promotions") กดแล้ว **404 อยู่ตอนนี้** เพราะเป็น "Sales/Reviews report" และ "Promotions" ที่ระบุไว้ใน `REBUILD_PLAN.md` ว่า "นอก 27 screen — เฟสหลัง" → **ตัดสินใจ: ปล่อยไว้ตามเดิม** ไม่ซ่อน ไม่ disable
- **G5 — Breadcrumb ไม่มี key ให้ 4 route:** Edit Product (#5, dynamic `[id]`), Add Employee (#18), Edit Employee (#19), Access Denied (#27) — `buildBreadcrumbs()` match path ตรงตัวเท่านั้น ไม่รองรับ dynamic segment จึงโชว์แค่ crumb ของหน้า parent ตอนนี้ (#5) หรือจะเป็นแบบเดียวกันตอนสร้าง #18/#19/#27
- **G6 — `payments` menuKey ไม่มี "หน้า" ใน 27 หน้าใช้เป็น route/menu** — แต่ตั้งแต่ #7 Manage Orders ใช้เป็น **permission ระดับ action** แล้ว (`usePermission("payments").approve` กันปุ่ม "ยืนยันการชำระเงิน" ใน DetailDrawer) — ไม่ใช่ gap อีกต่อไป แค่ไม่มี route ของตัวเองตามที่ตั้งใจไว้แต่แรก (หน้า "Payments" อยู่นอกสโคป 27)
- **G7 — Notification History (#26) / Access Denied (#27) ตั้งใจไม่มีใน sidebar** — ทางเข้า: #26 ผ่านลิงก์ "ดูทั้งหมด" ใน `NotificationDropdown` (navbar) · #27 ผ่าน redirect เมื่อ proxy/permission gate ปฏิเสธ — ไม่ใช่ gap ต้องแก้ แค่บันทึกไว้ให้ checklist §1 ผ่านข้อ "เข้าถึงได้"

---

## 4. Build checklist ต่อ vertical (21 หน้าที่เหลือ) — ใช้เป็นไกด์ลำดับทำเฟส 4

รูปแบบ copy จาก reference ที่มีอยู่แล้ว: **list → Products (#3)** · **form → Add Product (#4)** · **dashboard aggregate → Dashboard (#2)** · **reuse-only list → Product Stock (#6)**

| Vertical | Screens | Resource ใหม่ (type/service/fixture/handler) | Shared component ที่ต้อง build/promote | i18n namespace ที่ต้องเติม |
|---|---|---|---|---|
| **orders** | #7 ✅ Manage Orders, #8 ✅ POS | `orders` ✅ (DTO เดียว รวม ready+preorder — ไม่แยก order-items/payments collection แบบต้นทาง) | `DetailDrawer` ✅ (build, ใช้กับ #7) · #7 page-local: OrderStatusFilter, PaymentSlipPreview, OrderLifecycleSteps, OrderDetailContent · #8 page-local: ProductPickerGrid, CartPanel, QRPaymentModal (+ `posCart.ts` pure) — **QR = mock ด้วย lib `qrcode`** ไม่ใช่ Omise จริง | `orders` ✅ · `pos` ✅ (th+en) |
| **ingredients** | #9 ✅ List, #10 Stock, #11 History, #12 ✅ Units | `ingredients` ✅ + `ingredient-categories` ✅ · `ingredient-transactions` ยังไม่ทำ (คู่ #10/#11) · `units` มีแล้ว · `src/utils/unitContext.ts` ✅ | #9 IngredientFormModal ✅ · #12 UnitListCard/UnitFormModal ✅ · #10/#11 ยัง: ReceiveModal/AdjustModal/BulkReceiveModal, `AutoCompleteSearch` (build), TransactionTimeline, AnalyticsBarChart (`shared/charts/`, build) | `ingredients` ✅ · `units` ✅ (th+en) |
| **production** | #13 Plan, #14 Status, #15 History | `production-orders` (+ production-items) | **`TabbedPageLayout` (build, ค้างจากเฟส 3)** · KanbanBoard, ProductionOrderForm/Card, RevenueBarChart (reuse จาก charts), TeamPerformanceCard | `production` |
| **recipes** | #16 Recipes | `recipes` (main+sub) | RecipeCard, MainRecipeModal, SubRecipeModal, `DetailDrawer` (reuse), IngredientEditor, StepEditor | `recipes` |
| **employees/roles** | #17 List, #18 Add, #19 Edit, #20 Permissions, #21 User Log | `users`(employees) + `roles` + `permissions` + `user-logs` | EmployeeFormSections, AvatarUploader, ToggleRow, PasswordShuffleButton, RoleList, PermissionCollapseSection/CheckboxGroup, `DetailDrawer` (reuse) | `employees`, `permissions` · **unlock แท็บ "ประวัติการสต็อก" ที่ตัดออกจาก #6 ไว้ก่อน** (ต้อง `/user-logs` vertical) |
| **attendance** | #22 Attendance | `attendances` (+ check-in/out endpoint) | ClockDisplay, CheckInOutButtons, AttendanceHistoryTable | `attendance` |
| **finance** | #23 Expenses, #24 P&L | `expenses` + `/reports/finance-summary` | ExpenseForm, CategoryBreakdownBar, MonthSelector, PLStatementTable, `KPIStatsRow` (build), RevenueBarChart (reuse), PeriodSelector | `finance` |
| **store-design** | #25 Store Design | `banners` | BannerCard, BannerFormModal, BannerGrid · `UploadImageBox` (reuse จาก Add Product) | `storeDesign` |
| **notifications history** | #26 Notification History | reuse: `notifications` (มีแล้ว) | `NotificationItem` (reuse), `DetailDrawer` (reuse) | — (namespace `notifications` มีแล้ว) |
| **access-denied** | #27 Access Denied | ไม่มี | AccessDeniedCard (หน้าไฟล์เดียว ไม่ต้อง View/VM แยก) | — (ใช้ `common.*`) |

---

## 5. การดูแลเอกสารนี้

ทุกครั้งที่ปิดงาน 1 screen:
1. พลิก Status ในตาราง §2 ที่นี่ **และ** ใน `REBUILD_PLAN.md` §7 ให้ตรงกัน
2. ถ้าเพิ่ม sidebar leaf / breadcrumb key / i18n namespace ใหม่ → อัปเดตคอลัมน์ Reach/Breadcrumb ในแถวนั้น
3. รัน `npm run check` (i18n + theme + tsc + eslint)
4. ถ้ามี component ถูก promote จาก page-local → `shared/` → อัปเดต `COMPONENT_MAP.md`
5. ถ้าปิดช่องโหว่ใน §3 ได้ (เช่น เพิ่ม leaf ให้ Dashboard/Product Stock/Attendance) → ลบรายการนั้นออกจาก §3 พร้อมโน้ตว่าทำอะไรไป
