# MeowMeeCake Frontend — BACKLOG: บั๊ก/ความเสี่ยงที่พบระหว่างเชื่อมกับ backend จริง

> สร้าง: 2026-09-22 · ขอบเขต: ฝั่ง Frontend (`src/**`) เท่านั้น — เทียบคู่กับ
> [`../NextJS-MeowMeeCake/docs/BACKLOG2.md`](../../NextJS-MeowMeeCake/docs/BACKLOG2.md) ฝั่ง backend
> วิธีตรวจ: อ่านโค้ดจริง + เปิดแอปทดสอบจริงด้วย Playwright (ล็อกอินจริง คลิกทุกหน้าใหม่) + ตรวจ DB จริง
> (read-only) เพื่อยืนยันผลกระทบ — ไม่ใช่รายงานดิบจาก agent (ตามธรรมเนียมเดียวกับ BACKLOG2.md ฝั่ง backend)
>
> **สถานะโดยรวม:** §1/§2 แก้แล้ว (2026-09-22) · §3 ยังไม่แก้ — รอสั่งแก้ทีละข้อ

## สถานะโดยรวม

| ข้อ | สถานะ |
|---|---|
| **§1 permission-key ไม่ตรงกับ path-prefix ที่ URL guard ใช้ (pricing/reviews)** | ✅ **แก้แล้ว** (2026-09-22) — เลือกทางเลือก (ก): ผูก `"products"` ทั้ง `menu.ts`/`menuKeys.ts` ให้ตรงกับสิทธิ์จริงที่หน้าเช็คอยู่แล้ว |
| **§2 `enums.employmentType.Active` ไม่มี i18n key — ข้อมูลจริงในระบบมีค่านอก enum** | ✅ **แก้แล้ว (ทางเลือก ข — UI fallback)** (2026-09-22) — DB ยังมีแถวเสีย 1 แถวเหมือนเดิม (ตั้งใจไม่แก้ข้อมูล รอผู้ใช้ยืนยันค่าที่ถูกต้อง) |
| **§3 `docs/Debug.md` มีรหัสผ่านจริงเปิดเผยอยู่ ยังไม่ commit** | 🟡 พบจริง ยังไม่ตัดสินใจ (2026-09-22) |

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

## 3. 🟡 `docs/Debug.md` มีรหัสผ่านจริงเปิดเผยอยู่ — ยังไม่ commit

**ยืนยันด้วยการอ่านไฟล์จริง:** `docs/Debug.md:37` มีรหัสผ่าน seed ของเจ้าของร้าน (`MeowMee@1234`)
เขียนเป็น plaintext อยู่ในตารางบั๊กที่เคยเจอตอนเชื่อมระบบ

**สถานะปัจจุบัน:** ไฟล์นี้ (พร้อมกับ `docs/OVERVIEW.md`) เป็น **untracked** อยู่ในเครื่อง ยังไม่เคย
`git add`/`commit` — repo นี้เป็น public บน GitHub ถ้า commit ไปตรง ๆ จะเปิดเผยรหัสผ่านจริงให้คนนอกเห็น
(รหัสผ่านนี้ตรงกับที่ backend §12.1 ก็เจอปัญหาเดียวกัน — เป็นความเสี่ยงคู่กัน 2 repo)

**ทางเลือกที่เป็นไปได้ (รอผู้ใช้ตัดสินใจ):**
- (ก) redact ค่ารหัสผ่านออกจากไฟล์ (เช่นแทนด้วย `<REDACTED>`) แล้ว commit ตามปกติ
- (ข) ใส่ `docs/Debug.md` ใน `.gitignore` แล้วไม่ commit เลย (เก็บไว้ใช้ส่วนตัวเท่านั้น)
- (ค) commit ไปตรง ๆ แล้วค่อยรีเซ็ตรหัสผ่านจริงทันที (ต้องทำคู่กับ backend §12.1 อยู่แล้ว)

**สถานะ:** 🟡 ยังไม่ตัดสินใจ — ต้องทำคู่กับ backend §12.1 (รีเซ็ตรหัสผ่านจริง) ก่อนเปิดระบบให้คนนอกทีม
เข้าถึงได้
