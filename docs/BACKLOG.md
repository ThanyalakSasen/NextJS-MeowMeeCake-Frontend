# MeowMeeCake Frontend — BACKLOG: บั๊ก/ความเสี่ยงที่พบระหว่างเชื่อมกับ backend จริง

> สร้าง: 2026-09-22 · ขอบเขต: ฝั่ง Frontend (`src/**`) เท่านั้น — เทียบคู่กับ
> [`../NextJS-MeowMeeCake/docs/BACKLOG2.md`](../../NextJS-MeowMeeCake/docs/BACKLOG2.md) ฝั่ง backend
> วิธีตรวจ: อ่านโค้ดจริง + เปิดแอปทดสอบจริงด้วย Playwright (ล็อกอินจริง คลิกทุกหน้าใหม่) + ตรวจ DB จริง
> (read-only) เพื่อยืนยันผลกระทบ — ไม่ใช่รายงานดิบจาก agent (ตามธรรมเนียมเดียวกับ BACKLOG2.md ฝั่ง backend)
>
> **สถานะโดยรวม:** §1/§2/§3/§5/§6/§7/§8/§9 แก้ครบแล้ว · §4 บันทึกไว้ก่อน ยังไม่แก้ (2026-09-22, §8/§9 เพิ่ม 2026-09-23)

## สถานะโดยรวม

| ข้อ | สถานะ |
|---|---|
| **§1 permission-key ไม่ตรงกับ path-prefix ที่ URL guard ใช้ (pricing/reviews)** | ✅ **แก้แล้ว** (2026-09-22) — เลือกทางเลือก (ก): ผูก `"products"` ทั้ง `menu.ts`/`menuKeys.ts` ให้ตรงกับสิทธิ์จริงที่หน้าเช็คอยู่แล้ว |
| **§2 `enums.employmentType.Active` ไม่มี i18n key — ข้อมูลจริงในระบบมีค่านอก enum** | ✅ **แก้แล้ว (ทางเลือก ข — UI fallback)** (2026-09-22) — DB ยังมีแถวเสีย 1 แถวเหมือนเดิม (ตั้งใจไม่แก้ข้อมูล รอผู้ใช้ยืนยันค่าที่ถูกต้อง) |
| **§3 `docs/Debug.md`/`docs/OVERVIEW.md` มีรหัสผ่านจริงเปิดเผยอยู่/ยังไม่ commit** | ✅ **แก้แล้วทั้งคู่** (2026-09-22) — `Debug.md` redact แล้ว commit, `OVERVIEW.md` อัปเดตเนื้อหาให้ตรงสถานะจริงแล้ว commit |
| **§4 สินค้าทุกตัว (35/35) มี `category_id`/`unit_id` ชี้ไปเอกสารที่ถูกลบไปแล้ว** | 🟡 พบจริง บันทึกไว้ก่อน ยังไม่แก้ (2026-09-22) — ต้องมีคนตัดสินใจว่าแต่ละสินค้าควรอยู่หมวดไหนจริง |
| **§5 URL รูปภาพเป็น relative path — 404 ข้าม origin (product/banner/receipt)** | ✅ **แก้แล้ว** (2026-09-22) — เพิ่ม `resolveUploadUrl()` ใช้ที่ 4 จุด |
| **§6 หน้า `products/[id]/edit` ไม่มีปุ่ม/ลิงก์เข้าถึงจาก UI เลย** | ✅ **แก้แล้ว** (2026-09-22) — เพิ่มปุ่ม "แก้ไข" ทั้งมุมมองกริดและตาราง |
| **§7 POS: ยิงบาร์โค้ดต้องคลิกช่องกรอกก่อนเสมอ** | ✅ **แก้แล้ว** (2026-09-22) — global keydown capture, เจอ+แก้บั๊กจริง 2 ตัวระหว่างทำ |
| **§8 แบนเนอร์เก็บรูปเป็น base64 — เพิ่ม/แก้ด้วยรูปจริงพัง 400 เสมอ** | ✅ **แก้แล้ว** (2026-09-23) — ย้ายไปอัปโหลดไฟล์จริงเหมือน `product_img` |
| **§9 หน้า login ยัง error แบบแถบแดง inline — ไม่ใช่ swal2 เหมือนทุกจุดอื่นในระบบ** | ✅ **แก้แล้ว** (2026-09-23) — เปลี่ยนเป็น `alert.error()`, ลบ `ErrorMessage.tsx` (ไม่มีใครใช้ต่อแล้ว) |

---

## 1. 🟡 permission-key ที่ URL guard ใช้ไม่ตรงกับ permission-key จริงที่หน้าเช็ค (pricing/reviews)

**ยืนยันด้วยการอ่านโค้ดจริงทั้ง 2 ฝั่ง:**

- `src/constants/menuKeys.ts` (`ROUTE_MENU_MAP`, ใช้โดย `OwnerLayout.tsx` ทำ URL-based guard —
  ดัก path ที่ `!user.menuAccess[menuKey]?.view` แล้ว redirect ไป `/owner/access-denied`):
  - `/owner/promotions/**` → menuKey `"promotions"` (บรรทัด 44)
  - `/owner/reports/**` → menuKey `"reports"` (บรรทัด 48)
- แต่ตัวหน้าเองเช็คคนละ key:
  - `src/app/owner/promotions/pricing/usePricingViewModel.ts:41` — `usePermission("products")`
    (คอมเมนต์บรรทัด 7-8 ในไฟล์เดียวกันอธิบายเหตุผลไว้ชัดว่า **ตั้งใจ** เช็คแบบนี้ เพราะ endpoint จริงที่
    ยิงคือ `/admin/products` (`productsService.update()`) ซึ่งต้องมีสิทธิ์ `products.update` จริง ๆ
    ไม่มี endpoint "โปรโมชัน" แยกให้เช็ค)
  - `src/app/owner/reports/reviews/useReviewsViewModel.ts:28` — `usePermission("products")`
    (คอมเมนต์บรรทัด 5 อธิบายเหตุผลเดียวกัน: endpoint จริงคือ `/admin/reviews` ใต้ `products.*`)

**สรุป:** การเช็คสิทธิ์ *ในตัวหน้า* ถูกต้องแล้ว (ตรงกับสิทธิ์ที่ backend endpoint จริงต้องการ — มีคอมเมนต์
อธิบายไว้แล้วว่าตั้งใจ ไม่ใช่พลาด) แต่ **URL guard ที่ระดับ `OwnerLayout` ยังผูกกับ menuKey ตามหมวดของ
sidebar** (`promotions`/`reports`) ซึ่งเป็นคนละตัวกับสิทธิ์ที่หน้าใช้จริง (`products`) — เกิดความไม่
สอดคล้อง 2 ทาง:

1. staff มี `products.view=true` แต่ `promotions.view=false`/`reports.view=false` → URL guard เตะไป
   `access-denied` ทั้งที่หน้าทำงานได้จริงถ้าเข้าถึง (over-restrictive)
2. staff มี `promotions.view=true`/`reports.view=true` แต่ `products.view=false` → URL guard ปล่อยให้
   เข้าหน้าได้ แต่ทุกปุ่มกระทำการในหน้า (`usePermission("products")`) จะถูกปิดใช้งานเอง (ไม่ใช่ช่องโหว่
   ความปลอดภัย เพราะ backend เช็ค `products.*` เองอยู่แล้วถ้ายิง API ตรง — แค่ UX สับสน: เข้าหน้าได้แต่
   ทำอะไรไม่ได้เลย โดยไม่มีคำอธิบาย)

**ยืนยันผลกระทบกับ DB จริง:** ยังไม่ query หา role ที่ `products`/`promotions`/`reports` ไม่ตรงกันอยู่จริง
ก่อนแก้ — แก้แบบ align สิทธิ์ให้ตรงกันทั้ง 3 จุดไปเลย ไม่ต้องรอผลกระทบจริงเกิดก่อนเหมือน §9 ของ BACKLOG2.md
เพราะที่มาเป็นความไม่สอดคล้องของโค้ดเอง (ไม่ใช่ feature ที่ยังไม่มีใครใช้)

**ทางเลือกที่เลือก: (ก) เปลี่ยน `ROUTE_MENU_MAP` (+ `menu.ts`) ให้ 2 เส้นทางนี้ผูกกับ `"products"`**
ให้ตรงกับสิทธิ์จริงที่หน้าใช้อยู่แล้ว — ยอมรับข้อเสียที่ระบุไว้ (permission matrix UI ไม่มีการแบ่งกลุ่ม
แยกให้ "โปรโมชัน"/"รายงาน" คุม 2 หน้านี้อีกต่อไป toggle "สินค้า" (`products`) จะคุมทั้งหมด) เพราะเป็น
ทางเดียวที่ทำให้ sidebar visibility + URL guard + การเช็คสิทธิ์จริงในหน้า **ตรงกันทั้ง 3 จุด** โดยไม่ต้อง
แก้โครงสร้าง backend (ทางเลือก (ค) ใหญ่เกินไปสำหรับตอนนี้)

**แก้แล้ว:**
- `src/constants/menu.ts` — `promotionsPricing`/`reportsReviews` เปลี่ยน `menuKey` จาก
  `"promotions"`/`"reports"` → `"products"` (คุมการแสดงผลใน `Sidebar.tsx`)
- `src/constants/menuKeys.ts` (`ROUTE_MENU_MAP`) — เพิ่ม prefix เจาะจง
  `/owner/promotions/pricing` และ `/owner/reports/reviews` → `"products"` (ต้องมาก่อน prefix ทั่วไป
  `/owner/promotions`/`/owner/reports` เพราะ `resolveMenuKey()` เลือก prefix ที่ยาวที่สุด — คุม URL
  guard ใน `OwnerLayout.tsx`)
- `usePricingViewModel.ts`/`useReviewsViewModel.ts` — ไม่ต้องแก้ (เช็ค `"products"` ถูกต้องอยู่แล้ว)

ยืนยันด้วย `tsc --noEmit`/`eslint`/`check` (i18n+theme+tsc+eslint) ผ่านหมด — repo นี้ไม่มี unit test
ให้รัน (`find src -name "*.test.*"` ไม่พบไฟล์เลย)

**สถานะ:** ✅ แก้แล้ว (2026-09-22)

---

## 2. 🟡 `enums.employmentType.Active` ไม่มี i18n key — ข้อมูลจริงมีค่านอก enum ของ schema

**ยืนยันด้วยการอ่านโค้ดจริง + ทดสอบเปิดแอปจริง (Playwright, ล็อกอินเป็น owner):**

- `src/i18n/messages/th.json:446-449` และ `en.json:446-449` — `employmentType` มีแค่ 2 key:
  `full_time` (เต็มเวลา), `part_time` (พาร์ทไทม์)
- backend schema จริงจำกัด enum ไว้แค่ `["full_time", "part_time"]` เช่นกัน
- แต่ผู้ใช้จริงในฐานข้อมูล ("Thanyalak1") มี `employment_type: "Active"` — ค่านี้อยู่**นอก enum ของ
  schema เอง** (แปลว่าแถวนี้ถูกเขียนเข้า DB โดยข้าม validation ปกติ — ที่มาคล้ายกับ BSON Timestamp
  corruption ที่เจอฝั่ง backend คือ "ข้อมูลเก่าที่ไม่ผ่าน schema ปัจจุบัน" ไม่ใช่บั๊กจาก UI ปัจจุบัน)
- ผลคือหน้าที่ต้องแสดงค่านี้ (เช่นหน้ารายชื่อพนักงาน) ได้ `MISSING_MESSAGE: enums.employmentType.Active`
  สำหรับแถวนี้โดยเฉพาะแถวเดียว — หน้าอื่น ๆ ที่ไม่มีข้อมูลเสียแบบนี้ไม่กระทบ

**ยืนยันขอบเขตด้วย DB จริง (read-only aggregate, 2026-09-22):** query นับ `employment_type` ทุกค่าที่มี
อยู่จริงในระบบ (`db.users.aggregate([{$match:{employment_type:{$exists:true}}},{$group...}])`) →
`full_time`: 2 แถว, `Active`: **1 แถว** (ยืนยันว่าเป็นแถวเดียว ไม่ใช่หลายแถว), `null`: 6 แถว — ไม่มี
`part_time` เลยสักแถว แถวที่เสีย = ผู้ใช้ "Thanyalak1" (`thanyalak1.sas@kkumail.com`, `_id`
`6a37bbfcac430f48a7fa13e9`) **role_type = `owner`** (ไม่ใช่ staff) — ดูเหมือนเป็นบัญชีทดสอบเก่าที่หลงเหลือ
จากช่วงพัฒนา (ชื่อ/อีเมลรูปแบบเดียวกับบัญชีทดสอบอื่นในระบบ เช่น `meawmeecake@gmail.com`,
`pehcpring@gmail.com`) ไม่ใช่พนักงานจริงที่ยังใช้งานอยู่

**แก้แล้ว (ทางเลือก ข — UI fallback):** `EmployeesView.tsx` เปลี่ยนจาก
`t(`enums.employmentType.${r.employmentType}`)` ตรง ๆ เป็น `t.has(key) ? t(key) :
t("enums.employmentType.fallback")` (แพทเทิร์นเดียวกับที่ `userLog/UserLogView.tsx` ใช้กัน
`entities.${entity}` ที่ไม่รู้จักอยู่แล้ว) + เพิ่ม key `enums.employmentType.fallback`
("ไม่ระบุ"/"Unspecified") ใน `messages/th.json`/`en.json` — กันพังทั้งแถวถ้าเจอค่านอก enum อีกใน
อนาคต ไม่ต้องรอรู้ค่าที่ถูกต้องก่อนแก้ (เลือกทางนี้เพราะเป็นทางแก้ระยะยาวกว่า และแถวที่เสียดูเหมือน
บัญชีทดสอบที่ไม่มีใครใช้จริง ไม่คุ้มเสี่ยงเดาแก้ข้อมูลเป็นค่าที่อาจผิด)

**ยังไม่แก้ (ตั้งใจ):** ไม่ได้แก้ค่า `employment_type` ของแถวนี้ใน DB ให้เป็น `full_time`/`part_time`
เพราะไม่รู้ค่าที่ถูกต้องจริง และเป็นบัญชีที่ไม่ชัดว่ายังใช้งานจริงไหม — ทางเลือก (ก) เดิม (แก้ DB ตรง ๆ)
รอผู้ใช้ยืนยันก่อนว่าต้องการแก้ไหมและเป็นค่าอะไร

ยืนยันด้วย `npm run check` (i18n+theme+tsc+eslint) ผ่านหมด (exit code 0)

**สถานะ:** ✅ แก้แล้ว (2026-09-22) — เฉพาะฝั่ง UI, DB ยังมีแถวเสียเหมือนเดิม 1 แถว

---

## 3. ✅ `docs/Debug.md`/`docs/OVERVIEW.md` มีรหัสผ่านจริงเปิดเผยอยู่/ยังไม่ commit — แก้แล้ว

**ยืนยันด้วยการอ่านไฟล์จริง:** `docs/Debug.md:37` มีรหัสผ่าน seed ของเจ้าของร้าน (`MeowMee@1234`)
เขียนเป็น plaintext อยู่ในตารางบั๊กที่เคยเจอตอนเชื่อมระบบ — ทั้งไฟล์นี้และ `docs/OVERVIEW.md` เป็น
**untracked** อยู่ในเครื่อง ยังไม่เคย `git add`/`commit` (repo นี้เป็น public บน GitHub)

**แก้แล้ว — ทางเลือก (ก) สำหรับ `Debug.md`:** redact รหัสผ่านเป็น `<REDACTED>` แล้ว commit
(`docs/frontend-backlog`/PR #7, commit `3308b0a`) — ไม่ได้เปลี่ยนรหัสผ่านจริงในระบบ (นั่นทำแยกที่ backend
§12.1 แล้ว: รีเซ็ตรหัสผ่านจริง + ยืนยันด้วย API จริงว่ารหัส seed เดิมใช้ไม่ได้แล้ว)

**แก้แล้ว — `docs/OVERVIEW.md`:** ตรวจแล้วไม่มีรหัสผ่านจริง (มีแค่ credential mock `owner@meowmeecake.local`
/`owner1234` สำหรับ MSW เท่านั้น ไม่เชื่อมระบบจริง — ไม่เสี่ยง) แต่เนื้อหาล้าสมัยเทียบกับสถานะปัจจุบันจริง
(เช่น พอร์ต `:3000`→`:3001`, ยังอธิบายว่าใช้ MSW เป็นหลักทั้งที่เชื่อม backend จริงแล้ว, auth flow เดิมพูดถึง
"401 → refresh → retry" ที่ไม่ตรงกับโค้ดจริงแล้ว) — อัปเดตเนื้อหาให้ตรงกับสถานะจริงแล้ว commit
(`docs/overview-update`, commit `4580efb`)

**สถานะ:** ✅ แก้แล้วทั้งคู่ (2026-09-22)

---

## 4. 🟡 สินค้าทุกตัว (35/35) มี `category_id`/`unit_id` ชี้ไปเอกสารที่ถูกลบไปแล้ว

**พบระหว่างทดสอบหน้า `products/[id]/edit` จริงผ่านเบราว์เซอร์** (Playwright, ล็อกอินจริง) — ช่อง
"หมวดหมู่"/"หน่วยนับ" ในฟอร์มแก้ไขสินค้าว่างเปล่าทั้งที่สินค้ามีข้อมูลจริงอยู่ (ฟิลด์อื่นในฟอร์มเดียวกัน
ขึ้นค่าถูกต้องปกติ เช่น "ประเภทสินค้า" = "หน้าร้าน")

**ยืนยันด้วย DB จริง (read-only):**
- **สินค้าที่ยังไม่ลบทั้ง 35 ตัว (100%) มี `category_id` ชี้ไปที่ `productcategories` ที่ไม่มีอยู่จริงแล้ว**
  (ถูกลบ/สร้างใหม่ระหว่างพัฒนา แต่สินค้าที่ seed ไว้ไม่ได้ผูกรหัสใหม่ตาม)
- 1 ใน 35 ตัว (ชิโอะปัง, ตัวเดียวกับที่เคยพัง `pos-NaNNaN796` ก่อนแก้ BSON Timestamp) มี `unit_id` เสียด้วย
- **มองไม่เห็นในหน้า list/POS** เพราะ `ProductCard.tsx`/POS grid ไม่แสดงชื่อหมวดหมู่ต่อสินค้าเลย (แสดง
  แค่ราคา/สต็อก — filter tab หมวดหมู่ที่เห็นเป็น list หมวดหมู่จริงแยกต่างหาก ไม่ได้ผูกกับสินค้าแต่ละตัว)
  จึงไม่มีใครเจอบั๊กนี้มาก่อน — **โผล่เฉพาะตอนเข้าหน้าแก้ไขสินค้าเท่านั้น** (ซึ่งก่อนหน้านี้ก็ไม่มีทาง
  เข้าถึงได้จาก UI เลย — ดู §6)

**ผลกระทบถ้าบันทึกฟอร์มโดยไม่เลือกหมวดหมู่/หน่วยนับใหม่:** backend ปฏิเสธด้วย `400` (required) เพราะ
`category_id`/`unit_id` เป็น field บังคับจริง — ไม่มีความเสี่ยงข้อมูลเสียหายเงียบ ๆ แต่ประสบการณ์ใช้งานคือ
"ทำไมหมวดหมู่หาย" โดยไม่มีคำอธิบาย

**การตัดสินใจ:** บันทึกไว้ก่อนตามที่ผู้ใช้ขอ — การแก้ต้องรู้ก่อนว่าสินค้าแต่ละตัว "ควรอยู่หมวดไหนจริง"
(เป็นการตัดสินใจเชิงธุรกิจ ไม่ใช่สิ่งที่เดาจากโค้ด/ข้อมูลได้) ตัวเลือกที่เป็นไปได้เมื่อพร้อมแก้:
- (ก) ดูรายชื่อสินค้า + หมวดหมู่ที่มีอยู่จริงตอนนี้ (8 หมวด: ขนมปัง/คัพเค้ก/คุกกี้/เค้กชิ้น/เค้กปอนด์/
  เครื่องดื่ม/ซาวโดว์/อื่นๆ) แล้วจับคู่ใหม่ทีละตัว (เขียนสคริปต์ dry-run ก่อนแบบเดียวกับที่ backend ใช้)
- (ข) เข้าหน้าแก้ไขสินค้าทีละตัวผ่าน UI ที่เพิ่งเพิ่มปุ่มเข้าถึงได้แล้ว (§6) แล้วเลือกหมวดหมู่ใหม่ทีละตัวเอง

**สถานะ:** 🟡 ยังไม่แก้ — บันทึกไว้ก่อนตามที่ผู้ใช้ขอ

---

## 5. ✅ URL รูปภาพเป็น relative path — 404 ข้าม origin เสมอ (product/banner/receipt)

**พบระหว่างสืบสวนข้อ §4** — `ProductCard.tsx`/`BannerCard.tsx`/`FinanceExpensesView.tsx` (ใบเสร็จ)
เรนเดอร์ `<img src={url}>` จาก path ที่ backend คืนมาตรง ๆ โดยไม่เติม origin ก่อน — backend
`localDiskDriver` (`src/lib/upload.ts`) คืน URL แบบ relative เช่น `/uploads/products/xxx.jpg` เสิร์ฟจาก
**backend เอง** (`:3000`) ไม่ใช่ frontend (`:3001`) แม้ตอน dev ก็คนละ origin กันแล้ว ยิ่งจำเป็นตอน deploy
จริงที่เป็นคนละ subdomain กันตามที่ตัดสินใจไว้แล้ว (topology A, ดู backend memory `backend-integration.md`)

เรนเดอร์ path relative ตรง ๆ เป็น `<img src>` browser จะ resolve กับ origin ของ "หน้าเว็บ" (frontend)
ผิดที่เสมอ — ได้ 404 (หรือ `ERR_BLOCKED_BY_ORB` ถ้าลองยิงไป backend origin ตรง ๆ แล้ว backend ตอบ
ไม่มี CORS header ให้)

**ยืนยันว่าไม่เคยมีใครเจอบั๊กนี้มาก่อนเพราะเหตุผลเชิงโครงสร้าง:** ตรวจ DB จริงพบว่า **ไม่มีสินค้าไหนใน
ระบบใช้ path รูปแบบปัจจุบัน (`/uploads/...`) เลยสักตัว** — ของเก่าที่มีอยู่เป็น path แบบ legacy
(`/products/xxx.jpg`, ไม่ตรงกับ driver ปัจจุบันด้วยซ้ำ — ไฟล์จริงก็ไม่มีอยู่บน disk เครื่องนี้แล้วเพราะ
`public/uploads/`/`upload-products/` ถูก gitignore ไว้ถูกต้องแล้ว ไม่ใช่บั๊ก แค่ข้อมูลไม่ได้ตามมาด้วย)
หรือเป็น base64 data URI ยัดตรงในฟิลด์ (banner/receipt ใช้ `UploadImageBox` ซึ่งไม่เคยอัปโหลดไฟล์จริงเลย
ตั้งแต่ต้น — ต่างจาก `ProductImageUpload` ที่อัปโหลดจริง คนละ component กัน) เลยไม่มีทาง trigger บั๊ก
origin-mismatch นี้มาก่อนเพราะยังไม่เคยมี URL รูปแบบที่ถูกต้องปัจจุบันให้ทดสอบจริง ๆ สักตัว

**แก้แล้ว:** เพิ่ม `src/lib/uploads.ts` → `resolveUploadUrl(url)` (เติม backend origin ให้ path ที่ขึ้นต้น
ด้วย `/`, ปล่อยผ่าน URL ที่ absolute อยู่แล้วหรือ `data:` URI เฉย ๆ) ใช้ที่ 4 จุด: `ProductCard.tsx`,
`ProductImageUpload.tsx` (thumbnail preview เท่านั้น — `uid` ยังใช้ path ดิบเหมือนเดิมเพราะ `onRemove`
เทียบกับค่าใน DB), `BannerCard.tsx`, `FinanceExpensesView.tsx` (ทั้ง `href` และ `src`)

ยืนยันด้วยเบราว์เซอร์จริง: request รูปของสินค้าที่มี path legacy เปลี่ยนจากยิงไป
`http://localhost:3001/products/xxx.jpg` (ผิด origin) เป็น `http://localhost:3000/products/xxx.jpg`
(ถูก origin แล้ว) — ยัง fail อยู่เพราะไฟล์จริงไม่มีบน disก (คนละปัญหา ไม่ใช่โค้ดพัง — ดู §4/หมายเหตุ
ด้านบน) ยืนยันด้วย `npm run check` (i18n+theme+tsc+eslint) exit 0

**สถานะ:** ✅ แก้แล้ว (2026-09-22)

---

## 6. ✅ หน้า `products/[id]/edit` ไม่มีปุ่ม/ลิงก์เข้าถึงจาก UI เลย

**ยืนยันด้วยการ grep ทั้งโปรเจกต์:** ไม่เจอ `/edit`/`editProduct` อ้างอิงจากที่ไหนเลยนอกจากตัวไฟล์ของ
route นั้นเอง — หน้ารายการสินค้า (ทั้งมุมมองกริดและตาราง) มีแค่ปุ่ม toggle การแสดงผล + ลบ ไม่มีปุ่มแก้ไข
เลย คนใช้งานจริงเข้าหน้านี้ไม่ได้จาก UI เลยตอนนี้ ต้องพิมพ์ URL เอง (เทียบกับหน้าพนักงานที่มีปุ่ม "แก้ไข"
→ `editEmployee?id=...` ตามปกติ — จุดนี้แค่ตกหล่นไป)

**แก้แล้ว:** เพิ่มปุ่ม "แก้ไข" (`href="/owner/products/${_id}/edit"`, กันด้วย `perm.update` เหมือนปุ่มอื่น)
ทั้ง `ProductCard.tsx` (มุมมองกริด) และ `ProductsView.tsx` (มุมมองตาราง, คู่กับปุ่มลบเดิม)

ยืนยันด้วยเบราว์เซอร์จริง: คลิกปุ่ม "แก้ไข" จากหน้ารายการ → ไปถึงหน้าแก้ไขสินค้าจริงสำเร็จ

**สถานะ:** ✅ แก้แล้ว (2026-09-22)

---

## 7. ✅ POS: ยิงบาร์โค้ดได้จากทุกที่ในหน้าโดยไม่ต้องคลิกช่องกรอกก่อน

**คำขอผู้ใช้:** ทดสอบยิงบาร์โค้ดจริงด้วยเครื่องสแกนจริงแล้วพบว่าต้องคลิกเข้าช่องกรอกก่อนเสมอ (เครื่อง
สแกนจริงมักถูกใช้แบบ "ยิงแล้วใช้ได้เลย" ไม่อยากให้ต้องคลิกเมาส์ก่อนทุกครั้ง)

**แก้แล้ว:** เพิ่ม global `keydown` listener ใน `usePOSViewModel.ts` — capture การพิมพ์/ยิงบาร์โค้ดได้
จากทุกที่ในหน้า ถ้าตอนนั้น focus ไม่ได้อยู่ใน text input อื่นจริง ๆ (ค้นหา/ชื่อลูกค้า/ส่วนลด) ปล่อยให้
input นั้นทำงานตามปกติเสมอ ไม่ hijack การพิมพ์จริงของผู้ใช้

**เจอบั๊กจริง 2 ตัวระหว่างเขียน + ทดสอบเบราว์เซอร์จริง (Playwright):**
1. เช็ค "มี text input โฟกัสอยู่ไหม" แบบเดิมเช็คแค่ `tagName === "INPUT"` — antd เอง (`TypeTabBar`/
   `Segmented`, `Switch`, `Radio`) ใช้ `<input type="radio"/"checkbox">` ที่ซ่อนไว้เป็นตัวรับ focus จริง
   ไม่ใช่ input ที่ผู้ใช้ "พิมพ์" อะไร — แค่คลิก tab หมวดหมู่ก็ทำให้ระบบคิดว่ามี input พิมพ์อยู่แล้ว แล้ว
   ไม่ capture การยิงบาร์โค้ดให้เลย ยืนยันจริง: คลิก tab "ทั้งหมด" แล้วยิงบาร์โค้ด → ช่องกรอกว่างเปล่า
   ไม่มีอะไรถูก capture — แก้ด้วยการเช็คเฉพาะ `<input>` ที่ `type` ไม่ใช่ radio/checkbox/button/submit/
   reset/range/file/color/hidden ถึงจะถือว่าเป็น text input จริง
2. `useEffect` แรกที่เขียนไว้ผูก dependency array กับ `scan` (จาก `useMutation`) ตรง ๆ — `useMutation`
   ไม่การันตี stable reference ข้าม render ทำให้ effect cleanup+re-run ใหม่ทุกครั้งที่ `setScanCode` ทำให้
   re-render (คือทุกตัวอักษรที่พิมพ์เลย) บัฟเฟอร์ที่เก็บตัวอักษรที่พิมพ์มาแล้วถูกรีเซ็ตเป็นค่าว่างใหม่ทุก
   ครั้ง เหลือแค่ตัวอักษรตัวสุดท้ายก่อนกด Enter เท่านั้น (ยิง `pos-2226631` แล้วช่องกรอกเหลือแค่ `"1"`)
   แก้ด้วยการเก็บ `scan.mutate` ผ่าน `ref` (อัปเดตค่าใน effect แยกอีกตัว ห้ามเขียนตรงกลาง render —
   React error "Cannot update ref during render" ถ้าเขียนตรง ๆ) แล้วให้ effect หลัก mount ครั้งเดียว
   (`[]`) อ่านฟังก์ชันล่าสุดผ่าน ref เสมอ

**ยืนยันด้วยเบราว์เซอร์จริง (Playwright) ทั้ง 2 สถานการณ์:**
- คลิก tab หมวดหมู่ (โฟกัสไปที่ radio input ที่ซ่อนไว้) แล้วยิงบาร์โค้ด `pos-2226631` โดยไม่คลิกช่องกรอก
  เลย → ขึ้นค่าถูกต้องในช่องก่อนกด Enter, กด Enter แล้วเพิ่มลงตะกร้าสำเร็จ (฿200)
- คลิกช่องค้นหาสินค้าโดยตั้งใจแล้วพิมพ์ "ชิโอะปัง" → เข้าช่องค้นหาถูกต้อง ช่องยิงบาร์โค้ดยังว่างเปล่า
  ไม่ถูกแย่งพิมพ์

ยืนยันด้วย `npm run check` (i18n+theme+tsc+eslint) exit 0

**สถานะ:** ✅ แก้แล้ว (2026-09-22)

---

## 8. ✅ แบนเนอร์ยังใช้ `UploadImageBox` (base64) — เพิ่ม/แก้แบนเนอร์ด้วยรูปจริงพัง 400 เสมอ (พบ + แก้ 2026-09-23)

ผู้ใช้เจอบั๊กจริงระหว่างทดสอบเพิ่มแบนเนอร์ — backend `banner_img` จำกัดไว้ 1000 ตัวอักษร (พอสำหรับ URL)
แต่ `UploadImageBox` (ที่ `BannerFormModal.tsx` ใช้) เก็บรูปเป็น base64 data URI ตรง ๆ เกินเพดานทุกรูปจริง
— ดูรายละเอียดสาเหตุเต็มที่ backend `docs/BACKLOG2.md` §15

**แก้แล้ว — ย้ายไปอัปโหลดไฟล์จริงเหมือน `ProductImageUpload.tsx` (ผู้ใช้ขอให้แก้ที่ต้นเหตุ):**
- เพิ่ม `bannersService.uploadImage()` (`services/banners.ts`) เรียก `POST /admin/banners/images`
  ใหม่ฝั่ง backend
- เพิ่ม `BannerImageUpload.tsx` (component ใหม่ — เหมือน `ProductImageUpload.tsx` แต่รับรูปเดียว ไม่ใช่
  array) ใช้ `resolveUploadUrl()` (§5) แสดง thumbnail preview ให้ถูก origin เสมอ
- `BannerFormModal.tsx` เปลี่ยนจาก `UploadImageBox` → `BannerImageUpload`
- **ไม่แตะ** `ExpenseFormModal.tsx` (ใบเสร็จ) — ยังใช้ `UploadImageBox`/base64 เหมือนเดิม (นอกขอบเขตที่
  ขอรอบนี้ เป็นบั๊กคลาสเดียวกัน แต่ยังไม่มีใครรายงานว่าเจอปัญหาจริงจากจุดนี้)

**ยืนยันด้วยเบราว์เซอร์จริง:** อัปโหลดรูป JPEG จริงสำเร็จ (`200`, คืน URL จริง), สร้างแบนเนอร์สำเร็จ
(`201`), แทนที่รูปแล้วไฟล์เดิมถูกลบจริงบน disk (backend §15), แบนเนอร์เก่าที่ยังเป็น base64 ยังแสดง
ผลได้ปกติไม่ต้อง migrate ข้อมูลเก่า

ยืนยันด้วย `npm run check` (i18n+theme+tsc+eslint) exit 0

**สถานะ:** ✅ แก้แล้ว (2026-09-23)

---

## 9. ✅ หน้า login ยัง error แบบแถบแดง inline — ไม่ใช่ swal2 เหมือนทุกจุดอื่นในระบบ (พบ + แก้ 2026-09-23)

**ยืนยันด้วยการ grep ทั้งโปรเจกต์:** `src/lib/alert.ts` (ครอบ sweetalert2 — `toast()`/`alert.success/error/
warning/info()`/`confirmAlert()`) ถูกใช้เป็นมาตรฐานเดียวกันทุกหน้าเพิ่ม/แก้/ลบข้อมูลในระบบแล้วจริง (ยืนยัน
ด้วย `grep -rn "window\.confirm\|window\.alert\|message\.\(success\|error\|warning\|info\)\|Modal\.confirm\|
notification\."` ทั้ง `src/` → ไม่พบเลยสักจุด) **ยกเว้นจุดเดียว:** `src/app/login/_components/LoginForm.tsx`
ใช้ `ErrorMessage` (`src/components/base/ErrorMessage.tsx` — แถบแดง inline ธรรมดา ไม่ใช่ popup) แสดง error
ตอนเข้าสู่ระบบไม่สำเร็จ — ตกหล่นจากรอบ port ระบบเดิม (คอมโพเนนต์นี้ไม่มีใครใช้ที่อื่นเลยในระบบ นอกจากที่นี่)

**แก้แล้ว:**
- `LoginForm.tsx` — เปลี่ยนจาก `const [err, setErr] = useState(...)` + `{err && <ErrorMessage>{err}</ErrorMessage>}`
  เป็น `alert.error(isApiError(e2) ? e2.message : t("auth.loginFailed"))` ตรงจุด `catch` เดียวกัน (แพทเทิร์น
  เดียวกับทุกฟอร์มอื่นในระบบ)
- ลบ `src/components/base/ErrorMessage.tsx` + export ใน `src/components/base/index.ts` ทิ้ง (ไม่มีจุดใช้เหลือ
  แล้วหลังแก้ข้อนี้)

**ไม่แตะ:** `?reason=expired`/`?reason=timeout` (ที่ `OwnerLayout.tsx`/`AuthBootstrap.tsx` ต่อท้าย URL ตอน
redirect กลับ `/login` เมื่อ session หมดอายุจริง) — พารามิเตอร์นี้ `LoginForm.tsx` ไม่ได้อ่านมาแสดงเป็น alert
เลยตั้งแต่ต้น (คนละบั๊กกับข้อนี้ ผู้ใช้ไม่ได้ขอให้เพิ่มตอนนี้ — ขอบเขตของข้อนี้คือ style ของ alert ที่มีอยู่
แล้วเท่านั้น ไม่ใช่เพิ่ม alert ใหม่)

ยืนยันด้วย `npm run check` (i18n+theme+tsc+eslint) exit 0

**สถานะ:** ✅ แก้แล้ว (2026-09-23)
