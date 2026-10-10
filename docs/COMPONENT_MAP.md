# Component Map

> **เอกสารนี้คืออะไร:** ทะเบียน component ทุกตัว — ชื่อ · atomic level (แค่แท็ก) · อยู่ที่ไหน · ใช้กี่หน้า · split View/ViewModel ไหม · สถานะ
> **เปิดอ่านเมื่อ:** ก่อนสร้าง component ใหม่ (เช็คว่ามีอยู่แล้วไหม / ควรวางที่ไหน) · ตรวจความสอดคล้องกับ `MeowMeeCake_Components.html`
> **ทำไมสำคัญ:** กันสร้างซ้ำ · ให้ทุกคนวาง component ที่เดียวกันตามกติกา "ใช้กี่หน้า?"

**กติกาที่วาง:** UI ล้วน → `components/base/` · ใช้ ≥ 2 screen → `components/shared/<concern>/` · ใช้ 1 screen → `app/owner/<route>/_components/`
**หน้าร้าน** (`/customer/*` — ยกจาก FrontOffice): component ที่ใช้หลายหน้าอยู่ `components/customer/` · ใช้หน้าเดียวอยู่ `app/customer/<route>/_components/` (ดู §หน้าร้าน ท้ายเอกสาร) · อัปเดต 2026-10-09
**split:** มี state/effect/fetch จริง → แยก View + `use<X>` · presentation ล้วน → ไฟล์เดียว

---

## base/ — atoms (✅ เฟส 3)

| component | ไฟล์ | หมายเหตุ |
|---|---|---|
| Button | `base/Button.tsx` | wrap antd Button |
| Input | `base/Input.tsx` | wrap antd Input |
| PasswordInput | `base/PasswordInput.tsx` | Input.Password |
| InputNumber | `base/InputNumber.tsx` | full-width |
| Select | `base/Select.tsx` | full-width |
| Switch | `base/Switch.tsx` | |
| Tag | `base/Tag.tsx` | |
| Badge | `base/Badge.tsx` | |
| Spinner | `base/Spinner.tsx` | antd Spin |
| Divider | `base/Divider.tsx` | |
| DatePicker / RangePicker | `base/DatePicker.tsx` | full-width |
| Avatar | `base/Avatar.tsx` | + `initialsOf()` |
| DotIndicator | `base/DotIndicator.tsx` | จุดสี |
| ProgressBar | `base/ProgressBar.tsx` | สีตามค่า |
| Card | `base/Card.tsx` | กล่องขอบมน |
| Logo | `base/Logo.tsx` | โลโก้ร้าน · `src` = โลโก้ที่ร้านอัปโหลด (หน้าร้านใช้ผ่าน `customer/StoreLogo`) |
| EmptyState | `base/EmptyState.tsx` | antd Empty + i18n |
| ErrorMessage | `base/ErrorMessage.tsx` | กล่อง error แดง |
| LocaleSwitcher | `base/LocaleSwitcher.tsx` | TH/EN (เฟส 0.5) |

**Icon** = ใช้ `@heroicons/react` / `lucide-react` ตรง ๆ (ไม่มี wrapper)

---

## shared/ — ใช้ ≥ 2 screen

### shared/layout/ (✅ เฟส 3)
| component | ไฟล์ | split | consumers |
|---|---|---|---|
| AuthLayout | `AuthLayout.tsx` | — | `/login` (+ future auth pages) |
| OwnerLayout | `OwnerLayout.tsx` | ใช่ (auth gate + idle + drawer state) | ทุก `/owner/*` |
| Sidebar | `Sidebar.tsx` | ใช่ (permission filter + open state) | OwnerLayout |
| MenuGroupItem | `MenuGroupItem.tsx` | — | Sidebar |
| Navbar | `Navbar.tsx` | — (ประกอบ) | OwnerLayout |
| BreadcrumbTrail | `BreadcrumbTrail.tsx` | — | Navbar |
| NotificationDropdown | `NotificationDropdown.tsx` | ใช่ (`useNotifications` + open state) | Navbar |
| NotificationItem | `NotificationItem.tsx` | — | NotificationDropdown, Notification History |
| UserMenuDropdown | `UserMenuDropdown.tsx` | ใช่ (open state) | Navbar |
| ListPageLayout | `ListPageLayout.tsx` | — | Products, Orders, Employees, Ingredients, Finance, Reports, ... |
| DashboardPageLayout | `DashboardPageLayout.tsx` | — | Dashboard, POS (2-pane shell), Manage Units/Permissions (2-col shell), Attendance |
| TabbedPageLayout | `TabbedPageLayout.tsx` | — (antd `Tabs`, `activeKey`/`onChange` — consumer sync กับ `?tab=` เอง ถ้าต้องการ) | Production (`?tab=` sync), Recipes (local state) |

### shared/feedback/ (✅ เฟส 3–4)
| component | ไฟล์ | consumers |
|---|---|---|
| LoadingSpin | `feedback/LoadingSpin.tsx` | ทุกหน้า owner |
| ConfirmDeletePopup | `feedback/ConfirmDeletePopup.tsx` | ทุกหน้าที่มี delete |
| DetailDrawer | `feedback/DetailDrawer.tsx` | Manage Orders, Ingredient History, User Log, Notification History, Production |

### shared/stats/ (✅ เฟส 3)
| component | ไฟล์ | consumers |
|---|---|---|
| StatCard | `stats/StatCard.tsx` | Dashboard, Employees, Ingredients, Store Design, Notifications |
| StatCardsGrid | `stats/StatCardsGrid.tsx` | เช่นเดียวกัน |
| StatusBadge | `stats/StatusBadge.tsx` | Orders, Production, Payments, Stock (10+ screens) — `group` = enumConfig + i18n |
| BreakdownList | `stats/BreakdownList.tsx` | Production History, Finance Expenses — **promote จาก `production/_components/` (consumer ที่ 2)**; `formatValue` prop optional รองรับฟอร์แมตเงิน |

### shared/data/ (✅ เฟส 3–4 · AutoCompleteSearch ⏳)
| component | ไฟล์ | สถานะ | consumers |
|---|---|---|---|
| SearchInput | `data/SearchInput.tsx` | ✅ เฟส 3 | list screens |
| PaginationBar | `data/PaginationBar.tsx` | ✅ เฟส 3 | DataTable, list screens |
| DataTable | `data/DataTable.tsx` | ✅ เฟส 4 (จาก Products) | Products(table), Orders, Employees, Ingredients, ... |
| FilterToolbar | `data/FilterToolbar.tsx` | ✅ เฟส 4 | list screens |
| TypeTabBar | `data/TypeTabBar.tsx` | ✅ เฟส 4 | Products, Orders, Notifications |
| SortDropdown | `data/SortDropdown.tsx` | ✅ เฟส 4 | Products |
| ViewToggle | `data/ViewToggle.tsx` | ✅ เฟส 4 | Products |
| AutoCompleteSearch | `data/AutoCompleteSearch.tsx` | ⏳ เฟส 4 (Ingredient Stock) | |

### shared/charts/ — ตั้งใจไม่ทำ (D0 ตัดสินใจ)
| RevenueBarChart · AnalyticsBarChart | **ไม่ทำ** | เดิมวางแผนไว้ Finance Summary/Production History/Ingredient History (recharts) — ทั้ง 3 หน้าใช้ `DataTable`/`BreakdownList` (แถบ %) แทนกราฟจริงหมดแล้ว |

### shared/stats/ — ⏳ (ยังไม่มี consumer)
| KPIStatsRow | ⏳ | เดิมวางแผนไว้ Finance Summary — สุดท้ายใช้ StatCardsGrid + แถว KPI ธรรมดาแทน |

### shared/form/
| component | สถานะ | consumers |
|---|---|---|
| FormField | ✅ เฟส 4 (จาก Add Product) | ทุกฟอร์ม |
| ~~UploadImageBox~~ | ❌ ลบแล้ว 2026-10-10 — เก็บรูปเป็น base64 ที่ backend ไม่รับ · แทนด้วยตัวอัปโหลดจริงเฉพาะหน้า | `ProductImageUpload` (สินค้า) · `BannerImageUpload` (แบนเนอร์) · `ReceiptUpload` (ใบเสร็จค่าใช้จ่าย) |
| ToggleRow · MonthSelector · PasswordShuffleButton · AvatarUploader | ⏳ | Add/Edit Employee, Finance |

---

## page-local (`app/owner/<route>/_components/`)

**เสร็จแล้ว:**
| screen | _components |
|---|---|
| Login (`app/login/_components/`) | `LoginForm` ✅ |
| Products (`app/owner/products/_components/`) | `ProductCard` · `ProductGrid` · `CategoryChip` · `RatingDisplay` · `ProductFormFields` (ใช้ทั้ง add+edit) ✅ |
| Production (`app/owner/production/_components/`) | `PlanTab` · `StatusTab` · `HistoryTab` · `ProductionOrderFormModal` · `StatusBoard` · `ProductionOrderCard` · `ProductionOrderDetail` · `BreakdownList` ✅ |
| Recipes (`app/owner/recipes/_components/`) | `RecipeCard` · `RecipeDetail` · `MainRecipeModal` · `ComponentFormModal` · `IngredientEditor` · `StepEditor` (ใช้ร่วม 2 modal) ✅ |
| Finance Expenses (`app/owner/finance/expenses/_components/`) | `ExpenseFormModal` · `RecurringRemindersList` ✅ |
| Finance P&L (`app/owner/finance/summary/_components/`) | `PLStatementTable` ✅ |

ที่เหลือสร้างพร้อม screen ที่ใช้ (1 consumer) — ดูรายการเต็มใน `REBUILD_PLAN.md` §6 ตัวอย่าง:
`orders/OrderInStore/_components/` CartPanel, ProductPickerGrid, QRPaymentModal · ฯลฯ

**Promotion rule:** page-local ตัวไหนมี screen ที่ 2 มาใช้ → ย้ายขึ้น `shared/<concern>/` + อัปเดตแถวในเอกสารนี้

---

## หน้าร้าน — `components/customer/` (ใช้หลายหน้า)

| component | หน้าที่ | consumers |
|---|---|---|
| CustomerChrome | Navbar + เนื้อหา + Footer (ซ่อนในหน้า reset-password) | `app/customer/layout.tsx` |
| Navbar | เมนูหลัก · ค้นหา · ตะกร้า · กระดิ่ง · เมนูบัญชี · `StoreLogo` | ทุกหน้าร้าน |
| Footer | Facebook/ที่อยู่/ชื่อร้านจาก store-info · ลิงก์การจัดส่ง/ติดต่อเรา | ทุกหน้าร้าน |
| StoreLogo | โลโก้ที่ร้านอัปโหลด (/catalog/store-logo · `?v=`) → base `Logo` | Navbar |
| CustomerNotifications | กระดิ่ง + รายการล่าสุด (`useCustomerNotifications`) | Navbar |
| CustomerAuthGate | หน้าที่ต้อง login — guest เห็นการ์ดชวนเข้าสู่ระบบ | ตะกร้า · checkout · บัญชีทุกหน้า · รีวิว |
| CustomerBreadcrumb | เส้นทาง (หน้าแรกนำหน้าเสมอ) | เกือบทุกหน้า |
| AccountSideMenu | เมนูบัญชีของฉัน (5 รายการ) | หน้า account/* ยกเว้น member · favorites · notifications (+ `changepassword`) |
| ProductCard | บัตรสินค้า + หัวใจ + ใส่ตะกร้า + ป้ายแพ้อาหาร/เหตุผลแนะนำ · `isProductCardVisible` | หน้าแรก · สินค้าทั้งหมด · สินค้าคล้าย · รายการโปรด · (หลังร้าน: SearchTester ใช้ `isProductCardVisible`) |
| HeroCarousel | แบนเนอร์หน้าแรก | หน้าแรก |
| CheckoutAddressForm · CouponSelectBox · PointsRedeemBox · PickupLocationPicker | ส่วนของ checkout | checkout · preorder/checkout |
| AspectIcon | ไอคอนหัวข้อรีวิว (+ `ASPECT_ICON_KEYS` · `resolveAspectIcon`) | WriteReviewForm (หน้าร้าน) · ตั้งค่าหัวข้อรีวิว (หลังร้าน) |
| shopStyles.ts | class ปุ่ม/การ์ด/อินพุต/ระยะหน้า + `baht()` | ทุกหน้าร้าน |

**page-local ของหน้าร้าน:** `customer/_components/HomeRecommendations` · `customer/account/_components/` SlipPaymentPanel (ออเดอร์+พรีออเดอร์) · WriteReviewForm (+ReviewNotice/ReviewLoading) · ReviewLink · `customer/product/[id]/_components/` CustomizationPicker · PreorderOrderBox · ReviewsSection · SimilarProducts · `customer/preorder/_components/PreorderParts`
**ตรรกะร่วม (ไม่ใช่ component):** `customer/lib/` shopQueries · catalogQueries · storeFormat · preorder/lib · `customer/hooks/` useAddToCart · useFavorites · useCustomerNotifications · useReviewedItems

## page-local หลังร้านที่เพิ่มหลังเฟส 4 (BACKLOG4)

| screen | _components |
|---|---|
| ข้อมูลร้าน `owner/store-info` | SectionCard · StoreAddressFields · CoordinateInput · WeeklyMarketsEditor · TimeSelect (+ `storeInfoForm.ts` · `lib/parseCoordinates.ts`) |
| คำพ้องค้นหา `owner/products/search-synonyms` | SynonymGroupForm · SearchTester (+ `synonymForm.ts` · `lib/searchSynonyms.ts`) |
| รีวิวลูกค้า `owner/reports/reviews` | ReviewFiltersBar · ReviewCard · ReplyBox · NoteBox · ReviewDetailContent · StarRating (+ `reviewRow.ts`) |
| ตั้งค่าหัวข้อรีวิว `owner/reports/reviews/settings` | AspectsTab · TermsTab |

## ยังไม่ทำใน เฟส 3 (ตั้งใจเลื่อน)

- `data/DataTable` และ toolbar family → เฟส 4 (API shaped by first real table)
- `charts/*`, `form/*` (ที่เหลือ) → เฟส 4
- page-local components ทั้งหมด → เฟส 4
- Sidebar mobile: มี drawer แล้ว แต่ยังไม่ทำ swipe/animation ละเอียด
