# Final Backlog — งานที่เหลือทั้งระบบก่อนและหลัง deploy

> **เอกสารนี้คืออะไร:** รายการงานที่ยังต้องแก้ ต้องตั้งค่า ต้องตัดสินใจ และต้องทดสอบ ของทั้ง frontend (repo นี้) และ backend
> (`ThanyalakSasen/NextJS-MeowMeeCake` · ในเครื่อง `D:\1.2569\MeowMeeCake\NextJS-MeowMeeCake`) รวมไว้ที่เดียว — เน้น **การจัดการสิทธิ์** (§1)
> **เปิดอ่านเมื่อ:** วางแผนงานรอบถัดไป · เตรียม deploy · ตั้งตำแหน่งพนักงานครั้งแรก
> **ทำไมสำคัญ:** งานค้างกระจายอยู่ใน BACKLOG 4 ไฟล์ของ frontend + backlog / DEPLOY ของ backend — ไฟล์นี้คัดเฉพาะที่ **ยังเปิดอยู่จริง**
> (ตรวจกับโค้ด 2026-10-10) พร้อมบอกว่าแก้ที่ฝั่งไหน
>
> ตรวจ: 2026-10-10 · frontend `main` `6d9352f` · backend `main` `6cc6370` (หลัง merge #80 + #82)
> อัปเดต: 2026-10-10 หลัง merge backend #83 (`f403a28`) + frontend #68 (`4bb4924`) — ปิด P1–P3 · เพิ่ม P11
> อัปเดต: 2026-10-10 หลัง merge frontend #69 (`47bcaec`) — ปิด P11 · เพิ่ม P12 (หน้าสต็อกสินค้า) · P13 (หน้าแบนเนอร์)
> อัปเดต: 2026-10-11 หลัง merge backend #84 (`0352b7c`) + frontend #71 (`ec08544`) — ปิด P12 · P13
> อัปเดต: 2026-10-24 ตรวจทุกข้อกับโค้ด frontend `main` `623e8e3` · backend `main` `927596f` — ปิด P4 · P8 · E1/Q2 · E6 · E7 ·
> เพิ่มคำเตือน E2 (cron บน Render) · ดูผลรวมที่ [§0](#0-ผลตรวจ-2026-10-24)
> ที่มาเดิม: [`BACKLOG4-merge.md`](BACKLOG4-merge.md) §7–§10 · [`BACKLOG2.md`](BACKLOG2.md) §11, §16 · [`fix-backend.md`](fix-backend.md) ·
> backend `docs/DEPLOY.md` · `docs/BACKLOG5.md` · `docs/LINE.md` §8 · `docs/preorder.md` §9 · `docs/reprice.md`
> เช็กลิสต์ให้ทีมติ๊ก: https://claude.ai/artifact/PmrzmXNWwpwi1wUuTMUmFT (หัวข้อ §2–§4 ของไฟล์นี้)

สถานะ: 🔴 ต้องแก้ก่อน deploy · 🟠 ควรแก้ · 🟢 ทำหลัง deploy ได้ · ⏸ รอคนอื่น / รอตัดสินใจ · ✅ เสร็จ
ฝั่ง: **FE** = repo นี้ · **BE** = backend · **ทีม** = เจ้าของร้าน / ผู้ดูแลบัญชี / host

---

## 0. ผลตรวจ 2026-10-24

ระบบ deploy แล้ว: frontend บน Vercel (`sin1`) · backend บน Render (Singapore · plan free) · CI ของ frontend รันทุก PR (check + build) ·
backend มีเทส 126 ไฟล์ · ไม่มี PR / issue เปิดค้างทั้งสอง repo

วิธีตรวจ: เช็คทุกข้อในไฟล์นี้กับโค้ด `main` ของทั้งสอง repo · ข้อที่เป็นค่าตั้งบน host / บัญชีภายนอก / การตัดสินใจ / ผลทดสอบ **ดูจากโค้ดไม่ได้**
จึงไม่นับเป็นปิด (ถ้าทีมทำแล้ว ให้ติ๊กในตารางของหมวดนั้น — ตัวเลขจริงจะสูงกว่านี้)

| หมวด | ทั้งหมด | ✅ ปิดแล้ว | ยังเปิด (ยืนยันจากโค้ด) | ตรวจจากโค้ดไม่ได้ |
|---|---|---|---|---|
| §1 สิทธิ์ | 13 | 9 — P1–P4 · P7 · P8 · P11–P13 | P5 · P6 | P9 (ขั้นตอนตอน deploy) · P10 (ตั้งใจเลื่อน) |
| §2 ค่าตั้ง / บัญชีภายนอก | 9 | 3 — E1 · E6 · E7 (อนุมานจากระบบที่ deploy ใช้งานได้) | — | E2–E5 · E8 · E9 |
| §3 ต้องตัดสินใจ | 6 | 1 — Q2 | Q1 | Q3–Q6 |
| §4 ทดสอบ | 8 | 0 | — | T1–T8 (ไม่มีบันทึกผล) |
| §5 งานโค้ดไม่บล็อก deploy | 11 | 1 — N1 | N2–N10 · N11 (ทำบางส่วน) | — |
| **รวม** | **47** | **14 (≈30%)** | **14** | **18** |

งานโค้ดที่แก้ใน repo ได้ (§1 + §5 ไม่รวมงานทีม): ปิด 10 จาก 23 ≈ 43%

ต้องดูก่อน: **E2** — ไม่พบการตั้ง cron ทั้งใน `render.yaml` และที่อื่นในโค้ด (DEPLOY ⑧ เขียนสำหรับ crontab บน VPS ซึ่ง Render free ไม่มี) ·
**Q1** ยังไม่ตัดสินใจ · **P6** ยังไม่มีแม่แบบตำแหน่ง

---

## สรุปภาพรวม

| หมวด | เปิดอยู่ | ที่ต้องทำก่อน deploy |
|---|---|---|
| [§1 การจัดการสิทธิ์](#1-การจัดการสิทธิ์) | 4 (✅ P1–P4 · P7 · P8 · P11–P13) | P6 (ตั้งตำแหน่งเริ่มต้น) · P9 (ให้สิทธิ์รีวิวตอน deploy) |
| [§2 ค่าตั้งและบัญชีภายนอก](#2-ค่าตั้งและบัญชีภายนอก-ก่อน-deploy) | 6 (✅ E1 · E6 · E7) | ทั้งหมด — deploy แล้ว จึงเป็นช่องโหว่ที่ใช้งานอยู่ |
| [§3 ต้องตัดสินใจ](#3-ต้องตัดสินใจ) | 5 (✅ Q2) | Q1 (COGS) |
| [§4 ทดสอบที่ค้าง](#4-ทดสอบที่ค้าง) | 8 | T1–T4 |
| [§5 งานโค้ดที่ไม่บล็อก deploy](#5-งานโค้ดที่ไม่บล็อก-deploy) | 10 (✅ N1) | — |

**ปิดแล้ววันนี้:** ✅ backend #80 (คนที่ไม่ใช่ owner ยกระดับเป็น owner ไม่ได้) · ✅ backend #82 / issue #81 (ให้หรือจัดการได้ไม่เกินสิทธิ์ที่ตัวเองมี) ·
✅ frontend #63–#66 (เมนูบัญชีลูกค้า 5 รายการ) · ✅ `npm run build` 59 หน้า · `npm run check` · `npm audit` 0 ช่องโหว่ ·
✅ P1–P3 สิทธิ์หน้า ↔ API ตรงกัน (backend #83 · frontend #68) · ✅ P11 หน้าแรกหลังล็อกอินตามสิทธิ์ (frontend #69) ·
✅ P12 หน้าสต็อกสินค้าใช้ `stock` (backend #84 · frontend #71) · ✅ P13 หน้าแบนเนอร์ผูก `products` (frontend #71)

---

## 1. การจัดการสิทธิ์

### 1.1 ทำงานยังไง (ย่อ)

```
บทบาท (role) ──มี──▶ แถวสิทธิ์ (role_id + menu_key) ──5 flag──▶ view · create · update · delete · approve
                                                                   │
backend: ทุก /api/admin/* ตรวจ menu_key + action ── owner ผ่านหมด ──┘   ← ตัวบังคับจริง
frontend: ROUTE_MENU_MAP (constants/menuKeys.ts) กั้นหน้า · usePermission() ซ่อนปุ่ม  ← UX เท่านั้น
```

**กติกา backend หลัง #80 + #82** (คนที่ไม่ใช่ owner): สร้าง/ย้ายเข้า/จัดการบทบาทและบัญชี owner ไม่ได้ · ให้สิทธิ์ได้เฉพาะ flag ที่ตัวเองมี ·
ย้ายบทบาท / ตั้งรหัสผ่าน / แก้ / ลบ ได้เฉพาะคนที่สิทธิ์ไม่เกินตัวเอง · ถอนสิทธิ์ไม่จำกัด

**menu_key แต่ละตัวคุมอะไรจริง** (ตรวจจาก route ของ backend):

| menu_key | หน้าหลังร้าน | API หลัก | approve ใช้ทำอะไร |
|---|---|---|---|
| `dashboard` | แดชบอร์ด | `/admin/dashboard/overview` · `sales-by-day` · `top-products` | — |
| `reports` | รายงานยอดขาย · **รีวิว** · ค่าใช้จ่าย · สรุปการเงิน | `/admin/expenses` · `revenue-by-channel` · `/admin/reviews` · `aspects` · `semantic-terms` | — |
| `products` | สินค้า · ตั้งราคา · คำค้นเทียบเคียง · แบนเนอร์ · (สร้าง/แก้/ลบ หน่วยนับ) | `/admin/products` · categories · units · options/variants · banners · search-synonyms | — |
| `stock` | สต็อกสินค้า | `/admin/products/stock-list` (#84) · `/admin/products/:id/stock` · `products/low-stock` | — |
| `orders` | ออเดอร์ · **POS** · โซนค่าจัดส่ง | `/admin/orders` · `/admin/pos/*` (รวม `guest-customer` — #83) · delivery-zones · delivery-fee | — |
| `preorder` | รอบพรีออเดอร์ | `/admin/preorder-rounds` · `/admin/preorders` | — |
| `payments` | (ใน drawer ออเดอร์ · POS) | `/admin/payments` · `slips` | **ยืนยันสลิป และ คืนเงิน** (ตัวเดียวกัน — P7) |
| `promotions` | คูปอง · โปรโมชัน | `/admin/promotions` · `promotion-usages` | — |
| `production` | การผลิต | `/admin/production-orders` · `production-items` | **ปิดงานผลิต · ตัดสต็อกวัตถุดิบ** |
| `ingredients` | วัตถุดิบ · **สต็อกวัตถุดิบ · ประวัติ** · หน่วยนับ (ดู) | `/admin/ingredients` (+`/stock`) · categories · `ingredient-transactions` · อ่าน `/admin/units` (#83 — `recipes`/`stock` อ่านได้ด้วย) | — |
| `recipes` | สูตร | `/admin/recipes` · `components` · component-categories | — |
| `employees` | พนักงาน · สิทธิ์ · log | `/admin/users` · `roles` · `permissions` · `user-logs` | — |
| `store_info` | ข้อมูลร้าน · ค่าส่งเว็บ | `/admin/weekly-markets` · `shipping-zones` (ส่วนอื่นของข้อมูลร้าน = owner เท่านั้น) | — |

### 1.2 รายการ

| รหัส | ระดับ | ฝั่ง | เรื่อง | แก้ยังไง |
|---|---|---|---|---|
| P1 | ✅ | FE | ~~หน้ารีวิวลูกค้ากั้นด้วย `products` แต่ backend ใช้ `reports`~~ | ✅ frontend #68 — ลบแถว override ใน `menuKeys.ts` → ใช้ `reports` ตาม `/owner/reports` · ทดสอบหน้าจริง: พนักงานที่มีแค่ `reports` เข้าหน้ารีวิวได้ (เดิมไป access-denied) |
| P2 | ✅ | FE + BE | ~~หน้าสต็อก/ประวัติวัตถุดิบกั้นด้วย `stock` แต่ API ใช้ `ingredients` · อ่านหน่วยนับต้องมี `products.view`~~ | ✅ frontend #68 — route gate + sidebar + 2 ViewModel ใช้ `ingredients` · ป้ายหน่วยจาก `unit_id` ที่ populate มา (`unitLabel()`) ไม่เรียก `/admin/units` · ปุ่มในหน้าหน่วยนับตาม `products` · ✅ backend #83 — `crudRoutes` `readMenus`: อ่าน `/admin/units` ได้ด้วย view ของ `ingredients` · `recipes` · `stock` (เขียนยังต้อง `products`) · ทดสอบหน้าจริง: ฝ่ายผลิตที่ไม่มี `products` เปิดสต็อก/ประวัติ/หน่วยนับได้ครบ 200 |
| P3 | ✅ | BE + FE | ~~POS ต้องมี `employees.view` เพื่อหาบัญชีลูกค้าทั่วไป~~ | ✅ backend #83 — `GET /admin/pos/guest-customer` (`orders.view` · ไม่ seed = 404) · ✅ frontend #68 — `posService.guestCustomer()` แทน `usersService.list` · ทดสอบหน้าจริง: พนักงานเคาน์เตอร์ที่ไม่มี `employees` เปิด POS ได้ ไม่เรียก `/admin/users` · ยังไม่ได้ทดสอบขายจริงจนจบ (T1) |
| P4 | ✅ | FE | ~~หน้าพนักงาน/สิทธิ์แสดงตัวเลือกที่ backend จะปฏิเสธ~~ | ✅ (ตรวจ 2026-10-24) — `employees/usePermissionCeiling.ts` สำเนากติกา backend: `roleWithin` · `mayGrant` · ปิดเมื่อยังโหลดไม่เสร็จ · ใช้ในหน้าพนักงาน (`canManage`) และหน้าสิทธิ์ (ล็อกบทบาท owner · ปิดช่อง flag ที่ให้ไม่ได้ · คัดลอกได้เฉพาะบทบาทที่ไม่เกินตัวเอง) · ยังไม่ได้ทดสอบหน้าจริง (T7) |
| P5 | 🟠 | BE | **`expires_at` ยังไม่อยู่ในกติกา #82** — ผู้ที่มีสิทธิ์ชั่วคราวให้สิทธิ์เดียวกันแบบไม่หมดอายุกับบทบาทอื่น (หรือย้ายตัวเองเข้าบทบาทนั้น) ได้ | `permissionCeiling.assertMayGrant`: ถ้าสิทธิ์ของผู้ทำมี `expires_at` ให้ `expires_at` ที่ให้ต้องไม่เกินนั้น · ติดตามใน issue #81 (ปิดแล้ว — เปิด issue ใหม่) · ยังเปิด (2026-10-24: หัวไฟล์ `permissionCeiling.ts` ยังเขียนว่า "ยังไม่ครอบคลุม: expires_at") |
| P6 | 🔴 | FE + ทีม | **ยังไม่มีตำแหน่งเริ่มต้น** — ตอนนี้สร้างตำแหน่งได้แค่แบบว่าง หรือคัดลอกจากตำแหน่งเดิม | ทำ "เริ่มจากแม่แบบ" ใน `RoleFormModal` ตาม §1.3 (P1–P3 เสร็จแล้ว — แม่แบบไม่ต้องใส่สิทธิ์เกินจำเป็น) · ทีมตรวจตารางสิทธิ์ §1.3 ก่อน |
| P7 | ✅ | BE + FE | ~~ยืนยันสลิปกับคืนเงินใช้ `payments.approve` ตัวเดียวกัน~~ | ✅ 2026-10-19 — backend `POST /admin/payments/:id/refund` ใช้ **`payments.delete`** (เทส `refundPermission.test.ts`: มีแค่ approve = 403) · frontend ปุ่มคืนเงิน (ออเดอร์ + พรีออเดอร์) เช็ค `payments.delete` · หน้าจัดการสิทธิ์มีคำอธิบายใต้เมนูการชำระเงิน · ⚠️ **ตอน deploy: คนที่เคยคืนเงินได้ด้วย approve ต้องได้ `payments.delete` เพิ่ม** · ยังไม่ได้ทดสอบหน้าจริง |
| P8 | ✅ | BE | ~~ถอนสิทธิ์ / ปิดบทบาท / ลบบทบาท ของบทบาทที่สิทธิ์สูงกว่าได้~~ | ✅ (ตรวจ 2026-10-24) — `/admin/roles/[id]` และ `/restore` ตรวจ `assertMayManageRole` (`services/ownerProtection.ts`) · การถอนสิทธิ์รายแถวยังไม่จำกัด (ตั้งใจ — ตามกติกา #82) |
| P9 | 🔴 | ทีม | **ตอน deploy: สิทธิ์รีวิวย้ายจาก `products` → `reports`** (backend DEPLOY ⑦) — พนักงานที่เคยดูแลรีวิวต้องได้ `reports` ใหม่ | เจ้าของร้านให้ `reports` ในหน้าจัดการสิทธิ์ (P1 แก้แล้ว — มี `reports` ก็เข้าหน้ารีวิวได้) |
| P10 | 🟢 | BE | cache สิทธิ์ 30 วินาที + rate limit เก็บในหน่วยความจำ → **ต้องรัน backend instance เดียว** (DEPLOY Y8) · ถอนสิทธิ์แล้ว instance อื่นยังเห็นของเก่าได้ | ตอนนี้ไม่ต้องทำ (ร้านขนาดนี้ instance เดียวพอ) · ถ้าขยาย ย้ายไป Redis |
| P11 | ✅ | FE | ~~หลังล็อกอินพนักงานทุกคนไป `/owner/dashboard` แม้ไม่มี `dashboard.view` → widget ทุกตัว 403~~ | ✅ frontend #69 — `/owner/dashboard` ผูก `dashboard` (route gate + sidebar) · ไม่มีสิทธิ์ → `OwnerLayout` พาไปหน้าแรกที่มีสิทธิ์ตามลำดับ sidebar (`lib/landingPath.ts` · นับเฉพาะเมนูที่ผูก menuKey) แทน access-denied · widget เรียก `/admin/orders` · `ingredients/low-stock` · `production-orders` เฉพาะเมื่อมีสิทธิ์เมนูนั้น (ไม่มี = ซ่อน — เดิม 403 ตัวเดียวทำแดชบอร์ดล้มทั้งหน้า) · ทดสอบหน้าจริง 4 แบบ (หน้าเคาน์เตอร์ → `/owner/products` · ฝ่ายผลิต · มีแค่ `dashboard` → 1 widget ไม่มี 403 · owner ครบ 4 widget) · เหลือ: breadcrumb ยังขึ้น "แดชบอร์ด" ให้คนที่ไม่มีสิทธิ์ (กดแล้วไปหน้าแรกที่มีสิทธิ์ — ใช้ได้ แต่ชื่อชวนงง) |
| P12 | ✅ | FE + BE | ~~หน้าสต็อกสินค้ากั้นด้วย `stock` แต่โหลดรายการจาก `/admin/products` + `/admin/product-categories` (`products.view`)~~ | ✅ backend #84 — `GET /admin/products/stock-list` (`stock.view` · สินค้าปกติที่ไม่ถูกลบ · ไม่มี `purchase_cost` · populate หมวด/หน่วย — ชุดข้อมูลเดียวกับ `/admin/pos/products`) · ✅ frontend #71 — `productsService.stockList()` · ชื่อหมวด/หน่วยจากข้อมูลที่ populate · ตัวกรองหมวด = หมวดที่มีสินค้าในหน้า · ไม่เรียก categories/units แล้ว · ปรับยอดยังใช้ `PUT /:id/stock` (`stock.update`) · ทดสอบหน้าจริง: ฝ่ายผลิต (มีแค่ `stock`) · หน้าเคาน์เตอร์ · owner โหลดได้ครบ เรียกแค่ `stock-list` |
| P13 | ✅ | FE | ~~หน้าจัดการแบนเนอร์ไม่ผูกสิทธิ์ แต่ `/admin/banners` ตรวจ `products.*`~~ | ✅ frontend #71 — `/owner/store-design` ผูก `products` (`ROUTE_MENU_MAP` + sidebar) · ปุ่มเพิ่ม (หัวหน้า + การ์ด) / แก้ / ลบ / สวิตช์เปิดปิด / ลากเรียง ตาม `products` create/update/delete · ทดสอบหน้าจริง (แบนเนอร์ชั่วคราว 1 อัน — DB ทดสอบไม่มีแบนเนอร์): ไม่มี `products` → access-denied · ดูอย่างเดียว → ไม่มีปุ่ม + สวิตช์ปิด · owner ครบ |

### 1.3 ตำแหน่งเริ่มต้นที่เสนอ (P6)

ตัวย่อ: ด = view · ส = create · ก = update · ล = delete · อ = approve · — = ไม่มีสิทธิ์
**ต้องให้เจ้าของร้านยืนยันก่อนทำ** — ปรับได้ในตารางสิทธิ์หลังสร้างตำแหน่งเสมอ

| menu_key | ผู้จัดการร้าน | พนักงานหน้าเคาน์เตอร์ | ฝ่ายผลิต |
|---|---|---|---|
| `dashboard` | ด | — | — |
| `reports` | ด ส ก | — | — |
| `products` | ด ส ก ล | ด | — |
| `stock` | ด ก | ด | ด ก |
| `orders` | ด ส ก ล | ด ส ก | — |
| `preorder` | ด ส ก ล | ด ก | ด |
| `payments` | ด ส อ | ด ส อ ⚠️ P7 | — |
| `promotions` | ด ส ก ล | ด | — |
| `production` | ด ส ก ล อ | — | ด ส ก อ |
| `ingredients` | ด ส ก ล | — | ด ก |
| `recipes` | ด ส ก ล | — | ด |
| `employees` | ด ส ก | — (P3 แก้แล้ว — POS ไม่ต้องใช้) | — |
| `store_info` | ด | — | — |

เหตุผล:
- **ผู้จัดการร้าน** — งานประจำวันครบ · เก็บไว้ให้เจ้าของร้าน: ลบพนักงาน · ลบรายการการเงิน/ชำระเงิน · แก้ข้อมูลร้านและค่าส่ง ·
  ตามกติกา #82 จัดการได้เฉพาะพนักงานที่สิทธิ์ไม่เกินตัวเอง (หน้าเคาน์เตอร์ + ฝ่ายผลิตอยู่ในขอบเขตครบ)
- **หน้าเคาน์เตอร์** — เท่าที่ POS ใช้: ขาย (`orders` ส) · ยืนยันการชำระ (`payments` ส อ) · เปลี่ยนสถานะ · ส่งมอบพรีออเดอร์ (`preorder` ก) ·
  คิดส่วนลด (`promotions` ด) · ไม่เห็นตัวเลขการเงิน
- **ฝ่ายผลิต** — เปิด/เริ่ม/ปิดงานผลิต (`production` อ = ตัดสต็อกวัตถุดิบ) · รับเข้า/เบิกวัตถุดิบ (`ingredients` ก) · ปรับสต็อกสินค้าหลังอบ (`stock` ก) ·
  ดูสูตร (แก้ไม่ได้) · ดูยอดพรีออเดอร์ไว้วางแผน · หน่วยนับอ่านได้ด้วย `ingredients`/`recipes`/`stock` (P2 · #83) ·
  หน้าสต็อกสินค้าใช้ `stock` อย่างเดียว (P12 · #84/#71) — ไม่ต้องมี `products`
- หน้าเคาน์เตอร์และฝ่ายผลิตไม่มี `dashboard` → หลังล็อกอินไปหน้าแรกที่มีสิทธิ์ตามลำดับ sidebar (P11 ✅ #69): หน้าเคาน์เตอร์ = สินค้า · ฝ่ายผลิต = สต็อกสินค้า

วิธีทำ (FE): เพิ่ม `ROLE_TEMPLATES` ใน `employees/permissions/permissionGroups.ts` (ข้อมูลตามตารางนี้) · ตัวเลือก "เริ่มจากแม่แบบ" ใน
`RoleFormModal` คู่กับ "คัดลอกสิทธิ์จาก" (เลือกได้อย่างเดียว) · `usePermissionsViewModel` สร้างแถวสิทธิ์ตามแม่แบบผ่าน `permissionsService.create`
แบบเดียวกับการคัดลอก · ข้อความทั้งหมดผ่าน i18n (`permissions.template*` th/en) · ไม่ต้องแก้ backend และไม่ seed ข้อมูลล่วงหน้า
(คนที่ไม่ใช่ owner ใช้แม่แบบได้เฉพาะส่วนที่ไม่เกินสิทธิ์ตัวเอง — backend ปฏิเสธแถวที่เกินด้วย 403 → ต้องแจ้งว่าแถวไหนไม่ถูกสร้าง)

---

## 2. ค่าตั้งและบัญชีภายนอก (ก่อน deploy)

> ขั้นตอนเต็มของ backend: backend `docs/DEPLOY.md` ②–⑧ (DNS · สำรอง DB · secret · pm2 instance เดียว · nginx · งานข้อมูล · cron 6 ตัว)

| รหัส | ระดับ | ฝั่ง | เรื่อง | รายละเอียด |
|---|---|---|---|---|
| E1 | ✅ | ทีม | ~~**เลือกโครงสร้างโดเมน**~~ ✅ (อนุมาน 2026-10-24 — frontend บน Vercel · backend บน Render ใช้งานได้ · ยังไม่ได้เปิดดูค่า `COOKIE_DOMAIN` / `NEXT_PUBLIC_AUTH_GATE` จริง) | subdomain เดียวกัน (`app.` + `api.`) → backend `COOKIE_DOMAIN` + `ALLOWED_ORIGINS` · คนละ site → frontend `NEXT_PUBLIC_AUTH_GATE=client` (ไม่งั้นล็อกอินแล้ววนกลับ `/login`) — backend `docs/security-hardening.md` §3 |
| E2 | 🔴 | BE | `CRON_SECRET` + crontab 6 ตัว (DEPLOY ⑧) | ไม่ตั้ง = ออเดอร์ไม่หมดเวลาเอง · รอบพรีออเดอร์ไม่เปิด/ปิดเอง · ไม่มีเตือนก่อนวันรับ · ไม่มีสรุปรายเดือน · ⚠️ 2026-10-24: backend อยู่บน Render free — `render.yaml` มีแค่ `CRON_SECRET` ไม่มี cron job และไม่มีที่อื่นในโค้ดเรียก `/api/cron/*` (data-integrity · monthly-summary · order-expiry · preorder-reminders · preorder-rounds · storage-cleanup) → ต้องยืนยันว่ามีบริการภายนอกเรียกอยู่ ไม่งั้นงานอัตโนมัติไม่ทำงาน (ยกเลิกออเดอร์หมดเวลามีทางสำรองแบบ lazy ตอนลูกค้าเปิดหน้า) |
| E3 | 🔴 | BE | `STOREFRONT_URL` = โดเมนหน้าร้านจริง (Q-BE3) | ลิงก์ในอีเมลยืนยัน/ตั้งรหัสใหม่ + ลิงก์ท้ายข้อความ LINE |
| E4 | 🔴 | BE | `EMAIL_USER` · `EMAIL_PASS` (+ `EMAIL_SERVICE` หรือ `EMAIL_HOST`/`PORT`) | ไม่ตั้ง = สมัครสมาชิกไม่ได้ (502) |
| E5 | 🔴 | BE + ทีม | LINE: `LINE_CHANNEL_ACCESS_TOKEN` · `LINE_AUTH_CALLBACK_URL` · `LINE_AUTH_RETURN_URL` + Callback URL ใน LINE Console | แจ้งเตือน LINE · ปุ่มเข้าสู่ระบบด้วย LINE · ผูก LINE |
| E6 | ✅ | BE | secret ใหม่ทุกตัว (`JWT_SECRET` · `SESSION_SECRET` · `NEXTAUTH_SECRET` · `CRON_SECRET`) | คนละค่ากับ dev (DEPLOY ②) · ✅ (อนุมาน 2026-10-24 — `render.yaml` ประกาศ key ไว้ และระบบที่ deploy ล็อกอินได้ · ยังไม่ได้ยืนยันว่าเป็นค่าใหม่จริง) |
| E7 | ✅ | FE | env production (✅ อนุมาน 2026-10-24 — หน้าเว็บบน Vercel เรียก backend ได้): `NEXT_PUBLIC_API_BASE_URL` (ต่อท้าย `/api`) · `NEXT_PUBLIC_AUTH_COOKIE=session` · `NEXT_PUBLIC_GOOGLE_CLIENT_ID` · (`NEXT_PUBLIC_AUTH_GATE` ตาม E1) | ค่าทั้งหมดอยู่ใน `.env.example` · ยังไม่มีเอกสาร deploy ฝั่ง frontend (host ไหน · build/run) — ดู N10 |
| E8 | 🔴 | ทีม | **Google Cloud Console** — Authorized JavaScript origins: โดเมนหน้าเว็บจริง (+ `http://localhost` และ `http://localhost:3001` สำหรับ dev) | 2026-10-10 เพิ่ม `http://localhost` + `:3001` แล้ว แต่เช็คซ้ำทุก 3 นาทีนาน 1 ชั่วโมงยังได้ 403 `The given origin is not allowed for the given client ID` → น่าจะตั้งไม่ตรงมากกว่ารอ propagate: ตรวจว่าแก้ใน client `556882585770…` (ค่าเดียวกับ `GOOGLE_CLIENT_ID` ของ backend) และกด Save แล้ว · frontend `.env.local` ตั้ง `NEXT_PUBLIC_GOOGLE_CLIENT_ID` แล้ว |
| E9 | 🔴 | ทีม | งานข้อมูลหลัง deploy (DEPLOY ⑦) | `migrate:upload-files` · แก้รหัสสินค้า `pos-` 2 ตัว · `migrate:reviews` · `check:aspect-names` · `check:data-integrity` · `cleanup:legacy-product-fields` · ให้สิทธิ์ `reports` (P9) |

---

## 3. ต้องตัดสินใจ

| รหัส | ระดับ | รอใคร | เรื่อง | ตัวเลือก / ผลกระทบ |
|---|---|---|---|---|
| Q1 | 🔴 | เจ้าของร้าน + BE | **นิยามต้นทุนขาย (COGS)** — กำไรใน dashboard / สรุปรายเดือนหักต้นทุนวัตถุดิบซ้ำ | ก. COGS ตามสูตร + ค่าใช้จ่ายไม่นับหมวดวัตถุดิบ/บรรจุภัณฑ์ (BE แนะนำ) · ข. COGS = ค่าใช้จ่ายหมวดวัตถุดิบ/บรรจุภัณฑ์ · ถ้าเลือก ก. หน้าสรุปการเงิน (FE) ต้องย้ายไปใช้ `/dashboard/overview` — BACKLOG2 §11 ข้อ 10 · ยังเปิด (2026-10-24: หน้าสรุปการเงินยังใช้แบบ ข. — `COGS_EXPENSE_CATEGORIES`) |
| Q2 | ✅ | ทีม | ~~โครงสร้างโดเมน~~ | ดู E1 |
| Q3 | 🟠 | เจ้าของร้าน | ออเดอร์ทางโทรศัพท์/แชต | `channel: "online"` (นับเป็นเว็บ) ไปก่อน หรือเพิ่มช่องทาง (POS ต้องมีตัวเลือก) — BACKLOG2 §11 ข้อ 9 |
| Q4 | 🟠 | เจ้าของร้าน | โปรจำกัดครั้งต่อลูกค้า (`max_user_per_user`) กับบัญชีลูกค้าทั่วไปของ POS | ยกเว้นบัญชีนี้ หรือห้ามตั้งกับโปรหน้าร้าน — BACKLOG2 §13 |
| Q5 | 🟢 | ทีม | วันปิด FrontOffice (พอร์ต 4000) · คำถาม Q-FO1 · Q-FO3 · Q-FO4 | ตกลงแล้วว่าจะปิด (Q-OWN4) แต่ยังไม่มีวัน — BACKLOG3 G3 |
| Q6 | 🟢 | BE / เจ้าของร้าน | หน้ารีวิว analytics · dashboard · รายสินค้า (F3) | Q-BE4 คำตอบยังไม่ชัด — ต้องถามซ้ำ |

---

## 4. ทดสอบที่ค้าง

ทดสอบกับ backend ตัวที่จะ deploy (ตอนนี้ = `main` `f403a28`) · ในเครื่องใช้ DB `meowmeecake-test` ตาม [`MOCKS.md`](MOCKS.md) · ทั้งจอคอมและมือถือ

| รหัส | ระดับ | เรื่อง | หมายเหตุ |
|---|---|---|---|
| T1 | 🔴 | test plan PR #16–#19 กับ backend จริง (หน้าคำสั่งซื้อหน้าร้าน · POS ดีไซน์ใหม่ · ปรับสต็อก) | ค้าง 21 ข้อ (#16: 7 · #17: 3 · #18: 6 · #19: 5) — BACKLOG2 §16.2 |
| T2 | 🔴 | ล็อกอินด้วย Google ด้วยบัญชีจริง | หลัง E8 |
| T3 | 🔴 | ล็อกอินด้วย LINE + ผูก LINE จากหน้าบัญชี ด้วยบัญชีจริง | หลัง E5 · backend `LINE.md` §7 |
| T4 | 🔴 | สิทธิ์ตามตำแหน่ง: ล็อกอินเป็นแต่ละตำแหน่งใน §1.3 แล้วเปิดทุกหน้าที่ควรเข้าได้ — ต้องไม่มี 403 · หน้าที่ไม่มีสิทธิ์ต้องไป access-denied | หลัง P6 · ทดสอบแล้วเฉพาะหน้าที่แก้: P1–P3 (#68) · P11 หน้าแรกหลังล็อกอิน (#69) · P12–P13 สต็อกสินค้า + แบนเนอร์ (#71) |
| T5 | 🟠 | คลิกดูหน้าจอจริง: checkout (จุดรับ · คูปอง · แต้ม) · สมาชิก/แต้ม · สินค้าแนะนำหน้าแรก · บัญชีพร้อมเพย์รับเงินคืน + ปุ่มโอนคืนหลังร้าน · อาหารที่แพ้ | ผ่านระดับ API แล้ว (39/39 · 20/20 · 11/11) แต่ยังไม่คลิกจริง |
| T6 | 🟠 | หลัง deploy: ตามเช็กลิสต์ backend DEPLOY "ตรวจหลัง deploy" (อัปโหลดรูป · cookie ข้าม subdomain ฯลฯ) | backend `docs/DEPLOY.md` |
| T7 | 🟢 | ล็อกอินเป็นพนักงานที่มี `employees` แล้วลองจัดการ owner / คนที่สิทธิ์สูงกว่า → ต้องได้ข้อความ 403 ที่อ่านเข้าใจ | ยืนยัน #80 + #82 จากหน้าจอ (เทส integration ผ่านแล้ว) |
| T8 | 🟢 | seed ข้อมูลสาธิตจริง (รูปรีวิว · หัวข้อรีวิวมีไอคอน) ก่อนใช้ DB ทำภาพประกอบ | BACKLOG4 V8 |

---

## 5. งานโค้ดที่ไม่บล็อก deploy

| รหัส | ระดับ | ฝั่ง | เรื่อง | ที่มา / หมายเหตุ |
|---|---|---|---|---|
| N1 | ✅ | FE | ~~CI ของ frontend~~ | ✅ 2026-10-19 — `.github/workflows/ci.yml` (ทุก PR + push เข้า main): `npm ci` → `npm run check` → `npm run build` · แก้ `text-gray-400` 4 ไฟล์ที่ทำให้ `lint:ui` (= `npm run check`) ตก · รันในเครื่องผ่านทั้ง check + build แล้ว · ✅ 2026-10-24 รันบน GitHub จริงแล้ว (ทุก PR #175–#181 + push เข้า main ผ่าน) |
| N2 | 🟢 | FE | dashboard แยกยอดตามช่องทาง + รวมพรีออเดอร์ | API `revenue-by-channel` มีแล้ว (หน้าสรุปการเงินใช้อยู่) — BACKLOG2 §12 ข้อ 11 |
| N3 | 🟢 | BE | ตะกร้า / checkout ยังแสดง `price_snapshot` (ราคาตอนหยิบใส่) ไม่ใช่ราคาปัจจุบัน — ยอดจริงคิดใหม่ตอนสั่ง | backend `reprice.md` แถว 1, 3 (ยังไม่ได้ตรวจกับโค้ดรอบนี้) |
| N4 | 🟢 | BE | ผูกโปรโมชัน / `discountEngine` กับพรีออเดอร์ (ตอนนี้มีแค่ส่วนลดกรอกมือ) | backend `preorder.md` §9 |
| N5 | 🟢 | BE | LINE: รับ webhook `unfollow` (ลูกค้าบล็อก OA แล้วระบบยังคิดว่าผูกอยู่) · ข้อความถึงลูกค้าไม่บันทึกลง DB | backend `LINE.md` §8 ข้อ 9–10 |
| N6 | 🟢 | BE / FE | พิมพ์ป้ายบาร์โค้ด/QR สินค้าจาก DB | backend `BACKLOG.md` (label sheet) |
| N7 | 🟢 | FE | กู้คืนรายการที่ลบในหน้าอื่น (ตอนนี้มีแค่โซนค่าส่ง + หัวข้อรีวิว) | BACKLOG2 §16.3 · 2026-10-24: backend มี `/restore` แล้วหลาย resource (แบนเนอร์ · วัตถุดิบ · หมวด · ส่วนประกอบ · ค่าใช้จ่าย · รอบพรีออเดอร์ · สิทธิ์ ฯลฯ) — เหลือทำปุ่มกู้คืนฝั่ง frontend |
| N8 | 🟢 | FE | ลบ `NEXT_PUBLIC_API_MOCK` ออกจาก `.env.local` (ไม่มีผลตั้งแต่ถอด mock — I11) | ไฟล์ในเครื่อง ไม่อยู่ใน git · ยังอยู่ (2026-10-24) |
| N9 | 🟢 | FE / BE | ลบ branch ที่ merge แล้ว (2026-10-24: บน GitHub frontend มี 93 branch ที่ merge แล้ว · backend 15 · worktree ในเครื่องลบแล้ว): backend `fix/owner-escalation` · `fix/permission-ceiling` · `feat/pos-guest-customer` · `feat/product-stock-list` · frontend `fix/permission-gates` · `fix/dashboard-landing` · `fix/stock-banner-gates` · `docs/final-backlog` · `docs/final-backlog-p11` · branch เก่าใน BACKLOG2 §16.5 | — |
| N10 | 🟠 | FE | เอกสาร deploy ฝั่ง frontend (host · build · env · โดเมน) — backend มี `DEPLOY.md` แล้ว frontend ยังไม่มี | E1 ตัดสินใจแล้ว (Vercel `sin1` — `vercel.json`) · ยังไม่มีเอกสาร (2026-10-24) |
| N11 | 🟢 | FE | ตัวเลือก POS ส่วนที่ระบบยังไม่รองรับ: ~~สมาชิก~~ + ส่วนลดสมาชิก · โปรซ้อน · เลขบิลก่อนสร้าง · พิมพ์ใบเสร็จ · ลิ้นชักเงินสด · พักบิล | BACKLOG2 §16.4 (§14) · ทำบางส่วน (2026-10-24: POS มีการ์ดสมาชิก + แต้ม `MemberCard.tsx` แล้ว) |

---

## 6. ลำดับที่แนะนำ

1. ~~**P1 · P2 · P3**~~ ✅ (backend #83 · frontend #68) → ~~**P11**~~ ✅ (#69) → ~~**P12 · P13**~~ ✅ (backend #84 · frontend #71) — สิทธิ์ทุกหน้าที่ตรวจพบตรงกับ backend แล้ว
2. เจ้าของร้านยืนยันตาราง §1.3 → **P6** แม่แบบตำแหน่ง → **T4** ทดสอบทีละตำแหน่ง
3. **Q1** COGS + **E1** โดเมน (ตัดสินใจ) → **E2–E7** ตั้ง env → **E8 · E5** Console → **T2 · T3**
4. **T1 · T5** ทดสอบหน้าที่ค้าง กับ backend `main`
5. deploy ตาม backend DEPLOY.md → **E9** งานข้อมูล + **P9** ให้สิทธิ์ `reports` → **T6**
6. หลัง deploy: ~~**N1** CI · **P4 · P7**~~ ✅ · ที่เหลือตามลำดับความจำเป็น

**ลำดับใหม่ (2026-10-24 — ระบบ deploy แล้ว):** **E2** ยืนยันว่ามีตัวเรียก cron บน Render → **Q1** COGS → **P6** แม่แบบตำแหน่ง → **T4** →
**T1 · T5** ทดสอบหน้าจริง → ติ๊กข้อใน §2–§4 ที่ทีมทำไปแล้ว → **N10** เอกสาร deploy frontend
