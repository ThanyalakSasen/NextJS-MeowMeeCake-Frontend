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
| ขนาดตัวอักษร (antd) · ความสูง control · มุมโค้ง | `src/theme/tokens.ts` (`typography`, `control`) | antd อ่านผ่าน `antdTheme.ts` · ดู §4.2 |
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

- ฐาน **18px** (`html { font-size: 112.5% }`)
- `line-height: 1.7` ที่ body (อักษรไทยมีวรรณยุกต์บน-ล่าง ต้องการช่องบรรทัดกว้าง)
- touch target **44px** (เป็น px ตรง ๆ ไม่ใช่ rem — ดู §4.2), เส้นโฟกัส `:focus-visible` หนา 3px

| ใช้กับ | ขนาด | เขียนยังไง |
|---|---|---|
| ปุ่ม · ช่องกรอก · ตาราง · เมนู · เนื้อหาหลัก | **18px** | `text-base` / antd `fontSize` |
| ข้อความย่อย · ข้อความเล็กสุด | **16px** | `text-sm` (`text-xs` เท่ากัน — ดูกล่องข้างล่าง) |
| หัวข้อ h1–h5 | 28/24/20/18/16 | `text-2xl` … · antd `fontSizeHeading*` |

> ⚠️ **`text-xs` กับ `text-sm` ขนาดเท่ากันแล้ว (16px ทั้งคู่)**
> 16px คือพื้นขั้นต่ำของทั้งแอป — เล็กกว่านี้อ่านยากสำหรับอักษรไทยที่มีวรรณยุกต์ซ้อนสองชั้น
> โค้ดเก่าใช้ `text-xs` อยู่ 321 จุด จึงคงค่าไว้ให้เท่ากันแทนการไล่เปลี่ยนชื่อทั้งหมด
> **ของใหม่ให้ใช้ `text-sm`** — `text-xs` ถือเป็นหนี้ที่รอเก็บ

### 4.1 สเกลสีเทาของข้อความ — กฎคอนทราสต์

> เดิมเขียนแค่ "ห้าม `gray-400` ใช้ `gray-600`/`gray-700`" ซึ่งไม่ครอบคลุมข้อความรองที่ต้องการโทนอ่อนกว่านั้น
> ระบุให้ชัดหลังไล่เก็บ 106 จุด (2026-10-10 · `CONSISTENCY_AUDIT.md` ข้อ 3.4)

| คลาส | hex | คอนทราสต์บนขาว | ใช้กับ |
|---|---|---|---|
| ~~`text-gray-400`~~ | `#9ca3af` | **2.54:1 ❌** | **ห้ามใช้** — ตกทั้งเกณฑ์ข้อความ (4.5) และกราฟิก (3.0) |
| `text-gray-500` | `#6b7280` | 4.83:1 ✅ | ข้อความรอง · คำใบ้ · หน่วย · ไอคอนประกอบ · `placeholder:` |
| `text-gray-600` | `#4b5563` | 7.56:1 ✅ | label · คำอธิบาย (= `--text-muted` ค่าเดียวกันเป๊ะ) |
| `text-gray-700` | `#374151` | 10.31:1 ✅ | ข้อความเนื้อหาที่ไม่ใช่หัวข้อ |

**เลือกยังไง:** อ่อนที่สุดที่ยังผ่าน = `gray-500` · ถ้าเป็น label/คำอธิบายที่ต้องอ่านง่ายกว่านั้น = `gray-600`

> ⚠️ **`placeholder-gray-400` (ไม่มี `:` ) คือ syntax ของ Tailwind v3** ซึ่ง **v4 ไม่รองรับแล้ว** — เขียนไปก็ไม่มีผล
> โปรเจกต์นี้ใช้ v4 ต้องเขียน `placeholder:text-gray-500` · กฎ `no-gray-400` ดักทั้ง 2 แบบแล้ว

---

### 4.2 ความสูง control — 36px เท่ากันหมด

ปุ่ม · `Input` · `Select` · `InputNumber` · `DatePicker` · `Segmented` · `Radio.Group buttonStyle="solid"`
→ สูง **36px เท่ากันหมด รวม padding แล้ว** (`control.heightSM = height = heightLG = 36`)

`size="small"` / `"large"` **ไม่เปลี่ยนความสูงอีกต่อไป** — เหลือแค่ระยะซ้าย-ขวา

**ทำไม 36 ไม่ใช่ 32:** antd ไม่ได้ตั้งความสูงตรง ๆ แต่คำนวณ padding ย้อนกลับ
และ**ปุ่มกับช่องกรอกคิด line-height คนละสูตร**:

| | ความสูงเนื้อหา | ที่ 18px | padding ที่ 36px | padding ที่ 32px |
|---|---|---|---|---|
| ปุ่ม | `fontSize + 8` | 26px | 4px ✅ | 2px ✅ |
| ช่องกรอก | `fontSize × lineHeight` | 30.6px | 1.7px ✅ | **0 — ล้นขอบ 0.6px ❌** |

36 คือค่าต่ำสุดที่ทั้งสองแบบอยู่ได้ · สูตรอยู่ที่ `node_modules/antd/lib/button/style/token.js`

**ข้อยกเว้นที่ตั้งใจไม่ให้เป็น 36px:**

| อะไร | สูง | เพราะ |
|---|---|---|
| `Switch` | 30.6px | เป็น toggle ไม่ใช่ field — จงใจให้เล็กกว่า (antd อิง fontSize) |
| `Checkbox` | 18px | กล่องติ๊ก |
| ปุ่มใน POS (`OrderInStore`) | 44–54px | จอสัมผัสหน้าเคาน์เตอร์ ย่อเหลือ 36 จะกดยาก และตก WCAG 2.5.5 |
| ปุ่มกระดิ่ง / แฮมเบอร์เกอร์ | 44px | `--touch-target` — ดูข้อถัดไป |

### 4.3 กับดักหน่วย: Tailwind กับ antd คิดคนละระบบ

**`rem` ของโปรเจกต์นี้ = 18px ไม่ใช่ 16px** สเกลระยะของ Tailwind จึง**ใหญ่กว่าชื่อ 12.5%**:

| เขียน | คนมักคิดว่า | **ได้จริง** |
|---|---|---|
| `h-8` | 32px | **36px** ← พอดีกับ control ใหม่ |
| `h-10` | 40px | 45px |
| `h-11` | 44px | 49.5px |
| `h-12` | 48px | 54px |

เวลาทำ control เองด้วย `<button>` ธรรมดา ให้ใช้ **`h-8`** จึงจะสูงเท่า antd

ด้วยเหตุนี้ **คอมเมนต์ `/* Npx */` ใน `globals.css` เคยผิดมาแล้วหลายจุด** (เขียน 17px แต่จริง 19.125px)
`npm run lint:theme` ตรวจให้แล้วว่า rem กับคอมเมนต์ตรงกันจริง

**ค่าที่ห้ามเขียนเป็น `rem`:** `--touch-target` — ขนาดนิ้วคนไม่ควรขยายตามขนาดตัวอักษร

## 5. ตรวจสอบ

```bash
npm run lint:theme       # เทียบสีใน palette.ts ↔ globals.css
npm run lint:ui          # กฎ UI (ห้าม text-gray-400 · สี Tag ต้องมาจาก enumConfig · ไอคอน · aria-label)
npm run check            # i18n + theme + ui + tsc + eslint รวดเดียว
npm run lint:ui:update   # หลังแก้ของเดิมไปแล้ว — ขัน baseline ไม่ให้ถอยกลับ
```

**กฎที่ตรวจอัตโนมัติแล้ว** (`scripts/check-ui.mjs` — เพิ่ม 2026-10-10):

| กฎในเอกสารนี้ | ชื่อกฎในสคริปต์ |
|---|---|
| §4.1 ห้าม `text-gray-400` (รวม `placeholder-gray-400` ของ Tailwind v3) | `no-gray-400` |
| §2 สี badge สถานะต้องมาจาก `enumConfig.ts` | `tag-color-enum` |
| §4.3 คอมเมนต์ `/* Npx */` ต้องตรงกับ `rem` จริงที่ฐาน 18 | `check-theme.mjs` |
| §4.1 ฐานตัวอักษรต้องตรงกันทั้ง `tokens.ts` และ `globals.css` | `check-theme.mjs` |
| §4.2 touch target ต้องตรงกันทั้งสองไฟล์ | `check-theme.mjs` |
| §1.3 ของ `ACTION_BUTTONS.md` — ปุ่มมีไอคอน ห้ามมีสัญลักษณ์ซ้ำ | `icon-glyph-duplicate` |

**กฎทั้งหมดที่ `npm run check` บังคับตอนนี้ (6 ข้อ · baseline เหลือ 1 จุดที่ยกเว้นไว้พร้อมเหตุผล):**
`no-gray-400` · `plus-icon-solid` · `icon-button-aria` · `tag-color-enum` · `icon-glyph-duplicate` · `load-failed-component`

สคริปต์ทำงานแบบ **ratchet**: ของเดิมที่ยังค้างถูกบันทึกจำนวนไว้ใน `scripts/ui-baseline.json` และยังผ่านได้
แต่**เพิ่มของใหม่ไม่ได้** · รายละเอียดและแผนไล่เก็บอยู่ใน `CONSISTENCY_AUDIT.md` §4 Phase 1
