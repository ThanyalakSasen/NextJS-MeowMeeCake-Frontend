# MeowMeeCake Frontend — BACKLOG: บั๊ก/ความเสี่ยงที่พบระหว่างเชื่อมกับ backend จริง

> สร้าง: 2026-09-22 · ขอบเขต: ฝั่ง Frontend (`src/**`) เท่านั้น — เทียบคู่กับ
> [`../NextJS-MeowMeeCake/docs/BACKLOG2.md`](../../NextJS-MeowMeeCake/docs/BACKLOG2.md) ฝั่ง backend
> วิธีตรวจ: อ่านโค้ดจริง + เปิดแอปทดสอบจริงด้วย Playwright (ล็อกอินจริง คลิกทุกหน้าใหม่) + ตรวจ DB จริง
> (read-only) เพื่อยืนยันผลกระทบ — ไม่ใช่รายงานดิบจาก agent (ตามธรรมเนียมเดียวกับ BACKLOG2.md ฝั่ง backend)
>
> **สถานะโดยรวม:** ยังไม่มีข้อไหนแก้ — บันทึกไว้ก่อนตามที่ผู้ใช้ขอ รอสั่งแก้ทีละข้อ

## สถานะโดยรวม

| ข้อ | สถานะ |
|---|---|
| **§1 permission-key ไม่ตรงกับ path-prefix ที่ URL guard ใช้ (pricing/reviews)** | 🟡 พบจริง ยังไม่แก้ (2026-09-22) |
| **§2 `enums.employmentType.Active` ไม่มี i18n key — ข้อมูลจริงในระบบมีค่านอก enum** | 🟡 พบจริง ยังไม่แก้ (2026-09-22) |
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

**ยังไม่ยืนยันผลกระทบกับ DB จริง** (ต้องดูว่ามี role ไหนที่ `products`/`promotions`/`reports` ไม่ตรงกัน
อยู่จริงหรือไม่ — ยังไม่ได้ query)

**ทางเลือกที่เป็นไปได้ (ยังไม่ตัดสินใจ):**
- (ก) เปลี่ยน `ROUTE_MENU_MAP` ให้ 2 เส้นทางนี้ผูกกับ `"products"` แทน (ให้ตรงกับสิทธิ์จริงที่หน้าใช้) —
  แต่จะทำให้ sidebar แสดงเมนู "โปรโมชัน"/"รายงาน" ไม่ตรงกับสิทธิ์ที่ผู้ใช้เห็นในหน้าตั้งค่าสิทธิ์
  (permission matrix UI จะงงว่าทำไม toggle "promotions" ไม่มีผลกับหน้านี้)
- (ข) คงไว้ตามเดิม แต่เพิ่ม tooltip/คำอธิบายในหน้าตั้งค่าสิทธิ์ว่า pricing/reviews ใช้สิทธิ์ `products`
- (ค) เพิ่ม endpoint/permission key แยกที่ backend จริง ๆ (เปลี่ยนโครงสร้าง backend — งานใหญ่กว่า)

**สถานะ:** 🟡 ยังไม่แก้ — บันทึกไว้ก่อนตามที่ผู้ใช้ขอ

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

**ยังไม่ยืนยัน:** มีผู้ใช้แถวอื่นที่ค่าเพี้ยนแบบเดียวกันอีกไหม (ยังไม่ query DB เพื่อนับทั้งหมด)

**ทางเลือกที่เป็นไปได้:**
- (ก) แก้ข้อมูลแถวนี้ตรง ๆ ใน DB (คล้าย fix-bson-timestamp-products.ts ฝั่ง backend) — ต้องรู้ก่อนว่า
  ค่าที่ถูกต้องคือ `full_time` หรือ `part_time`
- (ข) เพิ่ม fallback ใน UI (เช่น `t.has(key) ? t(key) : rawValue`) กันพังทั้งแถวถ้าเจอค่านอก enum อีก
  ในอนาคต — แก้ปัญหาระยะยาวกว่า (ก)

**สถานะ:** 🟡 ยังไม่แก้ — บันทึกไว้ก่อนตามที่ผู้ใช้ขอ

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
