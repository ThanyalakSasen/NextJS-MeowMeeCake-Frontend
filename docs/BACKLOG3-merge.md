# MeowMeeCake Frontend — BACKLOG 3: รวม FrontOffice (หน้าร้าน) + งานตาม backend `main`

> สร้าง: 2026-10-06 · ขอบเขต: ฝั่ง Frontend (`src/**`)
> - repo นี้: `D:\1.2569\FrontEnd\NextJS-MeowMeeCake-Frontend` (branch `feat/storefront-checkout`)
> - FrontOffice (อีกผู้พัฒนา): `C:\Users\KimThanyalak\Downloads\frontend\frontend` (**ไม่ใช่ git repo** · ~47,000 บรรทัด)
> - backend หลัก: `D:\1.2569\MeowMeeCake\NextJS-MeowMeeCake` (branch `main`, `e3fb9bd`)
> - เอกสารคู่ฝั่ง backend: [`customer-backend-merge.md`](../../../MeowMeeCake/NextJS-MeowMeeCake/docs/customer-backend-merge.md) (อ้างเป็น **BE §x.x**)
>
> ก่อนหน้า: [`BACKLOG2.md`](BACKLOG2.md) · **ถัดไป: [`BACKLOG4-merge.md`](BACKLOG4-merge.md)** — งานที่เหลือทั้งหมด (ตรวจ 2026-10-08 เทียบ FrontOffice ทุกหน้า) ดูที่นั่น

## สรุปล่าสุด (2026-10-06)

**ภาพรวม**
- endpoint ที่ frontend เรียก**มีครบทุกเส้น**ใน backend `main` (path + method) · หน่วยเงินใน API ยังเป็น**บาท** → ไม่มีอะไรพังทันที
- backend `main` merge PR #52–#57 แล้ว → ข้อห้าม deploy ใน BACKLOG2 §16.1 หมดไป · deploy พร้อมกันได้ (backend ก่อน) แต่ PR #16–#19 ของ frontend ยังไม่เคยทดสอบกับ backend จริง
- FrontOffice (`Downloads`) copy ทับไม่ได้ — ต่อ backend พอร์ต 4000 + next-auth · เอามาได้แค่ UI / flow / logic หน้าจอ แล้วเขียนชั้น API ใหม่

**ทำแล้วบน branch `feat/storefront-checkout` (ยังไม่ commit)**
- A1–A3: หน้าชำระเงินใช้ QR + กำหนดชำระ 30 นาทีของ backend · ค่าส่งแบบใหม่ (`deliverable`) · ล็อกอินลูกค้าที่ยังไม่ยืนยันอีเมล → ขอลิงก์ใหม่ — **ทดสอบระดับ API ผ่าน 19/19** (backend + MongoDB local)
- B3: หน้า `/login` หน้าตาแบบ FrontOffice + ปุ่ม Google (GIS → `/auth/google`) + ปุ่ม LINE (endpoint ใหม่ใน backend branch `feat/line-login-endpoint` · เทส backend ผ่าน 45 ข้อ) — **รอตั้งค่า Google/LINE แล้วลองด้วยบัญชีจริง**
- เอกสารนี้ (หมวด A–I + แบบฟอร์มสอบถาม)

**ต้องทำต่อ (เรียงตามความสำคัญ)**

| ลำดับ | รหัส | งาน | ระดับ |
|---|---|---|---|
| 1 | A4 | ~~ลบ `src/lib/promptpay.ts`~~ ✅ · คลิกดูหน้าจอจริง · ~~commit~~ (PR #25) | — |
| 2 | B3 | ตั้ง `NEXT_PUBLIC_GOOGLE_CLIENT_ID` + origin ใน Google Console · `LINE_AUTH_*` + Callback URL ใน LINE Console · commit/PR branch backend | — |
| 3 | I1 | ~~เมนูสิทธิ์ `store_info`~~ ✅ | — |
| 4 | I2 | ปุ่มคืนเงิน — ออเดอร์ "ยกเลิก + ชำระแล้ว" ค้างรอโอนคืน | ✅ 2026-10-06 — ป้าย "รอโอนคืน" ในตาราง + แถบเตือนพร้อมปุ่มกรอง · drawer มี `RefundSection` (ยอด · เหตุผลยกเลิก · ปุ่มยืนยันโอนคืน + popup ยืนยัน · ต้องมีสิทธิ์ `payments.approve`) ทั้งออเดอร์และพรีออเดอร์ · **ยังไม่ทดสอบกับ backend จริง** |
| 5 | G1 · G2 | ส่งคำถาม path หน้าออเดอร์ลูกค้า + ทางเข้าโปรไฟล์ (กระทบ 9 เรื่อง) | ⏸ |
| 6 | ~~I4 + E1~~ | ✅ (branch `feat/product-customization` · รอทดสอบกับ backend) — หมวด I เหลือ I8–I11 | — |
| 7 | ~~B1 · B2~~ | ✅ (B1 = PR #28 · B2 = branch `feat/customer-account`) | — |
| 8 | ~~D1 → D2~~ → C3 → D3 → C1 | ~~ประวัติออเดอร์ · ที่อยู่~~ ✅ · checkout เต็ม · พรีออเดอร์ · รายละเอียดสินค้าเต็ม | ▢ |
| 9 | ที่เหลือ | D4–D10 · E2–E6 · I8–I11 | ▢ / ⏸ |

**รอคนอื่น:** backend — F1 แนบสลิปย้อนหลัง · F2 admin API ค่าส่งเว็บ · F3 รีวิว analytics · F4 dashboard รอบพรีออเดอร์ · Q-BE8 เปิดปฏิเสธ `product_stock_quantity` ใน PATCH (frontend พร้อมแล้ว — I12) ·
ทีม — G3 หลังร้านใช้ตัวไหน / ปิดพอร์ต 4000 · ผู้พัฒนา FrontOffice — Q-FO1–4

**ข้อควรระวัง**
- `.env.example` ของ frontend แก้แล้ว (เอา PromptPay ออก ใส่ Google) — **ห้าม** `git checkout -- .env.example`
- ทดสอบใช้ MongoDB local `meowmeecake-test` เท่านั้น (สคริปต์ใน scratchpad ปฏิเสธ DB อื่น) · ระหว่างทดสอบ A3 มีอีเมลยืนยันจริงส่งผ่านบัญชีอีเมลของร้านไป `test.unverified@meowmeecake.test` ~3 ฉบับ (ส่งไม่ถึงใคร · อาจมีอีเมลตีกลับในกล่องผู้ส่ง)

## วิธีใช้เอกสารนี้

- งานแบ่งเป็น **9 หมวด (A–I)** · แต่ละเรื่องมีรหัส (เช่น `C4`) ใช้อ้างใน commit / PR / คำถาม
- ทุกเรื่องมีหัวข้อเดียวกัน: **เป้าหมาย · ไฟล์/ต้นแบบ · API · ขั้นตอน · ขึ้นกับ · คำถาม**
- เรื่องที่ติดคำถาม → ไปกรอกใน **[§แบบฟอร์มสอบถาม](#แบบฟอร์มสอบถาม)** ท้ายเอกสาร (แยกตามคนที่ต้องถาม) แล้วกลับมาอัปเดตสถานะ
- สถานะ: ✅ เสร็จ · 🟡 กำลังทำ · ▢ พร้อมทำ · ⏸ ติดคำถาม/รอคนอื่น · ❌ ไม่ทำ

## กติกาที่ใช้กับทุกเรื่องที่พอร์ตจาก FrontOffice

FrontOffice ต่อ backend พอร์ต 4000 (`/api/customer/*` · `/api/owner/*`) + next-auth จึง **copy ทับไม่ได้** — ทุกหน้าต้อง:

1. เปลี่ยน path เป็น `/shop/*` · `/catalog/*` · `/admin/*` (ตาราง path เก่า → ใหม่: BE §8.9 · §8.14–§8.20)
2. `useSession()` → `useCustomerSession()` · `signIn()` → `login()` ใน `src/lib/authClient.ts`
3. เรียกผ่าน `src/services/shop*.ts` (axios `http.ts`) แทน `apiFetch` — แกะ `data` / `data.items` ของ envelope `{ success, data }`
4. หน้าร้าน (`/customer`) ยกเว้น check-i18n ได้ · หลังร้าน (`/owner`) ต้อง MVVM + i18n + `base/` ให้ผ่าน `npm run check`

---

## สารบัญงาน

| หมวด | เรื่อง | จำนวน | สถานะรวม |
|---|---|---|---|
| [A](#a-งานที่เสร็จแล้วบน-branch-นี้) | งานที่เสร็จแล้วบน branch นี้ | 4 | ✅ (A4 เหลือคลิกดูหน้าจอจริง) |
| [B](#b-พื้นฐานที่ต้องมีก่อน) | พื้นฐานที่ต้องมีก่อน (บัญชี · ล็อกอิน) | 3 | ▢ / ⏸ (หน้า login ยกหน้าตาแล้ว) |
| [C](#c-หน้าร้าน--เสริมหน้าที่มีอยู่แล้ว) | หน้าร้าน — เสริมหน้าที่มีอยู่แล้ว | 4 | ▢ |
| [D](#d-หน้าร้าน--หน้าใหม่) | หน้าร้าน — หน้าใหม่ | 10 | ▢ / ⏸ |
| [E](#e-หลังร้าน--หน้าใหม่) | หลังร้าน — หน้าใหม่ | 6 | ▢ / ⏸ |
| [F](#f-ต้องขอ-backend-ก่อน) | ต้องขอ backend ก่อน | 4 | ⏸ |
| [G](#g-ตัดสินใจทีม) | ตัดสินใจทีม | 3 | ⏸ |
| [H](#h-ไม่ทำ-ตัดสินแล้ว) | ไม่ทำ (ตัดสินแล้ว) | 6 | ❌ |
| [I](#i-แก้ตาม-backend-main-ตรวจ-2026-10-06) | แก้ตาม backend `main` (ไม่เกี่ยวกับ FrontOffice โดยตรง) | 15 | ✅ 9 · 🟡 1 (I3) · ▢ 3 (I8–I10) · ⏸ 2 (I11 · I15) — ตรวจ 2026-10-08 |

**ลำดับที่แนะนำ:** A4 → I1 · I2 (🔴) → G1 · G2 (ถามก่อน เพราะกระทบหลายเรื่อง) → I3–I7 → B1 → B2 → D1 → D2 → C3 → D3 → C1 → ที่เหลือ

---

## A. งานที่เสร็จแล้วบน branch นี้

> แก้ 2026-10-06 · ผ่าน `npm run check` · **ยังไม่ commit**
>
> **ทดสอบ 2026-10-06 — ผ่าน 19/19 ระดับ API** กับ backend `main` + MongoDB local (`meowmeecake-test` · ไม่ใช่ Atlas):
> ยิง API ตามลำดับเดียวกับหน้าเว็บแล้วเช็คค่าที่หน้าเว็บใช้แสดงผล (A3 ×5 · A2 ×5 · A1 ×9 รวมหมดเวลา/เปิดกลับ/ช่องโหว่ F1) ·
> หน้า `/login` `/customer/cart` `/customer/checkout` `/customer/order/[id]` คอมไพล์และเปิดได้ (200) ·
> **ยังไม่ได้คลิกดูหน้าจอในเบราว์เซอร์** (popup · นับถอยหลัง · ข้อความ) · ข้อสังเกต: `account_name` ว่างเมื่อใช้ env `PROMPTPAY_ID`
> (ชื่อบัญชีมาจาก StoreProfile เท่านั้น — หน้าเว็บซ่อนบรรทัดชื่อบัญชีให้แล้ว)

### A1 ✅ QR พร้อมเพย์ + กำหนดชำระ 30 นาที ใช้ของ backend
- **เป้าหมาย:** เลิกสร้าง QR ที่ frontend · มีนับถอยหลัง · แนบสลิปหลังหมดเวลาเพื่อเปิดออเดอร์กลับ
- **ไฟล์:** `src/services/shopPayments.ts` (`orderPaymentPage`) · `src/app/customer/order/[id]/page.tsx` · `src/app/customer/lib/shopQueries.ts`
- **API:** `GET /shop/orders/:id/payment` (BE §8.8)
- **ข้อจำกัด:** ลูกค้าที่ไม่เคยส่งสลิปก่อนหมดเวลา เปิดออเดอร์กลับเองไม่ได้ → [F1](#f1--แนบสลิปย้อนหลังเมื่อยังไม่มีรายการชำระเงิน)

### A2 ✅ `delivery-quote` แบบใหม่
- **ไฟล์:** `src/services/shopOrders.ts` (`DeliveryQuote`) · `src/app/customer/checkout/page.tsx`
- **ผล:** จังหวัดที่ส่งไม่ได้ (`deliverable: false`) → แสดง `message` + ปิดปุ่มสั่งซื้อ · ลบ "ส่งฟรีเมื่อซื้อครบ…" (BE §8.7)

### A3 ✅ ลูกค้าต้องยืนยันอีเมลก่อนล็อกอิน
- **ไฟล์:** `src/types/api.ts` (`ApiError.reason`) · `src/lib/http.ts` · `src/lib/authClient.ts` (`resendVerification` · `register`) · `src/app/login/_components/LoginForm.tsx` · i18n `auth.emailNotVerified*` / `auth.resendVerification*`
- **ผล:** 403 `EMAIL_NOT_VERIFIED` → popup + ปุ่มส่งลิงก์ยืนยันใหม่ (BE §8.9)

### A4 🟡 เก็บกวาดที่ต้องทำเอง (ระบบไม่อนุญาตให้ลบไฟล์ระหว่างแก้) — เหลือคลิกดูหน้าจอจริง
- [x] ลบ `src/lib/promptpay.ts` (ไม่มีใครเรียกแล้ว) — ตรวจ 2026-10-08: ไม่มีไฟล์แล้ว
- [x] เอา `NEXT_PUBLIC_PROMPTPAY_*` ออกจาก `.env.example` แล้ว (แทนด้วย `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ของ B3 — **ห้าม** `git checkout` ไฟล์นี้แล้ว)
- [ ] **อย่า**ลบ `qrcode` จาก `package.json` — POS `QRPaymentModal` ยังใช้
- [x] ทดสอบ A1–A3 ระดับ API กับ backend + DB local (19/19)
- [ ] คลิกดูหน้าจอจริงในเบราว์เซอร์ (popup ยืนยันอีเมล · นับถอยหลัง · กล่องข้อความแต่ละสถานะ) แล้ว commit

---

## B. พื้นฐานที่ต้องมีก่อน

### B1 ✅ หน้าสมัคร · ยืนยันอีเมล · ลืมรหัสผ่าน · ตั้งรหัสใหม่ (2026-10-06 · branch `feat/account-pages`)
- **ยกจาก FrontOffice:** `src/app/register/page.jsx` · `customer/verify-email` · `customer/forgot-password` (โหมด guest) · `customer/reset-password` — เปลี่ยนชั้น API เป็น `authClient` ของ repo นี้
- **`/register`** (MVVM + i18n · พื้นหลังเดียวกับ `/login` ผ่าน `AuthBackdrop` ที่แยกออกมาใช้ร่วม): ชื่อ · อีเมล · วันเกิด (วัน/เดือน/ปี ค.ศ.) · เบอร์ · รหัสผ่าน · ประวัติแพ้อาหาร (`/catalog/ingredients`) → `POST /auth/register` → หน้า "ตรวจอีเมล" + ปุ่มส่งลิงก์อีกครั้ง (backend ไม่ล็อกอินให้)
- **`/customer/verify-email?token=`**: `GET /auth/verify-email` (เดิม FrontOffice `/api/user/verify-email`) · กันยิงซ้ำด้วย ref (dev เรียก effect 2 รอบ → token ใช้แล้ว = ขึ้น "หมดอายุ") · สำเร็จ → ไปหน้า login (ต่างจาก FrontOffice ที่ไป `/customer` — backend ไม่ล็อกอินให้)
- **`/customer/forgot-password`** → `POST /auth/forgot-password` · ล็อกอินอยู่ = เติมอีเมลให้ (โหมด "เปลี่ยนรหัสผ่าน" + เมนูบัญชี → B2)
- **`/customer/reset-password?token=`** → เช็คลิงก์ `GET` ก่อนแสดงฟอร์ม · `POST { token, newPassword }` · ลิงก์ใช้ไม่ได้ = ปุ่ม "ขอลิงก์ใหม่"
- **ทดสอบ 14/14** กับ backend จริง + **SMTP ปลอมบนเครื่อง** (อ่านลิงก์จากอีเมลจริง ไม่มีอีเมลส่งออก): สมัคร → อีเมลมีลิงก์ → ก่อนยืนยันล็อกอินไม่ได้ → ยืนยัน → ใช้ token ซ้ำ 400 → ล็อกอินได้ · บันทึกเบอร์/วันเกิด · อีเมลซ้ำ 409 · ลืมรหัส → ลิงก์ → ตั้งใหม่ → รหัสเดิมเข้าไม่ได้/ใหม่เข้าได้ · ลิงก์ใช้ซ้ำไม่ได้ · อีเมลที่ไม่มีตอบเหมือนเดิม · ทุกหน้า 200
- ยังไม่ได้ทดสอบ: บันทึกอาหารที่แพ้ (DB ทดสอบไม่มีวัตถุดิบ) · คลิกหน้าจอจริง

### B2 ✅ บัญชีของฉัน · เปลี่ยนรหัสผ่าน · ผูก LINE · อีเมลของบัญชี LINE (2026-10-06 · branch `feat/customer-account` ต่อจาก B1)
- **path:** `/customer/account` ตาม FrontOffice (ตัดสิน **G2** = ทางนี้ — ลิงก์แจ้งเตือนของ backend ก็อยู่ใต้ `/customer/account/...`) · `/profile` เดิมคงไว้ให้พนักงาน
- **`/customer/account`** (ยกจาก `customer/account/page.tsx` + `LineConnectCard` + `line-welcome`): ข้อมูลส่วนตัว + หน้าต่างแก้ (ชื่อ · เบอร์ · วันเกิด → `PATCH /shop/me` · อีเมลแก้ไม่ได้) · LINE (ผูก/ยกเลิก `/shop/me/line` · บัญชีที่สมัครด้วย LINE ไม่มีปุ่มยกเลิก) · อาหารที่แพ้ (เพิ่ม/ลบ บันทึกทันที) · บัญชี LINE ที่ไม่มีอีเมล → กล่องกรอกอีเมลจริง (`POST /shop/me/email` + ลิงก์ยืนยัน · ส่งลิงก์ซ้ำได้)
- **`/customer/changepassword`**: เปลี่ยนด้วยรหัสเดิม `PATCH /shop/me/password` (FrontOffice ทำผ่านลิงก์อีเมลเพราะ backend เดิมไม่มี API) + ลิงก์ "ลืมรหัสผ่านปัจจุบัน?" → `/customer/forgot-password` · บัญชี Google/LINE แสดงคำอธิบายแทนฟอร์ม
- **เมนูบัญชี** `AccountSideMenu` (ข้อมูลส่วนตัว · เปลี่ยนรหัสผ่าน · ออกจากระบบ) — เมนูอื่นของต้นแบบเพิ่มตามหมวด D
- **LINE:** backend ส่งกลับ `/profile` หลังผูก (`LINE_LINK_RETURN_URL` ค่าเดียว) → `/profile` ส่งลูกค้าต่อมา `/customer/account?line=` · ล็อกอินด้วย LINE แล้วยังเป็นอีเมลชั่วคราว → `/login/line` พามาหน้าบัญชีให้กรอกอีเมล (แทน `line-welcome`)
- **ทดสอบ 12/12** กับ backend จริง (+ บัญชี LINE จำลองด้วย `authService.loginWithLine` บน DB local · SMTP ปลอม): โปรไฟล์ · แก้ข้อมูล · อาหารที่แพ้ · เบอร์ผิด 400 · สถานะ/ลิงก์ผูก LINE · รหัสเดิมผิด 400 · เปลี่ยนรหัส (รหัสเดิม 401 / ใหม่ 200 / เครื่องนี้ได้ cookie ใหม่ / session เก่าหลุด) · บัญชี LINE: needs_email · เปลี่ยนรหัสไม่ได้ · ตั้งอีเมลจริง → รอยืนยัน · อีเมลซ้ำ 409 · หน้า 200
- **ยังไม่ได้ทดสอบ:** ผูก LINE ด้วยบัญชีจริง · คลิกหน้าจอจริง · ส่งต่อจาก `/profile` (เกิดฝั่งเบราว์เซอร์)
- **ไม่ยกมา:** บัญชีพร้อมเพย์รับเงินคืน — backend ยังไม่มี `refund_promptpay_id/name` ([Q-BE12](#ถาม-backend))

### B3 🟡 หน้า login แบบ FrontOffice + เข้าสู่ระบบด้วย Google / LINE (โค้ดเสร็จ 2026-10-06 · รอตั้งค่า + ทดสอบด้วยบัญชีจริง)
- **หน้าตา:** ยกจาก `src/app/login/page.jsx` ของ FrontOffice — ภาพพื้นหลัง (`public/login.png`) · การ์ดโปร่ง/ขาว · แม่กุญแจ · ปุ่มเด้ง · ลิงก์ลืมรหัส/สมัคร · ปุ่ม Google + LINE
- **Google:** `GoogleLoginButton.tsx` — Google Identity Services (ปุ่มที่ Google วาด ธีม outline) → `POST /auth/google { credential }` → cookie `session`
- **LINE (endpoint ใหม่ใน backend — branch `feat/line-login-endpoint` ยังไม่ commit):** ปุ่มพาเบราว์เซอร์ไป `GET /api/auth/line?next=` → หน้ายินยอม LINE →
  `GET /api/auth/line/callback` (state ผูก nonce ใน cookie กัน login CSRF · `oauthService.signInWithLine` · ตั้ง cookie `session`) → กลับ `/login/line` ของ frontend → ไปหน้าตาม role
  · ใช้ `/login/line` แทน `/login` เพราะ `proxy.ts` เด้ง `/login` ที่มี cookie แล้วไปแดชบอร์ด
- **ทดสอบแล้ว:** backend unit 27 + integration 18 ผ่าน · ยิงจริงกับ backend local: เริ่ม flow ได้ 307 ไป LINE (scope `openid profile email` + cookie nonce) · `next=//evil.com` ถูกตัด · กดยกเลิก → `?line=cancelled` · state ปลอม → `?error=` · `/auth/google` ต่อถึง (token ปลอม → 400) · frontend `npm run check` ผ่าน
- **ยังไม่ได้ทดสอบ:** กดล็อกอินจริงด้วยบัญชี Google / LINE (ต้องตั้งค่าข้างล่างก่อน)
- **ต้องตั้งค่าเอง:**
  - [ ] frontend `.env.local`: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = ค่าเดียวกับ `GOOGLE_CLIENT_ID` ของ backend
  - [ ] Google Cloud Console → OAuth client → Authorized JavaScript origins เพิ่ม `http://localhost:3001` (+ โดเมนจริงตอน deploy)
  - [ ] backend `.env.local`: `LINE_AUTH_CALLBACK_URL=http://localhost:3000/api/auth/line/callback` · `LINE_AUTH_RETURN_URL=http://localhost:3001/login/line`
  - [ ] LINE Developers Console → LINE Login channel → Callback URL เพิ่ม `http://localhost:3000/api/auth/line/callback` (คนละ URL กับการผูก LINE)
- **ข้อจำกัด:** บัญชี LINE ใหม่ที่ไม่ให้อีเมล → backend ตั้งอีเมลชั่วคราว `*@line-user.invalid` · FrontOffice มีหน้า `customer/line-welcome` ให้กรอกอีเมลจริง (`/shop/me/email`) — repo นี้ยังไม่มี (รวมกับ B2)
- **ไม่ยกมา (ตัดสินแล้ว):** วิดีโอห้องอบขนมตอนกดเข้าสู่ระบบ (`PreloaderOverlay` + `Preloader.mp4`) · ม่านขนมตอน logout (`LogoutCurtain`)
- ✅ ลิงก์ "ลืมรหัสผ่าน?" และ "สมัครสมาชิก" ใช้ได้แล้ว (B1)

---

## C. หน้าร้าน — เสริมหน้าที่มีอยู่แล้ว

### C1 ▢ รายละเอียดสินค้า: ตัวเลือก/ออปชัน · รีวิว · สินค้าคล้าย · สารก่อภูมิแพ้
- **ไฟล์ของเรา:** `src/app/customer/product/[id]/page.tsx` · `hooks/useAddToCart.ts` · `services/shopCart.ts`
- **ต้นแบบ:** `ProductDetailClient.tsx` (1,108) · `ProductCustomizationPicker.tsx`
- **API:** `/catalog/products/:id/customization` · `/reviews` (+`summary`) · `/similar` · `/sentiment` · `/catalog/ingredients` · ตะกร้ารับ `variant_ids[]` + `selected_options` (BE §8.3)
- **ขั้นตอน:** (1) ตัวเลือกในหน้า + ส่งตะกร้า (2) แสดงตัวเลือกในตะกร้า/checkout/ออเดอร์ (3) รีวิว (4) สินค้าคล้าย + สารก่อภูมิแพ้

### C2 ✅ หน้าแรก: สินค้าแนะนำ (2026-10-09 — ดู [BACKLOG4 C2](BACKLOG4-merge.md#3-หน้าร้าน--เติม-ui-ในหน้าที่มีแล้ว))
- **ต้นแบบ:** `HomeRecommendations.tsx` · **API:** `/catalog/products/recommended` · `/shop/recommendations` (BE §8.15)

### C3 ✅ checkout: จุดรับสินค้า · คูปองส่วนตัว · ใช้แต้ม (2026-10-08 · branch `feat/checkout-full` · ทดสอบกับ backend 39/39 — รายละเอียด + ข้อควรระวังก่อน deploy ดู [BACKLOG4 §1.1](BACKLOG4-merge.md#11--c3-checkout-จุดรับสินค้า--คูปองของฉัน--ใช้แต้ม-branch-featcheckout-full--ทดสอบ--commit-2026-10-08))
- **ทำแล้ว:** `checkout/_components/` `PickupLocationPicker` (จุด + วันจาก `order_pickup_dates` · มีจุดเปิดอยู่ = บังคับเลือก · ไม่มีเลย = รับที่ร้านแบบเดิม) · `CouponSelectBox` (เลือก 1 ใบ · ล้างโค้ดส่วนลด และกลับกัน · ใช้ไม่ได้ = ไม่ส่ง) · `PointsRedeemBox` (ปัดทีละ 10 · ตัดลงเมื่อเพดานลด) · services `pickupLocations.ts` `shopLoyalty.ts` · สั่งซื้อแล้ว/ล้มเหลว → โหลดแต้ม/คูปองใหม่
- **ฐานคิดแต้ม** = ยอดสินค้า − min(ส่วนลดคูปอง/โค้ด, ยอดสินค้า) ตาม backend `orderService` จริง — คูปอง/โค้ด**ส่งฟรี**ก็ลดฐานด้วย (comment ใน backend บอกว่า "ส่วนลดส่งฟรีไม่ลดฐาน" แต่โค้ดไม่ได้แยก · FrontOffice หักแค่ส่วนลดสินค้า) → ถาม backend ว่าตั้งใจแบบไหน
- **ไฟล์ของเรา:** `src/app/customer/checkout/page.tsx`
- **ต้นแบบ:** `customer/checkout/page.tsx` (843) · `PickupLocationPicker` · `CouponSelectBox` · `PointsRedeemBox`
- **API:** `/catalog/pickup-locations` → ส่ง `pickup_location_id` + `pickup_date` · `/shop/coupons` (+`check`) · `/shop/points` (BE §8.7 · §8.11)
- **กติกา:** คูปองส่วนตัว **หรือ** โค้ด อย่างใดอย่างหนึ่ง + ใช้แต้มร่วมได้ (≤ 30% ของยอดสินค้า · ขั้นต่ำ 100 แต้ม)
- **ขึ้นกับ:** D5 (หน้าแต้ม/คูปอง) ไม่บังคับ

### C4 ✅ หน้าออเดอร์: ยกเลิกออเดอร์ (2026-10-07 · ทำพร้อม D1 · ทดสอบแล้ว)
- **API:** `POST /shop/orders/:id/cancel` — pending/confirmed เท่านั้น · ชำระแล้วก็ยกเลิกได้ = รอร้านโอนคืน (BE §8.8)
- **ขึ้นกับ:** G1 (หน้าออเดอร์อยู่ path ไหน)

---

## D. หน้าร้าน — หน้าใหม่

| รหัส | หน้า | ต้นแบบ FrontOffice | API | ขึ้นกับ | สถานะ |
|---|---|---|---|---|---|
| D1 | ประวัติคำสั่งซื้อ | `account/purchases` (+`[id]`) | `/shop/orders` (กรองสถานะ + แบ่งหน้าที่ server) · `/shop/orders/:id` | — | ✅ 2026-10-07 (branch `feat/purchases`) — รายการ + รายละเอียด (ย้ายหน้าออเดอร์เดิมมา · `/customer/order/[id]` redirect) · ทดสอบ 11/11 · ไม่มีรูปสินค้า/ปุ่มรีวิว (Q-BE13 · D7) |
| D2 | สมุดที่อยู่ | `account/address` (541) | `/shop/addresses` (+`:id`, `:id/default`) | B2 | ✅ 2026-10-07 (branch `feat/address-book`) — รายการ · เพิ่ม/แก้ (modal) · ตั้งค่าเริ่มต้น · ลบ (ยืนยันก่อน) · เมนู "ที่อยู่" ใน AccountSideMenu · cache ร่วมกับ checkout · ทดสอบ 8/8 · **ไม่มีชื่อ/เบอร์ผู้รับ** (backend หลักไม่เก็บในที่อยู่ — กรอกตอน checkout) |
| D3 | พรีออเดอร์ทั้ง flow | `preorder/*` · `account/preorders/*` (~2,700 บรรทัด) | `/catalog/preorder-rounds` (+`:id`) · `/shop/preorders` (+`cancel`, `payment`) · `delivery-quote` ส่ง `product_ids` | G1 · C1 | ✅ 2026-10-09 — ดู [BACKLOG4 D3](BACKLOG4-merge.md#2-หน้าร้าน--หน้าที่ยังไม่มี) |
| D4 | แต้มสะสม · คูปอง · แชร์แต้ม | `account/member` (567) | `/shop/points` (+`share`) · `/shop/coupons` (+`check`, `redeem`) | B2 | ✅ 2026-10-08 — ดู [BACKLOG4 D4](BACKLOG4-merge.md#2-หน้าร้าน--หน้าที่ยังไม่มี) |
| D5 | รายการโปรด | `account/favorites` | `/shop/favorites` (`data.items`) | B2 | ✅ 2026-10-08 — ดู [BACKLOG4 D5](BACKLOG4-merge.md#2-หน้าร้าน--หน้าที่ยังไม่มี) |
| D6 | กระดิ่งแจ้งเตือน | `account/notifications` · `CustomerNotifications` | `/shop/notifications` (+`:id`) → `{ items, unread_count }` | G1 (ลิงก์ในแจ้งเตือน) | ✅ 2026-10-09 — ดู [BACKLOG4 D6](BACKLOG4-merge.md#2-หน้าร้าน--หน้าที่ยังไม่มี) |
| D7 | เขียนรีวิว + รูป/วิดีโอ | `account/pendingreview/[id]` (705) | `/shop/reviews` · `/shop/reviews/upload` · `/catalog/review-aspects` | D1 | ✅ 2026-10-09 — ดู [BACKLOG4 D7](BACKLOG4-merge.md#2-หน้าร้าน--หน้าที่ยังไม่มี) |
| D8 | ติดต่อร้าน | `contact-us` | `/shop/contact` · `/catalog/contact-topics` | — | ✅ 2026-10-09 — ดู [BACKLOG4 D8](BACKLOG4-merge.md#2-หน้าร้าน--หน้าที่ยังไม่มี) |
| D9 | ตารางค่าส่ง · ข้อมูลร้าน | `shipping` · `StoreLogo` | `/catalog/shipping-zones` · `/catalog/store-info` · `/catalog/store-logo` | — | ✅ 2026-10-09 — ดู [BACKLOG4 D9](BACKLOG4-merge.md#2-หน้าร้าน--หน้าที่ยังไม่มี) |
| D10 | ลิงก์ชำระเงินใช้ครั้งเดียว | `customer/payment` | `/shop/payment-link` (+`redeem`) | G1 · Q-FO2 | ⏸ |

**หมายเหตุ D3:** พรีออเดอร์ใช้กติกาของ backend หลัก (กำหนดชำระ + ยกเลิกอัตโนมัติ · ไม่ใช่ 30 นาที) · หน้าชำระเงินใช้ `GET /shop/preorders/:id/payment` แบบเดียวกับ A1

---

## E. หลังร้าน — หน้าใหม่

> เขียนใหม่แบบ MVVM โดยดู UI ของ FrontOffice · ไม่เอาโค้ดมาตรง ๆ

| รหัส | หน้า | ต้นแบบ | API | หมายเหตุ | สถานะ |
|---|---|---|---|---|---|
| E1 | กลุ่มตัวเลือกสินค้า + POS | `ProductCustomizationEditor.tsx` | `GET/PUT /admin/products/:id/customization` · `pos/scan` คืน `customization` | แทน BACKLOG2 §6 · POS ต้องส่ง `variant_ids` (BE §8.3) | ✅ 2026-10-06 (PR #27 · `a53114b`) — ตัวแก้กลุ่มตัวเลือกในหน้าแก้สินค้า · ทดสอบกับ backend แล้ว (ดู "ผลทดสอบ PR #25–#27") |
| E2 | ข้อมูลร้าน (ที่อยู่ · พิกัด · ตลาดนัด · แผนที่ · โลโก้ · พร้อมเพย์) | `owner/store-info/*` | `/admin/store-profile` · `/admin/store-settings` · `/admin/weekly-markets` · `/admin/map-link` | เมนูใหม่ `store_info` · เลขพร้อมเพย์ของ A1 ตั้งที่นี่ (BE §8.19) | ✅ 2026-10-09 — ดู [BACKLOG4 E2](BACKLOG4-merge.md#4-หลังร้าน--หน้าที่ยังไม่มี) |
| E3 | คำค้นเทียบเคียง | `products/search-synonyms` | `/admin/search-synonyms` (+`:id`) | สิทธิ์ `products` (BE §8.16) | ✅ 2026-10-09 — ดู [BACKLOG4 E3](BACKLOG4-merge.md#4-หลังร้าน--หน้าที่ยังไม่มี) |
| E4 | จัดการรีวิวขั้นสูง | `reports/reviews/*` | `/admin/reviews/bulk` · `filter-options` · `:id/visibility` · `:id/sentiment` · `/admin/aspects/reorder` · `/admin/semantic-terms` | ไม่รวม analytics → F3 | ✅ 2026-10-09 — ดู [BACKLOG4 E4](BACKLOG4-merge.md#4-หลังร้าน--หน้าที่ยังไม่มี) |
| E5 | ออเดอร์พร้อมส่ง | `orders/readyReders` | `/admin/orders?order_status=ready` | อาจทำเป็นตัวกรองในหน้า `manageOrders` แทน | ✅ 2026-10-09 — ดู [BACKLOG4 E5](BACKLOG4-merge.md#4-หลังร้าน--หน้าที่ยังไม่มี) |
| E6 | ตัวกรองหมวด "ลูกค้า" ในแจ้งเตือน | — | `/admin/notifications?module=customer` | BE §8.17 · งานเล็ก | ✅ (PR #25 · `0f2f936`) — หมวด "ข้อความลูกค้า" ในตัวกรองหน้าประวัติแจ้งเตือน |

---

### E1 + I4 — กลุ่มตัวเลือกสินค้า (หลังร้าน) + เลือกตัวเลือกใน POS (วางแผน + ทำแล้ว 2026-10-06 · รอทดสอบกับ backend)

**ทำไมต้องทำ:** backend เลิกระบบตัวเลือกแบบมีสต็อกแยก (Y9) แล้วเปลี่ยนเป็น **กลุ่มตัวเลือกบวกราคา** (BE §8.3) — ตอนนี้ frontend
(1) ตั้งกลุ่มตัวเลือกให้สินค้าไม่ได้เลย และ (2) POS ไม่ส่ง `variant_ids` / `selected_options` → ถ้าสินค้ามีกลุ่ม "บังคับเลือก"
(ตั้งจากหลังร้านฝั่ง FrontOffice พอร์ต 4000 หรือหน้าเว็บลูกค้า) **ขายใน POS ได้ 400** ("กรุณาเลือก … ของ …")

**สัญญา API (backend `productCustomizationService.ts`)**
- `GET /admin/products/:id/customization` (products.view) → `{ groups: [{ _id, group_name, min_select, max_select, variants: [{ _id, variant_name, variant_price }] }], options: [{ _id, option_name, is_text_input, max_text_length, extra_price, is_required }] }`
- `PUT` (products.update) ส่ง**ทั้งชุด**: มี `_id` = แก้ · ไม่มี = เพิ่ม · หายไป = ลบ · `min_select` 0 = ไม่บังคับ · `variant_price` / `extra_price` = ราคาที่**บวกเพิ่ม**
- ตัวเลือกเก่าที่ไม่มีกลุ่ม → backend รวมเป็นกลุ่ม `_id: "legacy"` ชื่อ "ตัวเลือก" เลือก 1 (บังคับ)
- `GET /admin/pos/scan` คืน `customization` เพิ่ม · `variants[]` **ไม่มี `variant_stock` แล้ว** (สต็อกอยู่ที่ตัวสินค้าอย่างเดียว)
- รายการออเดอร์ (`POST /admin/orders` items[]) รับ `variant_ids: string[]` + `selected_options: [{ option_id, text_value? }]` · backend ตรวจ min/max · ออปชันบังคับ · ความยาวข้อความ แล้วคิดราคาเอง
- ⚠️ `GET /admin/products` (รายการ) **ไม่บอกว่าสินค้าไหนมีกลุ่มตัวเลือก** → POS ต้องถามทีละสินค้า (ดู Q-BE9)

**E1 — หน้าแก้สินค้า: ตัวแก้กลุ่มตัวเลือก**

| ขั้น | งาน | ไฟล์ |
|---|---|---|
| 1 | type + service: `ProductCustomization` · `productCustomizationService.get/save` | ใหม่ `types/productCustomization.ts` · `services/productCustomization.ts` |
| 2 | ViewModel: โหลดชุดปัจจุบัน · แก้ในหน่วยความจำ · บันทึกทั้งชุดด้วย PUT · ตรวจก่อนส่ง (ชื่อไม่ว่าง · `0 ≤ min ≤ max` · `max ≥ 1` · ราคา ≥ 0 · กลุ่มต้องมีตัวเลือก ≥ max) | ใหม่ `products/[id]/edit/useCustomizationEditor.ts` |
| 3 | UI: การ์ด "ตัวเลือกสินค้า" ในหน้าแก้สินค้า — รายการกลุ่ม (ชื่อ · บังคับ/ไม่บังคับ · เลือกได้สูงสุด · ตัวเลือก + ราคาบวกเพิ่ม · เพิ่ม/ลบ/เรียง) + รายการออปชันเสริม (ชื่อ · ช่องกรอกข้อความ/ติ๊ก · ความยาวสูงสุด · ราคาบวกเพิ่ม · บังคับ) · ปุ่มบันทึกแยกจากฟอร์มสินค้า (คนละ endpoint) | ใหม่ `products/[id]/edit/_components/CustomizationEditor.tsx` (+ `GroupEditor` · `OptionEditor`) · `EditProductView.tsx` |
| 4 | ต้นแบบหน้าตา: FrontOffice `src/app/components/products/ProductCustomizationEditor.tsx` (ยก UX มา เขียนใหม่แบบ MVVM + i18n) | — |
| 5 | สิทธิ์: ดู = `products.view` · แก้ = `products.update` · กลุ่ม `legacy` แสดงได้ แต่ตอนบันทึกต้องส่งตัวเลือกเดิมกลับไปในกลุ่มใหม่ (backend สร้างกลุ่มจริงให้) | — |

**I4 — POS: เลือกตัวเลือกก่อนลงบิล**

| ขั้น | งาน | ไฟล์ |
|---|---|---|
| 1 | `types/pos.ts`: เพิ่ม `customization` · ตัด `variant_stock` | `types/pos.ts` · `services/pos.ts` |
| 2 | ตะกร้า: บรรทัดใหม่มี `variantIds` · `options` · `extraPrice` · `label` (ข้อความตัวเลือก) · **key ของบรรทัด = สินค้า + ชุดตัวเลือก** (สินค้าเดียวกันคนละตัวเลือก = คนละบรรทัด) · ราคา/หน่วย = ราคาขาย + ราคาบวกเพิ่ม · สต็อกนับรวมทุกบรรทัดของสินค้าเดียวกัน | `posCart.ts` (`addLine` · `setLineQty` · `removeLine` · `isAtStock` · `buildOrderInput` ส่ง `variant_ids`/`selected_options`) |
| 3 | เพิ่มสินค้า: ก่อนลงบิลดึง customization ของสินค้านั้น (scan มีให้แล้ว · เลือกจากคำแนะนำ = `GET /admin/pos/scan?code=<_id>` + cache React Query — **ไม่ใช้** `…/customization` เพราะต้องสิทธิ์ products.view ซึ่งพนักงานหน้าร้านอาจไม่มี) → ไม่มีกลุ่ม/ออปชัน = ลงบิลทันทีเหมือนเดิม · มี = เปิด modal เลือก | `usePOSViewModel.ts` |
| 4 | modal เลือกตัวเลือก: แต่ละกลุ่ม radio (max 1) / checkbox (max > 1) + บอก "บังคับ / เลือกได้ไม่เกิน N" · ออปชันติ๊ก/กรอกข้อความ · ราคารวมสด · ปุ่มเพิ่มลงบิลกดได้เมื่อครบเงื่อนไข (ตรวจแบบเดียวกับ backend `resolveCustomization`) | ใหม่ `OrderInStore/_components/CustomizationPickerModal.tsx` |
| 5 | บิล: แสดงตัวเลือกใต้ชื่อสินค้า · โปรโมชันคิดจากยอดบรรทัดที่รวมราคาบวกเพิ่มแล้ว (`toPromoLines`) | `BillCard.tsx` · `posPromotion.ts` |
| 6 | เทส pure function ของตะกร้า/ตรวจตัวเลือก (ถ้าจะเริ่มมีเทสฝั่ง frontend) หรือทดสอบมือกับ backend local | — |

**ทดสอบ (ต้องมีสินค้าที่ตั้งกลุ่มแล้ว — ทำ E1 ก่อน)**
- [ ] ตั้งกลุ่ม "ขนาด" (บังคับ 1) + "ท็อปปิ้ง" (ไม่บังคับ สูงสุด 2) + ออปชัน "ข้อความบนเค้ก" (กรอกข้อความ) → บันทึก → โหลดใหม่ค่าตรง
- [ ] POS: สแกนสินค้านั้น → modal → ไม่เลือกขนาดกดไม่ได้ · เลือกครบ → ลงบิลราคาถูก → ชำระ → ออเดอร์มี `variant_name` + ออปชัน (drawer I6)
- [ ] สินค้าเดียวกันคนละตัวเลือก = 2 บรรทัด · รวมจำนวนไม่เกินสต็อก
- [ ] สินค้าไม่มีกลุ่ม: ลงบิลทันทีเหมือนเดิม (ไม่มี modal)

**ลำดับ:** E1 ก่อน (ต้องมีที่ตั้งกลุ่ม) → I4 · ประมาณ 2 PR

---

## F. ต้องขอ backend ก่อน

### F1 ⏸ แนบสลิปย้อนหลังเมื่อยังไม่มีรายการชำระเงิน
- **ปัญหา:** ออเดอร์หมดเวลา → `POST /shop/payments` ต้องมี `slip_image_url` (ไม่งั้น 400) แต่สลิปเป็นไฟล์ส่วนตัว อัปโหลดได้ผ่าน `/shop/payments/:id/slip` เท่านั้น (ต้องมี payment ก่อน) → วนไม่จบ
- **ตอนนี้:** หน้าออเดอร์แสดง "กรุณาติดต่อร้านพร้อมสลิป"
- **ทางแก้ที่เสนอ:** (ก) `POST /shop/payments` รับ multipart พร้อมไฟล์ · (ข) ยอมสร้าง payment ไม่มีสลิปให้ออเดอร์ที่ `late_upload` · (ค) frontend สร้าง payment ทันทีที่เปิดหน้าชำระเงิน (ไม่แนะนำ — GET มีผลข้างเคียง)
- **คำถาม:** [Q-BE1](#ถาม-backend)

### F2 ⏸ หน้าจัดการโซนค่าส่งของเว็บ (ShippingZones)
- **ปัญหา:** backend มีแค่ `/catalog/shipping-zones` (อ่าน) · หลังร้านแก้ได้เฉพาะ `DeliveryZones` (POS) · FrontOffice มี `owner/shipping` แต่เรียก `/api/owner/shipping-zones`
- **คำถาม:** [Q-BE2](#ถาม-backend) · ทำหน้าแล้วรวมกับ BACKLOG2 §16.3 "หน้าจัดการโซนค่าส่ง"

### F3 ⏸ รีวิว analytics · dashboard · รายสินค้า
- **ปัญหา:** BE §8.20 รอทีม (R5) · ต้นแบบ `ReviewAnalyticsTab` · `reviews/products/[id]` (~900 บรรทัด)
- **คำถาม:** [Q-BE4](#ถาม-backend)

### F4 ⏸ dashboard รอบพรีออเดอร์ + รายชื่อลูกค้าในรอบ
- **ปัญหา:** FrontOffice เรียก `/api/owner/preorder-rounds/dashboard` · `/:id/customers` — ไม่มีใน backend หลัก (ตอนนี้กรองพรีออเดอร์ตามรอบได้ในหน้า `preOrderRound`)
- **คำถาม:** [Q-BE5](#ถาม-backend) · [Q-OWN3](#ถาม-เจ้าของร้าน--ทีม)

---

## G. ตัดสินใจทีม

### G1 ✅ หน้าออเดอร์ของลูกค้าอยู่ path ไหน — `/customer/account/purchases/[id]` (แบบ FrontOffice · 2026-10-07 · D1) · `/customer/order/[id]` redirect มาที่นี่
- **ตัวเลือก:** (ก) `customer/order/[id]` ของ repo นี้ · (ข) `customer/account/purchases/[id]` แบบ FrontOffice
- **ผลกระทบ:** ลิงก์ในกระดิ่ง/LINE ของ backend ชี้ไป (ข) อยู่แล้ว (BE §8.12) · เลือก (ก) = ขอ backend แก้ `link` · เลือก (ข) = ย้ายหน้า A1 ไป path ใหม่
- **ขึ้นกับเรื่องนี้:** C4 · D1 · D3 · D6 · D10 · **คำถาม:** [Q-OWN1](#ถาม-เจ้าของร้าน--ทีม)

### G2 ✅ ทางเข้าโปรไฟล์ของลูกค้า — ใช้ `/customer/account` (ตาม FrontOffice · 2026-10-06 · B2)
- **ตัวเลือก:** `/profile` (มีอยู่ — ผูก LINE · ใช้ร่วมกับพนักงาน) หรือ `/customer/account` แบบ FrontOffice
- ค้างจาก BACKLOG2 §16.4 · **ขึ้นกับเรื่องนี้:** B2 · D2 · D4 · D5 · **คำถาม:** [Q-OWN2](#ถาม-เจ้าของร้าน--ทีม)

### G3 ⏸ หลังร้านใช้ตัวไหน + ปิดพอร์ต 4000 เมื่อไหร่
- BE §8.1 ⏳ · แนะนำ: ใช้ repo นี้ ทำเฉพาะหมวด E · ปิดพอร์ต 4000 ได้เมื่อ FrontOffice เลิกใช้หรือย้าย path ครบ
- **คำถาม:** [Q-OWN4](#ถาม-เจ้าของร้าน--ทีม) · [Q-FO1](#ถาม-ผู้พัฒนา-frontoffice)

---

## H. ไม่ทำ (ตัดสินแล้ว)

| รหัส | เรื่อง | เหตุผล |
|---|---|---|
| H1 | ชุดสินค้า (`dessert-set` · `promotions/bundles` · แพ็กเกจในตะกร้า) | ร้านเลิกใช้ · backend ไม่ย้าย (BE §8.13) |
| H2 | `/employee/*` | ใช้ `/owner` + `usePermission` แทน |
| H3 | สิทธิ์ชั่วคราว (`/permissions/temporary`) | backend ใช้ `expires_at` บน permission |
| H4 | `reports/sales` | ไม่มี route · repo นี้ใช้ `/admin/dashboard/*` |
| H5 | POS แบบ `pos-checkout` ครั้งเดียว | backend ใช้ สร้างออเดอร์ → ชำระ → ยืนยัน (repo นี้ทำแล้ว) |
| H6 | ค้นคำเทียบเคียงฝั่ง client (`lib/search/*`) | `/catalog/products?search=` ขยายคำค้นที่ server แล้ว (BE §8.16) |

---

## I. แก้ตาม backend `main` (ตรวจ 2026-10-06)

> ตรวจ: backend `main` `e3fb9bd` (merge PR #52–#65 ครบ 2026-10-06) เทียบกับ frontend `main` `1be98ed` + branch นี้ ·
> endpoint ที่ frontend เรียก **มีครบทุกเส้น** (เทียบ path + method ทั้ง 145 call กับ route จริง 212 ไฟล์ · รวม route ที่สร้างจาก `collectionRoutes`/`itemRoutes`) · หน่วยเงินใน API ยังเป็น**บาท** (`money-units.md`
> — #64 แก้ข้อมูลใน DB ไม่ได้เปลี่ยน API) → ไม่ต้องแก้ · ที่เหลือคือ field/สถานะ/ฟีเจอร์ใหม่ที่ frontend ยังไม่รู้จัก

| รหัส | ระดับ | เรื่อง | ไฟล์ frontend | API / อ้างอิง backend | สถานะ |
|---|---|---|---|---|---|
| I1 | 🔴 | **เมนูสิทธิ์ `store_info` ไม่มีใน frontend** — backend เพิ่มใน `MENU_KEYS` แล้ว (`/auth/me` ส่งมา) แต่ frontend ทิ้ง → หน้าสิทธิ์ตั้งค่าเมนูนี้ให้พนักงานไม่ได้ · ต้องมีก่อนทำหน้า E2 | `constants/menuKeys.ts` (`MenuKey` · `ALL_MENU_KEYS`) · `employees/permissions/permissionGroups.ts` · i18n `nav.*` | `permissionService.MENU_KEYS` · BE §8.19 | ✅ PR #25 (`0f2f936`) · ทดสอบแล้ว |
| I2 | 🔴 | **คืนเงินไม่มีปุ่ม** — ลูกค้ายกเลิกออเดอร์ที่ชำระแล้วได้เอง → สถานะ "ยกเลิก + ชำระแล้ว" = รอร้านโอนคืน (backend **ไม่**คืนอัตโนมัติ) แต่หลังร้านไม่มีทางกดยืนยันคืนเงิน → ค้างตลอด | `orders/manageOrders` + `preOrderRound` drawer · `services/payments.ts` (+ `refund`) | `POST /admin/payments/:id/refund` (`payments.approve`) · BE §8.8 · BACKLOG2 §15.3 ข้อ 7 | ✅ PR #25 (`1e1e68c` · `RefundSection`) · ทดสอบแล้ว |
| I3 | 🟡 | ประเภทแจ้งเตือน: frontend ยังมี `employee` (backend เลิกแล้ว) และ**ไม่มี `customer`** (ลูกค้าติดต่อร้าน · ยกเลิกออเดอร์) → ตัวกรองไม่มีหมวดนี้ · ป้ายเป็น key ดิบ | `types/notification.ts` · `notificationsHistory` · i18n `enums` | enum `Notifications.module` · BE §8.17 | ✅ 2026-10-09 — `NotificationModule` = 6 หมวดที่ backend สร้างได้ (+ `NOTIFICATION_MODULES` ใช้เป็นตัวกรอง) · `employee` แยกเป็น `LegacyNotificationModule` ใช้แสดงแถวเก่าเท่านั้น (คงป้าย i18n ไว้ — backend ก็ยังมีป้ายของเอกสารเก่า · ลบแล้วแถวเก่าจะขึ้น key ผิด) |
| I4 | 🟡 | **POS ไม่รองรับกลุ่มตัวเลือก** — `scan` คืน `customization` แล้ว แต่ POS ไม่ให้เลือก (`usePOSViewModel.ts:140`) · ถ้า FrontOffice (หลังร้านพอร์ต 4000) ตั้งกลุ่มบังคับเลือกให้สินค้าไว้ → ขายใน POS ได้ 400 | `OrderInStore/*` · `services/pos.ts` | `POST /admin/pos/scan` · ออเดอร์รับ `variant_ids` + `selected_options` · BE §8.3 | ✅ 2026-10-06 (PR #27 · `398f7cb`) — หน้าต่างเลือกตัวเลือกก่อนลงบิล · ดึงผ่าน `/admin/pos/scan` (สิทธิ์ orders.view) + cache · บรรทัดแยกตามชุดตัวเลือก · สต็อกรวมต่อสินค้า · ทดสอบแล้ว |
| I5 | 🟡 | สวิตช์ "ส่งทั่วประเทศ" ของหมวดสินค้า — ค่าส่งเว็บตัดสินจาก `ships_nationwide` · ไม่ตั้ง = เดาจากชื่อหมวด ("ซาวโดว์") | `components/shared/categories/CategoryManagerDialog.tsx` · `services/productCategories.ts` · `types/productCategory.ts` | `PATCH /admin/product-categories/:id { ships_nationwide }` · BE §8.7 | ✅ PR #26 (`a842444`) · ทดสอบแล้ว |
| I6 | 🟡 | drawer ออเดอร์ไม่แสดง field ของออเดอร์เว็บ: `payment_due_at` · `cancelled_reason` (เช่น "หมดเวลาชำระเงิน (ระบบยกเลิกอัตโนมัติ)") · จุดรับ `pickup_point` + `pickup_date` · แต้มที่ใช้ `points_redeemed`/`points_discount` · คูปองส่วนตัว | `types/order.ts` · `services/orders.ts` (`toOrder`) · `manageOrders/_components/OrderDetailContent.tsx` | BE §8.7 · §8.8 · §8.11 | ✅ PR #26 (`bfe3073`) · ทดสอบแล้ว |
| I7 | 🟡 | คูปองแลกแต้ม — โปรโมชันมี `points_cost` (ลูกค้าใช้แต้มแลกเป็นคูปองส่วนตัว) แต่ฟอร์มคูปองหลังร้านตั้งไม่ได้ | `promotions/coupons/couponForm.ts` · `CouponFormModal.tsx` · `types/promotion.ts` | `schemas/promotion.ts` `points_cost` · BE §8.11 | ✅ PR #26 (`72d8a6c`) · ทดสอบแล้ว |
| I8 | 🟢 | หน้าจัดการโซนค่าส่งของหลังร้าน/POS (`DeliveryZones`) ยังไม่มี (ค้างจาก BACKLOG2 §16.3) · คนละตารางกับค่าส่งเว็บ (F2) | ใหม่ `owner/...` | `/admin/delivery-zones` (+`:id`, `restore`) · `/admin/delivery-fee` | ▢ |
| I9 | 🟢 | รายการรีวิวหลังร้าน: response มี `data.summary` เพิ่ม (frontend ทิ้ง) · สถานะ/ปักหมุด/ตอบกลับ → รวมใน E4 | `services/reviews.ts` | BE §8.20 | ✅ 2026-10-09 (E4) |
| I10 | 🟢 | บัญชีลูกค้าจาก LINE ที่ไม่มีอีเมลได้อีเมลชั่วคราว `*@line-user.invalid` · `auth_provider: "line"` → ที่ไหนแสดงอีเมลผู้ใช้ (ออเดอร์ · รีวิว) ควรซ่อน/แสดง "บัญชี LINE" | `OrderDetailContent` · `reviews` · `types/user.ts` | `oauthService.isPlaceholderEmail` · BE §8.9 | ✅ 2026-10-09 — `lib/lineAccount.ts` (`isLinePlaceholderEmail` ย้ายจาก services/shopProfile — re-export ไว้) · `/profile` แสดง "บัญชี LINE — ยังไม่ได้ระบุอีเมล" · ฟอร์มแก้พนักงานเตือนให้ใส่อีเมลจริง · ตรวจแล้ว: drawer ออเดอร์/รีวิวหลังร้านไม่ได้แสดงอีเมลลูกค้า (backend ก็ตัดอีเมลชั่วคราวออกจากข้อความติดต่อร้านแล้ว) |
| I11 | 🟢 | mock (MSW) ใช้ไม่ได้แล้ว (path เก่า ไม่มี `/admin`) — ค้างจาก BACKLOG2 §16.5 · ตัดสินใจเขียนใหม่หรือลบ | `src/mocks/*` · `MSWReady` | — | ⏸ ตัดสินใจ |
| I13 | ✅ | **รายการถูกตัดเงียบ ๆ** — backend ตัด `?limit=` ไว้ ≤ 100 (`parsePagination` maxLimit · ไม่ส่ง = 20) แต่ frontend ขอ 200/500 อยู่ 24 จุด + ขอ 100 เพื่อ "โหลดทั้งหมด" อีก 15 จุด (ออเดอร์ · วัตถุดิบ · พนักงาน · หมวด · role) + หน่วยนับไม่ส่ง limit (ได้ 20) → แก้ที่ `http.getList` ไล่ขอทีละหน้าเมื่อ limit > `PAGE_MAX` · ใช้ `LIST_ALL` (1,000) แทนเลขลอย | `lib/http.ts` · ViewModel/service 26 ไฟล์ | `src/lib/queryParams.ts` | ✅ 2026-10-06 |
| I14 | ✅ | สิทธิ์หน้ารีวิว: backend ย้าย `/admin/reviews*` จาก `products.*` เป็น **`reports.*`** แต่เมนู + ViewModel ยังเช็ค `products` → ปุ่ม/เมนูไม่ตรงสิทธิ์จริง | `constants/menu.ts` · `useReviewsViewModel.ts` | BE §8.20 | ✅ 2026-10-06 |
| I12 | ✅ แจ้ง backend | **frontend ไม่ส่ง `product_stock_quantity` ใน PATCH แล้ว** (`productForm.toUpdateInput` ตัดออก · ปรับสต็อกผ่าน `PUT /stock` ตั้งแต่ PR #19) → backend เปิดการปฏิเสธใน `PATCH /admin/products/:id` ได้เลย (BACKLOG5 §4 แถวแรกยังเขียนว่ารอ FrontEnd) | — | BE §8.21 · [Q-BE8](#ถาม-backend) | ✅ |

| I15 | 🟡 | **POS โหลดรายการสินค้าไม่ได้ถ้าพนักงานไม่มีสิทธิ์ `products.view`** — POS ใช้ `GET /admin/products` (สิทธิ์ products) เป็นคำแนะนำในช่องค้นหา · ทดสอบ 2026-10-06: พนักงานที่มีแค่ orders + payments ได้ 403 (สแกนรหัส/บาร์โค้ด + เลือกตัวเลือกยังใช้ได้ผ่าน `/admin/pos/scan`) · มีมาก่อน PR ชุดนี้ | `OrderInStore/usePOSViewModel.ts` (`catalogQ`) | ขอ backend: endpoint รายการสินค้าสำหรับ POS ใต้สิทธิ์ orders (เช่น `GET /admin/pos/products`) — [Q-BE10](#ถาม-backend) · หรือกำหนดให้พนักงานหน้าร้านต้องมี products.view | ⏸ |

### ผลทดสอบ PR #25–#27 กับ backend จริง (2026-10-06)

> backend `feat/line-login-endpoint` (= `main` + #66) + MongoDB local · frontend `feat/product-customization` (รวม #25 + #26 + #27) ·
> สคริปต์เรียก **service / pure function ของ frontend ตรง ๆ** (ไม่ใช่ยิง API เอง) · ยังไม่ได้คลิกหน้าจอในเบราว์เซอร์

| ชุด | ผล | ที่ตรวจ |
|---|---|---|
| #25 regression (A1–A3) | ✅ 17/17 | ชำระเงิน/หมดเวลา/เปิดกลับ · ค่าส่ง `deliverable` · ยืนยันอีเมล (ข้ามการส่งอีเมลจริง) |
| #25 ใหม่ | ✅ 5/5 | `store_info` ใน menuAccess · **`LIST_ALL` ได้ 125/125 ไม่ซ้ำ** (limit 100 = 100) · ลูกค้ายกเลิกหลังจ่าย → `isAwaitingRefund` → `paymentsService.refund` → refunded · field ออเดอร์เว็บใน `toOrder` · รีวิวสิทธิ์ reports |
| #26 | ✅ 2/2 | สวิตช์ส่งทั่วประเทศ → `delivery-quote` เปลี่ยนตาม · `points_cost` 100 → ล้างช่อง = null |
| #27 | ✅ 5/5 + 1 | บันทึกกลุ่มผ่าน `customizationForm` (บันทึกซ้ำ id เดิม) · POS scan → เลือก → `posCart` → ออเดอร์ **ราคา POS = backend (380)** + ข้อความตัวเลือก/ออปชันตรง · ไม่เลือกกลุ่มบังคับ → หน้าจอจับได้ + backend 400 · สินค้าไม่มีตัวเลือกลงบิลตรง · **พนักงานไม่มี products.view สแกนได้ตัวเลือกครบ** (`/customization` ได้ 403 ตามที่คาด) |
| หน้าเว็บ | ✅ 12/12 | ทุกหน้าที่ PR แตะ เปิดได้ 200 (หลังรีสตาร์ท dev server — รอบแรกได้ 404 เพราะสถานะ dev server ค้าง ไม่ใช่โค้ด) |

พบใหม่: **I15** (ด้านบน)

**สถานะ deploy (อัปเดต BACKLOG2 §16.1):** backend `main` merge PR #52–#57 แล้ว (2026-10-06) → ข้อห้าม "frontend `main` ห้าม deploy ก่อน backend" หมดไป —
deploy พร้อมกันได้ (backend ก่อน) · แต่ PR #16–#19 ของ frontend **ยังไม่เคยทดสอบกับ backend จริง** (BACKLOG2 §16.2) · branch นี้ทดสอบ A1–A3 แล้ว (หมวด A)

**งานใน repo backend ที่เกิดจาก BACKLOG นี้:** branch `feat/line-login-endpoint` (B3 · ยังไม่ commit) — ต้อง commit + PR + merge ก่อน deploy ปุ่ม LINE

---

## แบบฟอร์มสอบถาม

> คัดลอกส่วนของแต่ละคนไปส่งได้เลย · ได้คำตอบแล้วกรอกช่อง **คำตอบ** แล้วอัปเดตสถานะเรื่องที่ "ใช้กับ"

### ถาม backend

| รหัส | คำถาม | ตัวเลือก / บริบท | ใช้กับ | คำตอบ | ผู้ตอบ · วันที่ |
|---|---|---|---|---|---|
| Q-BE1 | ออเดอร์ที่หมดเวลาและยังไม่มีรายการชำระเงิน ลูกค้าจะแนบสลิปเพื่อเปิดกลับได้อย่างไร | (ก) `POST /shop/payments` รับ multipart · (ข) สร้าง payment ไม่มีสลิปได้เมื่อ `late_upload` · (ค) ไม่รองรับ — ให้ติดต่อร้าน | F1 · A1 | | |
| Q-BE2 | จะมี admin API แก้ `ShippingZones` (ค่าส่งเว็บ) ไหม หรือให้แก้ใน DB/ฝั่งอื่น | ตอนนี้มีแค่ `/catalog/shipping-zones` | F2 | | |
| Q-BE3 | ลิงก์ในอีเมลยืนยัน/ตั้งรหัสใหม่ (`STOREFRONT_URL`) จะชี้ไปที่ frontend ตัวไหนตอน deploy | repo นี้ใช้ path `/customer/verify-email` · `/customer/reset-password` ตรงกับ FrontOffice | B1 | | |
| Q-BE4 | รีวิว analytics / dashboard / รายสินค้า จะย้ายเมื่อไหร่ · shape ของ response | BE §8.20 (R5) | F3 | | |
| Q-BE5 | จะมี endpoint สรุปรอบพรีออเดอร์ + รายชื่อลูกค้าในรอบไหม | FrontOffice ใช้ `/owner/preorder-rounds/dashboard` · `/:id/customers` | F4 | | |
| Q-BE6 | ถ้าเลือก G1 (ก) ช่วยเปลี่ยน `link` ของแจ้งเตือนลูกค้าเป็น `/customer/order/<id>` ได้ไหม | ตอนนี้ `/customer/account/purchases/<id>` | G1 · D6 | | |
| Q-BE9 | เพิ่ม flag `has_customization` (หรือจำนวนกลุ่ม/ออปชัน) ใน `GET /admin/products` ได้ไหม — POS จะได้ไม่ต้องถาม customization ทีละสินค้าก่อนลงบิล | ตอนนี้มีแค่ใน `/admin/pos/scan` · `/customization` รายตัว | I4 | | |
| Q-BE10 | ขอ endpoint รายการสินค้าสำหรับ POS ใต้สิทธิ์ orders (เช่น `GET /admin/pos/products?search=`) — ตอนนี้ POS ใช้ `/admin/products` ที่ต้อง products.view | พนักงานหน้าร้านที่มีแค่ orders ได้ 403 ในช่องค้นหา | I15 | | |
| Q-BE11 | `DELETE /shop/me/line` ไม่กันบัญชีที่สมัครด้วย LINE (ไม่มีรหัสผ่าน) — ยกเลิกแล้วเข้าสู่ระบบไม่ได้อีก · หน้าเว็บซ่อนปุ่มไว้แล้ว แต่ควรกันที่ backend ด้วย · ข้อความ "บัญชีนี้เข้าสู่ระบบด้วย Google…" ของเปลี่ยนรหัสใช้กับบัญชี LINE ด้วย | userService.unlinkLineAccount · changePassword | B2 | แก้แล้ว — ยกเลิก LINE ของบัญชีที่ไม่มีรหัสผ่านได้ 409 · backend PR #68 (`33e51a4`) | backend · 2026-10-09 (K7) |
| Q-BE12 | จะย้าย `refund_promptpay_id/name` (บัญชีรับเงินคืนของลูกค้า) จากฝั่งลูกค้ามาไหม — ใช้คู่กับคืนเงินออเดอร์ที่ลูกค้ายกเลิก (I2) | BE §7.1 ข้อ 21 · ไม่อยู่ใน `updateProfileBody` | B2 · I2 | | |
| Q-BE13 | `GET /shop/orders` (รายการ) ไม่ส่งรายการสินค้า + snapshot สินค้าในออเดอร์ไม่มีรูป — หน้า "ประวัติการสั่งซื้อ" ต้องดึงรายละเอียดทีละใบ (10 คำขอต่อหน้า) และแสดงไอคอนแทนรูป · ขอ `items` แบบย่อ (ชื่อ · จำนวน · ราคา · รูป) ใน list ได้ไหม | orderService.listOrders · productSnapshot | D1 | | |
| Q-BE8 | frontend เลิกส่ง `product_stock_quantity` ใน PATCH แล้ว (PR #19) — เปิดการปฏิเสธฝั่ง backend ได้เลยไหม | BACKLOG5 §4 ยังรอ FrontEnd | I12 | แก้แล้ว — PATCH ที่ส่ง `product_stock_quantity` ได้ 400 ให้ใช้ `/stock` · backend PR #68 (`33e51a4`) | backend · 2026-10-09 (K7) |
| Q-BE7 | รีวิว + merge endpoint ล็อกอินด้วย LINE (`/api/auth/line` + `/callback` — branch `feat/line-login-endpoint`) · ตั้ง `LINE_AUTH_*` + Callback URL ใน Console ตอน deploy | ทำให้แล้ว 2026-10-06 รอรีวิว | B3 | merge แล้ว — backend PR #66 (endpoint LINE login) · ค่าตั้ง `LINE_AUTH_*` ยังต้องตั้งตอน deploy (BACKLOG4 §9.6) | backend · 2026-10-08 (K7) |

### ถาม ผู้พัฒนา FrontOffice

| รหัส | คำถาม | ตัวเลือก / บริบท | ใช้กับ | คำตอบ | ผู้ตอบ · วันที่ |
|---|---|---|---|---|---|
| Q-FO1 | ยังพัฒนา FrontOffice ต่อไหม · โค้ดใน `Downloads` ตรงกับตัวที่รันจริงหรือเปล่า · มี git repo ไหม | ไม่มี git ให้เทียบ | G3 · ทุกเรื่องที่พอร์ต | | |
| Q-FO2 | ลิงก์ชำระเงินแบบ token ใช้ตอนไหน (ส่งทาง LINE / แชต?) ยังต้องมีไหม | `customer/payment?token=` | D10 | | |
| Q-FO3 | หน้าไหนที่ลูกค้าใช้จริงบ่อย / หน้าไหนเลิกใช้แล้ว | ช่วยจัดลำดับหมวด C · D | C · D | | |
| Q-FO4 | ยินดีให้นำ UI/โค้ดหน้าร้านมาปรับใช้ใน repo นี้ไหม | ใส่เครดิตในเอกสาร | ทั้งหมด | | |

### ถาม เจ้าของร้าน / ทีม

| รหัส | คำถาม | ตัวเลือก / บริบท | ใช้กับ | คำตอบ | ผู้ตอบ · วันที่ |
|---|---|---|---|---|---|
| Q-OWN1 | หน้าออเดอร์ลูกค้าใช้ path ไหน | (ก) `/customer/order/<id>` · (ข) `/customer/account/purchases/<id>` | G1 | | |
| Q-OWN2 | ลูกค้าเข้าโปรไฟล์ทางไหน | (ก) `/profile` ร่วมกับพนักงาน · (ข) `/customer/account` แยก | G2 | | |
| Q-OWN3 | ต้องการหน้าสรุปรอบพรีออเดอร์ไหม (ยอดต่อรอบ · รายชื่อลูกค้า) | ตอนนี้ดูได้ด้วยตัวกรองในหน้าพรีออเดอร์ | F4 | | |
| Q-OWN4 | หลังร้านใช้ repo นี้ตัวเดียว และปิด FrontOffice พอร์ต 4000 เมื่อหน้าลูกค้าย้ายครบ — เห็นด้วยไหม | BE §8.1 ⏳ | G3 | | |

---

## เทมเพลตเพิ่มเรื่องใหม่

```md
### <รหัส> <สถานะ> <ชื่อเรื่อง>
- **เป้าหมาย:**
- **ไฟล์ของเรา / ต้นแบบ FrontOffice:**
- **API:** (อ้าง BE §)
- **ขั้นตอน:**
- **ขึ้นกับ:**
- **คำถาม:** Q-xxx (เพิ่มในแบบฟอร์มด้วย)
```
