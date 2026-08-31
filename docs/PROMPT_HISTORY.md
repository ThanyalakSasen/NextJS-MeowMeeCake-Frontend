# ประวัติคำสั่ง & คำตอบ (ย่อ)

บันทึกคำสั่งที่ผู้ใช้สั่ง และคำตอบ/ผลลัพธ์แบบย่อ เรียงตามลำดับเวลา

---

## #1 — 2026-08-31

**ผู้ใช้สั่ง:**
สร้าง clone ของ `D:\Cream\MeowMeeCake\-MeowMeeCake-NextJS5` มาที่โปรเจกต์ `D:\Cream\MeowMeeCakeV2\NextJS-MeowMeeCake`
จุดประสงค์: แก้ให้ component สอดคล้องกันมากขึ้น โดยอ้างอิงจาก `D:\Cream\MeowMeeCake_Components.html`
ให้ **วางแผน** สร้างโปรเจกต์ใหม่โดยอิง feature + layout ทั้งหมดจาก `-MeowMeeCake-NextJS5`
— ยังไม่ต้องเขียนโค้ด — และทำไฟล์ .md บันทึกประวัติคำสั่ง + คำตอบย่อ

**คำตอบย่อ:**
- วิเคราะห์ทั้ง 3 แหล่ง: ต้นทาง (Next 16.2.6 / React 18 / antd 6 / mongoose / JWT auth, ~80 API routes, 38 controllers, 39 models, 27+ screens), ปลายทาง (create-next-app เปล่า + มี `src/models/*` 39 ไฟล์แล้ว โดย 5 ไฟล์ต่างจากต้นทาง), และ `MeowMeeCake_Components.html` (Atomic Design 18/40/53/5/8 + 27 screens)
- สร้างเอกสาร 2 ไฟล์:
  - `docs/REBUILD_PLAN.md` — แผน 6 เฟส (0 setup → 1 data → 2 backend → 3 component library ตาม Atomic → 4 screens 27 หน้า → 5 wiring → 6 verify) + ตาราง screen→route→template→component + รายการเรื่องต้องตัดสินใจ (D1–D7) + ความเสี่ยง
  - `docs/PROMPT_HISTORY.md` — ไฟล์นี้
- ยังไม่เขียนโค้ดจริง ตามที่สั่ง
- **รอผู้ใช้ตัดสินใจ:** D1 เวอร์ชัน Next/React · D2 5 model ที่ต่าง · D3 reactCompiler · D4 material-tailwind · D5 ขอบเขต route (27 ใน reference ก่อน?) · D6 ค่า `.env.local`

---

## #2 — 2026-08-31

**ผู้ใช้สั่ง:**
กำลังตัดสินใจเรื่องโครงสร้าง component: จะใช้ Atomic เต็มรูป หรือแบ่งเป็น
share component (ใช้หลายที่) + base component (atom) + component หน้าเดียวไว้ใน folder ของ page นั้น ๆ

**คำตอบย่อ:**
- แนะนำ **แนวหลัง (reuse-based + colocation)** — เหมาะกับโปรเจกต์นี้กว่า Atomic เต็มรูป
  (เส้นแบ่ง atom/molecule/organism เถียงไม่จบ · reference มี organism ใช้หน้าเดียว 40+ ตัว · ชิ้นส่วนหน้าเดียวกระจายหลายที่)
- โครงที่เสนอ: `src/components/base/` (atoms) + `src/components/shared/<concern>/` (ใช้ ≥2 screen) + `app/owner/<route>/_components/` (ใช้ 1 screen)
- กติกา: UI ล้วน→base · ≥2 screen→shared · 1 screen→page-local · มี consumer ที่ 2→promote ขึ้น shared
- เก็บ Atomic level เป็นแท็กใน `docs/COMPONENT_MAP.md` เพื่อตรวจความสอดคล้อง (ไม่ใช่โครงโฟลเดอร์)
- อัปเดต `REBUILD_PLAN.md`: เขียนเฟส 3 ใหม่ทั้งหมด + เพิ่ม D8 (ตัดสินแล้ว = แนวหลัง)

---

## #3 — 2026-08-31

**ผู้ใช้สั่ง:** D1 = downgrade

**คำตอบย่อ:**
- ยึดเวอร์ชันต้นทาง: `next` 16.2.6 · `react`/`react-dom` 18.3.1 · `eslint-config-next` 16.2.6 · `@types/react(-dom)` ^18
- ผลพลอยได้: ตัด `next/font/google` (Geist) ออกจาก `layout.tsx`, antd v6 peer-dep หมดปัญหา
- อัปเดต `REBUILD_PLAN.md`: D1 = ตัดสินแล้ว, เฟส 0 ข้อ 1 เขียนใหม่, ตัดความเสี่ยง React 19 ออก
- เหลือตัดสิน: D2 · D3 · D4 · D5 · D6

---

## #4 — 2026-08-31

**ผู้ใช้สั่ง:** D2 — model ที่ต่างมีอะไรบ้าง (ขอดูรายละเอียด)

**คำตอบย่อ:**
- diff ทั้ง 5 ไฟล์ (`attendanceModel`, `bundleModel`, `expenseModel`, `ingredientTransactionModel`, `notificationModel`)
- **ผล: เนื้อหาเหมือนกัน byte-for-byte** — ต่างแค่ line ending (ปลายทาง = CRLF, ต้นทาง + อีก 34 ไฟล์ = LF)
- D2 = ไม่มี schema conflict จริง → normalize เป็น LF + เพิ่ม `.gitattributes` (`* text=auto eol=lf`)
- อัปเดต `REBUILD_PLAN.md`: ข้อ 2, D2, เฟส 1
- เหลือตัดสิน: D3 · D4 · D5 · D6

---

## #5 — 2026-08-31

**ผู้ใช้สั่ง:**
- D3: ใช้ตามต้นทาง (เปิด reactCompiler)
- D4: เปิดใช้ (อยากให้ component บางส่วนใช้ Tailwind จัดการ)
- D5: ทำ 27 screen ก่อน
- D6: ค่า env เอามาให้ทีหลัง, mock ไปก่อน + สร้างไฟล์บันทึกว่า mock ตรงไหนบ้าง

**คำตอบย่อ:**
- **D3 = เปิด** `reactCompiler: true` + `babel-plugin-react-compiler@1.0.0` (Next จะใช้ Babel แทน SWC — build ช้าลงบ้าง)
- **D4:** ตรวจแล้ว `@material-tailwind/react` = dead dep ในต้นทาง (ไม่ถูก import เลย) + v2.1.10 ไม่รองรับ Tailwind v4 + เป็น component library ซ้อน antd → ถามผู้ใช้ → **เลือก "Tailwind ล้วน ไม่เอา material-tailwind"** · custom/visual component ใช้ Tailwind v4 utility ตรง ๆ, data/form ใช้ antd (`base/`)
- **D5 = ทำ 27 screen ใน reference ก่อน** · หน้าที่เกิน (promotions, reports, planOrPurchaseOrder ฯลฯ) = นอกขอบเขตรอบนี้
- **D6 = mock ไปก่อน** · เพิ่มชั้น mock ใน `dbConnect`/controller + `src/mocks/` fixtures + mock auth (user owner ปลอม) · **สร้าง `docs/MOCKS.md`** บันทึกทุกจุด mock + checklist ตอนถอด · กติกา: คอมเมนต์ `// MOCK:` ในโค้ดทุกจุด
- อัปเดต `REBUILD_PLAN.md`: D3–D6 + เฟส 0/1/2/4/6 + ข้อ 5/9/10 · สร้าง `docs/MOCKS.md`
- **D1–D8 ครบแล้ว — พร้อมเริ่มเฟส 0 เมื่อผู้ใช้ไฟเขียว**

---

## #6 — 2026-08-31

**ผู้ใช้สั่ง:**
- อยากทำ text localization รองรับ 2 ภาษาด้วย i18n ก่อนเป็นอันดับแรก
- แจกแจง model, type, constant, util ในโปรเจกต์

**คำตอบย่อ:**
- สร้าง `docs/I18N_PLAN.md`:
  - ไลบรารี = **`next-intl`** (no URL routing, locale ใน cookie `mmc_locale`) · locale: `th` (default) / `en`
  - โครง `src/i18n/` (config/request/format/useLocale + messages/{th,en}.json) · namespace ~22 กลุ่ม (common, nav, breadcrumb, entities, fields, enums, ...)
  - ย้าย label map เดิม (`entityLabels`, `fieldLabels`, `unitContext`, `promotionChannel`, sidebar menu, breadcrumb) → catalog
  - แยก `label` ออกจาก `*_CONFIG` ใน types (เหลือแต่สี) · รวมฟังก์ชัน format ที่กระจาย → `i18n/format.ts`
  - **DB enum ที่เก็บค่าไทย** (`Attendances.status`, `Expenses.category/payment_method`) = แนวทาง A: คงค่าใน DB, map ตอนแสดง (ไม่ migrate)
  - locale switcher ใน `UserMenuDropdown` · สคริปต์ lint หา literal อักษรไทยนอก `messages/`
  - แทรกเป็น **เฟส 0.5** (ทำก่อน component/screen)
- สร้าง `docs/INVENTORY.md`: แจกแจง **38 model** (จัดกลุ่ม 10 โดเมน + ชี้ enum ที่เป็นค่าไทย) · **6 type file** (interface/enum/const/util/mock แต่ละไฟล์) · **constant** (label map + enum config → ปลายทางหลัง i18n) · **util** (12 lib + helper ใน types)
- แก้ตัวเลขในแผน: models = **38** (ไม่ใช่ 39) · lib = 12 · api route.ts = 84
- อัปเดต `REBUILD_PLAN.md`: เพิ่มเฟส 0.5, D9, docs index, เกณฑ์ component "ไม่มี literal ข้อความ", เฟส 6 เพิ่ม i18n verify
- **D1–D9 ครบ — พร้อมเริ่ม เฟส 0 → 0.5 → 1 ...**

---

## #7 — 2026-08-31

**ผู้ใช้สั่ง:**
โครงโค้ดในแต่ละ screen/component แบ่งเป็น "ไฟล์โครงสร้าง" + "viewmodel" — ถามว่าเข้าใจไหม / เรียกว่าอะไร

**คำตอบย่อ:**
- ใช่ เข้าใจ — คือ **MVVM** (Model–View–ViewModel) · ใน React ทำผ่าน **custom hook (ViewModel) + presentational component (View)** · ชื่ออื่น: Container/Presentational (Smart/Dumb), headless component
- ต้นทางมีเค้าอยู่แล้ว: `useStaffRoles.ts`, `useProductionData.ts`, `useSalesTransactions.ts`
- สร้าง `docs/CODE_STRUCTURE.md`:
  - **Screen:** `page.tsx` (บาง เรียก hook + render View) + `<X>View.tsx` (JSX ล้วน) + `use<X>ViewModel.ts` (state/effect/fetch/handler/derived/permission) + `.types.ts`
  - **Component:** atom/presentation = ไฟล์เดียว · ตัวที่มี logic จริง (modal/table/form/kanban/cart) = split เป็นโฟลเดอร์ `<Name>/` + `index.ts` + `<Name>.tsx` + `use<Name>.ts`
  - เกณฑ์ split · ตาราง "อะไรอยู่ VM / อะไรอยู่ View" · `src/services/<resource>.ts` แยก `fetch("/api/*")` ออกจาก VM (จับคู่ mock D6) · naming convention
- **D10:** ทุก screen/component ที่มี logic ใช้ MVVM ตามเอกสารนี้
- อัปเดต `REBUILD_PLAN.md`: D10, docs index, `src/services/`, เกณฑ์เฟส 3 (split + `COMPONENT_MAP` เพิ่มคอลัมน์ split?), เฟส 4 (page+View+ViewModel), เฟส 6 (ตรวจ View ไม่มี fetch)
- **D1–D10 ครบ**

---

## #8 — 2026-08-31

**ผู้ใช้สั่ง:**
เช็ค + วางแผน: authentication, JWT, public layout, protected layout, axios, interceptor, การทำ session, session timeout

**คำตอบย่อ:**
- ตรวจของเดิมในต้นทาง → สร้าง `docs/AUTH_PLAN.md`:
  - **มีอยู่แล้ว:** JWT httpOnly cookie `mmc_session` (payload `{userId,roleId,roleType,email,fullname}`, อายุ 7d) · `session.ts` (sign/verify/set/clear) · login (bcrypt + auto-upgrade plaintext, lockout 5 ครั้ง/15 นาที, กัน user-enum, กัน role customer) · logout · `/api/auth/me` (คืน user + `menuAccess`) · `proxy.ts` guard `/owner/*` + `can_view` ต่อ route · `createCrudController` เช็ค `requirePermission` เฉพาะ POST/PATCH/DELETE
  - **ช่องโหว่/ที่ขาด:** ไม่มี refresh/sliding/idle timeout · **GET API เปิดโล่ง** ไม่เช็ค session · ไม่มี axios (ใช้ `fetch` 36 จุด) · Google OAuth env มีแต่ไม่ได้ทำ · public/protected layout ยังไม่เป็น template ชัด
  - **แผนเพิ่ม:** `src/lib/http.ts` axios + request interceptor (`Accept-Language`) + response interceptor (401→refresh→redirect, 403 toast, 409/422 ส่งต่อ, 5xx/network toast, unwrap `{data,meta}`, single-flight refresh) · `src/services/*` เรียก axios แทน fetch · session timeout = **short access token 30 นาที + sliding refresh (`/api/auth/refresh`) + absolute cap 8 ชม.** + `useIdleTimeout` (warn 60 วิ) + cross-tab `BroadcastChannel` + `visibilitychange` revalidate · `AuthLayout`/`OwnerLayout` เป็น template · `requireSession` + `can_view` ให้ GET API · throttle login ราย IP · i18n ข้อความ auth
  - เพิ่ม **เฟส 2.5 (Auth & HTTP foundation)** หลัง backend ก่อน component library
  - **D11** session timeout = แบบ B (short token + refresh + cap) · **D12** 401 → ลอง refresh ก่อน redirect · **D13** cookie `sameSite=lax` (คงเดิม) · **D14** เพิ่ม session guard ให้ GET API — *D11–D14 เป็นค่าแนะนำ รอผู้ใช้ยืนยัน*
- อัปเดต `REBUILD_PLAN.md`: docs index, เฟส 0 (+axios), เฟส 2 (auth hardening), เฟส 2.5 ใหม่, เฟส 5/6, โครงสร้าง, section 10, D11–D14

---

## #9 — 2026-08-31

**ผู้ใช้สั่ง:** ยืนยัน D11–D14

**คำตอบย่อ:**
- D11 = B (access token 30 นาที + sliding refresh throttle 5 นาที + absolute cap 8 ชม. + warn 60 วิ)
- D12 = ลอง refresh ก่อน แล้วค่อย redirect `/login?reason=expired`
- D13 = cookie `sameSite=lax` (คงเดิม)
- D14 = เพิ่ม `requireSession` ทุก GET + `can_view` เมื่อมี `menuKey`
- อัปเดต `REBUILD_PLAN.md` + `AUTH_PLAN.md`: mark ตัดสินแล้ว
- **D1–D14 ครบทั้งหมด — แผนพร้อม เริ่มเฟส 0 ได้เมื่อผู้ใช้ไฟเขียว**

---

## #10 — 2026-08-31  ▶ เริ่มเขียนโค้ด: เฟส 0 (เสร็จ)

**ผู้ใช้สั่ง:** เริ่มเขียนโค้ดเฟส 0

**ทำจริง:**
- `package.json`: downgrade `next` 16.2.6 · `react`/`react-dom` 18.3.1 · `eslint-config-next` 16.2.6 · `@types/react(-dom)` ^18 · เพิ่ม deps: `antd`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `dayjs`, `axios`, `@heroicons/react`, `lucide-react`, `recharts`, `sweetalert2`, `qrcode` · devDeps: `@types/bcryptjs|jsonwebtoken|qrcode`, `babel-plugin-react-compiler@1.0.0`
- `next.config.ts`: `reactCompiler: true` (D3)
- port จากต้นทาง: `src/app/globals.css` (ธีมกาแฟ), `src/app/providers.tsx` (antd ConfigProvider + th_TH + dayjs), `src/app/favicon.ico`, `public/pictures/logoMoewMeeCake.png`, `public/*.svg`
- `src/app/layout.tsx`: ตัด `next/font/google` (Geist), ใช้แบบต้นทาง (`<html lang="th">` + `<Providers>`)
- `src/app/page.tsx`: placeholder (เฟส 5 จะใส่ redirect ตาม session)
- `.env.local` (mock mode — ไม่มี `MONGODB_URI`) + `.env.example` + `.gitignore` เพิ่ม `!.env.example`
- `npm install` สำเร็จ (539 pkg) — ยืนยัน react 18.3.1 / next 16.2.6 / antd 6.6.2
- **อ่าน `node_modules/next/dist/docs/`** (กฎ AGENTS.md): ยืนยัน `proxy.ts` = convention ปัจจุบัน (middleware deprecated v16) → `src/proxy.ts` ของต้นทางถูกต้องแล้ว · runtime = Node.js
- **ผล: `npm run build` ✅ · `npm run lint` ✅**

**ติดปัญหา/เลื่อน:**
- `next-intl@3.26` peer ไม่รับ next 16 → **เลื่อนติดตั้งไปเฟส 0.5** ด้วย `next-intl@^4` (บันทึกใน `I18N_PLAN.md` + `REBUILD_PLAN.md`)
- Git เตือน LF→CRLF — จะแก้ด้วย `.gitattributes` (`eol=lf`) เฟส 1 (D2)

**ถัดไป:** เฟส 0.5 (i18n foundation)

---

## #11 — 2026-08-31  ▶ เฟส 0.5 (i18n foundation) เสร็จ

**ผู้ใช้สั่ง:** เริ่มเฟส 0.5

**ทำจริง:**
- ติดตั้ง **`next-intl@4.14.1`** (v3.26 peer ไม่รับ next 16 → ใช้ v4 ที่รองรับ `next ^16` + `react ^18`)
- `src/i18n/config.ts` — `locales ['th','en']`, `defaultLocale 'th'`, `LOCALE_COOKIE 'mmc_locale'`, `localeNames` (endonym), `resolveLocale()`
- `src/i18n/request.ts` — `getRequestConfig` อ่าน cookie → โหลด `messages/<locale>.json` (แบบไม่มี i18n routing)
- `src/i18n/format.ts` — `formatCurrency` (THB) / `formatNumber` / `formatPercent` / `formatDate` รับ locale (แทน fmtBaht/formatCurrency/fmt/fmtDateTH/fmtPct ที่ต้นทางกระจาย)
- `src/i18n/useSetLocale.ts` — hook สลับภาษา (เขียน cookie + `router.refresh()` ใน `useTransition`)
- `src/i18n/messages/{th,en}.json` — namespace: `common`, `nav` (เมนู+breadcrumb labels), `auth`, `errors`, `actions`, `entities` (37 model), `fields` (~130 field), `enums` (20 กลุ่ม — order/payment/production/stock/unit/promotion/sales/recipe/notification + DB-enum ค่าไทย 3 กลุ่มแบบแนวทาง A) + screen namespace ว่าง 13 อัน
- `next.config.ts` — wrap `createNextIntlPlugin("./src/i18n/request.ts")` (คง `reactCompiler`)
- `src/app/layout.tsx` — async, `getLocale()` → `<html lang={locale}>`, ครอบ `NextIntlClientProvider`
- `src/app/providers.tsx` — antd `ConfigProvider locale` = thTH/enUS + `dayjs.locale` ตาม `useLocale()` (useEffect)
- `src/app/page.tsx` — ใช้ `getTranslations("common")`
- `src/components/base/LocaleSwitcher.tsx` — ปุ่ม TH/EN (เฟส 3 Navbar จะ mount)
- `scripts/check-i18n.mjs` + `npm run lint:i18n` — หา literal อักษรไทยนอก `src/i18n|mocks|models|types`
- **ผล: `npm run build` ✅ · `lint` ✅ · `lint:i18n` ✅ (clean)**
- **smoke test** (`next start` + curl): ไม่มี cookie → `<html lang="th">` + ข้อความไทย · `mmc_locale=en` → `<html lang="en">` + ข้อความอังกฤษ ✅

**เลื่อนไปเฟสถัดไป:** set locale cookie จาก `Accept-Language` ใน `proxy.ts` (เฟส 2) · port `entityLabelTh`/`fieldLabelTh`/`formatFieldValue`/`computeFieldDiff` (เฟส 2) · mount LocaleSwitcher ใน Navbar (เฟส 3)

**ถัดไป:** เฟส 1 (models normalize + types + mocks)

---

## #12 — 2026-09-01  ▶ PIVOT: Frontend อย่างเดียว (วางแผน)

**ผู้ใช้สั่ง:**
โฟกัสโปรเจกต์ `NextJS-MeowMeeCake-Frontend` (โคลนจาก `NextJS-MeowMeeCake` state D0.5) · ลบส่วน backend ทั้งหมด (backend เป็นโปรเจกต์แยก) · ทำเฉพาะ frontend เชื่อม backend ผ่าน API

**คำตอบย่อ (วางแผน — ยังไม่เขียนโค้ด):**
- **rewrite `docs/REBUILD_PLAN.md`** เป็น frontend-only:
  - สถาปัตยกรรม: Next (SSR/CSR + proxy guard บาง ๆ) → axios (`src/lib/http.ts`) → Backend REST (แยก)
  - ตัดออก: `src/models/` (38), `src/controllers/`, `src/app/api/**`, `dbConnect`, `createCrudController`, server `session.ts`, `menuAccess`, `omise` · ถอน dep `mongoose`/`bcryptjs`/`jsonwebtoken`/`@types/*`
  - เฟสใหม่: 0 setup(+ถอน backend) · 0.5 i18n ✅ · **1 API layer** (`http.ts` + react-query + DTO `types/` + `services/` + `constants/` + `utils/`) · **2 Auth+shell** (`authClient` + interceptor + `useCurrentUser`/`useIdleTimeout` + `PermissionsContext` + `proxy.ts` cookie-presence + `AuthLayout`/`OwnerLayout`) · **2.5 MSW mock** · 3 component lib · 4 screens(27) · 5 wiring · 6 verify(+ชี้ backend จริง)
- **สร้าง `docs/API_CONTRACT.md`** (DRAFT) — envelope `{data,meta}` · query params · status codes · auth endpoints · resource CRUD (40) · aggregate endpoints · สิ่งที่ frontend ไม่ทำ
- **§FRONTEND PIVOT** เพิ่มใน `AUTH_PLAN.md` / `INVENTORY.md` · **rewrite `MOCKS.md`** เป็น MSW
- **การตัดสินใจ:**
  - เดิมยังใช้: D1 D3 D4 D5 D7 D8 D9 D10
  - ยกเลิก/เปลี่ยน: **D2** (models ถูกลบ) · **D6→D17** · **D11** (backend คุมอายุ token) · **D14** (ย้ายไป backend)
  - **ใหม่ — ค่าแนะนำ รอยืนยัน:** **D15** auth transport = (a) cookie+CORS ถ้า backend subdomain เดียวกัน / (b) bearer token ถ้า cross-origin · **D16** = `@tanstack/react-query` · **D17** = MSW · **D18** = `proxy.ts` เช็ค cookie-presence เท่านั้น (`can_view` → client) · **D19** = ลบ backend residue

**หมายเหตุ:** ไฟล์ D0.5 ถูกคัดลอกมาโฟลเดอร์นี้แล้ว (ยังไม่ commit — `git add` ถูก classifier บล็อกเพราะอยู่นอก working dir หลัก) · `src/models/` ยังอยู่ รอลบตามแผน · `src/lib` `src/constants` `src/mocks` เป็นโฟลเดอร์ว่าง (residue เฟส 1 เดิมที่ revert)

**ถัดไป:** ยืนยัน D15–D19 → เฟส 0 (ปิดงานถอน backend) → เฟส 1

---

## #13 — 2026-09-01  ▶ เฟส 0 (ถอน backend) + เฟส 1 (API layer) เสร็จ

**ผู้ใช้สั่ง:** เริ่มทำเฟส 1  *(ดำเนินตามค่าแนะนำ D15–D19: D15 = cookie + withCredentials (สลับเป็น bearer ได้ที่ `http.ts` จุดเดียว) · D16 = react-query · D17 = MSW · D18 = proxy cookie-presence · D19 = ลบ backend residue)*

**ทำจริง (โฟลเดอร์ `NextJS-MeowMeeCake-Frontend`):**

เฟส 0 — ถอน backend:
- `package.json`: ลบ `mongoose` `bcryptjs` `jsonwebtoken` `@types/bcryptjs` `@types/jsonwebtoken` · เพิ่ม `@tanstack/react-query@^5.62` · name → `meowmeecake-frontend`
- ลบ `src/models/` (38 ไฟล์)
- `.env.local` + `.env.example`: เหลือ `NEXT_PUBLIC_API_BASE_URL` + `NEXT_PUBLIC_API_MOCK` (ตัด MONGODB_URI / JWT_* / OMISE_* / EMAIL_* / GOOGLE_*)
- เพิ่ม `.gitattributes` (LF) · `npm install` (532 pkg, ยืนยัน react 18.3.1 / next 16.2.6)

เฟส 1 — API layer + DTO + contract:
- `src/types/api.ts` — envelope (`ListResponse<T>` / `ItemResponse<T>` / `EmptyResponse` / `ListMeta`) · `ListParams` · `ApiError` + `isApiError()`
- `src/types/auth.ts` — `MenuAction` · `MenuAccess` · `CurrentUser` · `LoginInput` · `src/types/index.ts` (`BreadcrumbItem`, `NotificationItem`, re-export api+auth)
- `src/constants/menuKeys.ts` — port pure (MenuKey, resolveMenuKey, isUnrestrictedRole, FULL/NO_MENU_ACCESS) · `src/constants/enumConfig.ts` — สี/flow enum (label แยกไป i18n)
- `src/lib/cookies.ts` — readCookie/writeCookie (SSR-guard)
- `src/lib/http.ts` — axios `baseURL=NEXT_PUBLIC_API_BASE_URL` + `withCredentials` (D15) · req interceptor แนบ `Accept-Language` จาก cookie locale · res interceptor แปลง error → `ApiError` + 401 hook `setUnauthorizedHandler()` (เฟส 2 ใส่ refresh) · facade `http.get/post/patch/delete<T>` คืน body ตรง
- `src/lib/queryClient.ts` — `makeQueryClient()` (staleTime 30s · retry เฉพาะ network/5xx ผ่าน `isApiError`) · wire `<QueryClientProvider>` ใน `providers.tsx`
- `src/lib/alert.ts` + `src/lib/exportCsv.ts` — port (alert default = English fallback, ผู้เรียกส่ง `t()`)
- **reference pattern:** `src/types/product.ts` + `src/services/products.ts` + `src/services/README.md` — แพตเทิร์นให้ resource อื่น copy ตอนเฟส 4
- `scripts/check-i18n.mjs` — allow `src/constants` (key ค่า DB enum ไทย, แนวทาง A)
- **ผล: `npm run build` ✅ · `lint` ✅ · `lint:i18n` ✅**

**เลื่อนไปเฟส 4 (มี consumer จริงตอนนั้น):** `src/utils/{fieldDiff,promotion,unitContext}` · DTO+service ของ resource อื่น (copy จาก `products`) — `promotion.ts` ต้อง refactor `reason` เป็น code แทนข้อความไทย (i18n)

**ยังไม่ commit** (git ในโฟลเดอร์นี้ถูก classifier บล็อก) · **ถัดไป:** เฟส 2 (auth + app shell)

---

## #14 — 2026-09-01  ▶ เฟส 2 (Auth + app shell) เสร็จ

**ผู้ใช้สั่ง:** เฟส 2

**ทำจริง:**
- `src/constants/auth.ts` (`AUTH_COOKIE` = `NEXT_PUBLIC_AUTH_COOKIE` \|\| `mmc_session` · path constants · broadcast channel) · `src/constants/session.ts` (idle 30 นาที / warn 60 วิ / activity events)
- `src/lib/authClient.ts` — `me` · `login` (post + then me) · `logout` (+broadcast) · `refresh` (single-flight) · `onAuthBroadcast` (BroadcastChannel) · `installAuthInterceptor(onFail)` ต่อ 401 hook ของ `http.ts` → refresh → retry request เดิม / fail → onFail
- `src/hooks/useCurrentUser.ts` (react-query `["auth","me"]`, retry:false, refetchOnWindowFocus) · `src/hooks/useIdleTimeout.ts` (throttle 5 วิ + latest-ref)
- `src/context/PermissionsContext.tsx` — `PermissionsProvider` + `usePermission(key)` (fail closed) + `useMenuAccess()`
- `src/proxy.ts` — cookie-presence guard (D18): `/owner/*` ไม่มี cookie → `/login?next=` · `/login` มี cookie → `/owner/dashboard` · set `mmc_locale` จาก `Accept-Language` · matcher `["/owner/:path*","/login"]`
- `src/components/shared/layout/AuthLayout.tsx` (centered) · `OwnerLayout.tsx` (client — auth gate + idle warn ผ่าน `confirmAlert` + `PermissionsProvider` + placeholder Sidebar/Navbar → เฟส 3)
- `src/components/providers/AuthBootstrap.tsx` (mount ใน `providers.tsx`) — install interceptor + ฟัง logout ข้ามแท็บ → `qc.clear()` + redirect
- route: `app/page.tsx` (redirect ตาม cookie, แทน placeholder เดิม) · `app/login/{layout,page}.tsx` (login form interim — เฟส 4 = Screen #1 เต็ม) · `app/owner/layout.tsx` (re-export) · `app/owner/dashboard/page.tsx` (stub)
- fix lint: `useIdleTimeout` เขียน ref ใน `useEffect` แทน render body
- **ผล: `build` ✅ (routes: `/`, `/login`, `/owner/dashboard`, Proxy) · `lint` ✅ · `lint:i18n` ✅**
- **หมายเหตุ:** runtime auth flow ทดสอบไม่ได้จนกว่าจะมี MSW (เฟส 2.5) — ยังไม่มี backend ให้ยิง

**ถัดไป:** เฟส 2.5 (MSW mock API — handlers ตาม `API_CONTRACT.md` + fixtures + toggle `NEXT_PUBLIC_API_MOCK`)

---

## #15 — 2026-09-01  ▶ เฟส 2.5 (Mock API / MSW) เสร็จ

**ผู้ใช้สั่ง:** เฟส 2.5

**ทำจริง:**
- `msw@2.15` (devDep) + `npx msw init public/` → `public/mockServiceWorker.js` + `package.json` `msw.workerDirectory`
- `src/mocks/db.ts` — in-memory store: `seed` (generic) + `list` (page/limit/search substring/sort/filter ตรงตัว) / `getById` / `create` / `update` / `softDelete` — ตาม `API_CONTRACT.md` §1
- `src/mocks/handlers/_crud.ts` — `crudHandlers(name, basePath)` factory (GET list/`:id` · POST · PATCH · DELETE + 404)
- `src/mocks/handlers/auth.ts` — `/auth/login|logout|me|refresh` · login = `DEV_CREDENTIALS` (`owner@meowmeecake.local` / `owner1234`) → ตั้ง cookie `mmc_session` ผ่าน `document.cookie` (ให้ `proxy.ts` Node อ่านเจอ) · `me` คืน `MOCK_USER` + menuAccess เต็ม (owner)
- `src/mocks/fixtures/{auth,products}.ts` (สินค้า 5 รายการ) · `handlers/index.ts` (seed + รวม) · `browser.ts` (`startMockWorker` single-flight, `onUnhandledRequest:"bypass"`) · `server.ts` (test)
- `src/components/providers/MSWReady.tsx` — `NEXT_PUBLIC_API_MOCK==="1"` → `import("@/mocks/browser")` + start → render children · mock off → dynamic import ไม่เข้า bundle · wire ครอบ `{children}` ใน `providers.tsx`
- `proxy.ts` — เพิ่ม `/` ใน matcher + redirect ที่ proxy (redirect ใน `page.tsx` = meta-refresh ตอน streaming ตาม Next 16 docs → ทำที่ proxy ให้เป็น 307)
- `eslint.config.mjs` — ignore `public/mockServiceWorker.js` · fix `db.ts seed` generic type
- `docs/MOCKS.md` — credential + สถานะ handler + วิธีเพิ่ม resource (2 บรรทัด)
- **ผล: `build` ✅ · `lint` ✅ · `lint:i18n` ✅**
- **curl verified:** `/` (±cookie) → 307 `/login` \| `/owner/dashboard` · `/owner/*` no-cookie → 307 `/login?next=` · `/login` +cookie → 307 dashboard · `mockServiceWorker.js` → 200
- **ยังไม่เทส (ต้องเบราว์เซอร์ + Service Worker):** login form → MSW `/auth/login` → cookie → `/auth/me` → dashboard — เฟส 6 หรือ `npm run dev` เทสมือด้วย credential ข้างบน

**ถัดไป:** เฟส 3 (component library — `base/` + `shared/` + `COMPONENT_MAP.md`)
