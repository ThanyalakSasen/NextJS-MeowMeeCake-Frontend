# Theme System

> **เอกสารนี้คืออะไร:** วิธีที่โปรเจกต์เก็บ "ค่าออกแบบ" (สี ขนาดตัวอักษร ความสูงปุ่ม มุมโค้ง เงา ฯลฯ) ไว้ที่เดียว แล้วป้อนให้ทั้ง **Tailwind** และ **antd**
> **เปิดอ่านเมื่อ:** จะเปลี่ยนสีแบรนด์ · เพิ่ม token ใหม่ · สงสัยว่าค่านี้แก้ที่ไหน
> **ทำไมสำคัญ:** มี 2 ระบบที่ render UI (utility ของ Tailwind + component ของ antd) — ถ้าไม่รวมค่าไว้ที่เดียว สี/ขนาดจะเพี้ยนกันเอง

---

## 1. โครงสร้าง 2 ชั้น

```
                 ┌─────────────────────────────┐
                 │  ค่าออกแบบ (design tokens)   │
                 └──────────────┬──────────────┘
              ┌─────────────────┴──────────────────┐
   ฝั่ง JS / antd                          ฝั่ง CSS / Tailwind
   src/theme/                              src/app/globals.css
   ─────────                               ──────────────────
   palette.ts   สีดิบ (hex)         ◄─sync─►  @theme  --color-brown-*, --color-danger …
      │                                       :root   โทเคนเชิงความหมาย + ขนาดโครงหน้า
   tokens.ts    โทเคนเชิงความหมาย
      │         (color.brandPrimary,
      │          control.height, a11y … )
   antdTheme.ts → ThemeConfig ป้อน <ConfigProvider> ใน src/app/providers.tsx
      │
   index.ts     re-export → `import { color, theme, antdTheme } from "@/theme"`
```

**เส้น `sync`** = ค่าสีอยู่ 2 ที่ (JS อ่าน CSS ไม่ได้ตอน build) — `npm run lint:theme` เทียบให้

---

## 2. แก้ค่าที่ไหน

| จะเปลี่ยน | แก้ไฟล์ | หมายเหตุ |
|---|---|---|
| **สีแบรนด์ / สีสถานะ** | `src/theme/palette.ts` **และ** `src/app/globals.css` (`@theme`) | ต้องแก้ทั้งคู่ให้ตรง แล้วรัน `npm run lint:theme` |
| ขนาดตัวอักษร (antd) · ความสูงปุ่ม · มุมโค้ง | `src/theme/tokens.ts` (`typography`, `control`) | antd อ่านผ่าน `antdTheme.ts` |
| ขนาดตัวอักษรฐานทั้งหน้า | `src/app/globals.css` → `html { font-size }` | Tailwind `text-*` เป็น rem ขยายตามอัตโนมัติ |
| สี/ระยะของ Sidebar, Navbar, Breadcrumb | `src/app/globals.css` → `:root` (บล็อกที่ 1) | ค่าสีอ้าง `var(--color-brown-*)` ไม่ใส่ hex ซ้ำ |
| touch target / เส้นโฟกัส | `tokens.ts` (`a11y`) + `globals.css` (`--touch-target`, `--focus-ring-*`) | |
| z-index / transition / เงา | `src/theme/tokens.ts` (`zIndex`, `motion`, `elevation`) | |
| สีของ badge สถานะ order/payment/production | `src/constants/enumConfig.ts` | เป็น palette เฉพาะโดเมน แยกจาก theme กลางตั้งใจ |

---

## 3. ใช้ token ในโค้ด

**className (ปกติที่สุด)** — ใช้ utility ของ Tailwind ตามเดิม ไม่ต้อง import อะไร:
```tsx
<div className="bg-brown-800 text-white rounded-lg" />
<span className="text-gray-600" />          {/* ข้อความรอง */}
<p className="text-danger" />                {/* = var(--color-danger) */}
```

**ต้องได้ค่าเป็น string/number** (inline style, ส่งให้ lib ภายนอก, logic):
```ts
import { color, control, a11y } from "@/theme";

confirmButtonColor: color.danger;           // "#DC2626"
style={{ minHeight: a11y.touchTargetPx }}   // 44
```

**antd ThemeConfig** — จุดเดียวคือ `src/theme/antdTheme.ts` (providers.tsx แค่ import มาเสียบ)

> **อย่า** `import "@/theme/palette"` ตรง ๆ ในหน้า/คอมโพเนนต์ — ใช้ `color.*` จาก `tokens.ts` (ผ่าน `@/theme`) เพื่อให้อ้างชื่อบทบาท ไม่ใช่เฉดสี

---

## 4. สเกลตัวอักษร (เป็นมิตรกับผู้สูงอายุ)

- ฐาน **18px** (`html { font-size: 112.5% }`) → `text-base` = 18, `text-sm` ≈ 15.75, `text-xl` ≈ 22.5, `text-2xl` = 27
- `line-height: 1.7` ที่ body (อักษรไทยมีวรรณยุกต์บน-ล่าง ต้องการช่องบรรทัดกว้าง)
- antd: `fontSize 17`, heading 28/24/20/18/16, `controlHeight 40` (LG 48 / SM 32)
- คอนทราสต์: ห้าม `text-gray-400` (ไม่ผ่าน WCAG AA) — ใช้ `gray-600`/`gray-700` หรือ `--text-muted`
- touch target ≥ 44px, เส้นโฟกัส `:focus-visible` หนา 3px

---

## 5. ตรวจสอบ

```bash
npm run lint:theme    # เทียบสีใน palette.ts ↔ globals.css
npm run check         # i18n + theme + tsc + eslint รวดเดียว
```
