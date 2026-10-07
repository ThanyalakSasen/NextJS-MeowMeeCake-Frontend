# MeowMeeCake Frontend — BACKLOG 4: งานที่เหลือของการรวม FrontOffice

> สร้าง: 2026-10-08 · ขอบเขต: ฝั่ง Frontend (`src/**`) + เอกสารใน `docs/`
> - repo นี้: `D:\1.2569\FrontEnd\NextJS-MeowMeeCake-Frontend` (branch `feat/checkout-full`)
> - FrontOffice (ต้นแบบ UI · ไม่ใช่ git repo): `C:\Users\KimThanyalak\Downloads\frontend\frontend`
> - backend หลัก: `D:\1.2569\MeowMeeCake\NextJS-MeowMeeCake` (branch `main`, `2746063`)
> - อ้าง backend `docs/customer-backend-merge.md` เป็น **BE §x.x** (เหมือน BACKLOG3)
>
> ก่อนหน้า: [`BACKLOG3-merge.md`](BACKLOG3-merge.md) — รหัสงานเดิม (C1, D3, E2, I8, Q-BE1 ฯลฯ) **ใช้ต่อในเอกสารนี้** · รหัสใหม่: `U` (เติม UI หน้าที่มีแล้ว) · `K` (แก้เอกสาร)

## วิธีตรวจ (2026-10-08)

- เทียบ route ทุกหน้า (`page.*`) ของ FrontOffice กับ repo นี้ — ลูกค้า 35 หน้า · เจ้าของร้าน 37 หน้า (`/employee/*` อีก 37 หน้าไม่นับ — H2)
- หน้าที่มีทั้ง 2 ฝั่ง: เทียบ component ที่ import · ลิงก์ในเมนู/Navbar/Footer · คำสำคัญของฟีเจอร์ (favorite · review · allergen · search ฯลฯ) · ขนาดโค้ด
- ตรวจสถานะงานใน BACKLOG3 กับโค้ดจริง (grep type/service) — พบหลายเรื่องเสร็จแล้วแต่เอกสารยังเป็น ▢ → หมวด K
- **ยังไม่ได้เปิดหน้าจอเทียบกันในเบราว์เซอร์** — ขนาดโค้ดไม่ใช่ตัววัดความครบ (repo นี้แยก MVVM/component · FrontOffice หลายหน้าโยนไป component ตัวเดียว)

สถานะ: ✅ เสร็จ · 🟡 ทำแล้วบางส่วน/รอทดสอบ · ▢ พร้อมทำ · ⏸ รอคนอื่น/ติดคำถาม · ❌ ไม่ทำ

---

## สรุปภาพรวม

| ฝั่ง | ครบแล้ว | ยังไม่มีทั้งหน้า | มีหน้าแต่ UI ไม่ครบ |
|---|---|---|---|
| หน้าร้าน (ลูกค้า) | 16 หน้า (หน้าแรก · รายการสินค้า · รายละเอียดสินค้า · ตะกร้า · checkout · บัญชี · ที่อยู่ · ประวัติ/รายละเอียดออเดอร์ · เปลี่ยน/ลืม/ตั้งรหัส · ยืนยันอีเมล · login · สมัคร · `/login/line`) | 15 หน้า (พรีออเดอร์ 8 · แต้ม · รายการโปรด · แจ้งเตือน · เขียนรีวิว · ติดต่อร้าน · ค่าส่ง · ลิงก์ชำระเงิน) | 9 จุด (หมวด 3) |
| หลังร้าน (เจ้าของร้าน) | ทุกหน้าที่มีในระบบเดิม | 5 หน้า (ข้อมูลร้าน · คำค้นเทียบเคียง · รีวิวขั้นสูง · ออเดอร์พร้อมส่ง · โซนค่าส่ง) | รีวิว (FO ~4,160 บรรทัด vs 374) |

**ลำดับที่แนะนำ:** ~~1.1 (ปิด C3)~~ ✅ → ~~K1–K4 (เอกสาร)~~ ✅ → D4 → D5 + U3 → C1 → D3 → D6 + U4 → D7 → D8 + D9 + U5 → C2 → หลังร้าน E2 → E3 → E4 → E5 → ที่เหลือ

---

## 1. งานค้างบน branch ปัจจุบัน

### 1.1 ✅ C3 checkout: จุดรับสินค้า · คูปองของฉัน · ใช้แต้ม (branch `feat/checkout-full` · ทดสอบ + commit 2026-10-08)
- **ทำแล้ว (2026-10-08 · ผ่าน `npm run check`):** `checkout/_components/PickupLocationPicker.tsx` · `CouponSelectBox.tsx` · `PointsRedeemBox.tsx` · `services/pickupLocations.ts` · `services/shopLoyalty.ts` · `CreateShopOrderInput` เพิ่ม `user_coupon_id` `points_to_redeem` `pickup_location_id` `pickup_date` · query key ใหม่ใน `shopQueries.ts`
- **กติกาที่ใช้:** มีจุดรับเปิด = takeaway ต้องเลือกจุด + วัน · ไม่มีจุดเปิด = รับที่ร้านแบบเดิม · คูปองของฉัน **หรือ** โค้ด (เลือกอันหนึ่งล้างอีกอัน) · คูปองที่ใช้กับออเดอร์ไม่ได้ไม่ถูกส่ง · แต้มปัดทีละ 10 และตัดลงเมื่อเพดานลด · สั่งซื้อสำเร็จ/ล้มเหลว → โหลดแต้ม/คูปองใหม่
- **ทดสอบ 2026-10-08 — ผ่าน 39/39** กับ backend branch `fix/pickup-date-regex` (`2746063` = `main` + แก้ regex) + MongoDB local `meowmeecake-test`
  (ปิด LINE/อีเมลระหว่างทดสอบ — ไม่มีข้อความส่งออก) · สคริปต์เรียก service ของ frontend ตรง ๆ + สูตรยอดเดียวกับ `checkout/page.tsx`:
  - จุดรับ: รายการ + `schedule` + `map_url` · จุดไม่มีวันเปิด = วันว่าง · takeaway + จุด + วัน → บันทึกจุด/วันถูก (เวลาไทย) · วันนอกตัวเลือก 400 · จุดไม่มีวันเปิด 400 · ไม่เลือกจุด = รับที่ร้านแบบเดิม
  - คูปอง: แลกด้วยแต้ม → ใช้ได้ · % (เพดาน 50) · ส่งฟรี (ลบค่าส่ง 40) · รับที่ร้าน + ส่งฟรี = ใช้ไม่ได้ · ไม่ถึงขั้นต่ำ = หน้าเว็บไม่ส่ง (ถ้าส่ง backend ปฏิเสธจริง) · สั่งแล้วคูปองหาย / ยกเลิกแล้วกลับมา
  - แต้ม: เพดาน 30% (1,800 แต้มกับยอด 600) · เกิน 10 แต้ม 400 · ปัดทีละ 10 (ส่ง 155 ตรง ๆ = 400) · หัก/คืนเมื่อสั่ง/ยกเลิก · ต่ำกว่า 100 ใช้ไม่ได้
  - รวม: คูปอง + แต้ม · ส่งฟรี + แต้ม · โค้ด + แต้ม · takeaway + จุดรับ + คูปอง + แต้ม → `total_amount` ของ backend = ยอดหน้าเว็บทุกกรณี · โค้ด + คูปองพร้อมกัน 400
  - หน้า `/customer/checkout` · `/customer/cart` · `/customer/account/purchases` คอมไพล์และเปิดได้ (200)
- **ยังไม่ได้ทดสอบ:** คลิกดูหน้าจอจริงในเบราว์เซอร์ (มือถือ + จอใหญ่)
- **⚠️ ก่อน deploy:** backend `main` (`7ef6362`) ยังมี regex `pickup_date` ผิด (`/^d{4}-d{2}-d{2}$/` ไม่มี `\`) → **ทุกออเดอร์ที่เลือกวันรับได้ 400** · ต้อง merge branch `fix/pickup-date-regex` (`2746063` · ยังไม่ push) ก่อน — [Q-BE15](#คำถามใหม่)
- **ติดคำถาม:** [Q-BE14](#คำถามใหม่) ฐานคิดแต้มเมื่อใช้คูปอง/โค้ดส่งฟรี — ทดสอบแล้ว: สูตร FrontOffice (1,800 แต้ม) ได้ 400 "ใช้แต้มได้สูงสุด 1680" → หน้าเว็บตอนนี้ตรงกับ backend

---

## 2. หน้าร้าน — หน้าที่ยังไม่มี

| รหัส | หน้า (repo นี้ควรอยู่ที่) | ต้นแบบ FrontOffice | API | ขึ้นกับ | สถานะ |
|---|---|---|---|---|---|
| D3 | พรีออเดอร์ทั้ง flow: รายการรอบ · รอบ · checkout · ชำระเงิน · สำเร็จ · ประวัติ + รายละเอียด + ชำระเงินย้อนหลัง | `customer/preorder/*` (5 หน้า) · `account/preorders/*` (3 หน้า) · `account/_components/SlipPaymentView.tsx` · ~2,700 บรรทัด | `/catalog/preorder-rounds` (+`:id`) · `/shop/preorders` (+`cancel`, `payment`) · `delivery-quote` ส่ง `product_ids` · จุดรับใช้ `preorderPickupDateOptions` (วันในช่วงรอบ) | C1 (ตัวเลือกสินค้า) · ใช้ `PickupLocationPicker` ของ C3 ได้ | ▢ |
| D4 | สมาชิกของฉัน: ยอดแต้ม · แต้มใกล้หมดอายุ · ประวัติ · แลกคูปอง · แชร์แต้ม · คูปองของฉัน | `account/member` (567) | `/shop/points` (+`share`) · `/shop/coupons` (+`check`, `redeem`) | service `shopLoyalty.ts` มีแล้ว (เติม history/catalog/redeem/share) | ▢ **ทำต่อจาก C3 ได้ทันที** |
| D5 | รายการโปรด | `account/favorites` | `/shop/favorites` (`data.items`) | ทำคู่ U3 | ▢ |
| D6 | การแจ้งเตือน (หน้า + กระดิ่งใน Navbar) | `account/notifications` · `components/customer/CustomerNotifications.tsx` (234) | `/shop/notifications` (+`:id`) → `{ items, unread_count }` | ลิงก์ในแจ้งเตือนชี้ `/customer/account/purchases/<id>` แล้ว (G1 ✅) | ▢ |
| D7 | เขียนรีวิว + รูป/วิดีโอ | `account/pendingreview/[id]` (705) · `components/AspectIcon.tsx` | `/shop/reviews` · `/shop/reviews/upload` · `/catalog/review-aspects` | D1 ✅ · ปุ่ม "รีวิว" ในประวัติออเดอร์ | ▢ |
| D8 | ติดต่อร้าน | `customer/contact-us` (411) | `/shop/contact` · `/catalog/contact-topics` | ทำคู่ U5 | ▢ |
| D9 | ตารางค่าส่ง + ข้อมูลร้าน/โลโก้ | `customer/shipping` (189) · `components/StoreLogo.tsx` | `/catalog/shipping-zones` · `/catalog/store-info` · `/catalog/store-logo` | ทำคู่ U5 | ▢ |
| D10 | ลิงก์ชำระเงินใช้ครั้งเดียว | `customer/payment?token=` | `/shop/payment-link` (+`redeem`) | [Q-FO2](BACKLOG3-merge.md#ถาม-ผู้พัฒนา-frontoffice) | ⏸ |

**หน้าใน FrontOffice ที่ไม่ต้องยกมา (มีทางอื่นแล้ว):**

| หน้า FrontOffice | ใน repo นี้ |
|---|---|
| `customer/line-welcome` | รวมในหน้าบัญชี (`LineAccountEmail` · B2) |
| `customer/changepassword/verify` (เปลี่ยนรหัสผ่านลิงก์อีเมล) | `/customer/changepassword` เปลี่ยนด้วยรหัสเดิม (`PATCH /shop/me/password`) |
| `customer/order` (placeholder) · `customer/order/success` | หลังสั่งซื้อไป `/customer/account/purchases/<id>?new=1` · ดู U8 ถ้าต้องการหน้า "สำเร็จ" |
| `account/purchases/[id]/payment` | ชำระเงิน/แนบสลิปอยู่ในหน้ารายละเอียดออเดอร์ (A1) |
| `customer/dessert-set` (+`[id]`) | ❌ H1 |

---

## 3. หน้าร้าน — เติม UI ในหน้าที่มีแล้ว

| รหัส | หน้า / component | ที่ขาด (เทียบ FrontOffice) | ต้นแบบ | ขึ้นกับ | สถานะ |
|---|---|---|---|---|---|
| C1 | รายละเอียดสินค้า `customer/product/[id]` | ตัวเลือก/ออปชันก่อนลงตะกร้า · รีวิว + สรุปคะแนน · สินค้าคล้าย · sentiment · สารก่อภูมิแพ้ · แสดงตัวเลือกในตะกร้า/checkout/ออเดอร์ | `ProductDetailClient.tsx` (1,108) · `ProductCustomizationPicker.tsx` (131) | API: `/catalog/products/:id/customization` · `/reviews` (+`summary`) · `/similar` · `/sentiment` · ตะกร้ารับ `variant_ids[]` + `selected_options` | ▢ |
| C2 | หน้าแรก `customer/page.tsx` | ส่วน "สินค้าแนะนำ" | `HomeRecommendations.tsx` (152) | `/catalog/products/recommended` · `/shop/recommendations` (ล็อกอินแล้ว) | ▢ |
| U1 | Navbar `components/customer/Navbar.tsx` | เมนู **พรีออเดอร์** · **ติดต่อเรา** · **กระดิ่งแจ้งเตือน** (FO มีเมนูชุดสินค้าด้วย — ไม่ทำ H1) | `components/customer/Navbar.tsx` (373) | D3 · D8 · D6 | ▢ เพิ่มทีละเมนูตามหน้าที่เสร็จ |
| U2 | เมนูบัญชี `components/customer/AccountSideMenu.tsx` | มี 4/8 — ขาด **สมาชิกของฉัน** · **ประวัติพรีออเดอร์** · **รายการโปรด** · **การแจ้งเตือน** · FO จัดเป็น 2 หัวข้อ ("บัญชีของฉัน" / "คำสั่งซื้อของฉัน") | `components/customer/SideBarMenu.tsx` (232) | D4 · D3 · D5 · D6 | ▢ |
| U3 | การ์ดสินค้า `components/customer/ProductCard.tsx` | ปุ่มหัวใจ (เพิ่ม/ลบรายการโปรด) · ป้ายสารก่อภูมิแพ้ตามที่ลูกค้าบันทึกไว้ | `components/customer/ProductCard.tsx` (350) | D5 · อาหารที่แพ้ของลูกค้า (`/shop/me` มีแล้ว) | ▢ |
| U4 | หน้ารายการสินค้า `customer/product` | ตรวจตัวกรองหมวด/เรียงลำดับ/สินค้าหมดให้ตรง FO (FO มีตัวกรองหมวดละเอียดกว่า · คำค้นมีครบแล้ว) · แสดงหัวใจ (U3) | `customer/product/page.tsx` (363) | U3 | ▢ เทียบหน้าจอจริงก่อน |
| U5 | Footer `components/customer/Footer.tsx` | ลิงก์ **ติดต่อเรา** · **ค่าจัดส่ง** · **Facebook ร้าน** | `components/customer/Footer.tsx` (64) | D8 · D9 | ▢ (ลิงก์ Facebook ใส่ได้เลย) |
| U6 | ตะกร้า `customer/cart` | ช่องค้นหาสินค้าบนหัวตะกร้า · ตรวจป้าย "ซื้อไม่ได้" (`cartItemBlocked` — หมด/ปิดขาย/สต็อกไม่พอ) ให้ครบเท่า FO | `customer/cart/page.tsx` · `components/cart/CartItem.tsx` (215) | — | ▢ |
| U7 | ประวัติสั่งซื้อ `account/purchases` (+`[id]`) | รูปสินค้า · ปุ่ม "รีวิว" · ไทม์ไลน์สถานะ · ซื้ออีกครั้ง | `account/purchases/page.tsx` (429) · `[id]/page.tsx` (642) | [Q-BE13](BACKLOG3-merge.md#ถาม-backend) (list ไม่มี items/รูป) · D7 | ⏸ / ▢ |
| U8 | หลังสั่งซื้อ | FO มีหน้า "สั่งซื้อสำเร็จ" + แถบขั้นตอน (`FlowSteps` · `orderFlowSteps`) ทั้งออเดอร์และพรีออเดอร์ · repo นี้ไปหน้าออเดอร์ตรง ๆ | `customer/order/success` (177) · `components/customer/FlowSteps.tsx` (30) | ตัดสินใจ: ทำแถบขั้นตอนในหน้า checkout/ออเดอร์ หรือไม่ทำ · [Q-OWN5](#คำถามใหม่) | ⏸ |
| U9 | บัญชีของฉัน `customer/account` | การ์ด + หน้าต่าง **บัญชีพร้อมเพย์รับเงินคืน** | `customer/account/page.tsx` (671) | [Q-BE12](BACKLOG3-merge.md#ถาม-backend) | ⏸ |
| — | สมุดที่อยู่ `account/address` | FO มีชื่อ/เบอร์ผู้รับในที่อยู่ — backend หลักไม่เก็บ (กรอกตอน checkout) | — | — | ❌ ตาม backend |

**ข้อมูลประกอบ (ขนาด component ที่ใช้ร่วม · FO / repo นี้):** `HeroCarousel` 262 / 116 · `CustomerBreadcrumb` 107 / 34 · `CustomerChrome` 59 / 40 — ฟีเจอร์หลักตรงกัน (เลื่อนอัตโนมัติ · เส้นทาง) · เทียบหน้าจอจริงตอนทำ U4 อีกครั้ง

---

## 4. หลังร้าน — หน้าที่ยังไม่มี

> เขียนใหม่แบบ MVVM + i18n + `base/` (ต้องผ่าน `npm run check`) โดยดู UI ของ FrontOffice · ไม่เอาโค้ดมาตรง ๆ

| รหัส | หน้า | ต้นแบบ FrontOffice | API | หมายเหตุ | สถานะ |
|---|---|---|---|---|---|
| E2 | ข้อมูลร้าน: ที่อยู่ · พิกัด · ตลาดนัด/จุดรับประจำสัปดาห์ · แผนที่ · โลโก้ · พร้อมเพย์ | `owner/store-info/*` (~1,416) · `components/CoordinateInput.tsx` | `/admin/store-profile` · `/admin/store-settings` · `/admin/weekly-markets` · `/admin/map-link` | เมนูสิทธิ์ `store_info` มีแล้ว (I1 ✅) · จุดรับที่ตั้งที่นี่คือข้อมูลของ C3/D3 (BE §8.19) | ▢ **ทำก่อนในฝั่งหลังร้าน** |
| E3 | คำค้นเทียบเคียง | `owner/products/search-synonyms` (340) | `/admin/search-synonyms` (+`:id`) | สิทธิ์ `products` (BE §8.16) | ▢ |
| E4 | จัดการรีวิวขั้นสูง: bulk · ซ่อน/แสดง · sentiment · ด้านที่รีวิว (เรียงลำดับ) · คำสำคัญ · ตั้งค่า + `data.summary` (I9) | `owner/reports/reviews/*` (รวม ~4,160 · ไม่รวม analytics) | `/admin/reviews/bulk` · `filter-options` · `:id/visibility` · `:id/sentiment` · `/admin/aspects/reorder` · `/admin/semantic-terms` | สิทธิ์ `reports` (I14 ✅) · analytics/รายสินค้า → F3 | ▢ |
| E5 | ออเดอร์พร้อมส่ง | `owner/orders/readyReders` (287) | `/admin/orders?order_status=ready` | แนะนำทำเป็นแท็บ/ตัวกรองด่วนในหน้า `manageOrders` แทนหน้าใหม่ | ▢ |
| I8 | โซนค่าส่งหลังร้าน/POS (`DeliveryZones`) | — | `/admin/delivery-zones` (+`:id`, `restore`) · `/admin/delivery-fee` | คนละตารางกับค่าส่งเว็บ (F2) | ▢ |
| F2 | โซนค่าส่งเว็บ (`ShippingZones`) | `owner/shipping` (359) | backend ยังไม่มี admin API | [Q-BE2](BACKLOG3-merge.md#ถาม-backend) | ⏸ |
| F3 | รีวิว analytics · dashboard · รายสินค้า | `reports/reviews/analytics` · `reviews/products/[id]` | BE §8.20 (R5) | [Q-BE4](BACKLOG3-merge.md#ถาม-backend) | ⏸ |
| F4 | dashboard รอบพรีออเดอร์ + รายชื่อลูกค้าในรอบ | `owner/preorders/rounds` (บางส่วน) | ไม่มีใน backend หลัก | [Q-BE5](BACKLOG3-merge.md#ถาม-backend) · [Q-OWN3](BACKLOG3-merge.md#ถาม-เจ้าของร้าน--ทีม) | ⏸ |

**หน้าที่มีครบแล้ว (เทียบ route):** dashboard · พนักงาน (+เพิ่ม/แก้ · สิทธิ์ · log · เงินเดือน `emp_salary`) · การเงิน (สรุป · ค่าใช้จ่าย) · วัตถุดิบ (+สต็อก · ประวัติ · หน่วย) · ประวัติแจ้งเตือน (มีหมวด "ลูกค้า" แล้ว — E6) · จัดการออเดอร์ · POS · รอบพรีออเดอร์ (`orders/preOrderRound` แทน `preorders/rounds`) · การผลิต (หน้าเดียวหลายแท็บ แทน `planOrPurchaseOrder` · `productionstatus` · `productionhistory`) · สินค้า (+เพิ่ม/แก้ · ตัวเลือก E1 · สต็อก) · คูปอง · ราคา · สูตร (modal แทน `recipes/addRecipe`) · รายงานยอดขาย · store-design

---

## 5. แก้ตาม backend ที่ยังค้าง (จาก BACKLOG3 หมวด I)

| รหัส | ระดับ | เรื่อง | สถานะจริง (ตรวจ 2026-10-08) |
|---|---|---|---|
| I3 | 🟢 | ประเภทแจ้งเตือน: เพิ่ม `customer` แล้ว แต่ `NotificationModule` (`types/notification.ts`) ยังมี `employee` ที่ backend เลิกแล้ว | 🟡 เหลือลบ `employee` (+ ป้าย/i18n ที่ใช้) |
| I9 | 🟢 | รายการรีวิวหลังร้าน: `data.summary` ยังถูกทิ้ง (`services/reviews.ts`) | ▢ ทำคู่ E4 |
| I10 | 🟢 | อีเมลชั่วคราวของบัญชี LINE (`*@line-user.invalid`) ยังแสดงดิบในหลังร้าน (drawer ออเดอร์ · รีวิว · พนักงาน) | ▢ |
| I11 | 🟢 | mock (MSW) ใช้ไม่ได้ (path เก่า ไม่มี `/admin`) — ตอนนี้ `.env.local` ตั้ง `NEXT_PUBLIC_API_MOCK=0` อยู่แล้ว | ⏸ ตัดสินใจ: เขียนใหม่ หรือลบ `src/mocks/*` + `MSWReady` + `public/mockServiceWorker.js` + `msw` |
| I15 | 🟡 | POS: ช่องค้นหาสินค้าได้ 403 ถ้าพนักงานไม่มี `products.view` | ⏸ [Q-BE10](BACKLOG3-merge.md#ถาม-backend) |

---

## 6. แก้เอกสาร

| รหัส | ไฟล์ | แก้อะไร | สถานะ |
|---|---|---|---|
| K1 | `BACKLOG3-merge.md` ตาราง E | E1 เขียน ▢ "ทำก่อน" — เสร็จแล้ว (PR #27) · E6 เขียน ▢ — มีหมวด "ลูกค้า" ในหน้าแจ้งเตือนแล้ว | ✅ 2026-10-08 |
| K2 | `BACKLOG3-merge.md` ตาราง I | I1 · I2 · I4 · I5 · I6 · I7 ยังเป็น ▢ — โค้ดเสร็จแล้วทั้งหมด (I1 `store_info` ใน `menuKeys.ts` · I2 `RefundSection` · I4 `CustomizationPickerModal` · I5 `ships_nationwide` · I6 field ออเดอร์เว็บใน `types/order.ts` · I7 `points_cost`) และผ่านการทดสอบชุด PR #25–#27 · I3 → 🟡 | ✅ 2026-10-08 — ใส่ PR + commit ทุกแถว · สรุปหมวด I ในสารบัญเป็น ✅ 9 · 🟡 1 · ▢ 3 · ⏸ 2 |
| K3 | `BACKLOG3-merge.md` บรรทัดแรก | ไม่มีหัวเรื่อง (`#`) — บรรทัดแรกเป็นข้อความสถานะ I4 ที่หลุดมา (หายตั้งแต่ commit แรก `c66e269`) · ควรมีหัวเรื่องแบบ BACKLOG2 + ลิงก์ "ถัดไป: BACKLOG4-merge.md" | ✅ 2026-10-08 — ข้อความที่หลุดย้ายไปไว้ในแถว I4 |
| K4 | `BACKLOG3-merge.md` A4 | `src/lib/promptpay.ts` ถูกลบแล้ว → ติ๊ก checkbox | ✅ 2026-10-08 — A4 เป็น 🟡 (เหลือคลิกดูหน้าจอจริง) |
| K5 | `README.md` §1 · §4 | ยังบอกว่าเป็นระบบหลังร้านอย่างเดียว (27 หน้า) · พอร์ต `3000` (จริง `3001`) · ไม่มีหน้าร้าน `/customer/*` · `services/shop*` · `components/customer` | ▢ |
| K6 | `docs/SCREEN_MAP.md` · `COMPONENT_MAP.md` | ยังไม่มีหน้าจอ/คอมโพเนนต์ของหน้าร้าน | ▢ |

---

## 7. รอคนอื่น

| เรื่อง | รอใคร | รายละเอียด |
|---|---|---|
| B3 ล็อกอิน Google / LINE | ทีม/ผู้ดูแลบัญชี | ตั้ง `NEXT_PUBLIC_GOOGLE_CLIENT_ID` + origin ใน Google Console · `LINE_AUTH_*` + Callback URL ใน LINE Console · merge backend `feat/line-login-endpoint` ([Q-BE7](BACKLOG3-merge.md#ถาม-backend)) แล้วทดสอบด้วยบัญชีจริง |
| F1 แนบสลิปย้อนหลัง | backend | [Q-BE1](BACKLOG3-merge.md#ถาม-backend) |
| F2 · F3 · F4 | backend / เจ้าของร้าน | หมวด 4 |
| I15 · U7 · U9 | backend | Q-BE10 · Q-BE13 · Q-BE12 |
| G3 ปิด FrontOffice พอร์ต 4000 | ทีม | [Q-OWN4](BACKLOG3-merge.md#ถาม-เจ้าของร้าน--ทีม) · [Q-FO1](BACKLOG3-merge.md#ถาม-ผู้พัฒนา-frontoffice) — ปิดได้เมื่อหมวด 2–3 ครบ |
| คำถามค้างใน BACKLOG3 | ทุกฝ่าย | Q-BE1–Q-BE13 · Q-FO1–Q-FO4 · Q-OWN3–Q-OWN4 ยังไม่มีคำตอบในแบบฟอร์ม |

---

## 8. ไม่ทำ (ตัดสินแล้ว)

ใช้ตาม BACKLOG3 หมวด H: H1 ชุดสินค้า (`dessert-set` · `promotions/bundles`) · H2 `/employee/*` · H3 สิทธิ์ชั่วคราว · H4 `reports/sales` แบบ FO · H5 POS `pos-checkout` · H6 ค้นคำเทียบเคียงฝั่ง client
เพิ่ม: ชื่อ/เบอร์ผู้รับในสมุดที่อยู่ (backend ไม่เก็บ) · วิดีโอ/ม่านตอน login-logout (`PreloaderOverlay` · `LogoutCurtain` — ตัดสินแล้วใน B3)

---

## 9. ฝั่ง backend — ต้องแก้/เพิ่ม (ตรวจ 2026-10-08)

> ตรวจ repo backend `D:\1.2569\MeowMeeCake\NextJS-MeowMeeCake` branch `fix/pickup-date-regex` (`2746063` = `main` `7ef6362` + 1 commit) ·
> `tsc --noEmit` ผ่าน · unit 228/228 · integration 393/393 (mongodb-memory-server) ·
> endpoint ที่งานใน BACKLOG4 จะเรียก (หมวด 2–4 · 43 เส้น) **มีครบทุกเส้น** — ที่เหลือคือบั๊ก · ช่องโหว่ · API เสริม · ค่าตั้ง

### 9.1 🔴 บั๊กที่ต้องแก้ก่อน deploy
| รหัส | เรื่อง | ไฟล์ backend | สถานะ |
|---|---|---|---|
| Q-BE15 | regex `pickup_date` ผิดบน `main` (`/^d{4}-d{2}-d{2}$/` ไม่มี `\`) → ออเดอร์/พรีออเดอร์ที่เลือกวันรับได้ 400 ทุกครั้ง · ค้นทั้ง `src/` แล้วไม่มี regex ผิดแบบเดียวกันที่อื่น | `src/schemas/order.ts:38` · `src/schemas/preorder.ts:36` | 🟡 แก้แล้วใน `fix/pickup-date-regex` (+ เทส) · backend PR [#67](https://github.com/ThanyalakSasen/NextJS-MeowMeeCake/pull/67) (2026-10-08) · **ต้อง merge ก่อน frontend PR #32** |

### 9.2 🟠 ช่องโหว่ (แก้เล็ก)
| รหัส | เรื่อง | ไฟล์ backend | สถานะ |
|---|---|---|---|
| Q-BE11 | `unlinkLineAccount` ไม่เช็คว่าเป็นบัญชีที่สมัครด้วย LINE (ไม่มีรหัสผ่าน) → ยกเลิกแล้วเข้าบัญชีไม่ได้อีก · หน้าเว็บซ่อนปุ่มแล้ว แต่ backend ต้องกัน | `src/services/userService.ts:405` | 🟡 backend PR [#68](https://github.com/ThanyalakSasen/NextJS-MeowMeeCake/pull/68) (2026-10-08) — 409 · รอ merge |
| Q-BE8 | `PATCH /admin/products/:id` ยังเขียน `product_stock_quantity` ตรง ๆ (ไม่ผ่าน `PUT /stock` → ไม่มีประวัติสต็อก) · frontend เลิกส่งแล้ว (I12) → ปฏิเสธได้เลย | `src/services/productService.ts` `updateProduct` (~บรรทัด 525) | 🟡 backend PR [#68](https://github.com/ThanyalakSasen/NextJS-MeowMeeCake/pull/68) — 400 ให้ใช้ `/stock` · **แก้บั๊กไปด้วย:** หน้าแก้สินค้าเปลี่ยนสินค้าที่มีสต็อกเป็นพรีออเดอร์เคยได้ 400 · รอ merge |

### 9.3 🟠 ทางตันใน flow ลูกค้า
| รหัส | เรื่อง | ไฟล์ backend | สถานะ |
|---|---|---|---|
| Q-BE1 (F1) | ออเดอร์หมดเวลาแล้วต้องแนบ `slip_image_url` แต่ URL ได้จาก `POST /shop/payments/:id/slip` เท่านั้น (ต้องมี payment ก่อน) → ลูกค้าที่ไม่เคยส่งสลิปเปิดออเดอร์กลับเองไม่ได้ · เสนอ: `POST /shop/payments` รับ multipart หรือยอมสร้าง payment ไม่มีสลิป | `src/services/paymentService.ts:49` · `:118` | ▢ |

### 9.4 🟡 API ที่ควรเพิ่ม
| รหัส | เรื่อง | ตอนนี้ | ใช้กับ |
|---|---|---|---|
| Q-BE10 | รายการสินค้าสำหรับ POS ใต้สิทธิ์ `orders` (เช่น `GET /admin/pos/products?search=`) | `admin/pos` มีแค่ `scan` | I15 |
| Q-BE13 | `GET /shop/orders` ส่ง items แบบย่อ (ชื่อ · จำนวน · ราคา · รูป) | `orderService.listOrders` (`:616`) ไม่ส่ง items · `productSnapshotSchema` (`orderItemModel.ts:4`) ไม่มีรูป | U7 · D1 |
| Q-BE9 | flag `has_customization` ใน `GET /admin/products` | ไม่มี | I4 (POS) |
| Q-BE2 | admin API แก้ `ShippingZones` (ค่าส่งเว็บ) | มีแค่ `admin/delivery-zones` (POS) | F2 |
| Q-BE4 | รีวิว analytics · dashboard · รายสินค้า | `admin/reviews` มี `bulk` · `filter-options` · `[id]` | F3 |
| Q-BE5 | สรุปรอบพรีออเดอร์ + รายชื่อลูกค้าในรอบ | `admin/preorder-rounds` มี CRUD · `items` · `status` · `restore` | F4 |
| Q-BE12 | `refund_promptpay_id/name` ของลูกค้า | ไม่มี field | U9 · I2 |

### 9.5 ต้องตัดสินใจ
| รหัส | เรื่อง | ไฟล์ backend |
|---|---|---|
| Q-BE14 | ฐานคิดเพดานแต้ม — comment "ส่วนลดส่งฟรีไม่ลดฐานคิดแต้ม" แต่โค้ด `min(discount_amount, subtotal)` หักส่วนลดค่าส่งด้วย · แก้โค้ด (frontend ต้องแก้ตาม) หรือแก้ comment | `src/services/orderService.ts:403` |

### 9.6 ค่าตั้ง (env)
| ตัวแปร | ปัญหา | ต้องตั้ง |
|---|---|---|
| `STOREFRONT_URL` | ไม่ได้ตั้งใน `.env.local` → `storefrontUrl()` ใช้ `NEXTAUTH_URL=http://localhost:3000` (= backend) → ลิงก์ในอีเมลยืนยัน/ตั้งรหัสใหม่ชี้ผิดที่ (Q-BE3) | dev `http://localhost:3001` · deploy = โดเมนหน้าร้าน |
| `LINE_AUTH_CALLBACK_URL` · `LINE_AUTH_RETURN_URL` | ไม่ได้ตั้ง → ปุ่ม LINE login (B3) ใช้ไม่ได้ (โค้ด merge แล้ว #66) | ตาม B3 ใน BACKLOG3 |
| `CRON_SECRET` | ไม่ได้ตั้ง → cron ปิดทั้ง 5 (`order-expiry` · `preorder-rounds` · `preorder-reminders` · `monthly-summary` · `data-integrity`) · dev ไม่เป็นไร | **deploy ต้องตั้ง** — ไม่งั้นรอบพรีออเดอร์ไม่เปลี่ยนสถานะเอง + ไม่มีแจ้งเตือนล่วงหน้า |

### 9.7 ปิดแล้ว
- Q-BE7 — endpoint LINE login merge แล้ว (backend PR #66)
- Q-BE6 — ไม่ต้องทำ (G1 เลือก `/customer/account/purchases/<id>` ที่ลิงก์ของ backend ใช้อยู่แล้ว)

**ลำดับที่แนะนำ (backend):** Q-BE15 (merge #67) → ~~Q-BE11 · Q-BE8~~ (#68) → ตั้ง `STOREFRONT_URL` → Q-BE1 → Q-BE10 · Q-BE13 → Q-BE14 (ตัดสินใจ) → ที่เหลือ

---

## คำถามใหม่

| รหัส | ถามใคร | คำถาม | บริบท | ใช้กับ | คำตอบ | ผู้ตอบ · วันที่ |
|---|---|---|---|---|---|---|
| Q-BE14 | backend | ฐานคิดเพดานแต้มตอนใช้คูปอง/โค้ด **ส่งฟรี** ควรหักส่วนลดค่าส่งหรือไม่ | `orderService.createOrder`: `goodsDiscount = min(discount_amount, subtotal)` รวมส่วนลดค่าส่งด้วย แต่ comment เขียนว่า "ส่วนลดส่งฟรีไม่ลดฐานคิดแต้ม" · FrontOffice หักเฉพาะส่วนลดสินค้า · หน้า checkout ตอนนี้ทำตามโค้ด backend (ถ้า backend แก้ ต้องแก้ `checkout/page.tsx` ตาม) | C3 | | |
| Q-BE15 | backend | merge `fix/pickup-date-regex` (`2746063` — แก้ regex `pickup_date` ใน `schemas/order.ts` + `schemas/preorder.ts` + เทส) เข้า `main` ได้เมื่อไหร่ | `main` ปฏิเสธ `pickup_date` ทุกค่า → checkout เลือกวันรับไม่ได้ (C3) และพรีออเดอร์ (D3) · branch อยู่ในเครื่องเท่านั้น ยังไม่ push | C3 · D3 | | |
| Q-OWN5 | เจ้าของร้าน | ต้องการหน้า "สั่งซื้อสำเร็จ" + แถบขั้นตอน (ตะกร้า → ยืนยัน → ชำระ → เสร็จ) แบบ FrontOffice ไหม | ตอนนี้สั่งซื้อแล้วไปหน้ารายละเอียดออเดอร์ (ชำระเงินได้ทันที) | U8 · D3 | | |
