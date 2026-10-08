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

**ลำดับที่แนะนำ:** ~~1.1 (ปิด C3)~~ ✅ → ~~K1–K4 (เอกสาร)~~ ✅ → ~~D4~~ ✅ → ~~D5 + U3 (หัวใจ)~~ ✅ → ~~C1~~ ✅ → ~~D3~~ ✅ → ~~D6 + U4~~ ✅ → ~~D7~~ ✅ → ~~D8~~ ✅ → ~~D9 + U5~~ ✅ → ~~C2~~ ✅ → หลังร้าน ~~E2~~ ✅ → ~~E3~~ ✅ → ~~E4~~ ✅ → ~~E5~~ ✅ → ที่เหลือ

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
| D3 | พรีออเดอร์ทั้ง flow: รายการรอบ · รอบ · checkout · ชำระเงิน · สำเร็จ · ประวัติ + รายละเอียด + ชำระเงินย้อนหลัง | `customer/preorder/*` (5 หน้า) · `account/preorders/*` (3 หน้า) · `account/_components/SlipPaymentView.tsx` · ~2,700 บรรทัด | `/catalog/preorder-rounds` (+`:id`) · `/shop/preorders` (+`cancel`, `payment`) · `delivery-quote` ส่ง `product_ids` · จุดรับใช้ `preorderPickupDateOptions` (วันในช่วงรอบ) | C1 (ตัวเลือกสินค้า) · ใช้ `PickupLocationPicker` ของ C3 ได้ | ✅ 2026-10-09 (branch `feat/preorders`) — `/customer/preorder` (รอบเปิด + รอบถัดไป · นับถอยหลัง · ขั้นตอน/กติกาตาม backend หลัก: ชำระใน 24 ชม. · ยกเลิกเองได้ก่อนชำระ) · `/[roundId]` · หน้าสินค้า `?round=` (ราคารอบ · ตัวเลือก · ขั้นต่ำ/สูงสุด · หมายเหตุ) → รายการพรีออเดอร์ (localStorage · รอบเดียว · ถามก่อนเปลี่ยนรอบ) → `/customer/preorder/checkout` (จุดรับ + วันรับในช่วงรอบ · จัดส่ง `product_ids` · คูปอง + แต้ม) → `/customer/account/preorders` (+`[id]` ชำระเงิน/สลิป/ยกเลิก) · `SlipPaymentPanel` ใช้ร่วมกับออเดอร์ · **ทดสอบกับ backend 30/31** (ข้อที่ไม่ผ่าน: เทสคาด 400 แต่ backend ตอบ 409 เมื่อเกินโควตารอบ — พฤติกรรมถูก) · C3 ซ้ำ 39/39 · `next build` ผ่าน · หน้า "สั่งสำเร็จ" แยกไม่ทำ (แถบสำเร็จ `?new=1` ในหน้ารายละเอียด — Q-OWN5) |
| D4 | สมาชิกของฉัน: ยอดแต้ม · แต้มใกล้หมดอายุ · ประวัติ · แลกคูปอง · แชร์แต้ม · คูปองของฉัน | `account/member` (567) | `/shop/points` (+`share`) · `/shop/coupons` (+`check`, `redeem`) | — | ✅ 2026-10-08 (branch `feat/member-points`) — `/customer/account/member`: บัตรสมาชิก + ความคืบหน้าถึงขั้นต่ำ · แต้มใกล้หมดอายุ · วิธีสะสม (+ โบนัสได้แล้ว/ยัง) · กติกาใช้แต้ม · แลกคูปอง (ยืนยันก่อน · แต้มไม่พอ/ครบสิทธิ์ปิดปุ่ม) · คูปองของฉันทุกสถานะ · ประวัติ 50 รายการ · cache ร่วมกับ checkout · **ทดสอบกับ backend 20/20** (+ C3 ซ้ำ 39/39) · ปุ่มแชร์รับแต้มไปอยู่ใน C1 · ยังไม่คลิกดูหน้าจอจริง |
| D5 | รายการโปรด | `account/favorites` | `/shop/favorites` (`data.items`) | ทำคู่ U3 | ✅ 2026-10-08 (branch `feat/favorites`) — `/customer/account/favorites`: grid · เอาออก · หยิบใส่ตะกร้าใช้ได้จริง (ต้นแบบไม่มี onClick) · พรีออเดอร์ = ปุ่มดูสินค้า · หมดชั่วคราว · เมนู "รายการโปรด" · `useFavorites` cache เดียวทั้งหน้า (ต้นแบบยิงขอต่อบัตร) · **ทดสอบกับ backend 10/11** (ข้อที่ไม่ผ่านคือสมมติฐานของเทสเรื่องลำดับ — ดู Q-BE16) · ยังไม่คลิกดูหน้าจอจริง |
| D6 | การแจ้งเตือน (หน้า + กระดิ่งใน Navbar) | `account/notifications` · `components/customer/CustomerNotifications.tsx` (234) | `/shop/notifications` (+`:id`) → `{ items, unread_count }` | ลิงก์ในแจ้งเตือนชี้ `/customer/account/purchases/<id>` แล้ว (G1 ✅) | ✅ 2026-10-09 (branch `feat/notifications`) — กระดิ่งบน Navbar (เฉพาะ login · จำนวนยังไม่อ่าน · 8 ล่าสุด · อ่านทั้งหมด · คลิกนอก/Esc ปิด) + `/customer/account/notifications` (100 ล่าสุด) · React Query โหลดใหม่ทุก 60 วิเฉพาะตอนแท็บแสดง (ต้นแบบใช้ setInterval ต่อคอมโพเนนต์) · อ่านแล้วแก้ cache ทุกชุดทันที · กดแล้วไปหน้ารายละเอียดจาก `ref_id` (พรีออเดอร์ backend ตั้ง link เป็นหน้ารายการ — Q-BE18) · link อื่นรับเฉพาะ path ภายใน · **ทดสอบกับ backend 16/17** (ข้อที่ไม่ผ่าน: เทสคาดว่าลูกค้ายกเลิกเองแล้วได้แจ้งเตือน — backend แจ้งเฉพาะร้าน ซึ่งถูกแล้ว) |
| D7 | เขียนรีวิว + รูป/วิดีโอ | `account/pendingreview/[id]` (705) · `components/AspectIcon.tsx` | `/shop/reviews` · `/shop/reviews/upload` · `/catalog/review-aspects` | D1 ✅ · ปุ่ม "รีวิว" ในประวัติออเดอร์ | ✅ 2026-10-09 (branch `feat/reviews`) — `/customer/account/purchases/[id]/review` + `/customer/account/preorders/[id]/review` (ฟอร์มเดียวกัน `account/_components/WriteReviewForm.tsx`) · ต้นแบบมี 2 โหมด (ทีละชิ้น `?next=` · รวม `?mode=combined`) → ที่นี่หน้าเดียว ติ๊กรายการที่จะใช้รีวิวนี้ ส่งแล้วที่เหลือรีวิวต่อในหน้าเดิม (ส่ง `…_ids` เสมอ · ผ่านบางชิ้นแสดงเหตุผลรายชิ้น) · ดาว → แง่มุมแบบ Grab (4–5 ชม / 1–3 ติ) + ไอคอน (`components/customer/AspectIcon.tsx`) · ข้อความ ≤ 500 · รูป ≤ 5 (5 MB) · วิดีโอ 1 (30 MB) · ส่งไม่ผ่าน = ลบไฟล์ที่อัปแล้ว · รูปสินค้าจาก catalog · ปุ่ม "รีวิวสินค้า (n)" / "✓ รีวิวแล้ว" ในประวัติ + รายละเอียด ออเดอร์/พรีออเดอร์ (เฉพาะ completed + ชำระแล้ว · `ReviewLink`) · **ทดสอบกับ backend 26/26** (รวมแต้ม 20/15 · รีวิวขึ้นหน้าสินค้า · ลบไฟล์ค้าง · รูปเกิน 5 · พรีออเดอร์) · `next build` ผ่าน · ยังไม่คลิกดูหน้าจอจริง · ไม่ทำ: แก้/ลบรีวิวของตัวเอง (`PATCH`/`DELETE /shop/reviews/:id` — FO ไม่มี) |
| D8 | ติดต่อร้าน | `customer/contact-us` (411) | `/shop/contact` · `/catalog/contact-topics` | ทำคู่ U5 | ✅ 2026-10-09 (branch `feat/reviews`) — `/customer/contact-us`: ข้อมูลร้านจาก `/catalog/store-info` (ที่อยู่ · เบอร์ · หน้าร้านประจำสัปดาห์ · อีเมล · โซเชียล · ลิงก์ Google Maps แทน iframe — ส่วนที่ไม่ตั้งไม่แสดง) · ฟอร์ม (ต้อง login · ส่งในนามบัญชี + ชวนเพิ่มเบอร์) · หัวข้อ/ความยาวจาก `/catalog/contact-topics` (ต้นแบบเก็บสำเนา) · 429 → แจ้งรอ 1 นาที · `services/storeInfo.ts` + `app/customer/lib/storeFormat.ts` (ใช้ต่อใน D9) · เมนู Navbar + ลิงก์ Footer · **ทดสอบกับ backend 18/18** (แจ้งเตือนหลังร้านหมวด customer · 401/400/429) · `next build` ผ่าน · ยังไม่คลิกดูหน้าจอจริง · แก้ระหว่างทำ: หน้าร้านที่ไม่มีวันเปิดเคยแสดง "ทุก" → "ยังไม่กำหนดวัน" |
| D9 | ตารางค่าส่ง + ข้อมูลร้าน/โลโก้ | `customer/shipping` (189) · `components/StoreLogo.tsx` | `/catalog/shipping-zones` · `/catalog/store-info` · `/catalog/store-logo` | ทำคู่ U5 | ✅ 2026-10-09 (branch `feat/reviews`) — `/customer/shipping`: ขั้นตอนหลังสั่งซื้อ · โซนค่าส่ง A–D (`/catalog/shipping-zones`) · ขอบเขตจัดส่ง (จังหวัดร้าน + หมวดส่งทั่วประเทศ — หมวดที่ยังไม่ตั้ง `ships_nationwide` เดาจากชื่อแบบเดียวกับ backend `categoryShipsNationwide` · ใช้ `constants/shipping.ts`) · จุดรับ (`schedule` จาก backend) · หมายเหตุ (ตัดลิงก์บัญชีพร้อมเพย์รับเงินคืน — U9) · `StoreLogo` (React Query แทน zustand · `?v=updated_at` · base `Logo` รับ `src`) ใน Navbar · **ทดสอบกับ backend 14/14** · `next build` ผ่าน · ยังไม่คลิกดูหน้าจอจริง · แก้ระหว่างทำ: เทสจับได้ว่าหมวดที่ `ships_nationwide: null` (ซาวโดว์ใน DB ทดสอบ) ไม่ขึ้นเป็นส่งทั่วประเทศ ทั้งที่ backend ส่งได้ |
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
| C1 | รายละเอียดสินค้า `customer/product/[id]` | ตัวเลือก/ออปชันก่อนลงตะกร้า · รีวิว + สรุปคะแนน · สินค้าคล้าย · sentiment · สารก่อภูมิแพ้ · แสดงตัวเลือกในตะกร้า/checkout/ออเดอร์ | `ProductDetailClient.tsx` (1,108) · `ProductCustomizationPicker.tsx` (131) | API: `/catalog/products/:id/customization` · `/reviews` (+`summary`) · `/similar` · `/sentiment` · ตะกร้ารับ `variant_ids[]` + `selected_options` | ✅ 2026-10-09 (branch `feat/product-detail` · ใช้ตัวแก้ backend Q-BE17 #69) — เลือกตัวเลือก/ออปชัน (ตรวจด้วย `src/lib/customizationSelection.ts` ที่ย้ายมาใช้ร่วมกับ POS) · ราคารวมตัวเลือก · หัวใจ · แชร์รับแต้ม · รีวิว (การกระจายดาว · แง่มุม · ปักหมุด · ร้านตอบ · วิดีโอ · ชื่อปิดบางส่วนจาก backend) · สินค้าคล้าย + ป้ายแพ้อาหาร · ตัวเลือกในตะกร้า/checkout · บัตรสินค้า/รายการโปรดที่มีตัวเลือก → พาไปเลือกก่อน (`quickAdd`) · **ทดสอบกับ backend 28/28** (+ C3 ซ้ำ 39/39) · ไม่ยกมา: รอบพรีออเดอร์ (D3) · หมายเหตุต่อชิ้น · รายการส่วนประกอบ (API ไม่ส่ง) |
| C2 | หน้าแรก `customer/page.tsx` | ส่วน "สินค้าแนะนำ" | `HomeRecommendations.tsx` (152) | `/catalog/products/recommended` · `/shop/recommendations` (ล็อกอินแล้ว) | ✅ 2026-10-09 (branch `feat/reviews`) — `app/customer/_components/HomeRecommendations.tsx`: login → `/shop/recommendations` (hybrid · เหตุผลข้อแรก + ป้ายแพ้อาหารบนบัตร — U3) · ไม่สำเร็จ/guest → `/catalog/products/recommended` · ไม่มีผล = สินค้าพร้อมขายเดิม (ต้นแบบขึ้นข้อความ/ปุ่มลองใหม่) · สูงสุด 10 ชิ้นที่ซื้อได้ทันที · `skipAuthRedirect` — session หมดบนหน้าแรกไม่เด้งไป login · **ทดสอบกับ backend 11/11** · `next build` ผ่าน · ยังไม่คลิกดูหน้าจอจริง |
| U1 | Navbar `components/customer/Navbar.tsx` | เมนู **พรีออเดอร์** · **ติดต่อเรา** · **กระดิ่งแจ้งเตือน** (FO มีเมนูชุดสินค้าด้วย — ไม่ทำ H1) | `components/customer/Navbar.tsx` (373) | D3 · D8 · D6 | ✅ **พรีออเดอร์** (D3) · **กระดิ่ง** (D6) · **ติดต่อเรา** (D8) |
| U2 | เมนูบัญชี `components/customer/AccountSideMenu.tsx` | ครบ 8/8 (สมาชิกของฉัน D4 · รายการโปรด D5 · ประวัติพรีออเดอร์ D3 · การแจ้งเตือน D6) · ยังไม่แบ่ง 2 หัวข้อแบบ FO ("บัญชีของฉัน" / "คำสั่งซื้อของฉัน") | `components/customer/SideBarMenu.tsx` (232) | — | ✅ · แบ่ง 2 หัวข้อแล้ว 2026-10-09 (`fix/frontend-followups`) — หัวข้อซ่อนบนมือถือ (เมนูเป็นแถบเลื่อนแนวนอน) |
| U3 | การ์ดสินค้า `components/customer/ProductCard.tsx` | ~~ปุ่มหัวใจ (เพิ่ม/ลบรายการโปรด)~~ ✅ D5 · ~~ป้ายสารก่อภูมิแพ้~~ ✅ C1 (prop `allergenWarning` + `reasons`) | `components/customer/ProductCard.tsx` (350) | ป้ายมาจากผลของระบบแนะนำเท่านั้น — ตอนนี้แสดงในสินค้าคล้าย (C1) · หน้าแรกจะได้ตอนทำ C2 | ✅ |
| U4 | หน้ารายการสินค้า `customer/product` | ตรวจตัวกรองหมวด/เรียงลำดับ/สินค้าหมดให้ตรง FO (FO มีตัวกรองหมวดละเอียดกว่า · คำค้นมีครบแล้ว) · แสดงหัวใจ (U3) | `customer/product/page.tsx` (363) | U3 | ✅ 2026-10-09 (D6 branch) — ตัวกรองหมวด/จำนวน/สินค้าหมด/หัวใจตรง FO แล้ว · **ค้นหาย้ายไป server** (`/catalog/products?search=` ขยายคำพ้อง — กรองในหน้าแบบเดิมหาคำพ้องไม่เจอ) · "ขายดี" → "คะแนนรีวิวสูงสุด" (ไม่มียอดขายใน catalog) · การเรียงอยู่ใน `?sort=` · ทดสอบคำพ้องกับ backend ผ่าน · ข้อสังเกต: ค้นหาด้วยรหัสสินค้า (pos-…) ไม่เจอแล้ว (server ค้นแค่ชื่อ/คำอธิบาย) |
| U5 | Footer `components/customer/Footer.tsx` | ลิงก์ **ติดต่อเรา** · **ค่าจัดส่ง** · **Facebook ร้าน** | `components/customer/Footer.tsx` (64) | D8 · D9 | ✅ 2026-10-09 — ติดต่อเรา (D8) · การจัดส่ง (D9) · Facebook + ที่อยู่ + ชื่อร้านจาก `/catalog/store-info` (ร้านยังไม่ตั้ง = ค่าเดิมของต้นแบบ) |
| U6 | ตะกร้า `customer/cart` | ช่องค้นหาสินค้าบนหัวตะกร้า · ตรวจป้าย "ซื้อไม่ได้" (`cartItemBlocked` — หมด/ปิดขาย/สต็อกไม่พอ) ให้ครบเท่า FO | `customer/cart/page.tsx` · `components/cart/CartItem.tsx` (215) | — | ✅ 2026-10-09 (`fix/frontend-followups`) — ป้ายแดงต่อบรรทัด: ไม่มีสินค้าแล้ว · ปิดขาย · กลายเป็นพรีออเดอร์ · หมด · สต็อกไม่พอ (รวมทุกตัวเลือกของสินค้าเดียวกัน · สต็อกจาก `/catalog/products/:id`) · มีรายการซื้อไม่ได้ → ปิดปุ่มสั่งซื้อ (`app/customer/lib/cartIssues.ts`) · ไม่ทำช่องค้นหาแยก — Navbar หน้าร้านมีช่องค้นหาอยู่แล้ว |
| U7 | ประวัติสั่งซื้อ `account/purchases` (+`[id]`) | รูปสินค้า · ปุ่ม "รีวิว" · ไทม์ไลน์สถานะ · ซื้ออีกครั้ง | `account/purchases/page.tsx` (429) · `[id]/page.tsx` (642) | [Q-BE13](BACKLOG3-merge.md#ถาม-backend) (list ไม่มี items/รูป) · D7 | ⏸ / ▢ — ปุ่ม "รีวิว" ✅ (D7) · เหลือรูป (Q-BE13) · ไทม์ไลน์ · ซื้ออีกครั้ง |
| U8 | หลังสั่งซื้อ | FO มีหน้า "สั่งซื้อสำเร็จ" + แถบขั้นตอน (`FlowSteps` · `orderFlowSteps`) ทั้งออเดอร์และพรีออเดอร์ · repo นี้ไปหน้าออเดอร์ตรง ๆ | `customer/order/success` (177) · `components/customer/FlowSteps.tsx` (30) | ตัดสินใจ: ทำแถบขั้นตอนในหน้า checkout/ออเดอร์ หรือไม่ทำ · [Q-OWN5](#คำถามใหม่) | ⏸ |
| U9 | บัญชีของฉัน `customer/account` | การ์ด + หน้าต่าง **บัญชีพร้อมเพย์รับเงินคืน** | `customer/account/page.tsx` (671) | [Q-BE12](BACKLOG3-merge.md#ถาม-backend) | ⏸ |
| — | สมุดที่อยู่ `account/address` | FO มีชื่อ/เบอร์ผู้รับในที่อยู่ — backend หลักไม่เก็บ (กรอกตอน checkout) | — | — | ❌ ตาม backend |

**ข้อมูลประกอบ (ขนาด component ที่ใช้ร่วม · FO / repo นี้):** `HeroCarousel` 262 / 116 · `CustomerBreadcrumb` 107 / 34 · `CustomerChrome` 59 / 40 — ฟีเจอร์หลักตรงกัน (เลื่อนอัตโนมัติ · เส้นทาง) · เทียบหน้าจอจริงตอนทำ U4 อีกครั้ง

---

## 4. หลังร้าน — หน้าที่ยังไม่มี

> เขียนใหม่แบบ MVVM + i18n + `base/` (ต้องผ่าน `npm run check`) โดยดู UI ของ FrontOffice · ไม่เอาโค้ดมาตรง ๆ

| รหัส | หน้า | ต้นแบบ FrontOffice | API | หมายเหตุ | สถานะ |
|---|---|---|---|---|---|
| E2 | ข้อมูลร้าน: ที่อยู่ · พิกัด · ตลาดนัด/จุดรับประจำสัปดาห์ · แผนที่ · โลโก้ · พร้อมเพย์ | `owner/store-info/*` (~1,416) · `components/CoordinateInput.tsx` | `/admin/store-profile` · `/admin/store-settings` · `/admin/weekly-markets` · `/admin/map-link` | เมนูสิทธิ์ `store_info` มีแล้ว (I1 ✅) · จุดรับที่ตั้งที่นี่คือข้อมูลของ C3/D3 (BE §8.19) | ✅ 2026-10-09 (branch `feat/reviews`) — `/owner/store-info` (MVVM + i18n th/en + `base/`) · เจ้าของร้าน 4 หัวข้อ แก้/บันทึกทีละหัวข้อ (ส่งเฉพาะ field ของหัวข้อ · เตือนก่อนทิ้งที่ยังไม่บันทึก): ข้อมูลทั่วไป + โลโก้ (multipart) · ติดต่อ (เบอร์ = พนักงานที่เลือก · อีเมล · โซเชียล · อีเมลระบบอ่านอย่างเดียว) · พร้อมเพย์ · ที่อยู่ + พิกัด (วางลิงก์ Google Maps/ลิงก์ย่อผ่าน `/admin/map-link` · `src/lib/parseCoordinates.ts` สำเนา backend คืนรหัส error) + หน้าร้านประจำสัปดาห์ · พนักงาน: เฉพาะหน้าร้านประจำสัปดาห์ตามสิทธิ์ `store_info` (ใหม่ = create · แก้ = update · ลบ = delete · 409 → โหลดใหม่) · เมนู + breadcrumb + `ROUTE_MENU_MAP` · บันทึกแล้วล้าง cache หน้าร้าน (ติดต่อเรา · Footer · โลโก้ · จุดรับ) · **ทดสอบกับ backend 37/37** (parser พิกัดตรงกับ backend 11 ตัวอย่าง · owner ทุกหัวข้อ → หน้าร้านเห็น · staff 403 ส่วน owner · staff update ผ่าน / create, delete 403) · `next build` ผ่าน · ตรวจในเบราว์เซอร์แล้ว 2026-10-09 (จอคอม + มือถือ · แก้ V1–V4 — ดู §10) · ไม่ยกมา: แปลงโลโก้เป็น PNG ฝั่ง client (backend หลักเก็บ URL ใหม่แทนการเขียนทับไฟล์ .png) · ข้อสังเกต: หน้าร้านเดิมที่ไม่มีวันเปิด (ข้อมูลเก่า) ทำให้บันทึกทั้งรายการไม่ได้จนกว่าจะแก้ — ฟอร์มชี้ลำดับให้ |
| E3 | คำค้นเทียบเคียง | `owner/products/search-synonyms` (340) | `/admin/search-synonyms` (+`:id`) | สิทธิ์ `products` (BE §8.16) | ✅ 2026-10-09 (branch `feat/reviews`) — `/owner/products/search-synonyms` (MVVM + i18n · เมนูใต้สินค้า สิทธิ์ `products`) · เพิ่ม (การ์ด) / แก้ (modal) / ลบ ตามสิทธิ์ create/update/delete · ตรวจก่อนส่งเหมือน backend (ยาว ≥ 2 หลังตัดวรรณยุกต์ · ≤ 60 · ≤ 50 คำ · คำหลักซ้ำ) + ตัดคำซ้ำ · เตือนคำที่อยู่ในกลุ่มอื่น (ไม่บล็อก) · ลองค้นหาแบบลูกค้า = `/catalog/products?search=` ตัวเดียวกับหน้าร้าน (ไม่ใช่โหลดสินค้าทั้งหมดมาค้นเองแบบต้นแบบ — H6) + แสดงคำที่ขยายแล้ว · `src/lib/searchSynonyms.ts` สำเนา `normalizeText` + `expandQueryWithSynonyms` · **ทดสอบกับ backend 20/20** (สำเนาตรงกับ backend 10 + 8 ตัวอย่าง · เพิ่ม/แก้/ลบแล้วการค้นหาหน้าร้านเปลี่ยนทันที · 409/400 ตรงกับฟอร์ม · staff ไม่มีสิทธิ์ 403) · `next build` ผ่าน · ยังไม่คลิกดูหน้าจอจริง |
| E4 | จัดการรีวิวขั้นสูง: bulk · ซ่อน/แสดง · sentiment · ด้านที่รีวิว (เรียงลำดับ) · คำสำคัญ · ตั้งค่า + `data.summary` (I9) | `owner/reports/reviews/*` (รวม ~4,160 · ไม่รวม analytics) | `/admin/reviews/bulk` · `filter-options` · `:id/visibility` · `:id/sentiment` · `/admin/aspects/reorder` · `/admin/semantic-terms` | สิทธิ์ `reports` (I14 ✅) · analytics/รายสินค้า → F3 | ✅ 2026-10-09 (branch `feat/reviews`) — **`/owner/reports/reviews` เขียนใหม่**: กรอง/ค้นหา/เรียง/แบ่งหน้าที่ server (หมวด · สินค้า · ดาว · หัวข้อ + ชม/ติ · ตอบแล้ว · อ่านแล้ว · รูป/วิดีโอ · ประเภทออเดอร์ · สถานะ · 5 แบบเรียง รวม "ควรตอบก่อน") + แถบสรุปของชุดที่กรอง (I9 · ปุ่มลัด "รีวิวลบที่ยังไม่ตอบ") · การ์ดรีวิว: สถานะ แสดง/ซ่อน/รออนุมัติ · ปักหมุด · อ่าน/ยังไม่อ่าน · ตอบกลับ (ข้อความสำเร็จรูป 6 แบบ + คำตอบเก่าที่เคยใช้) · โน้ต/แท็กภายใน · ป้ายที่มาผลวิเคราะห์ · รูป/วิดีโอ · drawer ผลวิเคราะห์ความรู้สึก · เลือกหลายรายการ: อ่านแล้ว/ยังไม่อ่าน (`/bulk`) + ส่งออก CSV (ต้นแบบ xlsx) · **หน้าใหม่ `/owner/reports/reviews/settings`**: หัวข้อรีวิว (เพิ่ม ≤ 20 · แก้ชื่อ · ไอคอน · คำแนะนำ · เปิด/ปิด · เลื่อนลำดับ · ลบ/กู้คืน · ตัวอย่างปุ่มที่ลูกค้าเห็น) + คำสำหรับวิเคราะห์ (`/admin/semantic-terms`) · สิทธิ์ `reports` · **ทดสอบกับ backend 44/44** · `next build` ผ่าน · ตรวจในเบราว์เซอร์แล้ว 2026-10-09 (จอคอม + มือถือ · แก้ V1–V4 — ดู §10) · แก้ระหว่างทำ: `/aspects/reorder` ตอบเป็น list (`data.items`) · ไม่ยกมา: แดชบอร์ด/analytics/รายสินค้า/สถิติการเลือกหัวข้อ (F3) · ข้อสังเกต: รีวิว seed เก่าที่บัญชีลูกค้าถูกลบ → การ์ดแสดง "ลูกค้า" |
| E5 | ออเดอร์พร้อมส่ง | `owner/orders/readyReders` (287) | `/admin/orders?order_status=ready` | แนะนำทำเป็นแท็บ/ตัวกรองด่วนในหน้า `manageOrders` แทนหน้าใหม่ | ✅ 2026-10-09 (branch `feat/reviews`) — ทำในหน้า `manageOrders` ตามที่แนะนำ (ไม่สร้างหน้าใหม่ — หน้า `readyReders` ของ FrontOffice เป็นหน้าเก่าใช้ข้อมูลจำลอง ไม่ได้ผูกเมนู): แถบแจ้ง "มี n ออเดอร์พร้อมส่งมอบ" ต่อแท็บ (จัดส่ง = รอจัดส่ง/ใส่เลขพัสดุ · รับเอง = รอลูกค้ามารับ) + ปุ่มกรองสถานะ ready · ลิงก์ตรงได้ด้วย `?tab=delivery|takeaway&status=<สถานะ>` · Export CSV เดิมใช้ตามตัวกรอง · **ทดสอบกับ backend 3/3** (เดินสถานะผ่านหลังร้านถึง ready → ตัวนับเพิ่ม) · `next build` ผ่าน · ยังไม่คลิกดูหน้าจอจริง |
| I8 | โซนค่าส่งหลังร้าน/POS (`DeliveryZones`) | — | `/admin/delivery-zones` (+`:id`, `restore`) · `/admin/delivery-fee` | คนละตารางกับค่าส่งเว็บ (F2) | ▢ |
| F2 | โซนค่าส่งเว็บ (`ShippingZones`) | `owner/shipping` (359) | backend ยังไม่มี admin API | [Q-BE2](BACKLOG3-merge.md#ถาม-backend) | ⏸ |
| F3 | รีวิว analytics · dashboard · รายสินค้า | `reports/reviews/analytics` · `reviews/products/[id]` | BE §8.20 (R5) | [Q-BE4](BACKLOG3-merge.md#ถาม-backend) | ⏸ |
| F4 | dashboard รอบพรีออเดอร์ + รายชื่อลูกค้าในรอบ | `owner/preorders/rounds` (บางส่วน) | ไม่มีใน backend หลัก | [Q-BE5](BACKLOG3-merge.md#ถาม-backend) · [Q-OWN3](BACKLOG3-merge.md#ถาม-เจ้าของร้าน--ทีม) | ⏸ |

**หน้าที่มีครบแล้ว (เทียบ route):** dashboard · พนักงาน (+เพิ่ม/แก้ · สิทธิ์ · log · เงินเดือน `emp_salary`) · การเงิน (สรุป · ค่าใช้จ่าย) · วัตถุดิบ (+สต็อก · ประวัติ · หน่วย) · ประวัติแจ้งเตือน (มีหมวด "ลูกค้า" แล้ว — E6) · จัดการออเดอร์ · POS · รอบพรีออเดอร์ (`orders/preOrderRound` แทน `preorders/rounds`) · การผลิต (หน้าเดียวหลายแท็บ แทน `planOrPurchaseOrder` · `productionstatus` · `productionhistory`) · สินค้า (+เพิ่ม/แก้ · ตัวเลือก E1 · สต็อก) · คูปอง · ราคา · สูตร (modal แทน `recipes/addRecipe`) · รายงานยอดขาย · store-design

---

## 5. แก้ตาม backend ที่ยังค้าง (จาก BACKLOG3 หมวด I)

| รหัส | ระดับ | เรื่อง | สถานะจริง (ตรวจ 2026-10-08) |
|---|---|---|---|
| I3 | 🟢 | ประเภทแจ้งเตือน: เพิ่ม `customer` แล้ว แต่ `NotificationModule` (`types/notification.ts`) ยังมี `employee` ที่ backend เลิกแล้ว | ✅ 2026-10-09 — `NotificationModule` = 6 หมวดที่ backend สร้างได้ (+ `NOTIFICATION_MODULES` ใช้เป็นตัวกรอง) · `employee` แยกเป็น `LegacyNotificationModule` ใช้แสดงแถวเก่าเท่านั้น (คงป้าย i18n ไว้ — backend ก็ยังมีป้ายของเอกสารเก่า · ลบแล้วแถวเก่าจะขึ้น key ผิด) |
| I9 | 🟢 | รายการรีวิวหลังร้าน: `data.summary` ยังถูกทิ้ง (`services/reviews.ts`) | ✅ 2026-10-09 (E4) — `reviewsService.list` อ่าน `data.summary` (ส่ง `summary=1`) แสดงในแถบสรุป |
| I10 | 🟢 | อีเมลชั่วคราวของบัญชี LINE (`*@line-user.invalid`) ยังแสดงดิบในหลังร้าน (drawer ออเดอร์ · รีวิว · พนักงาน) | ✅ 2026-10-09 — `lib/lineAccount.ts` (`isLinePlaceholderEmail` ย้ายจาก services/shopProfile — re-export ไว้) · `/profile` แสดง "บัญชี LINE — ยังไม่ได้ระบุอีเมล" · ฟอร์มแก้พนักงานเตือนให้ใส่อีเมลจริง · ตรวจแล้ว: drawer ออเดอร์/รีวิวหลังร้านไม่ได้แสดงอีเมลลูกค้า (backend ก็ตัดอีเมลชั่วคราวออกจากข้อความติดต่อร้านแล้ว) |
| I11 | 🟢 | mock (MSW) ใช้ไม่ได้ (path เก่า ไม่มี `/admin`) — ตอนนี้ `.env.local` ตั้ง `NEXT_PUBLIC_API_MOCK=0` อยู่แล้ว | ✅ 2026-10-09 (branch `fix/frontend-followups`) — เลือก "ลบทิ้งทั้งหมด": ถอด `src/mocks` · `MSWReady` · `public/mockServiceWorker.js` · แพ็กเกจ `msw` · `NEXT_PUBLIC_API_MOCK` (+ ESLint ignore · ข้อยกเว้น check-i18n) · `docs/MOCKS.md` เขียนใหม่เป็นวิธีทดสอบกับ backend ในเครื่อง + DB ทดสอบ · อัปเดต README · OVERVIEW · API_CONTRACT · services/README |
| I15 | 🟡 | POS: ช่องค้นหาสินค้าได้ 403 ถ้าพนักงานไม่มี `products.view` | ⏸ [Q-BE10](BACKLOG3-merge.md#ถาม-backend) |

---

## 6. แก้เอกสาร

| รหัส | ไฟล์ | แก้อะไร | สถานะ |
|---|---|---|---|
| K1 | `BACKLOG3-merge.md` ตาราง E | E1 เขียน ▢ "ทำก่อน" — เสร็จแล้ว (PR #27) · E6 เขียน ▢ — มีหมวด "ลูกค้า" ในหน้าแจ้งเตือนแล้ว | ✅ 2026-10-08 |
| K2 | `BACKLOG3-merge.md` ตาราง I | I1 · I2 · I4 · I5 · I6 · I7 ยังเป็น ▢ — โค้ดเสร็จแล้วทั้งหมด (I1 `store_info` ใน `menuKeys.ts` · I2 `RefundSection` · I4 `CustomizationPickerModal` · I5 `ships_nationwide` · I6 field ออเดอร์เว็บใน `types/order.ts` · I7 `points_cost`) และผ่านการทดสอบชุด PR #25–#27 · I3 → 🟡 | ✅ 2026-10-08 — ใส่ PR + commit ทุกแถว · สรุปหมวด I ในสารบัญเป็น ✅ 9 · 🟡 1 · ▢ 3 · ⏸ 2 |
| K3 | `BACKLOG3-merge.md` บรรทัดแรก | ไม่มีหัวเรื่อง (`#`) — บรรทัดแรกเป็นข้อความสถานะ I4 ที่หลุดมา (หายตั้งแต่ commit แรก `c66e269`) · ควรมีหัวเรื่องแบบ BACKLOG2 + ลิงก์ "ถัดไป: BACKLOG4-merge.md" | ✅ 2026-10-08 — ข้อความที่หลุดย้ายไปไว้ในแถว I4 |
| K4 | `BACKLOG3-merge.md` A4 | `src/lib/promptpay.ts` ถูกลบแล้ว → ติ๊ก checkbox | ✅ 2026-10-08 — A4 เป็น 🟡 (เหลือคลิกดูหน้าจอจริง) |
| K5 | `README.md` §1 · §4 | ยังบอกว่าเป็นระบบหลังร้านอย่างเดียว (27 หน้า) · พอร์ต `3000` (จริง `3001`) · ไม่มีหน้าร้าน `/customer/*` · `services/shop*` · `components/customer` | ✅ 2026-10-09 — §1 (หน้าร้าน + หลังร้าน · จำนวนหน้า · API 3 กลุ่ม · สถานะ mock) · §2 (พอร์ต 3001 · env จริง) · §4 (โฟลเดอร์ customer · services shop* · components/customer · providers) |
| K6 | `docs/SCREEN_MAP.md` · `COMPONENT_MAP.md` | ยังไม่มีหน้าจอ/คอมโพเนนต์ของหน้าร้าน | ✅ 2026-10-09 — SCREEN_MAP §2b หลังร้านที่เพิ่ม (8 หน้า + profile/register) · §2c หน้าร้านทุก route (ทางเข้า · API · รหัสงาน) · แก้ข้อมูลเก่า (Attendance ไม่มีแล้ว) · COMPONENT_MAP: components/customer + page-local หน้าร้าน/หลังร้านใหม่ + base Logo `src` |
| K7 | `BACKLOG3-merge.md` ตาราง D + คำถาม · `BACKLOG4` คำถามใหม่ | D3/D6 ยังเป็น ⏸ · D4/D5 ยังเป็น ▢ ทั้งที่เสร็จแล้ว · คำตอบ Q-BE7/8/11/15 ยังว่างทั้งที่ backend แก้/merge แล้ว (พบตอนจัดลำดับงานที่เหลือ 2026-10-09) | ✅ 2026-10-09 — ใส่สถานะ + ลิงก์ไป BACKLOG4 · กรอกคำตอบ + PR ของ backend |

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
| Q-BE15 | regex `pickup_date` ผิดบน `main` (`/^d{4}-d{2}-d{2}$/` ไม่มี `\`) → ออเดอร์/พรีออเดอร์ที่เลือกวันรับได้ 400 ทุกครั้ง · ค้นทั้ง `src/` แล้วไม่มี regex ผิดแบบเดียวกันที่อื่น | `src/schemas/order.ts:38` · `src/schemas/preorder.ts:36` | ✅ backend PR [#67](https://github.com/ThanyalakSasen/NextJS-MeowMeeCake/pull/67) merge แล้ว 2026-10-08 (`38b57c6`) · ทดสอบ C3 กับ `main` ซ้ำ 39/39 |
| Q-BE16 | 🟢 รายการโปรด: เอาออกแล้วเพิ่มกลับ = กู้แถวเดิม (`created_at` เดิม) → กลับไปอยู่ตำแหน่งเดิม ไม่ขึ้นบนสุดตามที่ GET บอกว่า "ล่าสุดก่อน" · เสนอ: ตั้ง `created_at` ใหม่ตอนกู้ (หรือเรียงด้วย `updated_at`) | `src/services/favoriteService.ts` `addFavorite` | ▢ เล็กน้อย |
| Q-BE18 | 🟢 แจ้งเตือนพรีออเดอร์ตั้ง `link` เป็น `/customer/account/preorders` (หน้ารายการ) — FrontOffice ไม่มีหน้ารายละเอียด แต่ repo นี้มีแล้ว (D3) · frontend เลี่ยงด้วย `ref_id` แล้ว · เสนอ: `docPath("preorder", id)` → `/customer/account/preorders/<id>` (ลิงก์ใน LINE จะได้ตรงด้วย) | `src/services/customerNotifyService.ts:140` | ▢ เล็กน้อย |
| Q-BE17 | 🔴 `POST /shop/cart/items` ไม่ส่ง `variant_ids` ต่อให้ `cartService` (schema รับ แต่ route ส่งแค่ `variant_id`) → **สินค้าที่มีกลุ่มบังคับเลือกใส่ตะกร้าจากหน้าเว็บไม่ได้เลย** (400 "กรุณาเลือก …") · เจอตอนทดสอบ C1 · ตรวจ route อื่นแล้ว (orders · preorders) ไม่เป็น | `src/app/api/shop/cart/items/route.ts` | ✅ backend PR [#69](https://github.com/ThanyalakSasen/NextJS-MeowMeeCake/pull/69) merge แล้ว 2026-10-09 (`4190f57`) · เทส route (fail เมื่อไม่มีตัวแก้) · CI ผ่าน |

### 9.2 🟠 ช่องโหว่ (แก้เล็ก)
| รหัส | เรื่อง | ไฟล์ backend | สถานะ |
|---|---|---|---|
| Q-BE11 | `unlinkLineAccount` ไม่เช็คว่าเป็นบัญชีที่สมัครด้วย LINE (ไม่มีรหัสผ่าน) → ยกเลิกแล้วเข้าบัญชีไม่ได้อีก · หน้าเว็บซ่อนปุ่มแล้ว แต่ backend ต้องกัน | `src/services/userService.ts:405` | ✅ backend PR [#68](https://github.com/ThanyalakSasen/NextJS-MeowMeeCake/pull/68) merge แล้ว 2026-10-09 (`33e51a4`) — 409 |
| Q-BE8 | `PATCH /admin/products/:id` ยังเขียน `product_stock_quantity` ตรง ๆ (ไม่ผ่าน `PUT /stock` → ไม่มีประวัติสต็อก) · frontend เลิกส่งแล้ว (I12) → ปฏิเสธได้เลย | `src/services/productService.ts` `updateProduct` (~บรรทัด 525) | ✅ backend PR [#68](https://github.com/ThanyalakSasen/NextJS-MeowMeeCake/pull/68) merge แล้ว (`33e51a4`) — 400 ให้ใช้ `/stock` · **แก้บั๊กไปด้วย:** หน้าแก้สินค้าเปลี่ยนสินค้าที่มีสต็อกเป็นพรีออเดอร์เคยได้ 400 |

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

## 10. ตรวจหน้าจอจริงในเบราว์เซอร์ (2026-10-09)

> รหัสงาน `V` · ตรวจบน branch `feat/reviews` (รวมโค้ดของ PR #37 + #38) · backend local + MongoDB `meowmeecake-test` (ปิด LINE/อีเมล) · frontend `:3001`
> Chrome ในเครื่องแบบ headless ผ่าน `playwright-core` (ติดตั้งใน scratchpad ไม่ได้เพิ่มเข้าโปรเจกต์) · login ผ่านฟอร์มจริงด้วย `e2.owner@meowmeecake.test` · ถ่ายจอคอม 1440px + มือถือ 390px
> ตรวจแล้ว: `/owner/store-info` (โหมดดู · แก้ไขครบ 4 หัวข้อ · บันทึกหน้าร้านที่กรอกไม่ครบ · ยืนยันทิ้งที่ยังไม่บันทึก) · `/owner/reports/reviews` (รายการ · เปิดตอบกลับ · drawer) · `/owner/reports/reviews/settings` (2 แท็บ) — ไม่มี console error และไม่มี API ล้ม

### 10.1 ✅ แก้แล้ว (commit บน `feat/reviews` · PR #38)
| รหัส | หน้า | ปัญหา | แก้ |
|---|---|---|---|
| V1 | ข้อมูลร้าน | ช่องที่ยังว่างแสดง placeholder สีเทา ("MeowMee Cake" · "0812345678" · "hello@meowmeecake.com") **ดูเหมือนตั้งค่าแล้ว** ทั้งที่ DB ว่าง — โดยเฉพาะเลขพร้อมเพย์ เจ้าของร้านอาจเข้าใจว่าตั้ง QR รับเงินแล้ว · ค่าที่บันทึกแล้วก็จางเท่า placeholder แยกไม่ออก | placeholder ตัวอย่างแสดงเฉพาะตอนแก้ไข · โหมดดูช่องว่าง = "— ยังไม่ได้ตั้งค่า" (`storeInfo.notSet`) · ค่าที่บันทึกเป็นตัวเข้ม (ทับสี disabled ของ antd ในหน้านี้) |
| V2 | ข้อมูลร้าน | การ์ด "ที่อยู่ร้าน & หน้าร้านประจำสัปดาห์" คำอธิบายยาวดันปุ่ม แก้ไข/บันทึก ลงแถวใหม่ด้านซ้าย | `SectionCard` หัวการ์ดไม่ wrap — ปุ่มอยู่มุมขวาบนเสมอ |
| V3 | ข้อมูลร้าน | เวลาเปิด–ปิดตกบรรทัด (เวลาปิดอยู่คนละแถว) | เวลาได้แถวของตัวเอง · ลิงก์แผนที่ย้ายลงแถวถัดไป |
| V4 | รีวิว | ปุ่ม "บันทึกภายใน" กับ "ตอบกลับรีวิวนี้" ติดกันจนอ่านเป็นคำเดียว · checkbox อยู่กลางการ์ด · มือถือเนื้อหาแคบเพราะคอลัมน์รูปสินค้า | ห่อ 2 ปุ่มด้วย flex มีระยะห่าง (เปิดแก้แล้วขยายเต็มแถว) · checkbox ชิดบน · ซ่อนรูปสินค้าบนจอแคบ |

### 10.2 ✅ แก้แล้ว (branch `fix/frontend-followups`)
| รหัส | หน้า | ปัญหา | แก้ |
|---|---|---|---|
| V5 | หลังร้านทุกหน้า (มือถือ 390px) | แถบบนสุด: ไอคอนกระดิ่งทับ breadcrumb · ชื่อผู้ใช้ทับชื่อหน้า | เลือก "breadcrumb แยกบรรทัด": ใต้ `sm` breadcrumb ย้ายลงแถวที่สอง (`.navbar-crumbs-row`) · ชื่อผู้ใช้ยาวตัดด้วย … · แถวที่สองซ่อนเองใน CSS ตั้งแต่ `sm` (เดิมใช้ `sm:hidden` แต่กฎ CSS นอก layer ชนะ utility → จอคอมเห็น breadcrumb ซ้ำ 2 แถว — พบตอนตรวจ V7) |
| V6 | รีวิว | ชื่อเมนู + breadcrumb เป็น "รายงานความคิดเห็น" แต่หัวหน้าเป็น "รีวิวลูกค้า" | ใช้ "รายงานความคิดเห็น" ทุกที่ (`reviews.title` th · en = "Customer Reviews") |
| V7 | หน้าที่ยังไม่ได้เปิดดู (PR #37 · #38) | — | ✅ 2026-10-09 เปิดครบ (ลูกค้าจอคอม + มือถือ · เจ้าของร้าน · พนักงาน) — ไม่มี console error · API ล้มมีแค่ 404 ของสินค้าที่ตั้งใจปิดในเคสตะกร้าซื้อไม่ได้ (U6) · ปัญหาที่พบแยกเป็น V5 (breadcrumb ซ้ำ) และ V9 |
| V9 | หน้าร้านเกือบทุกหน้า | ลิงก์ (`<a>` / `Link`) ที่ตั้งพื้นหลัง/สีตัวอักษรด้วย Tailwind **ไม่ได้สีนั้น** — เมนูบัญชีที่เลือกอยู่ไม่เป็นพื้นเข้ม · ปุ่มลิงก์ "ดูรายละเอียด"/รอบพรีออเดอร์/ชิปหมวด/ปุ่มแผนที่ ฯลฯ ไม่มีพื้น · ตัวอักษรขาวกลายเป็นสีลิงก์ของ antd | ต้นเหตุ: antd ใส่ CSS `a:where(.css-…){color;background}` แบบไม่อยู่ใน layer → ชนะ utility ของ Tailwind v4 (อยู่ใน `@layer utilities`) เสมอ · แก้ที่ต้นตอ: `<StyleProvider layer>` (`@ant-design/cssinjs`) ห่อ ConfigProvider ใน `providers.tsx` + ประกาศลำดับ `@layer theme, base, antd, components, utilities` ใน `globals.css` · ตรวจ: สแกนลิงก์ 10 หน้าร้านไม่เหลือ "bg/white lost" · เทียบภาพก่อน/หลัง 39 หน้า: หลังร้านไม่เปลี่ยน ยกเว้นคลาสที่โค้ดตั้งไว้แต่เดิมโดนทับ (ไอคอนตาสีฟ้า · checkbox ชิดบนในการ์ดรีวิว) |

### 10.3 ▢ ยังค้าง
| รหัส | หน้า | ปัญหา | หมายเหตุ |
|---|---|---|---|
| V8 | ข้อมูลทดสอบ | รีวิวใน DB ทดสอบมีรูปเป็นสี่เหลี่ยม 1×1 จากเทส D7 · หัวข้อรีวิว seed ไม่มีไอคอนตรงชื่อ ("⋯") · รีวิว 3 อันบัญชีลูกค้าถูกลบแล้ว | ไม่ใช่บั๊กของหน้าเว็บ — ถ้าจะใช้ DB นี้ทำภาพประกอบ/สาธิต ควร seed รูปและหัวข้อจริง |

## คำถามใหม่

| รหัส | ถามใคร | คำถาม | บริบท | ใช้กับ | คำตอบ | ผู้ตอบ · วันที่ |
|---|---|---|---|---|---|---|
| Q-BE14 | backend | ฐานคิดเพดานแต้มตอนใช้คูปอง/โค้ด **ส่งฟรี** ควรหักส่วนลดค่าส่งหรือไม่ | `orderService.createOrder`: `goodsDiscount = min(discount_amount, subtotal)` รวมส่วนลดค่าส่งด้วย แต่ comment เขียนว่า "ส่วนลดส่งฟรีไม่ลดฐานคิดแต้ม" · FrontOffice หักเฉพาะส่วนลดสินค้า · หน้า checkout ตอนนี้ทำตามโค้ด backend (ถ้า backend แก้ ต้องแก้ `checkout/page.tsx` ตาม) | C3 | | |
| Q-BE15 | backend | merge `fix/pickup-date-regex` (`2746063` — แก้ regex `pickup_date` ใน `schemas/order.ts` + `schemas/preorder.ts` + เทส) เข้า `main` ได้เมื่อไหร่ | `main` ปฏิเสธ `pickup_date` ทุกค่า → checkout เลือกวันรับไม่ได้ (C3) และพรีออเดอร์ (D3) · branch อยู่ในเครื่องเท่านั้น ยังไม่ push | C3 · D3 | merge แล้ว — backend PR #67 (`38b57c6`) · ทดสอบ C3 กับ `main` ซ้ำ 39/39 | backend · 2026-10-08 (K7) |
| Q-OWN5 | เจ้าของร้าน | ต้องการหน้า "สั่งซื้อสำเร็จ" + แถบขั้นตอน (ตะกร้า → ยืนยัน → ชำระ → เสร็จ) แบบ FrontOffice ไหม | ตอนนี้สั่งซื้อแล้วไปหน้ารายละเอียดออเดอร์ (ชำระเงินได้ทันที) | U8 · D3 | | |
