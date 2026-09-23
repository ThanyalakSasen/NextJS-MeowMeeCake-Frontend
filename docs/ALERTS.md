# Alert — modal แจ้งเตือน / ยืนยัน ของแอป

> **เอกสารนี้คืออะไร:** ประเภทของ alert ทั้งหมดในแอป ใช้อันไหนเมื่อไหร่ และรายการจุดที่ใช้
> **อัปเดต:** 2026-09-24 — เปลี่ยนจาก sweetalert2 toast (มุมขวาบน หายเอง) + antd Popconfirm เป็น **modal ของแอปเอง**
> **เปิดอ่านเมื่อ:** จะแจ้งผลการทำรายการ / ถามยืนยันในหน้าใหม่ · จะเปลี่ยนหน้าตา alert ทั้งแอป

---

## 1. โครงสร้าง

| ไฟล์ | หน้าที่ |
|---|---|
| `src/lib/alert.ts` | API ที่หน้า/ViewModel เรียก (`alert.*`, `confirmAlert`) — เป็นแค่ **คิว** ไม่ใช่ React เรียกได้จากทุกที่ (onError ของ react-query, try/catch) |
| `src/components/shared/feedback/AlertHost.tsx` | ตัวแสดง modal (antd `Modal`) — แสดงหัวคิวทีละอัน · สี/ไอคอน/หัวข้อต่อประเภทอยู่ที่ `KIND_STYLE` |
| `src/app/providers.tsx` | วาง `<AlertHost />` ไว้จุดเดียว (ใน `NextIntlClientProvider` + antd `ConfigProvider`/`App`) |
| `src/components/shared/feedback/ConfirmDeletePopup.tsx` | ครอบปุ่มลบ → เปิด modal ยืนยันการลบ (`confirmAlert` variant `delete`) — props เดิมทุกอย่าง |
| `src/i18n/messages/{th,en}.json` | หัวข้อมาตรฐาน `alert.title*`, `alert.deleteIrreversible`, ปุ่ม `common.ok` |

**พฤติกรรม:** ทุกประเภท **ต้องกดปุ่มปิดเอง** (ไม่ปิดอัตโนมัติ) · ปุ่มหลักได้ focus อัตโนมัติ → กด Enter ปิด/ยืนยันได้ ·
หลายอันพร้อมกัน = ขึ้นทีละอันตามลำดับ · `alert.*` คืน Promise ที่ resolve เมื่อผู้ใช้กดปิด

---

## 2. ประเภท

| ประเภท | เรียกใช้ | ไอคอน / สี | หัวข้อมาตรฐาน | ปุ่ม | ใช้เมื่อ |
|---|---|---|---|---|---|
| ✅ **สำเร็จ** | `alert.success(text)` | `CheckCircleIcon` เขียว | สำเร็จ | ✓ ตกลง | บันทึก/เพิ่ม/แก้ไข/ลบ/เปลี่ยนสถานะ/ส่งออก สำเร็จ |
| ❌ **ทำรายการไม่สำเร็จ** | `alert.error(isApiError(e) ? e.message : t("…Failed"))` | `XCircleIcon` แดง | ทำรายการไม่สำเร็จ | ✓ ตกลง | ยิง API แล้วล้มเหลว — **แสดงเหตุผลจาก backend เสมอ** (fallback = ข้อความเดิม) · อัปโหลดรูปไม่สำเร็จ |
| ⚠️ **ตรวจสอบข้อมูล** | `alert.warning(text)` | `ExclamationTriangleIcon` เหลือง | กรุณาตรวจสอบข้อมูล | ✓ ตกลง | ตรวจฟอร์มก่อนส่งไม่ผ่าน · เงื่อนไขธุรกิจ (เช่น สินค้าหมดสต็อก) — ผู้ใช้แก้เองได้ ไม่ใช่ระบบพัง |
| ℹ️ **แจ้งให้ทราบ** | `alert.info(text)` | `InformationCircleIcon` น้ำเงิน | แจ้งให้ทราบ | ✓ ตกลง | ผลที่ไม่ใช่ทั้งสำเร็จ/ผิดพลาด (เช่น ไม่มีข้อมูลให้ส่งออก) |
| ❓ **ยืนยัน** | `await confirmAlert(text, { title, confirmText, cancelText, danger?, dismissible? })` | `QuestionMarkCircleIcon` น้ำตาล · `danger` = ⚠ แดง | ยืนยันการทำรายการ | ✕ ยกเลิก · ✓ ยืนยัน | การกระทำที่ต้องถามก่อน (ไม่ใช่การลบรายการเดียว) |
| 🗑 **ยืนยันการลบ** | `<ConfirmDeletePopup title={...} onConfirm={...}><DeleteButton /></ConfirmDeletePopup>` | `TrashIcon` แดง | ยืนยันการลบ + "การลบไม่สามารถย้อนกลับได้" | ✕ ยกเลิก · 🗑 ลบ | ปุ่มลบทุกปุ่ม |

- ส่ง `title` / `note` เองได้ทุกประเภท (ไม่ส่ง = หัวข้อมาตรฐาน)
- `confirmAlert(..., { dismissible: false })` = ปิดด้วย Esc / คลิกพื้นหลัง / ✕ ไม่ได้ ต้องกดปุ่ม — ใช้เมื่อปุ่มยกเลิกมีผลจริง
  (ตอนนี้ใช้ที่ popup "session ใกล้หมดอายุ" ซึ่งปุ่มยกเลิก = ออกจากระบบ)
- **ห้าม** เรียก antd `message` / `notification` / `Modal.confirm` / `Popconfirm` หรือ `window.alert/confirm` ตรง ๆ — ใช้ API ข้างบนเสมอ

---

## 3. จุดที่ใช้ (144 จุด · 48 ไฟล์)

| ประเภท | จำนวน | กลุ่มย่อย |
|---|---|---|
| ✅ สำเร็จ | 54 | บันทึก/เพิ่ม/แก้ไข 25 · ลบ 15 · เปลี่ยนสถานะ/ยกเลิก/อนุมัติ 7 · ส่งออกไฟล์ 3 · อื่น ๆ 4 (เช็คอิน/เช็คเอาท์, สแกนเพิ่มลงตะกร้า, อ่านทั้งหมด) |
| ❌ ทำรายการไม่สำเร็จ | 59 | ยิง API ไม่สำเร็จ (แสดงเหตุผลจาก backend) 57 · อัปโหลดรูปไม่สำเร็จ 2 (`ProductImageUpload.tsx`, `BannerImageUpload.tsx`) |
| ⚠️ ตรวจสอบข้อมูล | 9 | ดู §3.1 |
| ℹ️ แจ้งให้ทราบ | 4 | ไม่มีข้อมูลให้ส่งออก 3 (`useUserLogViewModel`, `useFinanceExpensesViewModel`, `useManageOrdersViewModel`) · รีเซ็ตสิทธิ์แล้ว 1 (`usePermissionsViewModel`) |
| ❓ ยืนยัน | 3 | รีเซ็ตสิทธิ์ (`usePermissionsViewModel.ts`) · ลบการแจ้งเตือนทั้งหมด (`useNotificationHistoryViewModel.ts`) · session ใกล้หมดอายุ (`OwnerLayout.tsx`, `dismissible: false`) |
| 🗑 ยืนยันการลบ | 15 | ปุ่มลบใน พนักงาน, บทบาท, ค่าใช้จ่าย, วัตถุดิบ, หน่วย, การแจ้งเตือน, รอบพรีออเดอร์ + สินค้าในรอบ, สินค้า (กริด + ตาราง), คูปอง, สูตรหลัก, สูตรส่วนประกอบ, รีวิว, แบนเนอร์ |

### 3.1 ย้ายจาก ❌ error → ⚠️ warning (9 จุด — 2026-09-24)

| ไฟล์ | ข้อความ | เหตุผล |
|---|---|---|
| `src/app/owner/ingredients/units/useUnitsViewModel.ts` | `units.pickContext` | ยังไม่เลือก "ใช้กับ" |
| `src/app/owner/orders/preOrderRound/_components/RoundFormModal.tsx` | `preorderRound.openBeforeCloseRequired` · `pickupAfterCloseRequired` | ช่วงวันที่ของรอบไม่ถูกต้อง |
| `src/app/owner/orders/preOrderRound/_components/EditRoundModal.tsx` | 〃 | 〃 |
| `src/app/owner/production/_components/ProductionOrderFormModal.tsx` | `production.itemsRequired` | ยังไม่เพิ่มสินค้าในใบสั่งผลิต |
| `src/app/owner/recipes/_components/ComponentFormModal.tsx` | `recipes.ingredientRequired` | ยังไม่เพิ่มวัตถุดิบ |
| `src/app/owner/recipes/_components/MainRecipeModal.tsx` | `recipes.ingredientRequired` | 〃 |
| `src/app/owner/orders/OrderInStore/usePOSViewModel.ts` | `pos.scanOutOfStock` | เงื่อนไขธุรกิจ: สแกนเจอสินค้าที่หมดสต็อก |

---

## 4. ข้อควรรู้

- **หน้า POS:** สแกนบาร์โค้ดสำเร็จ (`pos.scanAdded`) ขึ้น modal "สำเร็จ" ทุกครั้ง ต้องกด Enter/ตกลงก่อนสแกนชิ้นถัดไป
  (ปุ่มตกลงได้ focus อัตโนมัติ กด Enter ได้เลย) — ถ้าช้าเกินไปสำหรับการขายจริง พิจารณาเอา success ของการสแกนออก
  เพราะสินค้าที่เพิ่มก็เห็นในตะกร้าอยู่แล้ว
- **error จาก validation ของ backend (400):** backend ส่งข้อความรวม "ข้อมูลที่ส่งมาไม่ผ่านการตรวจสอบ" — รายละเอียดช่องที่ผิดอยู่ใน
  `details.issues` ยังไม่ถูกดึงมาแสดง (แก้ได้ที่ `src/lib/http.ts` จุดเดียว)
- **`sweetalert2`** ไม่มีโค้ดไหน import แล้ว แต่ยังอยู่ใน `package.json` — ถอดได้ด้วย `npm uninstall sweetalert2`
