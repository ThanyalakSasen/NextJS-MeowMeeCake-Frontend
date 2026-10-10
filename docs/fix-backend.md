# งานที่ backend ต้องแก้ไข

> backend: `ThanyalakSasen/NextJS-MeowMeeCake` (ในเครื่อง `D:\1.2569\MeowMeeCake\NextJS-MeowMeeCake`)
> รวบรวมจาก [`BACKLOG4-merge.md`](BACKLOG4-merge.md) หมวด 9 และคำถามใน [`BACKLOG3-merge.md`](BACKLOG3-merge.md#ถาม-backend) · อัปเดต 2026-10-10 (หลัง backend #76)

สถานะ: ▢ พร้อมทำ (ตอบแล้วว่าทำ) · ⏸ รอคำตอบ · ✅ เสร็จ · ❌ ไม่ทำ

## 1. ตอบแล้วว่าทำ — frontend รอ API อยู่

ไม่มีงานค้างในหมวดนี้แล้ว — Q-BE10 · Q-BE12 · Q-BE2 · Q-BE5 เสร็จทั้งหมด (ดูหมวด 4)

> **Q-BE17 — ถอนคำขอแล้ว 2026-10-10 (ไม่ต้องแก้)**
> เคยขอให้เพิ่ม `"production"` เข้า `readMenus` ของ `/admin/units` เพราะ `useProductionViewModel.ts:100`
> อ่าน `/admin/units` แต่หน้านี้ gate ด้วย `production` ซึ่งไม่อยู่ใน `readMenus`
>
> **ถอนเพราะ:** `Final-Backlog.md` §1 กำหนดแม่แบบบทบาท "ฝ่ายผลิต" ให้มี `ingredients` (ด ก) · `recipes` (ด) · `stock` (ด ก)
> ซึ่งทั้ง 3 ตัวอยู่ใน `readMenus` อยู่แล้ว → อ่านหน่วยนับได้ปกติ
>
> ยังพังได้เฉพาะกรณีสร้างบทบาทเองที่มี **`production` อย่างเดียว** ซึ่งแม่แบบไม่ได้ออกแบบไว้แบบนั้น —
> ถ้าวันหนึ่งทำ `ROLE_TEMPLATES` (Final-Backlog P6) แล้วเปิดให้ตั้งเองอิสระ ค่อยกลับมาดูข้อนี้

## 2. รอคำตอบก่อนทำ

| รหัส | เรื่อง | ค้างที่ | frontend ที่รอ |
|---|---|---|---|
| Q-BE4 | รีวิว analytics · dashboard · รายสินค้า (`/owner/reviews/analytics` · `dashboard` · `products/[id]` ของ FrontOffice — BE §8.20 ยังไม่ย้าย) | คำตอบ "หลังจากเมื่อสินค้าถูกจัดส่งเรียบร้อยแล้ว" ยังไม่ชัดว่าหมายถึงจังหวะเปิดให้รีวิว หรือกำหนดเวลาทำหน้า analytics — ต้องถามซ้ำ | F3 |

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
| Q-BE16 | รายการโปรด: เอาออกแล้วเพิ่มกลับ → กู้แถวเดิม + ตั้ง `created_at` ใหม่ (ขึ้นบนสุด) · กดซ้ำตอนอยู่ในรายการ = ลำดับไม่เปลี่ยน — `favoriteService.addFavorite` | ✅ BE #76 · frontend ไม่ต้องแก้ (`useFavorites` ใส่ไว้บนสุดแบบ optimistic อยู่แล้ว — ไม่กระโดดกลับตอนโหลดใหม่อีก) |
| Q-BE5 | `GET /admin/preorder-rounds/dashboard` (จอง/โควตาต่อสินค้า · ยอดแยกชำระแล้ว/รอชำระ/ยกเลิก) · `GET /admin/preorder-rounds/:id/customers` (จัดกลุ่มตามลูกค้า · วิธีรับ · กรอง/ค้นหา) — สิทธิ์ `preorder.view` · CSV ทำฝั่ง frontend | ✅ BE #75 · frontend F4 (แท็บ "สรุปรอบ") ใช้แล้ว |
| Q-BE2 | `GET /admin/shipping-zones` (`store_info.view`) · `PATCH /admin/shipping-zones/:zone_code` (`store_info.update` · ชื่อ/ค่าส่ง/จังหวัด — 77 จังหวัด · ซ้ำข้ามโซน = 409 · โซน D ไม่มีจังหวัด · audit log) | ✅ BE #74 · frontend F2 (`/owner/shipping`) ใช้แล้ว |
| Q-BE12 | บัญชีพร้อมเพย์รับเงินคืน: `refund_promptpay_id/name` ใน `userModel` · `GET/PATCH /shop/me` (มือถือ 10 หลัก / บัตร 13 หลัก · `null` ล้าง) · ไม่ออกทาง `/admin/users` · `refund_account` ใน `GET /admin/orders/:id` · `/admin/preorders/:id` เฉพาะตอนรอโอนคืน | ✅ BE #73 · frontend U9 + I2 ใช้แล้ว |
| Q-BE10 · Q-BE9 | `GET /admin/pos/products` ใต้ `orders.view` (ไม่ลบ · ไม่ใช่พรีออเดอร์ · ไม่กรอง `is_visible` เหมือน `/pos/scan` · ไม่มี `purchase_cost`) + `has_customization` ต่อรายการ | ✅ BE #72 · frontend I15 ใช้แล้ว |
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
