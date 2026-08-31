# Component Map

> **เอกสารนี้คืออะไร:** ทะเบียน component ทุกตัว — ชื่อ · atomic level (แค่แท็ก) · อยู่ที่ไหน · ใช้กี่หน้า · split View/ViewModel ไหม · สถานะ
> **เปิดอ่านเมื่อ:** ก่อนสร้าง component ใหม่ (เช็คว่ามีอยู่แล้วไหม / ควรวางที่ไหน) · ตรวจความสอดคล้องกับ `MeowMeeCake_Components.html`
> **ทำไมสำคัญ:** กันสร้างซ้ำ · ให้ทุกคนวาง component ที่เดียวกันตามกติกา "ใช้กี่หน้า?"

**กติกาที่วาง:** UI ล้วน → `components/base/` · ใช้ ≥ 2 screen → `components/shared/<concern>/` · ใช้ 1 screen → `app/owner/<route>/_components/`
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
| Logo | `base/Logo.tsx` | โลโก้ร้าน |
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

### shared/feedback/ (✅ เฟส 3)
| component | ไฟล์ | consumers |
|---|---|---|
| LoadingSpin | `feedback/LoadingSpin.tsx` | ทุกหน้า owner |
| ConfirmDeletePopup | `feedback/ConfirmDeletePopup.tsx` | ทุกหน้าที่มี delete |

### shared/stats/ (✅ เฟส 3)
| component | ไฟล์ | consumers |
|---|---|---|
| StatCard | `stats/StatCard.tsx` | Dashboard, Employees, Ingredients, Store Design, Notifications |
| StatCardsGrid | `stats/StatCardsGrid.tsx` | เช่นเดียวกัน |
| StatusBadge | `stats/StatusBadge.tsx` | Orders, Production, Payments, Stock (10+ screens) — `group` = enumConfig + i18n |

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

### shared/feedback/ — ⏳ เฟส 4
| DetailDrawer | ⏳ | Orders, Notifications, Ingredients, User Log — shape จาก consumer |

### shared/charts/ — ⏳ เฟส 4
| RevenueBarChart · AnalyticsBarChart | ⏳ | Finance Summary, Production History, Ingredient History (recharts) |

### shared/stats/ — ⏳ เฟส 4
| KPIStatsRow | ⏳ | Finance Summary |

### shared/form/ — ⏳ เฟส 4
| FormField · UploadImageBox · ToggleRow · MonthSelector · PasswordShuffleButton · AvatarUploader | ⏳ | Add/Edit Product, Add/Edit Employee, Finance, Store Design |

### shared/layout/ — ⏳ เฟส 4
| TabbedPageLayout | ⏳ | Production, Promotions |
| DashboardPageLayout | ⏳ | Dashboard |

---

## page-local (`app/owner/<route>/_components/`)

**เสร็จแล้ว:**
| screen | _components |
|---|---|
| Login (`app/login/_components/`) | `LoginForm` ✅ |
| Products (`app/owner/products/_components/`) | `ProductCard` · `ProductGrid` · `CategoryChip` · `RatingDisplay` ✅ |

ที่เหลือสร้างพร้อม screen ที่ใช้ (1 consumer) — ดูรายการเต็มใน `REBUILD_PLAN.md` §6 ตัวอย่าง:
`products/_components/` ProductCard, ProductGrid, ProductFormFields · `production/_components/` KanbanBoard, ProductionOrderCard · `orders/OrderInStore/_components/` CartPanel, ProductPickerGrid, QRPaymentModal · `recipes/_components/` MainRecipeModal, IngredientEditor · `dashboard/_components/` RecentOrdersWidget, LowStockWidget · ฯลฯ

**Promotion rule:** page-local ตัวไหนมี screen ที่ 2 มาใช้ → ย้ายขึ้น `shared/<concern>/` + อัปเดตแถวในเอกสารนี้

---

## ยังไม่ทำใน เฟส 3 (ตั้งใจเลื่อน)

- `data/DataTable` และ toolbar family → เฟส 4 (API shaped by first real table)
- `charts/*`, `form/*`, `DetailDrawer`, `TabbedPageLayout`, `DashboardPageLayout` → เฟส 4
- page-local components ทั้งหมด → เฟส 4
- Sidebar mobile: มี drawer แล้ว แต่ยังไม่ทำ swipe/animation ละเอียด
