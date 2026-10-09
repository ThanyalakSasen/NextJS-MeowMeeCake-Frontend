# งานที่ backend ต้องแก้ไข

> backend: `ThanyalakSasen/NextJS-MeowMeeCake` (ในเครื่อง `D:\1.2569\MeowMeeCake\NextJS-MeowMeeCake`)
> รวบรวมจาก [`BACKLOG4-merge.md`](BACKLOG4-merge.md) หมวด 9 และคำถามใน [`BACKLOG3-merge.md`](BACKLOG3-merge.md#ถาม-backend) · อัปเดต 2026-10-09 (หลัง backend #71 · frontend #52)

สถานะ: ▢ พร้อมทำ (ตอบแล้วว่าทำ) · ⏸ รอคำตอบ · ✅ เสร็จ · ❌ ไม่ทำ

## 1. ตอบแล้วว่าทำ — frontend รอ API อยู่

ลำดับที่แนะนำ: 1.1 → 1.2 → 1.3 → 1.4

### 1.1 Q-BE10 — รายการสินค้าสำหรับ POS ใต้สิทธิ์ `orders` ▢
- **ปัญหา:** POS ใช้ `GET /admin/products` (ต้องมีสิทธิ์ `products.view`) เป็นคำแนะนำในช่องค้นหา → พนักงานหน้าร้านที่มีแค่สิทธิ์ `orders` ได้ 403 (สแกนรหัส/บาร์โค้ดผ่าน `/admin/pos/scan` ยังใช้ได้)
- **ขอ:** `GET /admin/pos/products?search=&page=&limit=` ใต้สิทธิ์ `orders` — คืนเฉพาะสินค้าที่ขายหน้าร้านได้ (ไม่ลบ · เปิดขาย) พร้อมฟิลด์ที่ POS ใช้: `_id` · ชื่อ th/en · ราคา · สต็อก · รหัส/บาร์โค้ด · รูป · `is_preorder`
- **ทำได้พร้อมกัน:** Q-BE9 (ข้อ 2.3) ใส่ flag `has_customization` ใน response นี้เลย
- **frontend ที่รอ:** I15 — `OrderInStore/usePOSViewModel.ts` (`catalogQ`)

### 1.2 Q-BE12 — บัญชีพร้อมเพย์รับเงินคืนของลูกค้า ▢
- **ปัญหา:** ยังไม่มี field `refund_promptpay_id` / `refund_promptpay_name` ในผู้ใช้ (FrontOffice เดิมมี — BE §7.1 ข้อ 21) · ไม่อยู่ใน `updateProfileBody`
- **ขอ:**
  - เพิ่ม 2 field ใน `userModel` + รับใน `PATCH /shop/me` (ตรวจรูปแบบพร้อมเพย์: เบอร์มือถือ 10 หลัก หรือเลขบัตร 13 หลัก · ล้างค่าได้)
  - คืนใน `GET /shop/me`
  - หลังร้านเห็นบัญชีนี้ตอนคืนเงินออเดอร์ที่ลูกค้ายกเลิก (I2 `RefundSection`) — เช่นใส่ใน `GET /admin/orders/:id` ของออเดอร์ที่ต้องคืนเงิน
- **frontend ที่รอ:** U9 — การ์ด + หน้าต่างแก้ใน `customer/account` · I2 แสดงบัญชีรับเงินคืนในหลังร้าน

### 1.3 Q-BE2 — admin API แก้โซนค่าส่งเว็บ (`ShippingZones`) ▢
- **ปัญหา:** ค่าส่งออเดอร์เว็บคิดจาก `ShippingZones` (โซน A–D · `provinces` · `fee` — `shippingZoneModel.ts`) แต่มีแค่ `GET /catalog/shipping-zones` (อ่านอย่างเดียว) · แก้ได้ทาง DB เท่านั้น
  (POS/หลังร้านใช้ `DeliveryZones` อีกตาราง — `/admin/delivery-zones` มีครบแล้ว ไม่เกี่ยว)
- **ขอ:** `GET /admin/shipping-zones` · `PATCH /admin/shipping-zones/:zone_code` (`fee` · `provinces` · ชื่อ/คำอธิบาย) ใต้สิทธิ์ตั้งค่าร้าน
  - กันจังหวัดซ้ำข้ามโซน · จังหวัดต้องอยู่ในรายชื่อ 77 จังหวัด · `fee` ≥ 0
  - เขียน audit log แบบ endpoint ตั้งค่าอื่น
- **frontend ที่รอ:** F2 — หน้า `owner/shipping` (ตามหน้าเดิมของ FrontOffice)

### 1.4 Q-BE5 — สรุปรอบพรีออเดอร์ + รายชื่อลูกค้าในรอบ ▢ (เจ้าของร้านต้องการ — Q-OWN3)
- **ปัญหา:** `admin/preorder-rounds` มีแค่ CRUD · `items` · `status` · `restore` — ไม่มีสรุปยอด/รายชื่อ (FrontOffice ใช้ `/owner/preorder-rounds/dashboard` · `/:id/customers`)
- **ขอ:**
  - `GET /admin/preorder-rounds/dashboard` — ต่อรอบ: จำนวนพรีออเดอร์ · จำนวนชิ้นต่อสินค้า (จอง / โควตา) · ยอดเงิน · แยกสถานะชำระเงิน (ชำระแล้ว / รอชำระ / ยกเลิก)
  - `GET /admin/preorder-rounds/:id/customers` — รายชื่อลูกค้าในรอบ: ชื่อ · เบอร์ · เลขพรีออเดอร์ · รายการ + จำนวน · วิธีรับ (รับเอง/จัดส่ง + ที่อยู่) · สถานะชำระเงิน · รองรับกรอง/ค้นหา และส่งออก (CSV) ถ้าทำได้
- **frontend ที่รอ:** F4 — dashboard ใน `owner/preorders/rounds`

## 2. รอคำตอบก่อนทำ

| รหัส | เรื่อง | ค้างที่ | frontend ที่รอ |
|---|---|---|---|
| Q-BE4 | รีวิว analytics · dashboard · รายสินค้า (`/owner/reviews/analytics` · `dashboard` · `products/[id]` ของ FrontOffice — BE §8.20 ยังไม่ย้าย) | คำตอบ "หลังจากเมื่อสินค้าถูกจัดส่งเรียบร้อยแล้ว" ยังไม่ชัดว่าหมายถึงจังหวะเปิดให้รีวิว หรือกำหนดเวลาทำหน้า analytics — ต้องถามซ้ำ | F3 |
| Q-BE9 | flag `has_customization` (หรือจำนวนกลุ่มตัวเลือก) ใน `GET /admin/products` — POS จะได้ไม่ต้องเรียก `/customization` ทีละสินค้า | ยังไม่ได้ตอบ · ถ้าทำ 1.1 ใส่ใน `/admin/pos/products` ได้เลย | I4 (POS) |
| Q-BE16 | 🟢 รายการโปรด: เอาออกแล้วเพิ่มกลับ = กู้แถวเดิม (`created_at` เดิม) → ไม่ขึ้นบนสุดตามที่ `GET` เรียง "ล่าสุดก่อน" · เสนอ: ตั้ง `created_at` ใหม่ตอนกู้ (หรือเรียงด้วย `updated_at`) — `favoriteService.addFavorite` | ยังไม่ได้ตอบ (แก้เล็ก) | — |

## 3. ค่าตั้งก่อน deploy (env ของ backend)

| ตัวแปร | ใช้ทำอะไร | ไม่ตั้ง = |
|---|---|---|
| `STOREFRONT_URL` (Q-BE3 ⏸ รอค่า URL จริง) | ลิงก์ในอีเมลยืนยัน/ตั้งรหัสใหม่ + ลิงก์หน้าคำสั่งซื้อท้ายข้อความ LINE (D10 · #70) | ใช้ `NEXTAUTH_URL` แทน · ไม่ได้ตั้งทั้งคู่ = LINE ไม่แนบลิงก์ |
| `CRON_SECRET` | cron 5 ตัว: `order-expiry` · `preorder-rounds` · `preorder-reminders` · `monthly-summary` · `data-integrity` | cron ปิดหมด — ออเดอร์ไม่หมดเวลาเอง · รอบพรีออเดอร์ไม่เปลี่ยนสถานะเอง · ไม่มีแจ้งเตือนล่วงหน้า |
| `LINE_AUTH_CALLBACK_URL` · `LINE_AUTH_RETURN_URL` (+ Callback URL ใน LINE Console) | ปุ่มเข้าสู่ระบบด้วย LINE (B3 · #66) | ปุ่ม LINE login ใช้ไม่ได้ |
| `LINE_CHANNEL_ACCESS_TOKEN` | ส่งแจ้งเตือน LINE ถึงลูกค้า/เจ้าของร้าน | ไม่ส่ง LINE (กระดิ่งในเว็บยังทำงาน) |
| `EMAIL_USER` · `EMAIL_PASS` (+ `EMAIL_SERVICE` หรือ `EMAIL_HOST`/`EMAIL_PORT`) | อีเมลสมัครสมาชิก / ลืมรหัสผ่าน | สมัครสมาชิกไม่ได้ (502) |

## 4. แก้แล้ว / ปิดแล้ว (อ้างอิง)

| รหัส | เรื่อง | ผล |
|---|---|---|
| Q-BE15 | regex `pickup_date` ผิด → เลือกวันรับไม่ได้ | ✅ #67 |
| Q-BE11 · Q-BE8 | ยกเลิก LINE ของบัญชีที่ไม่มีรหัสผ่าน · PATCH สินค้าเขียนสต็อกตรง ๆ | ✅ #68 |
| Q-BE17 | ตะกร้าไม่ส่ง `variant_ids` | ✅ #69 |
| Q-BE18 · D10 | ลิงก์แจ้งเตือนพรีออเดอร์ชี้หน้าใบนั้น · ลิงก์หน้าคำสั่งซื้อท้ายข้อความ LINE | ✅ #70 |
| Q-BE14 | ส่วนลดส่งฟรีไม่ลดฐานคิดเพดานแต้ม | ✅ #71 |
| Q-BE7 | endpoint LINE login | ✅ #66 |
| Q-BE1 | แนบสลิปเปิดออเดอร์ที่หมดเวลากลับ | ❌ ไม่ทำ — หมดเวลาแล้วยกเลิกไปเลย |
| Q-BE13 | `GET /shop/orders` ส่ง items แบบย่อ | ❌ ไม่ทำ — ดึงรายละเอียดทีละใบแบบเดิม |
| Q-BE6 | เปลี่ยน path ลิงก์แจ้งเตือนเป็น `/customer/order/<id>` | ❌ ไม่ต้องทำ (ใช้ `/customer/account/purchases/<id>`) |
| Q-BE19 | ภาษาอังกฤษในหน้าร้าน | ❌ ไม่ทำ — หน้าร้านใช้ภาษาไทยอย่างเดียว |
