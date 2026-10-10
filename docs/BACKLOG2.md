# MeowMeeCake Frontend — BACKLOG 2: งานที่ต้องทำตาม backend PR #52–#57

> สร้าง: 2026-10-03 · ขอบเขต: ฝั่ง Frontend (`src/**`) · เทียบกับ backend branch `fix/backlog4-y7-y11` (PR #57 ซ้อนบน #52 → #53 → #55, + #54)
> เอกสารคู่ฝั่ง backend (repo `D:\1.2569\MeowMeeCake\NextJS-MeowMeeCake`): [`docs/BACKLOG4.md`](../../../MeowMeeCake/NextJS-MeowMeeCake/docs/BACKLOG4.md) §8.4 ·
> `docs/LINE.md` §8.2, §9.10–9.13 · `docs/money-units.md` · `docs/preorder-round-flow.md`
> วิธีตรวจ: อ่านโค้ด frontend จริง (branch `feat/line-link-low-stock`, รวมงานที่ยังไม่ commit) เทียบกับ API/schema ของ backend จริง ·
> `tsc --noEmit` ผ่าน
>
> **อัปเดต 2026-10-03:** แก้ §1–§5, §7, §8 แล้ว — merge เข้า `main` ใน PR #16 (merge commit `49cae44`) · เหลือ §6 (รอเริ่มใช้ variant)
> · ทุกข้อผ่าน `npm run check` (i18n · theme · `tsc --noEmit` · eslint) **แต่ยังไม่ได้ทดสอบกับ backend จริง** (ดู test plan ใน PR #16) ·
> งานค้าง/ข้อสังเกตที่เจอระหว่างแก้ → [§10](#10-งานค้าง--ข้อสังเกตหลังแก้-2026-10-03)
> · งานต่อหลังคำตอบ backend (§12 ข้อ 4–6) merge แล้วใน PR #17 (merge commit `2d8c1ff`) · POS โปรโมชัน + ปรับหน้าจอ → §13
>
> **อัปเดต 2026-10-04:** POS โปรโมชัน + หน้าจอตามดีไซน์ใหม่ (§13–§14) merge แล้วใน PR #18 (`d8b6b8b`) · ปรับสต็อกผ่าน `/stock` (§15.2 ข้อ 5)
> merge แล้วใน PR #19 (`0b55bd0`) · **⚠️ backend PR #52–#57 ยังไม่ merge — frontend `main` ห้าม deploy ก่อน** · สรุปสิ่งที่เหลือทั้งหมด → [§16](#16-สถานะรวม--สิ่งที่เหลือ-2026-10-04)
>
> ก่อนหน้า: [`BACKLOG.md`](BACKLOG.md) (§1–§9 — 2026-09-22/23)

## สถานะโดยรวม

| ข้อ | ระดับ | สถานะ |
|---|---|---|
| **§1 ยังใช้ `product_type` (inStore/online/preorder) — backend เปลี่ยนเป็น `is_preorder` แล้ว (#52)** | 🔴 ต้องทำก่อน merge backend | ✅ แก้แล้ว `ec21a33` |
| **§2 ยืนยันสลิปของพรีออเดอร์ไม่ได้ — พรีออเดอร์จะถูกยกเลิกอัตโนมัติทั้งหมดตอนปิดรอบ (#55)** | 🔴 ต้องทำก่อน merge backend | ✅ แก้แล้ว `55d1d16` |
| **§3 สรุปการเงินอ่าน `revenue.online` ที่ไม่มีแล้ว → `NaN` · พรีออเดอร์ = 0 ตายตัว** | 🟡 | ✅ แก้แล้ว `7670832` |
| **§4 รูปสลิปไม่ผ่าน `resolveUploadUrl()` → 404 ข้าม origin (+ #54 สลิปเป็นไฟล์ส่วนตัว)** | 🟡 | ✅ แก้แล้ว `368f7da` |
| **§5 `manageOrders` ไม่อ่าน `?id=` — ลิงก์จาก LINE/แจ้งเตือนเปิดได้แค่หน้ารายการ** | 🟡 | ✅ แก้แล้ว `d40a147` |
| **§6 สินค้าที่มีตัวเลือก (variant) — ไม่มีหน้าจัดการ · POS ยังไม่รองรับ (backend Y9)** | 🟡 ทำเมื่อจะเริ่มใช้ variant | ⏳ ยังไม่แก้ (ตั้งใจรอ) |
| **§7 ตัวกรองหมวดแจ้งเตือนยังมี `employee` (backend เลิกใช้แล้ว)** | 🟢 | ✅ แก้แล้ว `274ed0a` |
| **§8 หน้าพรีออเดอร์ / ใบผลิต ไม่รองรับ `?id=` — แนบลิงก์เจาะจงจากแจ้งเตือนไม่ได้** | 🟢 | ✅ แก้แล้ว `ffd66e0` (ต้องแจ้ง backend ใส่ `link` — §10) |
| §9 สิ่งที่ตรวจแล้วใช้ได้ (เงินเป็นบาท · ผูก LINE · เกณฑ์สินค้าใกล้หมด · ลิงก์แจ้งเตือนในเว็บ) | ✅ | — |
| §10 งานค้าง / ข้อสังเกตหลังแก้ | — | ดู §10 |
| §11 คำตอบจาก backend — คำถาม 11 ข้อ | — | ✅ ตอบแล้ว (บางข้อ ⏳ รอตัดสินใจ) |
| §12 งานต่อของ frontend หลังคำตอบ backend | — | ข้อ 4–6 ✅ merge แล้ว (PR #17 · `2d8c1ff`) · ที่เหลือดู §12 |
| §13 หน้าคำสั่งซื้อหน้าร้าน: โปรโมชัน + ปรับหน้าจอ | — | ✅ merge แล้ว (PR #18 · `d8b6b8b`) — หน้าจอถูกแทนด้วย §14 · โปรโมชันยังใช้ต่อ |
| §14 POS ตามดีไซน์ใหม่ | — | ✅ merge แล้ว (PR #18 · `d8b6b8b`) — ยังไม่ได้ทดสอบกับ backend จริง |
| §15 ตรวจ CRUD ทั้งระบบ | — | ข้อ 5 ✅ merge แล้ว (PR #19 · `0b55bd0`) · ข้อ 1–4 ✅ ทำแล้ว (ตรวจกับโค้ด 2026-10-10 — ดู §16.3) · §15.3 ✅ (กู้คืนมีเฉพาะบางหน้า) |
| §16 สถานะรวม / สิ่งที่เหลือ (2026-10-04) | — | ดู §16 |

**ลำดับที่แนะนำ:** §1 → §2 (ต้องเสร็จก่อน merge backend #52/#55) → §3 → §4 → §5 → ที่เหลือ — ✅ ทำตามลำดับนี้แล้ว

---

## 1. 🔴 ยังใช้ `product_type` — backend เปลี่ยนเป็น `is_preorder` (boolean) แล้ว

**ที่มา (backend #52, BACKLOG2 §14):** สินค้าเหลือ 2 แบบ ตัดสินด้วย `is_preorder` ตัวเดียว · ช่องทางขาย (เว็บ/หน้าร้าน) ดูจาก**เลขออเดอร์**
(`ORD-` เว็บ · `POS-` หน้าร้าน · `PRE-` พรีออเดอร์) ไม่ได้ผูกกับสินค้า · รหัสสินค้า `pos-…` = ปกติ · `pre-…` = พรีออเดอร์
· backend **ปฏิเสธ** `product_type` / `product_types` ใน body ด้วย 400 (`productService.normalizeTypesInput`) ·
query `?product_type=` แบบเดิมยังแปลงให้ (`isPreorderFilterFrom`) แต่ควรเปลี่ยนเป็น `?is_preorder=true|false`

**ผลกระทบหลัง merge backend #52:**

| จุด | ไฟล์ | อาการ |
|---|---|---|
| สร้าง/แก้สินค้า | `src/app/owner/products/productForm.ts` (ส่ง `product_type`) | **400 ทุกครั้ง** "ฟิลด์ product_type เลิกใช้แล้ว — ส่ง is_preorder แทน" |
| POS | `src/app/owner/orders/OrderInStore/usePOSViewModel.ts:73` (`p.product_type !== "preorder"`) | `product_type` ไม่มีแล้ว → เงื่อนไขจริงเสมอ → **สินค้าพรีออเดอร์โผล่ใน POS** · กดขายแล้ว backend ปฏิเสธ |
| สต็อกสินค้า | `src/app/owner/products/productStock/useProductStockViewModel.ts:64` | สินค้าพรีออเดอร์ (ไม่มีสต็อก) ปนในหน้าสต็อก |
| รายการสินค้า | `src/app/owner/products/ProductsView.tsx:29, 74-76` | คอลัมน์ "ประเภท" ว่าง (`enums.productType.undefined`) · ตัวกรอง inStore/online ไม่มีความหมาย |
| หน้าพรีออเดอร์ | `src/app/owner/orders/preOrderRound/usePreOrderRoundViewModel.ts:44` (`product_type: "preorder"`) | ยังใช้ได้ (backend แปลงให้) แต่ควรเปลี่ยน |
| type | `src/types/product.ts:9, 34, 65` (`ProductType`) | ต้นทางของทุกจุดข้างบน |

**แก้ที่เสนอ:**
- `types/product.ts`: `product_type: ProductType` → `is_preorder: boolean` (ลบ `ProductType` หรือเหลือ `"normal" | "preorder"` สำหรับ UI)
- ฟอร์ม: ตัวเลือก "สินค้าปกติ / พรีออเดอร์" → ส่ง `is_preorder` · พรีออเดอร์ต้องมี `preorder_config` และ**ห้ามส่ง** `product_stock_quantity`
- POS / สต็อก: กรองด้วย `!p.is_preorder` (หรือเรียก `?is_preorder=false`)
- รายการสินค้า: คอลัมน์/ตัวกรอง 2 ค่า · i18n `enums.productType.*` ปรับตาม
- หน้าพรีออเดอร์: `?is_preorder=true`

**✅ แก้แล้ว (`ec21a33`):**
- `types/product.ts`: `Product.is_preorder: boolean` · `ProductListParams.is_preorder` · ลบ `ProductType` · เพิ่ม `ProductKind = "normal" | "preorder"`
  + `productKindOf()` ใช้เฉพาะ UI (ป้าย/ตัวกรอง/i18n) ไม่ส่งไป API
- `services/products.ts` `toProduct()`: derive `is_preorder` จาก response รุ่นเก่า (`product_type` / `product_types`) ได้ และ**ตัดฟิลด์เก่าทิ้ง**
  กันหลุดกลับไปใน body ของ PATCH แล้วโดน 400
- ฟอร์ม: Radio "สินค้าปกติ / พรีออเดอร์" (antd `Select` รับค่า boolean ไม่ได้) → ส่ง `is_preorder` · พรีออเดอร์ซ่อนช่องสต็อก + เกณฑ์ใกล้หมด
- POS / สต็อก: `?is_preorder=false` + กรอง `!p.is_preorder` ฝั่ง client ซ้ำไว้ (กัน backend รุ่นเก่าที่ไม่รู้จัก param) · หน้าพรีออเดอร์ `?is_preorder=true`
- รายการสินค้า / หน้าตั้งราคา / สูตร: คอลัมน์ + ตัวกรอง 2 ค่า · i18n `enums.productType` เหลือ `normal` / `preorder` · mock ใช้ `is_preorder`
- ตรวจแล้ว: PATCH ที่ส่ง `is_preorder` ค่าเดิมซ้ำ **ไม่ทำให้รหัสสินค้าเปลี่ยน** — backend สร้าง `product_id` ใหม่เฉพาะเมื่อ prefix `pos-`/`pre-`
  ไม่ตรงประเภท (เปลี่ยนประเภทจริง = รหัสเปลี่ยน ต้องพิมพ์บาร์โค้ดใหม่)
- ⚠️ ต้องขึ้นพร้อม backend #52 — ~~รัน `scripts/migrate-is-preorder.ts`~~ ไม่ต้องแล้ว (DB จริงย้ายแล้ว 2026-10-01 — §11 ข้อ 1) · ลำดับ deploy ดู §11

---

## 2. 🔴 ยืนยันสลิปของพรีออเดอร์ไม่ได้

**ที่มา (backend #55 — `docs/preorder-round-flow.md` ประเด็น 3):** ใบสั่งผลิตนับ**เฉพาะพรีออเดอร์ที่ชำระเงินแล้ว** (`payment_status = paid`) ·
พรีออเดอร์ที่ไม่จ่ายภายในกำหนด (`payment_due_at` = min(สั่ง + 24 ชม., ปิดรอบ)) **ถูกยกเลิกอัตโนมัติ** · ตอนปิดรอบยกเลิกคนที่ยังไม่จ่ายทั้งหมด
(ยกเว้นมีสลิปรอแอดมินตรวจ)

**ตอนนี้:** `src/app/owner/orders/preOrderRound/_components/PreorderDetailContent.tsx` แสดงแค่ badge `payment_status` — **ไม่มีรูปสลิป
ไม่มีปุ่มอนุมัติ/ปฏิเสธ** · `src/services/preorders.ts` มีแค่ list / get / status

**ผลกระทบ:** แอดมินยืนยันการจ่ายพรีออเดอร์ผ่านหน้าเว็บไม่ได้ → พรีออเดอร์ค้าง pending → **ถูกยกเลิกอัตโนมัติ + ไม่เข้าใบผลิต**

**แก้ที่เสนอ (แบบเดียวกับออเดอร์ใน `manageOrders`):**
- ดึง payment ของพรีออเดอร์: `GET /api/admin/payments?preorder_id=<id>`
- แสดงรูปสลิป (ผ่าน `resolveUploadUrl()` — ดู §4) + ปุ่มอนุมัติ/ปฏิเสธ → `POST /api/admin/payments/{id}/verify` `{ approved: true|false }`
- แสดง**กำหนดชำระ** `payment_due_at` (เลยแล้ว/ใกล้ถึง) ในรายละเอียดและรายการพรีออเดอร์
- (เลือกได้) แจ้งว่าพรีออเดอร์ที่ถูกยกเลิกเพราะไม่จ่ายมี `cancelled_reason` = "ไม่ได้ชำระเงินภายในกำหนด — ระบบยกเลิกอัตโนมัติ"

**✅ แก้แล้ว (`55d1d16`):**
- `paymentsService.listByPreorder()` → `GET /admin/payments?preorder_id=` (backend เรียงใหม่สุดก่อน — ใช้ `[0]`)
- drawer พรีออเดอร์: รูปสลิป + ปุ่ม "ยืนยันการชำระเงิน" / "ปฏิเสธสลิป" (ปฏิเสธมี confirm เตือนว่าเลยกำหนดแล้วจะถูกยกเลิกอัตโนมัติ) ·
  ส่วนสลิปโชว์เฉพาะผู้มี `payments.view` · ปุ่มเฉพาะ `payments.approve`
- "รอตรวจ" ตัดสินจาก `payment.status === "pending"` **ไม่ใช่** `verified_at` — สลิปที่ถูกปฏิเสธแล้วลูกค้าแนบใหม่ backend เปลี่ยนกลับเป็น
  `pending` แต่ `verified_at` ยังค้างค่าตอนปฏิเสธ (บั๊กเดียวกันในหน้าออเดอร์แก้ใน §4)
- `payment_due_at` (`types/preorder.ts` + `services/preorders.ts`) โชว์ใน drawer และใต้ badge การชำระเงินในตาราง · เลยกำหนด = สีแดง
  "เลยกำหนดชำระ" (`preorderStatus.ts` `paymentDueState()`)
- `cancelled_reason` แสดงอยู่แล้วเดิม — พรีออเดอร์ที่ถูกยกเลิกอัตโนมัติเห็นเหตุผลได้เลย

---

## 3. 🟡 สรุปการเงินคำนวณผิด — `revenue.online` ไม่มีแล้ว / พรีออเดอร์ = 0

**ไฟล์:** `src/app/owner/finance/summary/useFinanceSummaryViewModel.ts` (บรรทัด ~45-80)

- เรียก `revenue-by-type` แล้วใช้ `revenueQ.data.online` — backend (#52) ให้ endpoint นี้คืนรูปแบบใหม่ `{ web, pos, preorder, other, total, counts, orders }`
  (เป็น alias ของ `revenue-by-channel`) **ไม่มี `online`** → `Math.max(undefined, 0)` = **`NaN`** → แถวออนไลน์ / หน้าร้าน / รายรับรวม / กำไร เป็น NaN
- `preorderIncome = 0` ตายตัว (คอมเมนต์ว่า "preorder ยังไม่เชื่อมกับ backend") — backend รวมพรีออเดอร์ไว้แล้ว (BACKLOG4 R5)

**แก้ที่เสนอ:** เรียก `GET /api/admin/dashboard/revenue-by-channel?date_from=&date_to=` ใช้ `web` (เว็บไซต์) · `pos` (หน้าร้าน) · `preorder` ·
`other` (ออเดอร์เลขรุ่นเก่า/FrontOffice) · `total` แทนการคิดเองจาก `/admin/orders` (ไม่ต้อง clamp/ลบกันเอง) · หรือใช้
`/api/admin/dashboard/overview` (มี revenue / expenses / cogs / profit_estimate ให้แล้ว — ตัวเลขชุดเดียวกับสรุปรายเดือนที่ส่ง LINE)

**✅ แก้แล้ว (`7670832`) — เลือกทาง `revenue-by-channel`:**
- `reportsService.revenueByChannel()` แทน `revenueByType` · ตรวจแล้วเงื่อนไขเดียวกับที่หน้านี้เคยกรองเอง (ชำระแล้ว · ช่วงวันที่ตาม `created_at`)
  ต่างแค่ backend นับพรีออเดอร์ด้วย
- แถวรายรับ: ยอดขายเว็บไซต์ (`ORD-`) · ยอดขายหน้าร้าน (`POS-`) · ยอดขายพรีออเดอร์ (`PRE-`) · "ออเดอร์รุ่นเก่า (ไม่ระบุช่องทาง)" โชว์เฉพาะเมื่อมียอด ·
  รายรับรวม/จำนวนออเดอร์ใช้ `total` / `orders` จาก backend ตรง ๆ (เลิกรวมเองจาก `/admin/orders` limit 200)
- ตารางเปรียบเทียบ 6 เดือน: รายรับจาก endpoint เดียวกันเดือนละ 1 request (เดิมไม่นับพรีออเดอร์)
- โหลดไม่ได้ → ข้อความ + ปุ่มลองใหม่ (เดิมโชว์รายรับ 0 / กำไรติดลบเงียบ ๆ)
- i18n: `rowReadySales`/`rowOnlineSales` → `rowWebSales`/`rowPosSales` + `rowOtherSales`
- **ไม่ได้เปลี่ยน:** ต้นทุนขายยังนับจากค่าใช้จ่ายหมวดวัตถุดิบ/บรรจุภัณฑ์ (ไม่ได้ใช้ `overview` — จะเปลี่ยนโครงตาราง P&L ทั้งหน้า) — ดู §10

---

## 4. 🟡 รูปสลิปเรนเดอร์ path ดิบ → 404 ข้าม origin (และ #54 สลิปเป็นไฟล์ส่วนตัว)

**ไฟล์:** `src/app/owner/orders/manageOrders/_components/OrderDetailContent.tsx:89` — `src={payment.slip_image_url}` ไม่ผ่าน
`resolveUploadUrl()` (ซึ่งแก้ปัญหาเดียวกันให้รูปสินค้า/แบนเนอร์/ใบเสร็จไปแล้วใน [`BACKLOG.md`](BACKLOG.md) §5)

- **ตอนนี้:** path relative (`/uploads/slips/…`) ถูก resolve กับ origin ของ frontend → 404 (เป็นบั๊กอยู่แล้วแม้ก่อน #54)
- **หลัง backend #54:** สลิปย้ายไปเป็นไฟล์ส่วนตัว URL `/api/files/slips/<file>` — เปิดได้เฉพาะเจ้าของรายการ / owner / staff ที่มีสิทธิ์
  `payments.view` (401/403 ถ้าไม่ล็อกอิน/ไม่มีสิทธิ์) · backend `docs/uploads.md` §6

**แก้ที่เสนอ:** ใช้ `resolveUploadUrl(payment.slip_image_url)` (ทั้งออเดอร์และพรีออเดอร์ §2) — frontend กับ backend เป็น same-site
(`app.` / `api.` โดเมนเดียวกัน · dev: localhost คนละ port) cookie จึงแนบไปกับ `<img>` ได้ ถ้าตั้ง `COOKIE_DOMAIN` ฝั่ง backend ถูก ·
ถ้ายังติด 401 ให้เปลี่ยนเป็นโหลดผ่าน axios (`withCredentials`) → `URL.createObjectURL(blob)`

**✅ แก้แล้ว (`368f7da`):**
- ตรวจ backend: งาน #54 อยู่ branch `origin/fix/uploads-slips-receipts` (ไม่ใช่ `fix/backlog4-y7-y11`) · cookie session เป็น `SameSite=Lax`
  เมื่อ same-site (`src/lib/session.ts`) → `<img>` แนบ cookie เองได้ **ไม่ต้องโหลดผ่าน axios/blob**
- component ใหม่ `src/app/owner/orders/_components/SlipImage.tsx` ใช้ร่วม Manage Orders + Pre-order Round: `resolveUploadUrl()` (รองรับทั้ง
  `/uploads/slips/…` เดิม และ `/api/files/slips/…` ใหม่) · โหลดไม่ได้ (401/403/404) โชว์ "เปิดสลิปไม่ได้" แทนรูปแตก
- `OrderDetailContent.tsx`: "รอตรวจ" เปลี่ยนจาก `verified_at` เป็น `payment.status === "pending"` — เดิมสลิปที่ลูกค้าแนบใหม่หลังถูกปฏิเสธ
  ไม่มีปุ่มให้ยืนยันอีก
- โหมด `AUTH_GATE=client` (frontend/backend คนละ site) เบราว์เซอร์อาจบล็อก third-party cookie ทั้ง `<img>` และ axios — ข้อจำกัดของโหมดนั้นเอง

---

## 5. 🟡 `manageOrders` ไม่อ่าน `?id=` — ลิงก์จาก LINE / แจ้งเตือนเปิดได้แค่หน้ารายการ

**ที่มา (backend LINE.md §9.12):** ข้อความ LINE ถึงเจ้าของร้านแนบลิงก์ `🔗 <ADMIN_APP_URL>/owner/orders/manageOrders?id=<orderId>` และแจ้งเตือนในเว็บ
(`NotificationItem.tsx` → `<Link href={item.link}>`) ใช้ลิงก์เดียวกัน (ออเดอร์ใหม่ · สลิปรอตรวจของออเดอร์)

**ตอนนี้:** `src/app/owner/orders/manageOrders/*` ไม่มี `useSearchParams` / อ่าน `id` เลย → กดแล้วไปหน้ารายการ ต้องหาออเดอร์เอง

**แก้ที่เสนอ:** อ่าน `id` จาก query → เปิด drawer รายละเอียดออเดอร์นั้น (`GET /api/admin/orders/{id}`) แม้ไม่อยู่ในหน้าแรกของรายการ ·
เปิดใน browser ของ LINE ครั้งแรกอาจต้องล็อกอินใหม่ → หลังล็อกอินควรพากลับมาที่ URL เดิม (รวม `?id=`)

**✅ แก้แล้ว (`d40a147`):**
- drawer ผูกกับ `?id=` (URL เป็นตัวตั้ง): เปิดลิงก์ = เปิด drawer ทันที (ดึงรายตัวด้วย id — เปิดได้แม้ไม่อยู่ในหน้า/แท็บตาราง) · กดดูจากตาราง =
  ใส่ `?id=` (แชร์ลิงก์ได้) · ปิด = ลบ `?id=` · id ผิด/ไม่มี → "ไม่พบคำสั่งซื้อนี้ หรือลิงก์ไม่ถูกต้อง" · `page.tsx` ครอบ `Suspense`
- กลับมาที่ URL เดิมหลังล็อกอิน (รวม query):
  - ไม่มี cookie → `proxy.ts` ใส่ `?next=` พร้อม query อยู่แล้ว (แก้ไว้ตอนทำ `/profile`)
  - session หมดอายุ → `OwnerLayout.tsx` + 401 handler กลางใน `AuthBootstrap.tsx` แนบ path + query เป็น `next` (เดิมทิ้ง query / ไม่ใส่ `next` เลย)
  - `LoginForm` ยังกรอง `next` เฉพาะ path ในแอป (`/owner/*`, `/profile`) — ไม่เปิดช่อง open redirect

---

## 6. 🟡 สินค้าที่มีตัวเลือก (variant) — ทำเมื่อจะเริ่มใช้

**ที่มา (backend Y9 — BACKLOG4 §7.11):** สต็อกแยกต่อตัวเลือก (`variant_stock`) และ**สต็อกสินค้า = ผลรวมของตัวเลือก** ·
สั่ง/ใส่ตะกร้าสินค้าที่มีตัวเลือก**ต้องระบุ `variant_id`** (ไม่ระบุ = 400) · ตัวเลือกหมด = 409 แม้สต็อกรวมยังเหลือ ·
ปรับสต็อกที่ตัวสินค้าตรง ๆ (`PUT/PATCH /admin/products/{id}/stock`) ของสินค้าที่มีตัวเลือก = **409** — ต้องปรับที่ตัวเลือก
(`PATCH /api/admin/product-variants/{id}` `{ variant_stock }`)

**ตอนนี้:** ไม่มีหน้าจัดการตัวเลือก · POS ไม่รองรับ (`usePOSViewModel.ts:80` คอมเมนต์ไว้แล้วว่ารอมีสินค้าจริงใช้) · DB จริงมีตัวเลือก 0 ตัว → **ยังไม่กระทบ**

**ต้องทำเมื่อเริ่มใช้:** หน้าเพิ่ม/แก้/ลบตัวเลือก (ชื่อ · ราคาเพิ่ม · สต็อก) ในหน้าแก้สินค้า · POS ให้เลือกตัวเลือกก่อนเพิ่มลงบิล
(`/admin/pos/scan` คืน `variants[]` พร้อม `variant_stock` อยู่แล้ว) · หน้าสต็อกแสดง/ปรับสต็อกต่อตัวเลือก

**⏳ ยังไม่แก้ (2026-10-03)** — ตั้งใจรอจนเริ่มมีสินค้าใช้ตัวเลือกจริง

---

## 7. 🟢 ตัวกรองหมวดแจ้งเตือนยังมี `employee`

**ที่มา (backend LINE.md §9.10):** backend เลิกใช้หมวด `employee` (ลบจาก enum/type — ไม่มีจุดไหนสร้างแล้ว · เอกสารเก่า 1 รายการยังอ่านได้)

**ไฟล์:** `src/app/owner/notificationsHistory/NotificationHistoryView.tsx:20` (`MODULES`) · `src/types/notification.ts:6` ·
`src/mocks/fixtures/notifications.ts` (mock 2 แถว) · i18n `enums.notificationModule.employee` (คงไว้ได้ — ใช้แสดงเอกสารเก่า)

**แก้ที่เสนอ:** เอา `employee` ออกจากตัวเลือกตัวกรอง (และ mock) · **การแปลชื่อหมวดใช้ i18n ของ frontend ต่อได้** (backend มี `module_label`
ภาษาไทยให้ด้วย แต่ frontend รองรับ 2 ภาษาอยู่แล้ว ไม่จำเป็นต้องเปลี่ยน) · backend รับ `?module=` ทั้ง key อังกฤษและป้ายไทย

> หมายเหตุ: ถ้อยคำหัวข้อแจ้งเตือนเปลี่ยนแล้ว (LINE.md §9.11 — เช่น "สินค้าใกล้จะหมด: …", "เปิดพรีออเดอร์รอบใหม่ PRE-…",
> "มีคำสั่งซื้อรอตรวจสอบสลิปโอนเงิน รหัสคำสั่งซื้อ ORD-…") — ตรวจแล้ว frontend **ไม่มีจุดไหนเทียบด้วยข้อความหัวข้อ** ไม่ต้องแก้ (ยกเว้น mock ถ้าอยากให้ตรง)

**✅ แก้แล้ว (`274ed0a`):** ตัวกรองหน้า Notification History เหลือ 5 หมวด (ไม่มี `employee`) · ลบ mock หมวด `employee` 2 แถว ·
**คง** `employee` ไว้ใน `NotificationModule` + i18n เพื่อแสดงป้ายของเอกสารเก่า 1 รายการ

---

## 8. 🟢 หน้าพรีออเดอร์ / ใบผลิต ไม่รองรับ `?id=`

ถ้าอยากให้ลิงก์จากแจ้งเตือน (เว็บ + LINE) เปิดรายการนั้นตรง ๆ แบบ §5 — ให้ 2 หน้านี้อ่าน `?id=` แล้วเปิดรายละเอียดด้วย แล้วแจ้ง backend ให้ใส่ `link`:

| แจ้งเตือน (backend) | ลิงก์ตอนนี้ | path ที่ใช้ได้ (อัปเดตหลังแก้ `ffd66e0`) |
|---|---|---|
| สรุปยอดรายเดือน | `/owner/dashboard` | ✅ ตรงแล้ว |
| ออเดอร์ใหม่ · สลิปรอตรวจของออเดอร์ | `/owner/orders/manageOrders?id=<orderId>` | ✅ ตรงแล้ว — เปิด drawer ได้ตั้งแต่ §5 |
| พรีออเดอร์ใหม่ · สลิปของพรีออเดอร์ | ไม่มี (`submitSlip` ส่ง `link: null`) | **`/owner/orders/preOrderRound?tab=orders&id=<preorderId>`** ✅ รองรับแล้ว |
| ปิดรอบ · จ่ายช้าหลังเริ่มผลิต · เพิ่ม/หักยอดใบผลิต | ไม่มี | **`/owner/production?id=<productionOrderId>`** ✅ รองรับแล้ว |
| สินค้าใกล้จะหมด · ผลิตเสร็จสินค้ามีตัวเลือก | `/owner/products` | `/owner/products/{id}/edit` (มีอยู่แล้ว) |
| วัตถุดิบใกล้จะหมด | `/owner/ingredients` | ไม่มีหน้ารายตัว — ใช้หน้ารวมต่อ |

**✅ แก้แล้ว (`ffd66e0`)** — แพทเทิร์นเดียวกับ §5 (drawer ผูกกับ `?id=` · กดดูจากตารางใส่ `?id=` · ปิดลบออก · id ผิด → "ไม่พบ…"):
- Pre-order Round: `?id=<preorderId>` ดึงรายตัวด้วย id · ไม่ระบุ `?tab=` = ไปแท็บคำสั่งซื้อ
- Production: `?id=<productionOrderId>` หาจาก list ที่โหลดไว้ (ใหม่สุด 200 ใบ — ลิงก์จากแจ้งเตือนชี้ใบล่าสุดเสมอ) · ไม่ระบุ `?tab=` = แท็บสถานะ

---

## 9. ✅ ตรวจแล้วใช้ได้ (บันทึกไว้กันตรวจซ้ำ)

| เรื่อง | ผล |
|---|---|
| หน่วยเงิน (backend เปลี่ยน DB เป็นบาท — `money-units.md`) | ✅ frontend ไม่มีจุดไหนคูณ/หาร 100 — ถือเงินจาก API เป็นบาทอยู่แล้ว · API ไม่เปลี่ยน contract |
| ผูกบัญชี LINE ของลูกค้า | ✅ หน้า `/profile` (commit `d20b215`) |
| เกณฑ์สินค้าใกล้หมดรายสินค้า (`low_stock_threshold`) | ✅ commit `fa60150` |
| ลิงก์ในแจ้งเตือนเว็บ | ✅ `NotificationItem.tsx` ใช้ `<Link href={item.link}>` |
| path หน้า dashboard สำหรับสรุปรายเดือน | ✅ `/owner/dashboard` มีอยู่จริง |
| typecheck | ✅ `tsc --noEmit` ผ่าน (2026-10-03, รวมงานที่ยังไม่ commit) |
| ลบหน้าเช็คอิน-เช็คเอาท์ (attendance) | ✅ commit `b7d55b3` (เดิมเป็นงานยังไม่ commit 21 ไฟล์ตอนตรวจ) |
| `npm run check` หลังแก้ทุกข้อ | ✅ ผ่าน (2026-10-03, ก่อน merge PR #16) |

---

## 10. งานค้าง / ข้อสังเกตหลังแก้ (2026-10-03)

**ต้องทำก่อน/ตอน deploy (ฝั่ง backend / ประสานงาน):**
- 🔴 **frontend (`main` หลัง PR #16) ต้องขึ้นพร้อม backend #52** — ไม่งั้นฟอร์มเพิ่ม/แก้สินค้าได้ 400 (backend บน `main` ยังไม่รู้จัก `is_preorder`)
  · ~~รัน `scripts/migrate-is-preorder.ts`~~ ไม่ต้องแล้ว — DB จริงย้ายแล้ว 2026-10-01 (§11 ข้อ 1 มีลำดับ deploy เต็ม)
- ✅ ~~แจ้ง backend ใส่ `link` ในแจ้งเตือนตามตาราง §8~~ — backend ทำแล้ว 2026-10-03 (PR #57 · backend `docs/LINE.md` §9.14) ใช้ได้หลัง merge backend · ดู §11 ข้อ 2
- 🟡 ทดสอบกับ backend จริงตาม test plan ใน PR #16 (ยังไม่ได้ทดสอบ)

**ข้อสังเกตที่เจอระหว่างแก้ (ยังไม่ทำ):**
- Manage Orders มีแค่ปุ่ม "ยืนยันการชำระเงิน" — ไม่มี "ปฏิเสธสลิป" เหมือนหน้าพรีออเดอร์ (§2) · เพิ่มได้ด้วยแพทเทิร์นเดียวกัน
- สรุปการเงิน: หลังขายหน้าร้าน POS invalidate แค่ `orders`/`products` ไม่ใช่ `reports` → ถ้าเปิดหน้าสรุปค้างไว้ ตัวเลขยังไม่อัปเดตจนรีโหลด
- สรุปการเงิน: ต้นทุนขายยังคิดจากค่าใช้จ่ายหมวดวัตถุดิบ/บรรจุภัณฑ์ — ถ้าอยากให้ตรงกับสรุปรายเดือนที่ส่ง LINE ต้องย้ายไปใช้ `/dashboard/overview` (เปลี่ยนโครงตาราง P&L)
- Production `?id=`: หาเฉพาะใน 200 ใบล่าสุดที่โหลดไว้ — ลิงก์ไปใบที่เก่ากว่าจะขึ้น "ไม่พบ" (`productionOrdersService.get` มีอยู่ ถ้าต้องการค่อยเพิ่ม fallback)
- POS ช่องสแกน (แก้แล้ว `49df14e`): พิมพ์ด้วยแป้นอังกฤษครึ่งหนึ่งแล้วสลับแป้นไทยกลางคัน `-` ที่พิมพ์ตอนแป้นอังกฤษจะกลายเป็น `3`
  (ดูจากตัวอักษรอย่างเดียวไม่รู้ว่ามาจากแป้นไหน) — เครื่องสแกนไม่เจอกรณีนี้

**งานอื่นใน PR #16 (นอก BACKLOG2):** หน้า `/profile` เชื่อม LINE (`d20b215`) · เกณฑ์สินค้าใกล้หมด (`fa60150`) · ลบ attendance (`b7d55b3`) ·
อิโมจิ → heroicons (`7817aee`) · POS แปลงแป้นไทย→QWERTY (`439e21a`) + แก้ช่องสแกนแปลงซ้ำ (`49df14e`)

---

## 11. คำตอบจาก backend — คำถาม 11 ข้อ (2026-10-03)

> ฉบับเต็ม: backend `docs/BACKLOG4.md` §8.6 · ✅ = ตอบ/ทำแล้ว · ⏳ = ต้องตัดสินใจร่วม

**ต้องทำ (1–4)**
1. ✅ **ลำดับ deploy #52** — ไม่ต้องรัน `migrate-is-preorder` (DB จริงย้ายแล้ว 2026-10-01) · ลำดับ: merge backend #56 → #52 → #53 → #55 → #57 + #54 →
   หยุด backend+FrontOffice → `migrate:money-to-baht --apply` → deploy backend → **deploy frontend `main` (PR #16) รอบเดียวกัน** → เปิด FrontOffice
2. ✅ **link แจ้งเตือนพรีออเดอร์/ใบผลิต** — backend ใส่แล้ว (`src/lib/adminLinks.ts`): พรีออเดอร์ใหม่ + สลิปพรีออเดอร์ → `/owner/orders/preOrderRound?tab=orders&id=` ·
   แจ้งเตือนใบผลิต → `/owner/production?id=` · สินค้าใกล้หมด → `/owner/products/<id>/edit` · สรุปวันรับ/ปิดรอบที่ไม่มีใบผลิต → `/owner/orders/preOrderRound`
3. ✅ **#54 + `COOKIE_DOMAIN`** — merge แยกได้ แต่ deploy รอบเดียวกัน · `COOKIE_DOMAIN=.<โดเมน>` เมื่อ `app.`/`api.` เป็น subdomain เดียวกัน → `SameSite=Lax` +
   `Secure` (สลิป `<img>` ส่ง cookie ได้) คู่กับ `ALLOWED_ORIGINS=https://app.<โดเมน>` + HTTPS · **แนะนำ subdomain** (คนละโดเมน = `SameSite=None` เสี่ยงโดนบล็อก)
4. ✅ **`LINE_LINK_RETURN_URL`** = `https://app.<โดเมน>/profile` (+ `LINE_LOGIN_CALLBACK_URL=https://api.<โดเมน>/api/shop/me/line/callback` · `ADMIN_APP_URL=https://app.<โดเมน>`)

**ขอยืนยัน (5–8)**
5. ✅ `payment_due_at` อยู่ใน response พรีออเดอร์ทั้ง list/get — พรีออเดอร์เก่าก่อน #55 เป็น `null` → รองรับ null
6. ✅ ออเดอร์จาก POS (`POST /api/admin/orders` ค่าเริ่มต้น `channel: "instore"`) ได้ `POS-YYYYMMDD-…` · `channel: "online"` → `ORD-`
7. ✅/⏳ `/api/shop/me/line` ใช้ได้ทุกบัญชีที่ล็อกอิน · ผูก LINE มีผลแค่แจ้งเตือนถึงลูกค้า (แจ้งเตือนร้านไปกลุ่ม `LINE_TARGET_ID`) ·
   ⏳ ลูกค้าเข้า `/profile` ทางไหน — ตัดสินใจร่วม (FrontOffice ลิงก์มาหน้านี้ / หรือทำปุ่มผูกเองด้วย API เดียวกัน)
8. ✅ โครงข้อมูลคงที่แล้ว (`is_preorder` · `payment_due_at` · `revenue-by-channel` · `module_label` · `link` · `/api/files/slips/…`) — ใช้ได้หลัง merge backend เท่านั้น

**ตัดสินใจร่วมกัน (9–11)**
9. ⏳ channel ออเดอร์โทร/แชต — backend แนะนำ `channel: "online"` (`ORD-`, นับเป็นเว็บ) ไปก่อน · ถ้าต้องแยกยอดค่อยเพิ่ม channel ใหม่ (`TEL-`)
10. ⏳ **COGS** — ⚠️ backend พบว่ากำไรใน dashboard/สรุปรายเดือนหักต้นทุนวัตถุดิบซ้ำ (ค่าใช้จ่ายทุกหมวด + COGS ตามสูตร) · ต้องเลือก 1 นิยามใช้ทั้งสองฝั่ง:
    ก. COGS ตามสูตร + ค่าใช้จ่ายไม่นับหมวดวัตถุดิบ/บรรจุภัณฑ์ (**แนะนำ**) · ข. COGS = ค่าใช้จ่ายหมวดวัตถุดิบ/บรรจุภัณฑ์ (แบบเงินสด — ตรงกับหน้าสรุปการเงินตอนนี้)
11. ⏳ สินค้ามีตัวเลือก — เจ้าของร้านตัดสินใจ · **§6 ต้องเสร็จก่อนสร้างตัวเลือกตัวแรก**

---

## 12. งานต่อของ frontend หลังคำตอบ backend (2026-10-03)

> ที่มา: รายการที่ backend ส่งต่อให้ frontend หลังตอบ §11 · ✅ = ทำแล้ว · ⏳ = รอตัดสินใจ · ▢ = ยังไม่ทำ
> ข้อ 4–6 merge แล้วใน PR #17 (merge commit `2d8c1ff` — commits `b6860e5` · `6b1273c` · `de0ae5b`) · ผ่าน `npm run check` ·
> ยังไม่ได้ทดสอบกับ backend จริง (test plan ใน PR #17)

**🔴 ก่อน/ตอน deploy**
1. ▢ **ทดสอบตาม test plan ใน PR #16** กับ backend `fix/backlog4-y7-y11` (ยังไม่ได้ติ๊กสักข้อ) + กดลิงก์จากแจ้งเตือนใหม่ให้ครบทุกแบบ
   (ออเดอร์ · พรีออเดอร์ใหม่/สลิปพรีออเดอร์ · ใบผลิต · สินค้าใกล้หมด · สรุปวันรับ/ปิดรอบ — path ดู §11 ข้อ 2)
2. ▢ **env production:** `NEXT_PUBLIC_API_MOCK=0` · `NEXT_PUBLIC_API_BASE_URL=https://api.<โดเมน>/api` · `NEXT_PUBLIC_AUTH_COOKIE=session` —
   ตรวจแล้วชื่อตัวแปรตรงกับที่โค้ดอ่าน (`.env.example` ก็ระบุ `session` ไว้แล้ว) · ⚠️ ค่าเริ่มต้นในโค้ดคือ `mmc_session` ถ้าลืมตั้ง = login แล้ววนกลับ `/login`
   · ไม่ต้องตั้ง `NEXT_PUBLIC_AUTH_GATE` ถ้าใช้ subdomain เดียวกันตามที่ backend แนะนำ (§11 ข้อ 3)
3. ▢ **deploy frontend `main` รอบเดียวกับ backend** (#52–#57 และ #54) ตามลำดับใน §11 ข้อ 1

**🟡 ควรทำ**
4. ✅ **ปุ่มปฏิเสธสลิปในหน้าจัดการออเดอร์** — `OrderDetailContent.tsx` มี "ยืนยันการชำระเงิน" + "ปฏิเสธสลิป" (มี confirm) แบบเดียวกับหน้าพรีออเดอร์ ·
   สถานะ `failed` แสดง "สลิปถูกปฏิเสธ รอลูกค้าแนบใหม่" · i18n `orders.rejectPayment*` / `paymentRejected*` / `slipRejected`
5. ✅ **หน้าสรุปการเงินรีเฟรชหลังขาย POS** — checkout invalidate `["reports"]` · เพิ่มเติม: ยืนยัน/ปฏิเสธสลิป (ทั้งออเดอร์และพรีออเดอร์) ก็ invalidate
   `["reports"]` ด้วย เพราะเปลี่ยนยอดที่ชำระแล้วเหมือนกัน
6. ✅ **`/owner/production?id=` โหลดใบที่ไม่อยู่ใน 200 ใบล่าสุด** — ถ้าไม่เจอใน list ดึง `GET /admin/production-orders/{id}` ตรง ๆ ·
   แยก mapping เป็น `toProductionOrder()` ใช้ร่วม list/รายตัว · query key อยู่ใต้ `["production-orders"]` mutation เดิมจึงอัปเดตใบนี้ด้วย ·
   drawer มีสถานะกำลังโหลด และ "ไม่พบ" เฉพาะเมื่อดึงรายตัวแล้วไม่เจอจริง

**⏳ รอตัดสินใจร่วมกัน**
7. ⏳ **นิยามต้นทุน (§11 ข้อ 10)** — ถ้าเลือก (ก) ที่ backend แนะนำ หน้าสรุปการเงินต้องย้ายไปใช้ `/dashboard/overview` (เปลี่ยนโครงตาราง P&L) ·
   ถ้าเลือก (ข) หน้าสรุปการเงินตอนนี้ตรงแล้ว ฝั่ง backend ปรับ dashboard/สรุปรายเดือนแทน
8. ⏳ **ออเดอร์โทร/แชต (§11 ข้อ 9)** — ถ้าจะนับเป็นยอดเว็บ หน้า POS ต้องมีตัวเลือกช่องทาง แล้วส่ง `channel: "online"` (ได้เลข `ORD-`) ·
   ตอนนี้ `posCart.ts` `buildOrderInput()` ส่ง `"instore"` ตายตัว
9. ⏳ **ทางเข้า `/profile` ของลูกค้า (§11 ข้อ 7)** — ตกลงร่วมกับ FrontOffice (ลิงก์มาหน้านี้ หรือ FrontOffice ทำปุ่มผูกเองด้วย API เดียวกัน)
10. ⏳ **สินค้าที่มีตัวเลือก (§11 ข้อ 11)** — §6 ต้องเสร็จก่อนสร้างตัวเลือกตัวแรก

**🟢 ไม่บังคับ**
11. ▢ dashboard แสดงยอดแยกตามช่องทาง และรวมยอดพรีออเดอร์ (ใช้ `revenue-by-channel` แบบเดียวกับหน้าสรุปการเงิน)

**ข้อสังเกตใน §10 ที่ปิดแล้วด้วยรายการนี้:** ปุ่มปฏิเสธสลิปหน้าออเดอร์ (ข้อ 4) · สรุปการเงินไม่รีเฟรชหลังขาย POS (ข้อ 5) ·
Production `?id=` หาได้แค่ 200 ใบล่าสุด (ข้อ 6) · แจ้งเตือน `link` (§11 ข้อ 2 — backend ใส่แล้ว)

---

## 13. หน้าคำสั่งซื้อหน้าร้าน (POS): โปรโมชัน + ปรับหน้าจอ (2026-10-03)

> ✅ merge แล้วใน PR #18 (`d8b6b8b`) · ผ่าน `npm run check` · ทดสอบ logic โปรโมชันด้วยข้อมูลตัวอย่างแล้ว · **ยังไม่ได้ทดสอบกับ backend จริง/ในเบราว์เซอร์**
> ⚠️ ส่วน "หน้าจอใหม่" ด้านล่างถูกแทนด้วย §14 แล้ว (ส่วนโปรโมชัน/แจ้งเตือนสินค้ามีโปรยังใช้ต่อ)

**ที่ขอ:** ใช้โปรโมชันในหน้าคำสั่งซื้อหน้าร้าน · เอาเมนู (กริด) สินค้าออก เหลือส่วนแสดงสินค้าที่สแกน + ช่องค้นหาตามรหัส/ชื่อสินค้า ·
แจ้งเตือนว่าสินค้าไหนมีโปรโมชัน

**หน้าจอใหม่ (`OrderInStore/`):**
- ซ้าย: ช่องสแกนบาร์โค้ด (เดิม) · ช่องค้นหาตามรหัสหรือชื่อสินค้า (`ProductSearch` — antd AutoComplete เลือกแล้วเพิ่มลงรายการ
  แสดงรหัส ราคา สต็อกคงเหลือ และป้ายโปรโมชัน · หมดสต็อกเลือกไม่ได้) · แถบแจ้งโปรโมชันทั้งบิล · ตาราง "รายการสินค้าที่สแกน"
  (`ScannedList` — ชื่อ + รหัส + ป้ายโปร · ราคา · จำนวน · รวม · ลบ)
- ขวา: แผงชำระเงิน (`CheckoutPanel` แทน `CartPanel`) — เลือกโปรโมชัน · ส่วนลดเพิ่มเติม · ยอดชำระ · ชื่อลูกค้า · วิธีชำระ · ยืนยัน
- ลบ: `ProductPickerGrid.tsx` (กริดเมนู) · `CartPanel.tsx` · แท็บหมวดหมู่ + ช่องค้นหาชื่อเดิม
- ช่องค้นหาตามชื่อใช้รายการสินค้าที่โหลดไว้ (`?is_preorder=false`, 200 รายการ) — โหลดไม่ได้ยังยิงบาร์โค้ดได้ (ถาม backend ทีละรหัส)

**โปรโมชัน:**
- โหลด `GET /admin/promotions?activeNow=true` (ต้องมีสิทธิ์ `promotions.view` — ไม่มีสิทธิ์ขายได้ตามปกติ แค่ไม่เห็นโปร) ·
  ใช้เฉพาะช่องทาง `instore` · ตัด `FreeShipping` ทิ้ง (ขายหน้าร้าน = takeaway ไม่มีค่าส่ง backend ปฏิเสธเสมอ)
- `posPromotion.ts` (pure) พรีวิวส่วนลดด้วยกติกาเดียวกับ backend `src/lib/discountEngine.ts` — สินค้า/หมวดที่ร่วมรายการ ·
  ขั้นต่ำยอด/จำนวน · Percentage + เพดาน · Amount · `usage_limit` (จาก `used_count`) · ใช้ไม่ได้ = แสดงเหตุผล
- เลือกได้ทีละ 1 โปร (มีป้าย "คุ้มสุด") · ส่ง `promotion_id` ไปกับ `POST /admin/orders` แล้ว **backend คิดส่วนลดใหม่เอง** —
  ยอดชำระที่สร้าง payment ใช้ `order.total_amount` ของ backend ไม่ใช่ตัวเลขพรีวิว
- ใช้โปรแล้วกรอกส่วนลดเพิ่มเติมไม่ได้ (backend รับ `promotion_*` หรือ `discount_amount` อย่างใดอย่างหนึ่ง)
- โปรที่เลือกไว้แต่บิลเปลี่ยนจนใช้ไม่ได้ → คิดราคาแบบไม่ใช้โปร + แจ้งในแผง (ไม่ส่ง `promotion_id` ที่ backend จะปฏิเสธ)
- ขายเสร็จ invalidate `["promotions"]` (used_count เปลี่ยน)

**แจ้งเตือนสินค้าที่มีโปรโมชัน:**
- สแกน/เลือกสินค้าที่มีโปร → popup "เพิ่มแล้ว" มีบรรทัด "สินค้านี้มีโปรโมชัน: …" (ใช้ `note` ของ popup เดิม ไม่เด้ง popup ซ้อน)
- ป้าย "โปร: …" ในผลค้นหาและในตารางรายการที่สแกน · แถบแจ้ง "โปรโมชันทั้งบิลวันนี้" (โปรที่ไม่จำกัดสินค้า/หมวด)

**แก้เพิ่มระหว่างทำ:**
- สแกนสินค้าที่อยู่ในรายการครบสต็อกแล้ว เดิมขึ้น "เพิ่มแล้ว" ทั้งที่จำนวนไม่เพิ่ม → แจ้งเตือน "ครบจำนวนสต็อกแล้ว" แทน
- `th.json` / `en.json`: `enums.expenseCategory` และ `enums.expensePaymentMethod` ถูกประกาศซ้ำ 2 ครั้ง — ลบชุดแรกออก
  (runtime ใช้ชุดหลังอยู่แล้ว ผลไม่เปลี่ยน · en ต่างกันแค่ตัวพิมพ์ใหญ่ "Bank Transfer"/"Bank transfer") + บรรทัดว่างที่ค้าง

**ข้อจำกัด / ต้องตัดสินใจ:**
- ⚠️ โปรที่มี `max_user_per_user` — POS ผูกบัญชี "ลูกค้าทั่วไป" บัญชีเดียว ใช้ไปครบสิทธิ์แล้ว backend จะปฏิเสธทุกบิลถัดไป
  (frontend เช็คไม่ได้ — แสดงหมายเหตุใต้โปรนั้นไว้) → ต้องตกลงกับ backend ว่าจะยกเว้นบัญชีลูกค้าทั่วไป หรือห้ามตั้งค่านี้กับโปรหน้าร้าน
- การนับว่า "สินค้ามีโปร" นับเฉพาะโปรที่จำกัดสินค้า/หมวด — โปรทั้งบิลแสดงที่แถบด้านบนแทน (ไม่ติดป้ายทุกสินค้า)

---

## 14. POS ตามดีไซน์ใหม่ (2026-10-04)

> ✅ merge แล้วใน PR #18 (`d8b6b8b` — commits `5e1aaba` · `40c5c0c` เอากรอบช่องสแกนออก · `1c8a2e2` ปุ่มเงินสด/QR ใช้ base `Button`
> ขนาดมาตรฐาน) · ผ่าน `npm run check` · **ยังไม่ได้ทดสอบในเบราว์เซอร์/กับ backend จริง**
> ที่มา: ดีไซน์ HTML "POS ขายหน้าร้าน" — ใช้เฉพาะส่วนเนื้อหา (header/เมนูสีเข้มของดีไซน์ไม่ใช้ — หน้านี้อยู่ใน OwnerLayout ของแอป)

**หน้าจอ (`OrderInStore/`) — แทนของ §13 ทั้งหมด:**
- ซ้าย: ช่อง **"สแกน / ค้นหา" ช่องเดียว** (`ScanSearchBox` — ยิงบาร์โค้ด หรือพิมพ์รหัส/ชื่อ · คำแนะนำใต้ช่อง: รหัส · ชื่อ + ป้ายโปร · ราคา · "+ เพิ่ม")
  · **บิลปัจจุบัน** (`BillCard` — รหัส · ชื่อ + ราคาต่อหน่วย + ป้ายโปร · ปุ่ม −/+ · รวม · ลดเหลือ 0 = เอาออก)
- ขวา (`PaymentAside`): **การ์ดโปรโมชัน** · ยอดสินค้า / ส่วนลดโปรโมชัน / ยอดชำระ (ตัวใหญ่) · ปุ่ม **เงินสด** / **QR พร้อมเพย์** · "ยกเลิกบิลนี้" (มี confirm)
- หน้าต่าง: **รับเงินสด** (`CashPaymentModal` — ยอดชำระ · รับเงินมา · เงินทอน/ยังขาด · ปุ่มด่วน "พอดี" + ธนบัตร 3 ใบถัดไป ·
  คีย์แพด · พิมพ์ตัวเลข/Backspace/Enter จากคีย์บอร์ดได้) · **QR** (`QRPaymentModal` ปรับตามดีไซน์ + "เปลี่ยนเป็นเงินสด") ·
  **ชำระเงินสำเร็จ** (`PaymentDoneModal` — เลขออเดอร์ · วิธีชำระ · ยอดจริงจาก backend · รับเงิน · ส่วนลด · เงินทอน · เริ่มบิลใหม่)
- ลบ: `ScannedList` · `ProductSearch` · `CheckoutPanel` (ของ §13) · ช่องชื่อลูกค้า (ไม่เคยถูกส่งไป backend) · ส่วนลดกรอกมือ (ดีไซน์ไม่มี)

**พฤติกรรม:**
- Enter ในช่องสแกน/ค้นหา: รหัสตรงกับสินค้าที่โหลดไว้ หรือคำแนะนำเหลือตัวเดียว → เพิ่มทันที · ไม่งั้นถาม `GET /admin/pos/scan` (รองรับรหัสนอก 200 รายการ / `_id`)
- แปลงแป้นไทย→QWERTY ยังใช้กับช่องนี้ (สแกนตอนแป้นเป็นไทยได้) · ยิงบาร์โค้ดตอนไม่ได้ focus ช่องไหนก็ยังเข้าช่องนี้
- เพิ่มสินค้าไม่เด้ง popup ทุกชิ้นแล้ว (สแกนต่อเนื่องได้) — เด้งแจ้งเฉพาะ **สินค้าที่มีโปรโมชัน** / หมดสต็อก / ครบสต็อก
- เงินทอน/ยอดสรุปหลังจ่ายใช้ `order.total_amount` / `discount_amount` ของ backend (ไม่ใช่ตัวเลขพรีวิว)
- สีใช้โทเคนของแอป (น้ำตาล · success · info · danger) แทนสีของดีไซน์ (`#B4235A` / `#0B5E4C` / `#1E5AA8`) และฟอนต์ของแอปแทน Mitr/IBM Plex Sans Thai

**ส่วนของดีไซน์ที่ยังไม่ได้ทำ (backend/ระบบยังไม่รองรับ):**
- **สมาชิก** ("เพิ่มสมาชิก (เบอร์โทร / สแกนบัตร)" + ส่วนลดสมาชิก 5%) — POS ผูกบัญชีลูกค้าทั่วไปบัญชีเดียว ยังไม่มีระบบสมาชิก/ค้นหาลูกค้าด้วยเบอร์
- **โปรโมชันซ้อนหลายตัว** (ดีไซน์เลือกได้หลายการ์ด + อัตโนมัติ) — backend รับ `promotion_id` เดียวต่อออเดอร์ → การ์ดเลือกได้ทีละ 1
  · โปรแบบ "6 ชิ้น จ่าย 5" / "คู่เค้กลด ฿10 ต่อแก้ว" ทำไม่ได้ด้วยชนิดส่วนลดของ backend ตอนนี้ (มีแค่ Percentage / Amount / FreeShipping)
- **เลขบิลก่อนสร้าง** ("บิล #000231") — backend gen `order_no` ตอนสร้างออเดอร์ · โชว์ในหน้าต่างชำระสำเร็จแทน
- **พิมพ์ใบเสร็จ** · **เปิดลิ้นชักเงินสด** · **QR พร้อมเพย์จริง** (ยังเป็น mock) · **พักบิล** / ชื่อแคชเชียร์ / เวลา (อยู่ใน header ของดีไซน์)

---

## 15. ตรวจ CRUD ทั้งระบบ — frontend เทียบกับ backend (2026-10-04)

> วิธีตรวจ: เทียบทุก route `/api/admin/*` ของ backend (branch `fix/backlog4-y7-y11`) กับ `src/services/*.ts` แล้วไล่ว่าแต่ละฟังก์ชันมีหน้า
> (`src/app`, `src/components`, `src/hooks`) เรียกใช้จริงไหม · อ่านอย่างเดียว ไม่ได้แก้โค้ด · frontend branch ตอนตรวจ: `feat/pos-promotions`
> C = สร้าง · R = อ่าน · U = แก้ · D = ลบ

### 15.1 ✅ ครบ / เกือบครบ

| resource | C | R | U | D | หมายเหตุ |
|---|---|---|---|---|---|
| สินค้า | ✅ | ✅ | ✅ | ✅ | รวมอัปโหลดรูป · ⚠️ ปรับสต็อกผ่าน PATCH ทั่วไป (§15.2 ข้อ 5) |
| วัตถุดิบ · หน่วยนับ · สูตร · ส่วนประกอบ | ✅ | ✅ | ✅ | ✅ | |
| ค่าใช้จ่าย · โปรโมชัน · แบนเนอร์ | ✅ | ✅ | ✅ | ✅ | |
| ผู้ใช้/พนักงาน | ✅ | ✅ | ✅ | ✅ | ⚠️ ขาดรีเซ็ตรหัสผ่าน / ปลดล็อก (§15.2 ข้อ 4) |
| รอบพรีออเดอร์ + สินค้าในรอบ | ✅ | ✅ | ✅ | ✅ | |
| ใบสั่งผลิต | ✅ | ✅ | start / complete / cancel | — | `productionOrdersService.update/remove` มีแต่ไม่มีหน้าใช้ |
| ออเดอร์ · พรีออเดอร์ | ✅ (POS) | ✅ | เปลี่ยนสถานะ | ยกเลิกแทนลบ | ⚠️ ขาดสถานะจัดส่ง (§15.2 ข้อ 3) |
| การชำระเงิน | ✅ | ✅ | อนุมัติ / ปฏิเสธ | — | ⚠️ ขาดคืนเงินด้วยมือ (§15.3 ข้อ 7) |
| แจ้งเตือน · รีวิว | — | ✅ | อ่านแล้ว / ซ่อน / sentiment | ✅ | |
| สิทธิ์ (permissions) · role | ✅ | ✅ | สิทธิ์ ✅ · role ❌ | role ✅ · สิทธิ์ ❌ | `permissionsService.remove` มีแต่ไม่มีหน้าใช้ |
| รับเข้า/เบิกวัตถุดิบ | ✅ | ✅ | — | — | เป็นบันทึกประวัติ — ตั้งใจไม่ให้แก้ |

### 15.2 🔴 ขาด — กระทบการใช้งานจริง

| # | เรื่อง | backend มีแล้ว | frontend ตอนนี้ | ต้องทำ |
|---|---|---|---|---|
| 1 | **หมวดหมู่สินค้า / หมวดวัตถุดิบ / หมวดส่วนประกอบ** | CRUD + restore (`/admin/product-categories`, `/ingredient-categories`, `/component-categories`) | มีแค่ `list` | หน้าเพิ่ม/แก้/ลบหมวด (เช่นในหน้าสินค้า/วัตถุดิบ หรือหน้าตั้งค่า) |
| 2 | **โซนค่าส่ง** | `/admin/delivery-zones` CRUD + restore · `/admin/delivery-fee` (คิดค่าส่ง) | ไม่มีเลย | หน้าจัดการโซน (จังหวัด · ค่าส่ง · ยอดขั้นต่ำส่งฟรี) |
| 3 | **สถานะการจัดส่ง** | `PATCH /admin/orders/{id}/delivery` · `/admin/preorders/{id}/delivery` (`delivery_status` · `tracking_no` · `shipped_at` · `delivered_at` · `delivered_note`) | ไม่มี | ปุ่ม/ฟอร์มใน drawer ออเดอร์และพรีออเดอร์แบบ delivery |
| 4 | **ผู้ใช้: รีเซ็ตรหัสผ่าน / ปลดล็อก** | `PUT /admin/users/{id}/password` · `POST /admin/users/{id}/unlock` | ไม่มี | ปุ่มในหน้าพนักงาน — ถ้าพนักงานกรอกรหัสผิดจนโดนล็อก เจ้าของร้านปลดผ่านเว็บไม่ได้ |
| 5 | ✅ **ปรับสต็อกสินค้าผ่าน PATCH ทั่วไป** (แก้คู่กับ backend) — **แก้แล้ว PR #19** (`8746f4f`): หน้าสต็อกใช้ `PUT …/stock` · หน้าแก้สินค้าไม่ส่งสต็อกใน PATCH (ช่องสต็อกโชว์อย่างเดียว) | `PUT /admin/products/{id}/stock` `{ quantity }` · `PATCH …/stock` `{ delta }` (atomic · แจ้งสินค้าใกล้หมด · กันสินค้ามีตัวเลือก) | `useProductStockViewModel.ts:104` → `productsService.update(id, { product_stock_quantity })` = `PATCH /admin/products/{id}` | เปลี่ยนไปใช้ endpoint `/stock` — ทางเดิม: ไม่แจ้งสินค้าใกล้หมด · ข้ามกติกาสินค้ามีตัวเลือก (Y9) · ไม่ atomic (ทับกับออเดอร์ที่ตัดสต็อกพร้อมกันได้) · **backend จะปฏิเสธ `product_stock_quantity` ใน PATCH ทั่วไปในรอบถัดไป** |

### 15.3 🟡 ขาด — ยังไม่กระทบตอนนี้

| # | เรื่อง | หมายเหตุ |
|---|---|---|
| 6 | **ตัวเลือกสินค้า (variant) / ตัวเลือกเสริม (option)** | `/admin/product-variants` · `/admin/product-options` — ยังไม่มี service เลย · DB จริงยังไม่มีข้อมูล → ดู §6 |
| 7 | **คืนเงินด้วยมือ** | `POST /admin/payments/{id}/refund` — ตอนนี้คืนได้แค่อัตโนมัติตอนยกเลิกออเดอร์ที่จ่ายแล้ว |
| 8 | **กู้คืนรายการที่ลบ** | backend มี `…/{id}/restore` เกือบทุก resource (สินค้า · หมวด · หน่วย · สูตร · ส่วนประกอบ · โปรโมชัน · ค่าใช้จ่าย · แบนเนอร์ · ผู้ใช้ · role · รอบพรีออเดอร์ ฯลฯ) — frontend ไม่มีเลย ลบผิดกู้จากเว็บไม่ได้ |
| 9 | **แก้ชื่อ role** | `PATCH /admin/roles/{id}` — มีแค่สร้าง/ลบ |

### 15.4 🟢 ไม่มีหน้า — ไม่จำเป็น / ตั้งใจ

- ประวัติการใช้โปรโมชัน (`/admin/promotion-usages`) · คำ/หมวดของระบบวิเคราะห์รีวิว (`/admin/semantic-terms`, `/admin/aspects`) ·
  แก้รายการในออเดอร์ (`/admin/order-items`) / ในใบผลิตรายบรรทัด (`/admin/production-items` — `actual_qty`, consume/reverse stock)
- ลงเวลาทำงาน (`/admin/attendances`) — ลบออกโดยตั้งใจ (`b7d55b3`)
- endpoint ฝั่งลูกค้า `/api/shop/*` (ตะกร้า · ที่อยู่ · สั่งซื้อ · รีวิว) — เป็นงานของ FrontOffice ไม่ใช่หลังร้าน

**ลำดับที่แนะนำ:** ข้อ 5 (เสี่ยงข้อมูลสต็อกเพี้ยน) → 4 → 3 → 2 → 1 → ที่เหลือ — ข้อ 5 ✅ เสร็จแล้ว (PR #19) · ถัดไปข้อ 4

---

## 16. สถานะรวม / สิ่งที่เหลือ (2026-10-04)

> ตรวจจากของจริง: GitHub PR ทั้งสอง repo · git · `npm run check` บน frontend `main` (`0b55bd0`) ผ่าน · backend repo ที่ใช้งานจริง
> `D:\1.2569\MeowMeeCake\NextJS-MeowMeeCake` (branch `fix/backlog4-y7-y11`)

**Frontend `main`:** PR #16–#19 merge ครบ · ไม่มี PR ค้าง

| PR | เรื่อง | merge commit |
|---|---|---|
| #16 | §1–§5 · §7 · §8 + `/profile` เชื่อม LINE · เกณฑ์สินค้าใกล้หมด · ลบ attendance · ช่องสแกนแป้นไทย | `49cae44` |
| #17 | §12 ข้อ 4–6 (ปฏิเสธสลิปออเดอร์ · รีเฟรชสรุปการเงิน · production `?id=`) | `2d8c1ff` |
| #18 | §13–§14 POS โปรโมชัน + หน้าจอตามดีไซน์ใหม่ · เอกสาร BACKLOG2 §1–§15 | `d8b6b8b` |
| #19 | §15.2 ข้อ 5 ปรับสต็อกผ่าน `/stock` | `0b55bd0` |

### 16.1 🔴 frontend ล้ำหน้า backend — ห้าม deploy frontend `main` ก่อน

- backend PR **#52 · #53 · #54 · #55 · #56 · #57 ยัง OPEN ทั้งหมด** — backend `main` ยังอยู่ที่ PR #51 (`bbca610`)
- frontend `main` ใช้ของจาก PR พวกนั้นแล้ว: `is_preorder` (ฟอร์มสินค้าจะได้ 400) · `revenue-by-channel` (สรุปการเงินโหลดไม่ได้) ·
  `payment_due_at` · payments ของพรีออเดอร์ · สลิปไฟล์ส่วนตัว `/api/files/slips/…` · `PUT …/stock`
- ลำดับ deploy: §11 ข้อ 1 (merge backend → deploy backend → deploy frontend `main` รอบเดียวกัน) · env production: §12 ข้อ 2
- **งาน backend ที่ยังไม่ commit** (อยู่ในเครื่องเท่านั้น): `src/lib/adminLinks.ts` (ลิงก์แจ้งเตือน `?id=` ที่ frontend รองรับแล้ว) ·
  service 10 ไฟล์ · `tests/integration/notificationLinks.test.ts` · `scripts/migrate-money-to-baht.ts` — ต้อง commit/push ก่อน deploy

### 16.2 🧪 ยังไม่ได้ทดสอบกับ backend จริง

test plan ใน PR #16 · #17 · #18 · #19 — ข้อที่ต้องใช้ backend จริงยังไม่ได้ติ๊กเลยสักข้อ (ผ่านแค่ `npm run check` + ทดสอบ logic บางส่วน) ·
เน้นหน้าคำสั่งซื้อหน้าร้าน (§14) ที่เปลี่ยนเยอะ · ทำได้กับ backend `fix/backlog4-y7-y11` ในเครื่องก่อน merge backend

### 16.3 🟡 งาน frontend ที่เหลือ

> ตรวจกับโค้ด `main` 2026-10-10 — งานต่อจากนี้ติดตามใน [`BACKLOG4-merge.md`](BACKLOG4-merge.md)

| ที่มา | เรื่อง | สถานะ |
|---|---|---|
| §15.2 ข้อ 4 | ปุ่มรีเซ็ตรหัสผ่าน / ปลดล็อกผู้ใช้ (หน้าพนักงาน) | ✅ `ResetPasswordModal` + ปลดล็อกในหน้าพนักงาน |
| §15.2 ข้อ 3 | บันทึกสถานะจัดส่ง (เลขพัสดุ · วันส่ง · วันได้รับ) ใน drawer ออเดอร์/พรีออเดอร์ | ✅ `orders/_components/DeliverySection` (ใช้ทั้ง 2 drawer) |
| §15.2 ข้อ 2 | หน้าจัดการโซนค่าส่ง | ✅ `/owner/orders/delivery-zones` (BACKLOG4 I8) · ค่าส่งเว็บ `/owner/shipping` (F2) |
| §15.2 ข้อ 1 | เพิ่ม/แก้/ลบหมวดหมู่สินค้า · วัตถุดิบ · ส่วนประกอบ | ✅ `hooks/useCategoryManager` (ทั้ง 3 ชนิด) |
| §15.3 ข้อ 6 / §6 | ตัวเลือกสินค้า (variant) — ต้องเสร็จก่อนสร้างตัวเลือกตัวแรก | ✅ ตัวแก้ตัวเลือกในหน้าแก้สินค้า (`CustomizationEditor`) + POS เลือกตามกลุ่ม (BACKLOG3 I4) |
| §15.3 ข้อ 7–9 | คืนเงินด้วยมือ · กู้คืนรายการที่ลบ · แก้ชื่อ role | 🟡 คืนเงิน ✅ (`RefundSection`) · กู้คืน: มีเฉพาะโซนค่าส่ง + หัวข้อรีวิว · แก้ชื่อ role ✅ (ปุ่ม "แก้ชื่อ" ในหน้าจัดการสิทธิ์ · backend #79) |
| §12 ข้อ 11 | dashboard แยกยอดตามช่องทาง + รวมพรีออเดอร์ | ▢ ไม่บังคับ — แยกช่องทางมีในหน้าสรุปกำไร-ขาดทุนแล้ว แต่ dashboard ยังไม่แยก |

### 16.4 ⏳ รอตัดสินใจ (เจ้าของร้าน / backend / FrontOffice)

- นิยามต้นทุนขาย (§11 ข้อ 10 · §12 ข้อ 7) — ถ้าเลือก (ก) สรุปการเงินต้องย้ายไป `/dashboard/overview`
- ออเดอร์โทร/แชต `channel: "online"` (§11 ข้อ 9 · §12 ข้อ 8) — ถ้าใช่ POS ต้องมีตัวเลือกช่องทาง
- ทางเข้า `/profile` ของลูกค้า (§11 ข้อ 7 · §12 ข้อ 9) — ตกลงกับ FrontOffice
- โปรที่มี `max_user_per_user` กับบัญชีลูกค้าทั่วไปของ POS (§13) — ยกเว้นบัญชีนี้ หรือห้ามตั้งกับโปรหน้าร้าน
- ส่วนของดีไซน์ POS ที่ระบบยังไม่รองรับ (§14): สมาชิก + ส่วนลดสมาชิก · โปรซ้อนหลายตัว / "6 ชิ้นจ่าย 5" · เลขบิลก่อนสร้าง ·
  พิมพ์ใบเสร็จ · ลิ้นชักเงินสด · QR พร้อมเพย์จริง · พักบิล

### 16.5 🧹 เล็กน้อย

- โหมด mock (MSW) ใช้ไม่ได้แล้ว — handler ยังใช้ path เก่า (`/products` ไม่มี `/admin`) และไม่มี pos · promotions · `/stock` ·
  ตอนนี้ `.env.local` ตั้ง `NEXT_PUBLIC_API_MOCK=0` จึงไม่กระทบ · ถ้าจะใช้ mock ต้องเขียน handler ใหม่ หรือเลิกใช้แล้วลบทิ้ง
- branch ที่ merge แล้วยังค้างทั้งในเครื่องและบน GitHub (`feat/line-link-low-stock` · `fix/backend-followups-4-6` · `feat/pos-promotions` ·
  `fix/product-stock-endpoint`) — ลบได้
