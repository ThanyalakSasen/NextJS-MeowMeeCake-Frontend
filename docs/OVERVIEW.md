# ภาพรวมโปรเจกต์ — MeowMeeCake Frontend

> **เอกสารนี้คืออะไร:** แผนที่ย่อของทั้งโปรเจกต์ในหน้าเดียว — แอปทำอะไร, ใช้เครื่องมืออะไร, โค้ดวางยังไง, ตอนนี้ทำถึงไหน, และเอกสารเล่มไหนเปิดอ่านตอนไหน
> **เปิดอ่านเมื่อ:** วันแรกที่เข้าโปรเจกต์ (อ่านก่อน `README.md`) · อยากได้ภาพรวมเร็ว ๆ ก่อนลงรายละเอียด · ลืมว่าเรื่องหนึ่ง ๆ อยู่เอกสารไหน
> **ทำไมสำคัญ:** `README.md` = "อ่านจบแล้วแก้โค้ดได้" (ยาว) · เอกสารนี้ = "รู้ว่าอะไรอยู่ไหน" (สั้น) แล้วค่อยเจาะตามลิงก์
> **ความสัมพันธ์:** ไม่ทับกับ `REBUILD_PLAN.md` (แผน+การตัดสินใจ) — เอกสารนี้สรุป *สถานะปัจจุบัน* ไม่ใช่ประวัติการตัดสินใจ

---

## 1. แอปนี้คืออะไร (1 นาที)

- **ทำอะไร:** เว็บหลังบ้านร้านเค้ก — สินค้า, คำสั่งซื้อ, พรีออเดอร์, โปรโมชัน, POS หน้าร้าน, วัตถุดิบ, สูตร, การผลิต, พนักงาน, การเงิน, รายงาน, แบนเนอร์, แจ้งเตือน · รวม **30 หน้า** (Login + 29 หน้า owner — เพิ่มจาก 27 เดิมตอนเชื่อม backend จริง: รอบพรีออเดอร์, ตั้งราคา, คูปอง, ยอดขาย, รีวิวลูกค้า)
- **ใครใช้:** เจ้าของร้าน (เห็นทุกอย่าง) + พนักงาน (เห็นเฉพาะที่ได้รับสิทธิ์จริงจาก backend ผ่าน `/api/auth/me`)
- **ขอบเขต:** **frontend เท่านั้น** — ไม่มี DB / ไม่เข้ารหัสรหัสผ่าน / ไม่ออก token · backend เป็นคนละโปรเจกต์ คุยผ่าน REST API
- **2 ภาษา:** ไทย (ค่าเริ่มต้น) / อังกฤษ — สลับได้ทุกหน้า
- **เชื่อม backend จริงแล้ว (2026-09):** `.env.local` ตั้ง `NEXT_PUBLIC_API_MOCK=0` ยิงเข้า backend จริงที่ `NEXT_PUBLIC_API_BASE_URL` เสมอ — **MSW** (backend ปลอมในเบราว์เซอร์ตอบตาม `API_CONTRACT.md`) ยังอยู่ในโค้ด ใช้เป็น fallback ตอน dev โดยไม่มี backend รันอยู่เท่านั้น (`NEXT_PUBLIC_API_MOCK=1`) ไม่ใช่โหมดหลักอีกต่อไป

---

## 2. Tech stack

| ด้าน | ใช้ | หมายเหตุ |
|---|---|---|
| Framework | **Next.js 16.2.6** (App Router) | `reactCompiler: true` · `src/proxy.ts` = middleware เดิม (Node runtime) |
| UI | **React 18.3.1** + TypeScript | |
| Component | **antd 6** | เรียกผ่าน `components/base/` เท่านั้น — ไม่เรียก antd ตรงจากหน้า |
| Styling | **Tailwind 4** | จัด layout/spacing/สี · antd = component, Tailwind = จัดวาง |
| i18n | **next-intl 4** | locale ใน cookie `mmc_locale` — ไม่มี `/th` `/en` ใน URL |
| Server-state | **@tanstack/react-query 5** | ViewModel wrap `useQuery` / `useMutation` |
| HTTP | **axios** | instance + interceptor เดียวที่ `src/lib/http.ts` |
| Mock API | **MSW 2** | toggle `NEXT_PUBLIC_API_MOCK=1` · persist ลง `localStorage` |
| อื่น ๆ | sweetalert2 (`lib/alert.ts`) · dayjs · recharts · qrcode · heroicons / lucide | |
| Theme | `src/theme/*.ts` (antd tokens) + `globals.css @theme` (Tailwind) | ค่าสีอยู่ 2 ที่ — `npm run lint:theme` เทียบให้ตรง |

---

## 3. สถาปัตยกรรม

```
Browser
  │  HTTP
  ▼
Next.js (โปรเจกต์นี้: SSR/CSR + proxy guard บาง ๆ)
  │
  │  ViewModel → services/* → src/lib/http.ts (axios + interceptor)
  ▼
 ┌─────────────────────────────┐
 │ NEXT_PUBLIC_API_MOCK = 1 ?  │  ← .env.local จริงตอนนี้ตั้งเป็น 0 (ยิง backend จริงเสมอ)
 └───────────┬─────────────────┘
     yes ────┤──── no (ค่าจริงตอนนี้)
     ▼       │      ▼
 MSW         │   Backend REST API จริง (โปรเจกต์แยก, พอร์ต 3000)
 src/mocks/  │   /api/auth/*  /api/admin/products  /api/admin/orders ...
 (fallback   │   (path จริงมี /api/admin/* หรือ /api/shop/* นำหน้าเสมอ — ต่างจาก
  ตอน dev    │   ที่ร่างไว้เดิมใน API_CONTRACT.md ที่ไม่มี /admin — ดู MOCKS.md)
  ไม่มี      │
  backend)   │
     └───────┴──────┘
             ▼
   interceptor แกะ envelope { data, meta } → ViewModel ได้ข้อมูลเหมือนกันทั้ง 2 ทาง
```

**จุดสำคัญ:** หน้า (`page.tsx` / `*View.tsx`) **ไม่เคย** เรียก `fetch` / `axios` เอง — ผ่าน ViewModel → `services/*` → `http.ts` เสมอ (เพื่อสลับ mock ↔ backend จริงได้ที่เดียว)

---

## 4. เส้นทางของ 1 request (โค้ดจริง)

```tsx
// app/owner/products/page.tsx — จุดเชื่อมบาง ๆ
"use client";
export default function ProductsPage() {
  const vm = useProductsViewModel();
  return <ProductsView {...vm} />;
}
```

```ts
// app/owner/products/useProductsViewModel.ts — สมองของหน้า (ไม่มี JSX)
const perm = usePermission("products");                       // ซ่อนปุ่มตามสิทธิ์
const productsQ = useQuery({
  queryKey: ["products", params],
  queryFn: () => productsService.list(params),                // → { data, meta }
});
const remove = useMutation({
  mutationFn: (id: string) => productsService.remove(id),
  onSuccess: () => { alert.success(t("products.deleted")); qc.invalidateQueries({ queryKey: ["products"] }); },
});
```

```ts
// src/services/products.ts — 1 ไฟล์ต่อ 1 resource
export const productsService = {
  list:   (params) => http.get("/products", { params }),
  remove: (id)     => http.delete(`/products/${id}`),
  // ...
};
```

```tsx
// app/owner/products/ProductsView.tsx — JSX ล้วน รับ props จาก ViewModel
export function ProductsView(vm: ReturnType<typeof useProductsViewModel>) {
  const t = useTranslations();                                // t เดียว, key path เต็ม
  return (
    <ListPageLayout title={t("products.title")}
      actions={vm.perm.create && <Button href="/owner/products/addProducts">{t("products.addProduct")}</Button>}>
      {/* ...ตาราง/กริด... */}
    </ListPageLayout>
  );
}
```

---

## 5. โครงสร้างโฟลเดอร์

```
src/
  app/
    layout.tsx · providers.tsx · page.tsx · globals.css   ← shell + ธีม + provider
    login/                     (AuthLayout — ไม่มีเมนู)
    owner/
      layout.tsx               (OwnerLayout: Sidebar + Navbar + PermissionsProvider + idle)
      <route>/                 1 หน้า = page.tsx + use<X>ViewModel.ts + <X>View.tsx
        _components/            component เฉพาะหน้านั้น
  proxy.ts                     ด่านหน้า: เช็คแค่ "มี" auth cookie ไหม (D18)

  lib/        http.ts · authClient.ts · queryClient.ts · alert.ts · exportCsv.ts · cookies.ts
  services/   1 ไฟล์ต่อ resource — เรียก http.ts, คืน DTO
  types/      DTO (interface ตรงกับ JSON ของ backend)
  constants/  menuKeys · menu · breadcrumb · enumConfig (สี/flow — ไม่มี label) · auth · session
  context/    PermissionsContext — usePermission("<menuKey>")
  hooks/      useCurrentUser · useIdleTimeout · useNotifications
  i18n/       config · request · format · messages/{th,en}.json (27 namespace)
  theme/      palette · tokens · antdTheme · index
  components/
    base/     19 atoms — ครอบ antd + ธีม (Button, Input, Select, DatePicker, ...)
    shared/   layout | data | feedback | stats | form  — ใช้ ≥ 2 หน้า
  mocks/      MSW — db · handlers/ · fixtures/  (ลบทั้งโฟลเดอร์ได้เมื่อ backend พร้อม)

docs/         เอกสารทั้งหมด (ดู §9)
scripts/      check-i18n.mjs · check-theme.mjs
```

---

## 6. กติกาหลัก 4 เรื่อง

### 6.1 MVVM — 1 หน้า = 3 ไฟล์
`page.tsx` (บาง) · `use<X>ViewModel.ts` (state / query / mutation / handler / `usePermission` — **ไม่มี JSX**) · `<X>View.tsx` (JSX ล้วน — **ไม่มี fetch / data-useEffect**) · หน้าจิ๋วยุบเหลือ `page.tsx` ไฟล์เดียวได้ · รายละเอียด → `CODE_STRUCTURE.md`

### 6.2 Component — ตัดสินด้วย "ใช้กี่หน้า?"
UI ล้วนไม่มี logic → `components/base/` · ใช้ ≥ 2 หน้า → `components/shared/<หมวด>/` · ใช้หน้าเดียว → `app/owner/<หน้า>/_components/` · หน้าที่ 2 มาใช้ → promote ขึ้น `shared/` · รายละเอียด → `COMPONENT_MAP.md`

### 6.3 i18n — `t` เดียว, key = path เต็ม
```tsx
const t = useTranslations();          // ไม่ใส่ namespace
t("products.title")                    // key ตรงกับ path ใน messages json เป๊ะ
```
เพิ่มข้อความใหม่ = เติม key **เดียวกันทั้ง** `messages/th.json` + `en.json` · พิมพ์ key ผิด = build error (ผ่าน `messages.d.ts`) · เขียนไทยตรง ๆ ใน `.tsx` = `lint:i18n` จับ · enum ที่ DB เก็บค่าไทย ใช้ `t("enums.<group>.<ค่าไทย>")` (แนวทาง A) · รายละเอียด → `I18N_PLAN.md`

### 6.4 Auth — สิทธิ์ = แค่ UX
backend เป็นเจ้าของทุกอย่างสำคัญ (ตรวจรหัส, ออก token, บังคับสิทธิ์จริง) · frontend ทำแค่: `authClient` (login/logout/me) · interceptor `401 → เด้ง login ทันที` (**ไม่มี refresh/retry** — backend ไม่มี refresh token จริง ใช้ JWT อายุ 7 วันตรง ๆ, 401 = session หมดอายุจริงเสมอ ยกเว้น `/auth/login` เองที่ 401 = รหัสผ่านผิด ต้องโชว์ error ของ backend ไม่ใช่เด้ง login) · `menuAccess` มาจากสิทธิ์จริงที่ backend คำนวณให้ผ่าน `/api/auth/me` (ไม่ได้เดาจาก `role_type` ฝั่ง client แล้ว) · `useIdleTimeout` (เตือน 60 วิ ก่อน idle หมด) · `usePermission()` ซ่อนปุ่ม/เมนู + `OwnerLayout` กั้นหน้าตาม URL ด้วย · `proxy.ts` เช็คแค่ *มี* auth cookie · **"ซ่อนปุ่ม ≠ ปลอดภัย"** · รายละเอียด → `AUTH_PLAN.md`

---

## 7. สถานะโปรเจกต์

| เฟส | งาน | สถานะ |
|---|---|---|
| 0 | Setup + ถอน backend residue | ✅ |
| 0.5 | i18n foundation (next-intl) | ✅ |
| 1 | API layer — `http.ts` · react-query · DTO · services · `API_CONTRACT.md` | ✅ |
| 2 | Auth + app shell — `authClient` · `PermissionsContext` · `proxy.ts` · layouts | ✅ |
| 2.5 | Mock API (MSW) — handlers + fixtures + toggle | ✅ |
| 3 | Component library — `base/` (19) + `shared/` | ✅ |
| 4 | **27 screens** — page + View + ViewModel ทุกหน้า | ✅ 27/27 (2026-09-07) |
| 5 | Wiring — providers, sidebar, permission gate, breadcrumb | ✅ |
| **6** | **Verify** — lint/build เขียว · สลับ locale ครบทุกหน้า · auth flow จริง · **สลับ MSW ออก → ชี้ backend จริง → smoke test** | ✅ (2026-09) — `NEXT_PUBLIC_API_MOCK=0` เชื่อม backend จริงแล้ว ทดสอบจริงผ่านเบราว์เซอร์ (ล็อกอินจริง + คลิกทุกหน้า) พบ+แก้ mismatch หลายจุดระหว่างทาง (path ไม่มี `/admin` prefix, envelope list ซ้อนชั้นผิด, field name ไม่ตรง ฯลฯ — ดู `Debug.md`) |
| **7** | **Backend integration hardening** — auth/permission จริงจาก backend, money-unit migration, BSON Timestamp data fix, permission-key alignment ฯลฯ | 🔄 ทำต่อเนื่อง — ดู backend `docs/BACKLOG2.md` และ `docs/BACKLOG.md` (ฉบับนี้) สำหรับรายการที่พบ/แก้แล้ว |

> รายการหน้าเต็ม + สถานะ wiring ต่อหน้า → `SCREEN_MAP.md` · รายละเอียดสิ่งที่ทำในแต่ละเฟส → `REBUILD_PLAN.md` §5 · ปัญหาที่พบระหว่างเชื่อม backend จริง → `Debug.md`/`BACKLOG.md`

---

## 8. คำสั่ง & ก่อน commit

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | dev server ที่ **`:3001`** (hardcode ไว้ใน `package.json` กันชนพอร์ตกับ backend ที่ `:3000` — mock mode ถ้าตั้ง `NEXT_PUBLIC_API_MOCK=1`) |
| `npm run build` | build + เช็ค TypeScript ทั้งโปรเจกต์ |
| `npm run lint` | ESLint |
| `npm run lint:i18n` | เช็ค key parity th/en + จับ literal ข้อความไทยนอกไฟล์แปล |
| `npm run lint:theme` | เทียบสีใน `theme/palette.ts` ↔ `globals.css` |
| **`npm run check`** | **`lint:i18n` + `lint:theme` + `tsc --noEmit` + `eslint` รวดเดียว — ต้องเขียวก่อน commit** |

**env** (`.env.local` คัดจาก `.env.example`): `NEXT_PUBLIC_API_BASE_URL` (URL backend รวม `/api` ต่อท้าย — backend เสิร์ฟใต้ `/api/*`) · `NEXT_PUBLIC_API_MOCK` (`1` = MSW · **`0` = backend จริง ← ค่าจริงตอนนี้**) · `NEXT_PUBLIC_AUTH_COOKIE=session` (ชื่อ cookie จริงจาก backend ไม่ใช่ `mmc_session` ตามแผนเดิม)
**credential mock (MSW เท่านั้น, ไม่เชื่อมระบบจริง):** `owner@meowmeecake.local` / `owner1234` — **credential จริง** (backend จริง): ดู `Debug.md` (ไม่ใส่ค่าจริงในไฟล์นี้)

---

## 9. เอกสารใน `docs/`

| ไฟล์ | คืออะไร | เปิดอ่านเมื่อ |
|---|---|---|
| `OVERVIEW.md` (นี้) | แผนที่ย่อ + สถานะปัจจุบัน | วันแรก / อยากได้ภาพรวมเร็ว |
| `REBUILD_PLAN.md` | แผนแม่บท — เป้าหมาย, สถาปัตยกรรม, 8 เฟส, การตัดสินใจ D1–D19 พร้อมเหตุผล | อยากรู้ทำถึงไหน / ทำไมเลือกแนวนี้ |
| `CODE_STRUCTURE.md` | กติกา MVVM — View/ViewModel วางยังไง ตั้งชื่ออะไร แตกไฟล์เมื่อไหร่ | ก่อนสร้างหน้า/component ที่มี logic |
| `API_CONTRACT.md` | สัญญา REST กับ backend — envelope, params, status, auth, 40 resource | ก่อนเขียน service / mock / DTO ใหม่ |
| `MOCKS.md` | MSW ทำงานยังไง + handler ที่มี + credential dev + checklist ปิด mock | dev โดยไม่มี backend / จะต่อ backend จริง |
| `I18N_PLAN.md` | ระบบ 2 ภาษา — โครง namespace, การจัดการ enum ค่าไทย | เพิ่มภาษา / ข้อความแปลไม่ครบ / งง key |
| `AUTH_PLAN.md` | auth ฝั่ง frontend — interceptor 401→refresh, idle, cross-tab | แตะโค้ด login / session / permission |
| `THEME.md` | design token 2 ชั้น (antd + Tailwind) แก้สีที่ไหน | เปลี่ยนสีแบรนด์ / เพิ่ม token |
| `INVENTORY.md` | แจกแจงทุก entity / field / enum / util จากระบบเดิม | ก่อนสร้าง DTO / หา enum / ตั้งชื่อฟิลด์ |
| `COMPONENT_MAP.md` | ทะเบียน component → อยู่ `base`/`shared`/หน้าไหน → ใช้กี่หน้า | หา component / จะสร้างใหม่หรือใช้ของเดิม |
| `SCREEN_MAP.md` | สถานะ wiring ของ 27 หน้า — route, menuKey, breadcrumb, ทางเข้า | ก่อน/หลังจบ screen / กดเมนูแล้วไปผิดหน้า |
| `PROMPT_HISTORY.md` | ไทม์ไลน์การพัฒนา — แต่ละครั้งสั่งอะไร ทำอะไรไป | อยากรู้ที่มาของโค้ด / เฟสไหนเสร็จ |

---

## 10. ทำ ✅ / อย่า ❌

**ทำ ✅**
- หน้าใหม่ = `page.tsx` (บาง) + `use<X>ViewModel.ts` + `<X>View.tsx`
- เรียก API ผ่าน `services/*` → `http.ts` เท่านั้น
- ข้อความทุกคำผ่าน `t("...")` — เติมทั้ง `th.json` + `en.json`
- ใช้ปุ่ม/input จาก `components/base/` · ซ่อนปุ่มด้วย `usePermission(...)` ใน ViewModel
- **อ่าน `node_modules/next/dist/docs/` ก่อนแตะโค้ดที่เกี่ยวกับ Next** (เวอร์ชันนี้ต่างจากที่คุ้น — `AGENTS.md`)
- `npm run check` ให้เขียวก่อน commit

**อย่า ❌**
- เขียนข้อความไทย/อังกฤษตรง ๆ ใน `.tsx`
- `fetch` / `axios` ใน `page.tsx` หรือ `*View.tsx`
- `useState` / `useEffect` โหลดข้อมูลใน `*View.tsx` (ย้ายไป ViewModel)
- เรียก antd ตรงจากหน้า (ผ่าน `base/` เสมอ)
- คิดว่า "ซ่อนปุ่ม = ปลอดภัย" (backend คือตัวบังคับจริง)
- ลบ block auto-generated ท้าย `AGENTS.md` (จะถูกสร้างใหม่ — commit ไปกับงานได้เลย)
