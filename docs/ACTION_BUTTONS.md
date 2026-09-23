# ปุ่ม action มาตรฐาน — ทุกปุ่มต้องมี "ไอคอน + คำ"

> **เอกสารนี้คืออะไร:** บันทึกการเปลี่ยนปุ่มที่เดิม "มีแต่คำ" (หรือ "มีแต่ไอคอน") ให้เป็น **ไอคอน + คำ** รูปแบบเดียวกับปุ่ม
> "+ สร้างคูปองใหม่" — ทั้งปุ่มในหน้า, ในตาราง, ในการ์ด, ใน drawer และ**ปุ่มท้าย Modal / Popconfirm**
> **อัปเดต:** 2026-09-24 (รอบ 1: แก้ไข/ลบ/เพิ่ม · รอบ 2: ปุ่มที่เหลือทั้งหมด + ปุ่มท้าย Modal)
> **เปิดอ่านเมื่อ:** จะเพิ่มปุ่มในหน้าใหม่ · อยากรู้ว่าปุ่มไหนใช้ไอคอนอะไร · จะเปลี่ยนไอคอน/คำของปุ่มทั้งแอป

---

## 1. ของกลาง — `src/components/shared/actions/ActionButtons.tsx`

import จาก `@/components/shared/actions`

### 1.1 ไอคอนต่อความหมาย (`actionIcon(kind, size?)`)

ใช้ชุดเดียวกันทุกที่ — ปุ่มกลาง, ปุ่มเฉพาะหน้า (`icon={actionIcon(...)}`) และปุ่มท้าย Modal

| kind | ไอคอน (heroicons) | ความหมาย / ใช้กับ |
|---|---|---|
| `edit` | `PencilSquareIcon` | แก้ไข |
| `delete` | `TrashIcon` | ลบ |
| `add` | `PlusIcon` (**solid** — ให้เหมือนปุ่มเพิ่ม/สร้างเดิมทั้งแอป) | เพิ่ม / สร้าง |
| `save` | `CheckIcon` | บันทึก |
| `cancel` | `XMarkIcon` | ยกเลิก = ปิดฟอร์ม/ไม่บันทึก |
| `cancelAction` | `XCircleIcon` | ยกเลิก**รายการ** (ออเดอร์ / รอบพรีออเดอร์ / ใบสั่งผลิต) — แยกจาก `cancel` |
| `retry` | `ArrowPathIcon` | ลองใหม่ (โหลดไม่สำเร็จ) |
| `view` | `EyeIcon` | ดู |
| `next` | `ArrowRightIcon` | ไปสถานะถัดไป |
| `confirm` | `CheckCircleIcon` | ยืนยัน (รับเงิน POS) / เปิดสิทธิ์ทั้งหมด |
| `off` | `MinusCircleIcon` | ปิดสิทธิ์ทั้งหมด |
| `verify` | `CheckBadgeIcon` | ตรวจสอบ/อนุมัติสลิปชำระเงิน |
| `reset` | `ArrowUturnLeftIcon` | รีเซ็ต |
| `filter` | `FunnelIcon` | กรองรายการ |
| `external` | `ArrowTopRightOnSquareIcon` | ไปที่ลิงก์ |
| `receive` · `use` · `adjust` | `ArrowDownTrayIcon` · `ArrowUpTrayIcon` · `AdjustmentsHorizontalIcon` | รับเข้า · เบิกใช้ · ปรับสต็อก |

ทุกไอคอนเป็น **outline** ยกเว้น `add` · ขนาดตาม `size` ของปุ่ม: `small` = `h-3.5 w-3.5` · ปกติ = `h-4 w-4`

### 1.2 ปุ่มกลาง

| component | ไอคอน | คำเริ่มต้น | หมายเหตุ |
|---|---|---|---|
| `EditButton` | `edit` | `common.edit` แก้ไข | |
| `DeleteButton` | `delete` | `common.delete` ลบ | `danger` ให้เสมอ |
| `SaveButton` | `save` | `common.save` บันทึก | ไม่กำหนด type — ส่ง `type="primary"` / `htmlType="submit"` เอง |
| `CancelButton` | `cancel` | `common.cancel` ยกเลิก | ปิดฟอร์ม — **ไม่ใช่** ยกเลิกออเดอร์ (ใช้ `actionIcon("cancelAction")`) |
| `RetryButton` | `retry` | `common.retry` ลองใหม่ | |
| `ViewButton` | `view` | `common.view` ดู | |

```tsx
import { EditButton, DeleteButton, SaveButton, CancelButton, RetryButton, ViewButton,
  actionIcon, modalButtonIcons } from "@/components/shared/actions";

<EditButton size="small" onClick={() => vm.openEdit(row)} />
<ConfirmDeletePopup onConfirm={onDelete}><DeleteButton size="small" /></ConfirmDeletePopup>
<DeleteButton size="small" label={t("permissions.deleteRole")} />      // เปลี่ยนคำได้ทุกปุ่มกลาง
<SaveButton type="primary" htmlType="submit" loading={vm.submitting} />
<RetryButton onClick={() => vm.refetch()} />

// ปุ่มเฉพาะหน้า (ไม่มีปุ่มกลาง) — ใช้ไอคอนจากชุดเดียวกัน
<Button size="small" danger icon={actionIcon("cancelAction", "small")} onClick={...}>{t("orders.cancel")}</Button>

// ปุ่มท้าย antd <Modal> — OK ได้ไอคอนตาม kind, Cancel ได้ ✕ เสมอ
<Modal {...modalButtonIcons(editTarget ? "save" : "add")} okText={...} cancelText={t("common.cancel")} ...>
```

- ปุ่มกลางส่ง props ของ `Button` (`@/components/base`) ต่อทั้งหมด (ยกเว้น `icon`/`children`) — ครอบด้วย `ConfirmDeletePopup` ได้
- **ต่อไป:** ปุ่มใหม่ให้ใช้ปุ่มกลาง / `actionIcon` / `modalButtonIcons` เสมอ ไม่เขียนปุ่มที่มีแต่คำ และไม่ import heroicons เองสำหรับ
  ความหมายที่มีในตารางข้างบนแล้ว — เปลี่ยนไอคอนทั้งแอปแก้ที่ไฟล์เดียว

---

## 2. รอบ 1 — แก้ไข / ลบ / เพิ่ม (29 ปุ่ม)

ประเภท: **A** = มีแต่คำ → ไอคอน + คำ · **B** = มีแต่ไอคอน → ไอคอน + คำ · **C** = ไอคอน solid → outline · **D** = ปุ่มเพิ่มที่ไม่มีไอคอน → เพิ่ม `PlusIcon`

หน้าทุกหน้าอยู่ที่ `src/app/owner/<route>/page.tsx` (route ในตาราง = path หลัง `/owner`) · บรรทัด = โค้ดปัจจุบัน

### 2.1 ในตาราง

| route | component ที่ใช้ปุ่ม | บรรทัด | ปุ่ม | ประเภท |
|---|---|---|---|---|
| `/owner/employees` | `src/app/owner/employees/EmployeesView.tsx` | 120 · 127 | แก้ไข (ลิงก์ editEmployee) · ลบ | A · A |
| `/owner/ingredients` | `src/app/owner/ingredients/IngredientsView.tsx` | 146 · 153 | แก้ไข · ลบ | A · A |
| `/owner/finance/expenses` | `src/app/owner/finance/expenses/FinanceExpensesView.tsx` | 161 · 164 | แก้ไข · ลบ | A · A |
| `/owner/products` (มุมมองตาราง) | `src/app/owner/products/ProductsView.tsx` | 132 · 135 | แก้ไข (ลิงก์ `/edit`) · ลบ | A · A |
| `/owner/recipes` (แท็บสูตรส่วนประกอบ) | `src/app/owner/recipes/RecipesView.tsx` | 184 · 188 · 191 | แก้ไข · ลบ (ปิดใช้เมื่อมีสูตรหลักใช้อยู่) · ลบ | A · A · A |
| `/owner/notificationsHistory` | `src/app/owner/notificationsHistory/NotificationHistoryView.tsx` | 153 | ลบ | A |
| `/owner/reports/reviews` | `src/app/owner/reports/reviews/ReviewsView.tsx` | 112 | ลบ | A |
| `/owner/orders/preOrderRound` (แท็บรอบ) | `src/app/owner/orders/preOrderRound/_components/RoundsTab.tsx` | 110 | ลบ (เฉพาะรอบที่ปิด/ยกเลิกแล้ว) | A |

### 2.2 ในการ์ด

| route | component ที่ใช้ปุ่ม | บรรทัด | ปุ่ม | ประเภท |
|---|---|---|---|---|
| `/owner/products` (มุมมองกริด) | `src/app/owner/products/_components/ProductCard.tsx` (ผ่าน `ProductGrid.tsx`) | 69 · 73 | แก้ไข · ลบ (เต็มความกว้าง) | A · A |
| `/owner/recipes` (แท็บสูตรหลัก) | `src/app/owner/recipes/_components/RecipeCard.tsx` | 99 · 103 | แก้ไข · ลบ | **B** · A |
| `/owner/promotions/coupons` | `src/app/owner/promotions/coupons/_components/CouponCard.tsx` | 72 · 76 | แก้ไข · ลบ (หัวการ์ด) | **B** · **B** |
| `/owner/store-design` | `src/app/owner/store-design/_components/BannerCard.tsx` | 121 · 126 | แก้ไข · ลบ | **C** · A |
| `/owner/ingredients/units` | `src/app/owner/ingredients/units/_components/UnitListCard.tsx` | 75 · 82 | แก้ไข · ลบ (ท้ายแต่ละหน่วย) | **B** · A |

### 2.3 drawer / แผงสิทธิ์ / หัวหน้า

| route | component ที่ใช้ปุ่ม | บรรทัด | ปุ่ม | ประเภท |
|---|---|---|---|---|
| `/owner/orders/preOrderRound` (drawer รอบ) | `src/app/owner/orders/preOrderRound/_components/RoundDetailContent.tsx` | 29 · 101 · 104 | แก้ไขรอบ · แก้ไข/ลบ สินค้าในรอบ | A · A · A |
| `/owner/employees/permissions` | `src/app/owner/employees/permissions/PermissionsView.tsx` | 72 | ลบบทบาท (`label`) | A |
| `/owner/products` (หัวหน้า) | `src/app/owner/products/ProductsView.tsx` | 57 | เพิ่มสินค้า — `PlusIcon` | **D** |

**สรุปรอบ 1:** A 23 · B 4 · C 1 · D 1 = **29 ปุ่ม** (`EditButton` 12 · `DeleteButton` 16 · `PlusIcon` 1)

---

## 3. รอบ 2 — ปุ่มที่เหลือทั้งหมด (51 ปุ่ม) + ปุ่มท้าย Modal (15 Modal + 1 Popconfirm)

### 3.1 ลองใหม่ → `RetryButton` (20 จุด — ทุกหน้าที่มีสถานะ "โหลดไม่สำเร็จ")

| route | component | บรรทัด |
|---|---|---|
| `/owner/dashboard` | `src/app/owner/dashboard/DashboardView.tsx` | 31 |
| `/owner/employees` | `src/app/owner/employees/EmployeesView.tsx` | 99 |
| `/owner/employees/userLog` | `src/app/owner/employees/userLog/UserLogView.tsx` | 123 |
| `/owner/finance/expenses` | `src/app/owner/finance/expenses/FinanceExpensesView.tsx` | 147 |
| `/owner/ingredients` | `src/app/owner/ingredients/IngredientsView.tsx` | 125 |
| `/owner/ingredients/ingredientHistory` | `src/app/owner/ingredients/ingredientHistory/IngredientHistoryView.tsx` | 101 |
| `/owner/ingredients/ingredientStock` | `src/app/owner/ingredients/ingredientStock/IngredientStockView.tsx` | 89 |
| `/owner/ingredients/units` | `src/app/owner/ingredients/units/UnitsView.tsx` | 21 |
| `/owner/notificationsHistory` | `src/app/owner/notificationsHistory/NotificationHistoryView.tsx` | 134 |
| `/owner/orders/manageOrders` | `src/app/owner/orders/manageOrders/ManageOrdersView.tsx` | 145 |
| `/owner/orders/OrderInStore` | `src/app/owner/orders/OrderInStore/POSView.tsx` | 26 |
| `/owner/orders/preOrderRound` (แท็บออเดอร์ / แท็บรอบ) | `src/app/owner/orders/preOrderRound/_components/OrdersTab.tsx` · `RoundsTab.tsx` | 113 · 96 |
| `/owner/production` (แท็บแผนผลิต) | `src/app/owner/production/_components/PlanTab.tsx` | 111 |
| `/owner/products` | `src/app/owner/products/ProductsView.tsx` | 106 |
| `/owner/products/productStock` | `src/app/owner/products/productStock/ProductStockView.tsx` | 105 |
| `/owner/promotions/coupons` | `src/app/owner/promotions/coupons/CouponsView.tsx` | 66 |
| `/owner/promotions/pricing` | `src/app/owner/promotions/pricing/PricingView.tsx` | 126 |
| `/owner/reports/reviews` | `src/app/owner/reports/reviews/ReviewsView.tsx` | 84 |
| `/owner/store-design` | `src/app/owner/store-design/StoreDesignView.tsx` | 66 |

### 3.2 ดู → `ViewButton` (4 จุด — ในตาราง)

| route | component | บรรทัด |
|---|---|---|
| `/owner/orders/manageOrders` | `src/app/owner/orders/manageOrders/ManageOrdersView.tsx` | 155 |
| `/owner/orders/preOrderRound` (แท็บออเดอร์ / แท็บรอบ) | `src/app/owner/orders/preOrderRound/_components/OrdersTab.tsx` · `RoundsTab.tsx` | 123 · 107 |
| `/owner/production` (แท็บแผนผลิต) | `src/app/owner/production/_components/PlanTab.tsx` | 121 |

### 3.3 บันทึก / ยกเลิก ในหน้าฟอร์ม → `SaveButton` + `CancelButton` (9 ปุ่ม)

| route | component | บรรทัด | ปุ่ม |
|---|---|---|---|
| `/owner/employees/addEmployee` | `src/app/owner/employees/addEmployee/AddEmployeeView.tsx` | 16 · 17 | บันทึก · ยกเลิก |
| `/owner/employees/editEmployee` | `src/app/owner/employees/editEmployee/EditEmployeeView.tsx` | 21 · 22 | บันทึก · ยกเลิก |
| `/owner/products/addProducts` | `src/app/owner/products/addProducts/AddProductView.tsx` | 16 · 17 | บันทึก · ยกเลิก |
| `/owner/products/[id]/edit` | `src/app/owner/products/[id]/edit/EditProductView.tsx` | 21 · 22 | บันทึก · ยกเลิก |
| `/owner/employees/permissions` | `src/app/owner/employees/permissions/PermissionsView.tsx` | 81 | บันทึกสิทธิ์ (`SaveButton label={t("permissions.save")}`) |

### 3.4 ปุ่มเฉพาะหน้า → `icon={actionIcon(...)}` (18 ปุ่ม)

| route | component | บรรทัด | ปุ่ม | kind |
|---|---|---|---|---|
| `/owner/orders/manageOrders` | `src/app/owner/orders/manageOrders/ManageOrdersView.tsx` | 136 | แสดงรายการ (สลิปรอตรวจ) | `filter` |
| 〃 | 〃 | 157 | ยกเลิกออเดอร์ | `cancelAction` |
| `/owner/orders/manageOrders` (drawer ออเดอร์) | `src/app/owner/orders/manageOrders/_components/OrderDetailContent.tsx` | 102 | ยืนยันการชำระเงิน | `verify` |
| `/owner/orders/preOrderRound` (drawer ออเดอร์พรีออเดอร์) | `src/app/owner/orders/preOrderRound/_components/PreorderDetailContent.tsx` | 108 · 110 | ยกเลิกออเดอร์ · ไปสถานะถัดไป | `cancelAction` · `next` |
| `/owner/orders/preOrderRound` (drawer รอบ) | `src/app/owner/orders/preOrderRound/_components/RoundDetailContent.tsx` | 50 · 52 | ยกเลิกรอบ · ไปสถานะถัดไป | `cancelAction` · `next` |
| `/owner/production` (drawer ใบสั่งผลิต) | `src/app/owner/production/_components/ProductionOrderDetail.tsx` | 82 · 84 | ยกเลิกใบสั่งผลิต · ไปสถานะถัดไป | `cancelAction` · `next` |
| `/owner/ingredients/ingredientStock` | `src/app/owner/ingredients/ingredientStock/IngredientStockView.tsx` | 109 · 110 · 111 | รับเข้า · เบิกใช้ · ปรับยอด | `receive` · `use` · `adjust` |
| `/owner/products/productStock` | `src/app/owner/products/productStock/ProductStockView.tsx` | 142 | ปรับสต็อก | `adjust` |
| `/owner/orders/OrderInStore` (ตะกร้า POS) | `src/app/owner/orders/OrderInStore/_components/CartPanel.tsx` | 141 | ยืนยัน ฿xx | `confirm` |
| `/owner/orders/OrderInStore` (Modal QR) | `src/app/owner/orders/OrderInStore/_components/QRPaymentModal.tsx` | 61 | ยืนยันรับเงินแล้ว (Modal นี้ `footer={null}` ใช้ปุ่มของตัวเอง) | `confirm` |
| `/owner/employees/permissions` | `src/app/owner/employees/permissions/PermissionsView.tsx` | 76 | รีเซ็ต | `reset` |
| 〃 (ตารางสิทธิ์) | `src/app/owner/employees/permissions/_components/PermissionMatrix.tsx` | 58 | เปิดทั้งหมด / ปิดทั้งหมด (สลับตามสถานะ) | `confirm` / `off` |
| `/owner/notificationsHistory` (drawer) | `src/app/owner/notificationsHistory/NotificationHistoryView.tsx` | 166 | ไปที่ลิงก์ | `external` |

### 3.5 ปุ่มท้าย Modal → `{...modalButtonIcons(kind)}` (15 Modal · ปุ่ม OK + Cancel = 30 ปุ่ม)

ปุ่ม **Cancel** ได้ `cancel` (✕) ทุก Modal · ปุ่ม **OK** ตามตาราง — Modal ที่ใช้ทั้งสร้างและแก้ไขสลับไอคอนตามโหมด (`editTarget ? "save" : "add"`)

| route (หน้าที่เปิด Modal) | Modal | บรรทัด | ปุ่ม OK | kind ของ OK |
|---|---|---|---|---|
| `/owner/employees/permissions` | `src/app/owner/employees/permissions/_components/RoleFormModal.tsx` | 37 | สร้าง | `add` |
| `/owner/finance/expenses` | `src/app/owner/finance/expenses/_components/ExpenseFormModal.tsx` | 43 | บันทึก / เพิ่มรายจ่าย | `save` / `add` |
| `/owner/ingredients` | `src/app/owner/ingredients/_components/IngredientFormModal.tsx` | 85 | บันทึก / เพิ่มวัตถุดิบ | `save` / `add` |
| `/owner/ingredients/units` | `src/app/owner/ingredients/units/_components/UnitFormModal.tsx` | 63 | บันทึก / เพิ่มหน่วย | `save` / `add` |
| `/owner/ingredients/ingredientStock` | `src/app/owner/ingredients/ingredientStock/_components/StockActionModal.tsx` | 58 | รับเข้า / เบิกใช้ / ปรับยอด (ตาม `mode`) | `receive` / `use` / `adjust` |
| `/owner/orders/preOrderRound` | `src/app/owner/orders/preOrderRound/_components/RoundFormModal.tsx` | 93 | สร้าง | `add` |
| 〃 | `src/app/owner/orders/preOrderRound/_components/EditRoundModal.tsx` | 72 | บันทึก | `save` |
| 〃 | `src/app/owner/orders/preOrderRound/_components/RoundItemFormModal.tsx` | 77 | บันทึก | `save` |
| `/owner/production` | `src/app/owner/production/_components/ProductionOrderFormModal.tsx` | 92 | สร้างใบสั่งผลิต | `add` |
| 〃 | `src/app/owner/production/_components/CreateFromRoundModal.tsx` | 69 | สร้างใบสั่งผลิต | `add` |
| `/owner/products/productStock` | `src/app/owner/products/productStock/_components/AdjustStockModal.tsx` | 46 | บันทึก | `save` |
| `/owner/promotions/coupons` | `src/app/owner/promotions/coupons/_components/CouponFormModal.tsx` | 56 | บันทึก / สร้างคูปองใหม่ | `save` / `add` |
| `/owner/recipes` | `src/app/owner/recipes/_components/MainRecipeModal.tsx` | 74 | บันทึก / สร้างสูตรหลัก | `save` / `add` |
| 〃 | `src/app/owner/recipes/_components/ComponentFormModal.tsx` | 65 | บันทึก / สร้างสูตรส่วนประกอบ | `save` / `add` |
| `/owner/store-design` | `src/app/owner/store-design/_components/BannerFormModal.tsx` | 49 | บันทึก / เพิ่มแบนเนอร์ | `save` / `add` |

**Popconfirm ยืนยันการลบ** — `src/components/shared/feedback/ConfirmDeletePopup.tsx:22-23` (ใช้ทุกปุ่มลบทั้งแอป): OK = `delete` (🗑 danger) · Cancel = `cancel` (✕) · ขนาด small

**สรุปรอบ 2:** `RetryButton` 20 · `ViewButton` 4 · `SaveButton` 5 · `CancelButton` 4 · `actionIcon` 18 = **51 ปุ่ม**
· ปุ่มท้าย `modalButtonIcons` 15 Modal (30 ปุ่ม) · Popconfirm ยืนยันลบ 1 จุด (2 ปุ่ม ใช้ทั้งแอป)

---

## 4. ที่ตั้งใจ **ไม่** ใส่ไอคอน / คงไว้แบบเดิม

### 4.1 คงไว้แบบ "มีแต่ไอคอน" (6 ปุ่ม) — แถวแน่นมาก ใส่คำแล้วเบียดช่องกรอก · มี `aria-label` ครบ

| ที่ใช้ | component | บรรทัด | ปุ่ม |
|---|---|---|---|
| `/owner/orders/OrderInStore` (ตะกร้า POS) | `src/app/owner/orders/OrderInStore/_components/CartPanel.tsx` | 87 | 🗑 เอาสินค้าออก |
| `/owner/recipes` (ฟอร์มสูตร) | `src/app/owner/recipes/_components/IngredientEditor.tsx` | 64 | ✕ ลบแถววัตถุดิบ |
| 〃 | `src/app/owner/recipes/_components/StepEditor.tsx` | 55 | ✕ ลบขั้นตอน |
| 〃 | `src/app/owner/recipes/_components/MainRecipeModal.tsx` | 136 | ✕ ลบแถวส่วนประกอบ |
| `/owner/orders/preOrderRound` (ฟอร์มรอบ) | `src/app/owner/orders/preOrderRound/_components/RoundFormModal.tsx` | 165 | ✕ ลบแถวสินค้า |
| `/owner/production` (ฟอร์มใบสั่งผลิต) | `src/app/owner/production/_components/ProductionOrderFormModal.tsx` | 154 | ✕ ลบแถวสินค้า |

### 4.2 คงไว้แบบ "มีแต่คำ" — ไม่ใช่ปุ่ม action หรือเป็นปุ่มหลักปุ่มเดียวบนหน้า

| component | บรรทัด | เหตุผล |
|---|---|---|
| `src/app/login/_components/LoginForm.tsx` | 46 | ปุ่ม "เข้าสู่ระบบ" — ปุ่มหลักปุ่มเดียวของหน้า |
| `src/app/owner/access-denied/_components/AccessDeniedCard.tsx` | 17 | ปุ่ม "กลับ" — ปุ่มเดียวของหน้า |
| `src/app/owner/orders/OrderInStore/_components/CartPanel.tsx` | 59 | "ล้างตะกร้า" — ลิงก์ข้อความ (`section-card-link`) แบบเดียวกับ "ดูทั้งหมด →" |
| `src/components/shared/layout/UserMenuDropdown.tsx` | 43 | "ออกจากระบบ" — ลิงก์ข้อความท้าย dropdown |
| `ProductPickerGrid.tsx:27` · `RoleListPanel.tsx:28` · `CategoryChip.tsx:19` · `LocaleSwitcher.tsx:21` · `UserMenuDropdown.tsx:22` | — | ไม่ใช่ปุ่ม action (การ์ดสินค้า POS, รายการบทบาท, ชิปหมวดหมู่ที่มีจุดสีอยู่แล้ว, ตัวเลือกภาษา, avatar) |

---

## 5. สิ่งที่แก้ติดมาด้วย / สิ่งที่พบ

- ไอคอนแก้ไขเหมือนกันทั้งแอป (เดิม `BannerCard` ใช้ solid ที่เดียว) · `CouponCard` ได้ชื่อปุ่มแล้ว (เดิมไอคอนล้วนไม่มี `aria-label`)
- ตัด import ที่ไม่ใช้แล้ว (`PencilSquareIcon`/`TrashIcon`/`Button`) ออกจากไฟล์ที่เกี่ยวข้อง
- **⚠️ พบ (ยังไม่แก้):** ปุ่มลบในมุมมอง**ตาราง** `/owner/products` (`ProductsView.tsx:135`) **ลบทันทีไม่ถามยืนยัน** — มุมมองกริดมี `ConfirmDeletePopup`

---

## 6. ตรวจสอบ

- `npm run check` (i18n + theme + tsc + eslint) ✅ ผ่าน
- สแกน `<Button>` + `<button>` ทั้ง `src/**/*.tsx` หลังแก้ (นับ `{}` ใน prop เพื่ออ่าน `icon={<XIcon />}` ถูก): ที่เหลือ "มีแต่คำ" = เฉพาะ §4.2 ·
  "มีแต่ไอคอน" = เฉพาะ §4.1
- ทุกไฟล์ที่มี `okText=` (Modal/Popconfirm) มี `modalButtonIcons` หรือ `okButtonProps` แล้ว
- ⏳ **ยังไม่ได้ดูด้วยตาในเบราว์เซอร์** — session ของเบราว์เซอร์ทดสอบหมดอายุ ควรเปิดดู: หัวการ์ดคูปอง · ตารางที่มีหลายปุ่ม
  (สต็อกวัตถุดิบ 3 ปุ่ม, ค่าใช้จ่าย, สินค้า, จัดการออเดอร์) ว่าไม่ล้นแนวนอน · ปุ่มท้าย Modal เพิ่ม/แก้ไข · Popconfirm ยืนยันลบ
