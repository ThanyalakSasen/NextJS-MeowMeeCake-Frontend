# ตรวจความสอดคล้องของ Component ฝั่งหลังร้าน (`/owner/*`)

> **เอกสารนี้คืออะไร:** ผลตรวจว่าโค้ดฝั่งหลังร้าน "ทำตามกติกาที่ตัวเองเขียนไว้" แค่ไหน — อะไรตรง อะไรหลุด และควรไล่เก็บตามลำดับไหน
> **เปิดอ่านเมื่อ:** รับงานต่อจากคนอื่น · จะเพิ่มหน้าใหม่แล้วอยากรู้ว่า "แบบที่ถูก" หน้าตาเป็นยังไง · วางแผน sprint เก็บหนี้ทางเทคนิค
> **ตรวจเมื่อ:** 2026-10-09 · **ทวนซ้ำเต็มรูปแบบ:** 2026-10-10 หลัง merge `main` (+51 commit) — ตรวจโค้ดใหม่ด้วยทั้งหมด
> **ขอบเขต:** `src/app/owner/**` (33 route) + `src/components/**` · **ไม่ได้แก้โค้ดใด ๆ** ระหว่างตรวจ
> **เกณฑ์ที่ใช้ตัดสิน:** `COMPONENT_MAP.md` · `ACTION_BUTTONS.md` · `ALERTS.md` · `THEME.md` (กติกาของโปรเจกต์เอง ไม่ใช่ความเห็นส่วนตัว)

---

## 0. อ่าน 1 นาที

| | |
|---|---|
| **สรุปสั้นที่สุด** | โครงสร้างใหญ่แข็งแรงมาก · ที่หลุดคือ "รายละเอียดที่ไม่มีเครื่องตรวจอัตโนมัติ" |
| **`npm run check`** | ✅ **เขียวทั้งชุด** (i18n · theme · tsc · eslint) ตั้งแต่ 2026-10-10 |
| **เจอทั้งหมด** | 13 ประเด็น — ✅ แก้แล้ว 2 (ข้อ 3.1, 3.2) · เหลือ 11: ร้ายแรง 1 · สายตา 6 · โครงสร้าง/เอกสาร 4 |
| **ใช้เวลาแก้ที่เหลือ** | ประมาณ 2–3 วันทำงาน ถ้าทำตาม Phase ใน §4 |
| **ข่าวดีจากรอบทวน** | โค้ดใหม่ 51 commit (รวมหน้า `/owner/shipping`) **ทำตาม convention ครบ** — ดู §2 ท้ายตาราง |

---

## 1. "Consistency" คืออะไร ทำไมต้องแคร์

สมมติร้านกาแฟสาขาหนึ่งวางแก้วไว้ซ้ายมือ อีกสาขาวางขวามือ ลูกค้าที่เดินเข้าสาขาใหม่จะงง — ทั้งที่ทั้งสองสาขา "ทำงานได้" เหมือนกัน

ซอฟต์แวร์ก็เหมือนกัน **ความสอดคล้อง (consistency) คือการที่ของอย่างเดียวกัน ถูกทำด้วยวิธีเดียวกันทุกที่** ประโยชน์ที่จับต้องได้:

| ได้อะไร | ตัวอย่างในโปรเจกต์นี้ |
|---|---|
| **ผู้ใช้เดาถูก** | ปุ่มลบมีถังขยะสีแดงและถามยืนยันเสมอ → พนักงานใหม่ไม่กดลบพลาด |
| **แก้ที่เดียวจบ** | ไอคอน "แก้ไข" อยู่ใน `actionIcon("edit")` ที่เดียว → อยากเปลี่ยนทั้งแอปแก้ไฟล์เดียว ไม่ใช่ไล่ 20 ไฟล์ |
| **คนใหม่เข้าใจไว** | ทุกหน้าชื่อ `XView.tsx` + `useXViewModel.ts` → เปิดหน้าไหนก็รู้ว่าหาอะไรที่ไหน |
| **บั๊กซ่อนตัวยากขึ้น** | ถ้า 31 หน้าทำเหมือนกันแล้วมี 1 หน้าต่าง หน้านั้นมักคือหน้าที่มีบั๊ก |

**หัวใจของเอกสารฉบับนี้:** ทุกข้อที่เจอ ไม่ใช่ "โค้ดไม่สวย" แต่คือ **"โค้ดไม่ตรงกับกติกาที่ทีมเขียนไว้เอง"** — ซึ่งวัดได้ ไม่ต้องเถียงกัน

---

## 2. สิ่งที่โปรเจกต์นี้ทำได้ดีมาก (อย่าเผลอไปรื้อ)

ก่อนจะพูดถึงที่หลุด ต้องบอกก่อนว่าพื้นฐานแน่นกว่าโปรเจกต์นักศึกษาทั่วไปมาก

| เรื่อง | ผลตรวจ | แปลว่า |
|---|---|---|
| **แยก View / ViewModel** | 32 จาก 33 route ใช้ชื่อ `XView.tsx` + `useXViewModel.ts` ตรงกันหมด (ที่เหลือคือ `/owner/access-denied` ซึ่งเป็นการ์ดเปล่า ไม่มีตรรกะ) | หน้าตา (UI) กับ ตรรกะ (logic) แยกกันชัด เทสต์ง่าย อ่านง่าย |
| **Layout ร่วม** | ทุกหน้ารายการใช้ `ListPageLayout` · หน้าแดชบอร์ดใช้ `DashboardPageLayout` · หน้าแท็บใช้ `TabbedPageLayout` | หัวหน้า/ระยะขอบ/breadcrumb เหมือนกันหมดโดยไม่ต้อง copy-paste |
| **ปุ่มลบปลอดภัย** | **ทุกปุ่มลบ** ในระบบถูกครอบด้วย `ConfirmDeletePopup` | ไม่มีจุดไหนกดแล้วลบหายทันที (จุดที่เอกสารเคยแจ้งว่าค้าง — `ProductsView.tsx:140` — แก้ไปแล้ว) |
| **ปุ่มท้าย Modal** | 26 ไฟล์ที่มี `okText=` มี `modalButtonIcons` ครบทั้ง 26 | ปุ่ม OK/Cancel ของทุก popup หน้าตาเหมือนกัน |
| **Alert ทางเดียว** | ไม่พบ antd `message` / `notification` / `Modal.confirm` / `Popconfirm` / `window.alert` เลยสักจุด | การแจ้งเตือนทั้งแอปไหลผ่าน `src/lib/alert.ts` จุดเดียวจริง ๆ |
| **ไม่มีการลักไก่ข้ามหน้า** | ไม่มีไฟล์ไหน import `_components` ของหน้าอื่นข้าม route | ลบหน้าไหนทิ้ง ไม่พังหน้าอื่น |
| **i18n / theme** | `npm run lint:i18n` และ `npm run lint:theme` ผ่านทั้งคู่ | ไม่มีข้อความไทยฝังในโค้ด · สีใน `palette.ts` ตรงกับ `globals.css` |
| **โค้ดใหม่ 51 commit** | หน้า `/owner/shipping` · `DashboardTab` · `RoundDashboardDrawer` · `RenameRoleModal` · `ReceiptUpload` — ทำตาม convention **ครบทุกข้อ** | เป็นสัญญาณว่ากติกาที่เขียนไว้ "ใช้ได้จริง" ไม่ใช่กฎบนกระดาษ |

**เจาะลึกโค้ดใหม่** — ตรวจทีละไฟล์แล้วพบว่า:

| ไฟล์ใหม่ | base wrapper | `usePermission` | Loading/Retry | ปุ่มกลาง / `actionIcon` |
|---|---|---|---|---|
| `shipping/ShippingZonesView.tsx` + ViewModel | ✓ | ✓ (ใน ViewModel) | ✓ ทั้งคู่ | ✓ |
| `preOrderRound/_components/DashboardTab.tsx` | ✓ | — (อ่านอย่างเดียว) | ✓ | ✓ |
| `preOrderRound/_components/RoundDashboardDrawer.tsx` | ✓ | — | ✓ | — |
| `permissions/_components/RenameRoleModal.tsx` | ✓ | — (เช็คที่ ViewModel) | — | ✓ `modalButtonIcons` |
| `finance/expenses/_components/ReceiptUpload.tsx` | — (ใช้ antd `Upload` ตรง ซึ่งถูก เพราะไม่มี wrapper) | — | — | — |

`/owner/shipping` ใช้ `ShippingZonesView.tsx` + `useShippingZonesViewModel.ts` + `ListPageLayout` ตรงตามแบบทุกอย่าง — **คนเขียนไม่ต้องถาม ก็ทำถูก** เพราะมี 32 หน้าก่อนหน้าเป็นตัวอย่าง

> **บทเรียนที่ 1:** เรื่องที่มี **สคริปต์ตรวจอัตโนมัติ** → ผ่านหมด
> เรื่องที่อาศัย **ความจำของคนเขียน** → หลุดเกือบทุกเรื่อง
> นี่คือข้อสรุปที่สำคัญที่สุดของเอกสารนี้ และเป็นเหตุผลที่ Phase 1 ใน §4 คือ "สร้างเครื่องตรวจ" ไม่ใช่ "ไล่แก้"

---

## 3. สิ่งที่เจอ

เรียงจากกระทบผู้ใช้มากที่สุดลงไป แต่ละข้อมี 4 ส่วน: **อาการ → หลักฐาน → ทำไมสำคัญ → แก้ยังไง**

### 🔴 กลุ่มที่ 1 — กระทบการใช้งานจริง

---

#### 3.1 ~~ใบเสร็จค่าใช้จ่ายไม่ได้ถูกอัปโหลดจริง~~ · ✅ **แก้แล้ว** (commit `d380b4c`)

> **สถานะ:** แก้ไปแล้วใน `main` ระหว่างที่ตรวจเรื่องนี้อยู่พอดี — เก็บไว้เป็นกรณีศึกษา เพราะเป็นตัวอย่างที่ดีที่สุดในเอกสารนี้ว่า "ของเก่าที่ลืมถอด" อันตรายแค่ไหน

**อาการ (ตอนตรวจเจอ)**
ระบบมีที่อัปโหลดรูป 3 ที่ แต่ทำงานไม่เหมือนกัน:

| หน้า | ใช้ component | อัปโหลดขึ้น server จริงไหม |
|---|---|---|
| เพิ่ม/แก้สินค้า | `ProductImageUpload.tsx` | ✅ จริง |
| ออกแบบหน้าร้าน (แบนเนอร์) | `BannerImageUpload.tsx` | ✅ จริง |
| **ค่าใช้จ่าย (ใบเสร็จ)** | `UploadImageBox.tsx` | ❌ **ไม่จริง** |

**หลักฐาน**
`src/components/shared/form/UploadImageBox.tsx:31` เคยเขียนไว้ตรง ๆ ว่า

```tsx
return false; // ไม่อัปโหลดจริง — เก็บ base64
```

แล้วถูกเสียบเข้าฟิลด์ `receipt_url` ที่ `ExpenseFormModal.tsx:80`

**ทำไมสำคัญ**
`UploadImageBox` เป็นของที่ทำไว้ตอนยังไม่มี backend จริง (ยุค mock) มันแปลงรูปเป็นข้อความ base64 ยาว ๆ แล้วยัดลง field — ไม่ได้ส่งไฟล์ไปไหน

**ผลจริงที่เกิดขึ้น — แย่กว่าที่คาด**
ตอนเขียนรายงานประเมินไว้ว่า "อาจได้แค่ข้อความยาวมากในฐานข้อมูล **หรือ backend ปฏิเสธ**" ซึ่งความจริงคืออย่างหลัง — commit ที่แก้ (`d380b4c`) บันทึกไว้ว่า:

> *backend ตอบ 400 ทุกครั้ง (แนบใบเสร็จไม่ได้เลย)*

แปลว่าฟีเจอร์นี้ **ใช้ไม่ได้มาตลอด** ไม่ใช่แค่ "เก็บผิดที่"

**แก้ไปยังไง**
- ลบ `components/shared/form/UploadImageBox.tsx` ทิ้ง
- สร้าง `finance/expenses/_components/ReceiptUpload.tsx` ที่อัปโหลดไฟล์จริงแบบเดียวกับอีก 2 ตัว

> 💡 **บทเรียนจากข้อนี้**
> ของชั่วคราวที่ "ไว้ก่อน เดี๋ยวค่อยทำจริง" มักอยู่ยาวกว่าที่คิด และอันตรายตรงที่มัน **ดูเหมือนทำงานได้** — ปุ่มกดได้ รูปขึ้น preview ครบ ผู้ใช้ไม่มีทางรู้ว่ามันไม่ได้บันทึกอะไรเลย
> วิธีป้องกัน: ของที่ยังไม่เสร็จ ควรพังแบบ **เห็นชัด** (ขึ้น error / ซ่อนปุ่มไปเลย) ไม่ใช่พังเงียบ ๆ — หลักการนี้เรียกว่า *fail loudly*

---

#### 3.2 ~~`npm run check` พังอยู่~~ · ✅ **แก้แล้ว** (2026-10-10)

> **สถานะ:** ยืนยันแล้วว่า `rm -rf .next` แก้ได้จริง — รัน `npm run check` ซ้ำหลังลบ ผ่านครบทั้ง 4 ด่าน (exit 0)
> เก็บหัวข้อไว้เพราะอาการนี้ **จะกลับมาอีก** ทุกครั้งที่ลบหน้าทิ้ง — อ่าน "วิธีสังเกต" ท้ายหัวข้อ

**อาการ (ตอนตรวจเจอ)**
```
.next/types/validator.ts(60,39): error TS2307:
Cannot find module '../../src/app/owner/attendance/page.js'
```

**หลักฐาน**
- หน้า `/owner/attendance` (ลงเวลาทำงาน) ถูกลบออกโดยตั้งใจไปแล้ว (commit `b7d55b3` — ดู `BACKLOG2.md:455`)
- source สะอาดแล้วจริง: ไม่มีโฟลเดอร์ `attendance/` · ไม่มี `types/attendance.ts` · ไม่มี key `attendance.*` ใน `th.json`
- แต่ `.next/types/validator.ts` มีวันที่ **2026-09-07** — เก่ากว่าวันตรวจ 1 เดือน
- และ `tsconfig.json` สั่ง include `".next/types/**/*.ts"` → `tsc` เลยไปอ่านไฟล์ที่ Next สร้างค้างไว้

**ทำไมสำคัญ**
`npm run check` คือด่านสุดท้ายก่อน commit (i18n + theme + tsc + eslint) **ถ้ามันแดงอยู่ตลอดโดยที่ทุกคนรู้ว่า "ไม่เป็นไรหรอก"** สุดท้ายจะไม่มีใครดูผลมันอีกเลย แล้ววันที่มี error จริงก็จะไม่มีใครเห็น — นี่คือปรากฏการณ์ *alert fatigue* (ชินกับสัญญาณเตือนจนเมิน)

**แก้ยังไง**
```bash
rm -rf .next && npm run check
```
`.next/` อยู่ใน `.gitignore` อยู่แล้ว ลบได้ปลอดภัย ไม่กระทบ repo (เสียแค่เวลา build รอบแรกช้าลงนิดหน่อย)

**วิธีสังเกตว่าเจออาการนี้อีก**
ถ้า `tsc` ฟ้อง error ที่ไฟล์ซึ่ง path ขึ้นต้นด้วย `.next/` — **อย่าเพิ่งไปไล่แก้โค้ด** ให้ลบ `.next` แล้วรันใหม่ก่อน
error ใน `.next/` ไม่เคยเป็นความผิดของโค้ดที่เราเขียน เพราะมันคือไฟล์ที่ Next สร้างเอง

---

#### 3.3 พนักงานเห็นปุ่มที่ตัวเองกดไม่ได้ (6 หน้า)

**อาการ**
ระบบมี `usePermission()` ไว้ซ่อนปุ่มตามสิทธิ์ของ role — แต่ 6 หน้าที่มีการแก้ข้อมูลลืมเรียก

**หลักฐาน** — ViewModel ที่มี `useMutation` แต่ไม่มี `usePermission`:

| ไฟล์ | จำนวน mutation |
|---|---|
| `store-design/useStoreDesignViewModel.ts` | 5 |
| `notificationsHistory/useNotificationHistoryViewModel.ts` | 3 |
| `employees/addEmployee/useAddEmployeeViewModel.ts` | 2 |
| `employees/editEmployee/useEditEmployeeViewModel.ts` | 2 |
| `products/addProducts/useAddProductViewModel.ts` | 2 |
| `products/[id]/edit/useEditProductViewModel.ts` | 2 |

(อีก 20 ไฟล์ที่เหลือเรียกครบ)

**ทำไมสำคัญ — และสิ่งที่ *ไม่* ต้องกังวล**
ขอให้อ่านคอมเมนต์ใน `src/context/PermissionsContext.tsx:8` ให้ดี:

> ⚠️ นี่คือ "UX gate" เท่านั้น (ซ่อน/โชว์ปุ่ม) — ตัวบังคับสิทธิ์จริงอยู่ที่ backend

แปลว่า **นี่ไม่ใช่ช่องโหว่ความปลอดภัย** พนักงานที่ไม่มีสิทธิ์กดปุ่มไปก็โดน backend ปฏิเสธอยู่ดี แต่ประสบการณ์ที่ได้คือ "เห็นปุ่ม → กด → ขึ้น error" ซึ่งแย่กว่า "ไม่เห็นปุ่มตั้งแต่แรก" และไม่เหมือนอีก 20 หน้า

> 💡 **แนวคิดที่ควรจำ: Defense in Depth (ป้องกันหลายชั้น)**
> การเช็คสิทธิ์ที่ frontend = เพื่อ **ประสบการณ์ที่ดี**
> การเช็คสิทธิ์ที่ backend = เพื่อ **ความปลอดภัย**
> ต้องมีทั้งคู่ และห้ามสลับหน้าที่กัน — frontend เชื่อถือไม่ได้ เพราะผู้ใช้แก้โค้ดในเบราว์เซอร์ได้

**แก้ยังไง**
ใน ViewModel เพิ่ม `const perm = usePermission("<menuKey>")` แล้ว return ออกไป จากนั้นใน View ครอบปุ่มด้วย `{vm.perm.update && ( ... )}` — ลอกแบบจาก `useProductsViewModel.ts` ได้เลย

---

### 🟠 กลุ่มที่ 2 — หน้าตาไม่สม่ำเสมอ

---

#### 3.4 `text-gray-400` — 90 จุด ใน 50 ไฟล์ (เฉพาะฝั่งหลังร้าน)

**อาการ**
`THEME.md §4` เขียนกฎไว้ชัด:

> คอนทราสต์: ห้าม `text-gray-400` (ไม่ผ่าน WCAG AA) — ใช้ `gray-600`/`gray-700` หรือ `--text-muted`

แต่มันคือสีข้อความรองที่ใช้บ่อยที่สุดในระบบ (หลังร้าน 90 จุด + หน้าร้านอีก 16 จุด)

**ทำไมสำคัญ**
**WCAG AA** คือมาตรฐานสากลว่าข้อความต้องตัดกับพื้นหลังพอให้คนสายตาไม่ดีอ่านออก — ต้องมีอัตราส่วนความสว่างอย่างน้อย 4.5:1 สำหรับข้อความปกติ `gray-400` บนพื้นขาวได้ประมาณ 2.8:1 เท่านั้น

โปรเจกต์นี้ตั้งใจออกแบบ **เพื่อผู้สูงอายุ** (ดู `THEME.md §4`: ตัวอักษรฐาน 18px, line-height 1.7, touch target 44px) การใช้สีที่อ่านไม่ออกจึงขัดกับเป้าหมายของตัวเอง

**ทำไมถึงหลุดเยอะขนาดนี้**
เพราะ `check-theme.mjs` **ไม่ได้ตรวจเรื่องนี้** — มันตรวจแค่ว่าสีใน `palette.ts` ตรงกับ `globals.css` ไหม กฎข้อนี้เลยมีสถานะเป็น "ข้อตกลงที่เขียนไว้ในเอกสาร" ซึ่งไม่มีใครบังคับ

**แก้ยังไง**
1. เพิ่มการตรวจลง `check-theme.mjs` **ก่อน** (ไม่งั้นแก้เสร็จเดี๋ยวก็กลับมา)
2. แทนที่ด้วย `text-gray-600` เป็นค่าเริ่มต้น — แต่ **อย่าใช้ sed แทนที่รวดเดียวทั้งโปรเจกต์** เพราะบางจุดเป็นไอคอน placeholder หรือ decoration ที่ไม่ใช่ข้อความให้อ่าน (เช่น `SearchInput.tsx:24` ไอคอนแว่นขยายในช่องค้นหา) ต้องดูทีละจุด
3. จุดที่ตั้งใจให้จาง ๆ จริง ๆ ให้ใช้ `--text-muted` ที่นิยามไว้แล้ว

---

#### 3.5 ไอคอน "เพิ่ม" มี 2 หน้าตาในแอปเดียวกัน

**อาการ**
`ACTION_BUTTONS.md §1.1` กำหนดว่า ไอคอน `add` = `PlusIcon` แบบ **solid** (ทึบ) เสมอ ส่วนไอคอนอื่นทั้งหมดเป็น outline (เส้น) — แต่ความจริง:

| แบบ | จำนวนไฟล์ |
|---|---|
| `@heroicons/react/24/solid` | 14 |
| `@heroicons/react/24/outline` | 12 |

ตัวอย่างปุ่ม "เพิ่ม" ที่เป็น outline (ควรเป็น solid):
- `ingredients/units/_components/UnitListCard.tsx:43` — เพิ่มหน่วย
- `orders/preOrderRound/_components/RoundDetailContent.tsx:74` — เพิ่มสินค้าในรอบ
- `reports/reviews/settings/_components/AspectsTab.tsx:48` — เพิ่มหัวข้อรีวิว

และในทางกลับกัน `notificationsHistory/NotificationHistoryView.tsx:83,88` ใช้ `CheckCircleIcon` กับ `TrashIcon` แบบ **solid** ทั้งที่กติกาบอกว่าสองตัวนี้ต้อง outline

**ทำไมสำคัญ**
ผู้ใช้จำ "รูปร่าง" ของปุ่มได้เร็วกว่าอ่านตัวหนังสือ ถ้าปุ่มเพิ่มในหน้า A เป็นเครื่องหมายบวกทึบ แต่หน้า B เป็นเส้นบาง สมองต้องประมวลผลใหม่ทุกหน้า — เล็กน้อยแต่สะสม

**แก้ยังไง**
ใช้ `actionIcon("add")` จาก `@/components/shared/actions` แทนการ import `PlusIcon` เอง — จะได้ตัวที่ถูกต้องอัตโนมัติ และถ้าวันหนึ่งอยากเปลี่ยนไอคอนทั้งแอป แก้ไฟล์เดียว

---

#### 3.6 สีของป้าย `Tag` มาจาก 3 แหล่ง — มีแค่แหล่งเดียวที่ถูก

> **หมายเหตุ:** รอบตรวจแรกรายงานข้อนี้ไว้แค่ 4 จุด เพราะค้นเฉพาะคำว่า `warning`/`error` รอบทวนซ้ำค้นทุก `<Tag color=` เลยเห็นภาพเต็ม — **ใหญ่กว่าที่รายงานไว้มาก**

**อาการ**
`THEME.md §2` กำหนดว่า *"สีของ badge สถานะ order/payment/production → `src/constants/enumConfig.ts` — เป็น palette เฉพาะโดเมน แยกจาก theme กลางตั้งใจ"*

แต่จากทั้งหมด **20 จุด**ที่ใช้ `<Tag color=...>` ฝั่งหลังร้าน:

| แหล่งที่มาของสี | จำนวน | ตรงกติกา? |
|---|---|---|
| **(ก)** `enumConfig` (`cfg.antColor`) | 3 จุด | ✅ ถูก |
| **(ข)** ตารางสีประจำไฟล์ (`ZONE_COLOR`, `GROUP_TAG`, `tagColorFor()`) | 3 จุด | ⚠️ รูปแบบใหม่ที่ไม่มีในกติกา |
| **(ค)** พิมพ์ชื่อสีของ antd ลงไปตรง ๆ | **14 จุด** | ❌ ผิด |

**หลักฐาน — กลุ่ม (ค) ที่ชัดที่สุด**

| ไฟล์ | บรรทัด | เขียนว่า |
|---|---|---|
| `orders/manageOrders/ManageOrdersView.tsx` | 86 | `<Tag color="warning">` รอคืนเงิน |
| `orders/preOrderRound/_components/OrdersTab.tsx` | 75 | `<Tag color="warning">` รอคืนเงิน |
| `orders/manageOrders/_components/OrderDetailContent.tsx` | 64 | `<Tag color="error">` ยกเลิกแล้ว |
| `orders/preOrderRound/_components/PreorderDetailContent.tsx` | 43 | `<Tag color="error">` ยกเลิกแล้ว |
| `employees/EmployeesView.tsx` | 33, 52 | `"blue"` · `"success"/"default"` |
| `employees/permissions/PermissionsView.tsx` · `RoleListPanel.tsx` | 60 · 42 | `"gold"/"blue"` (ตรรกะซ้ำกัน 2 ที่) |
| `notificationsHistory/NotificationHistoryView.tsx` | 69 | `"default"/"processing"` |
| `promotions/pricing/PricingView.tsx` | 41 | `"processing"/"success"` |
| `reports/reviews/_components/ReviewDetailContent.tsx` | 45 | ternary 3 ชั้น `success/warning/default` |
| `orders/delivery-zones/DeliveryZonesView.tsx` · `shipping/ShippingZonesView.tsx` | 94 · 91 | `"gold"` ทั้งคู่ (ความหมายเดียวกัน แต่ไม่ได้แชร์กัน) |

สังเกตว่า **ไฟล์เดียวกันหลายไฟล์ใช้ `StatusBadge` กับสถานะอื่นอยู่แล้ว** (เช่น `ManageOrdersView.tsx:64`) — คือรู้วิธีที่ถูก แต่สถานะเหล่านี้ตกหล่น

**ทำไมสำคัญ**
`"warning"` / `"gold"` / `"processing"` คือชื่อสีสำเร็จรูปของ antd — **ไม่ใช่สีของแบรนด์** ผลที่ตามมา:
- ในตารางเดียวกัน ป้ายบางอันมาจาก palette ของร้าน บางอันมาจาก palette ของ library เฉดเพี้ยนกันเล็กน้อย
- เปลี่ยนธีมทีหลัง 14 จุดนี้จะไม่เปลี่ยนตาม
- ความหมายเดียวกันใช้คนละสีได้ง่าย เช่น `role_type === "owner"` ให้สี gold เขียนไว้ 2 ไฟล์ ถ้าแก้ที่เดียวจะเพี้ยนทันที

**เรื่องที่น่ากังวลกว่า — รูปแบบนี้กำลังแพร่**
กลุ่ม (ข) ทั้ง 3 จุดอยู่ใน **โค้ดที่เพิ่งเพิ่มใหม่** (`ShippingZonesView.tsx:78` ใช้ `ZONE_COLOR` · `RoundDashboardDrawer.tsx:128` ใช้ `GROUP_TAG`) — คนเขียนรู้ว่า "ไม่ควร hardcode" เลยทำตารางสีไว้ในไฟล์ ซึ่งดีกว่าเดิม แต่**ยังไม่ใช่ที่ที่กติกากำหนด** ผลคือตอนนี้มีตารางสีกระจายอยู่ 3 ที่แทนที่จะเป็น 1

**แก้ยังไง**
ย้ายทั้งหมดไปที่ `src/constants/enumConfig.ts` ซึ่งมีโครง `{ color, antColor }` รออยู่แล้ว:
1. เพิ่ม group ใหม่: `refundStatus` · `roleType` · `readStatus` · `zoneKind` · `paymentGroup`
2. เปลี่ยนจุดที่ใช้เป็น `<StatusBadge group="..." value="..." />`
3. ลบ `ZONE_COLOR` / `GROUP_TAG` / `tagColorFor()` ออกจากไฟล์หน้า

---

#### 3.7 import antd ตรง ทั้งที่มีตัวห่อของโปรเจกต์อยู่แล้ว

**อาการ**
`src/components/base/` คือชั้นที่ห่อ antd ไว้ทั้งหมด (กฎใน `COMPONENT_MAP.md`: *"base/ — atom ทั้งหมด (ครอบ antd + ธีมโปรเจกต์) · import จากที่เดียว: `@/components/base`"*) แต่มี 12 ไฟล์ที่ข้ามชั้นนี้:

| ตัวห่อที่มีอยู่ | ไฟล์ที่ข้ามไป import antd ตรง |
|---|---|
| `base/Tag` | ManageOrdersView · OrderDetailContent · OrdersTab · PreorderDetailContent |
| `base/Divider` | OrderDetailContent · PreorderDetailContent · RoundDetailContent |
| `base/ProgressBar` | IngredientsView · IngredientStockView |
| `base/EmptyState` | UnitListCard |
| `base/Spinner` | `shared/feedback/LoadingSpin.tsx` |
| `base/Input` | `shared/data/SearchInput.tsx` |

**ทำไมสำคัญ**
> 💡 **แนวคิดที่ควรจำ: Wrapper Layer (ชั้นห่อหุ้ม)**
> เหตุผลที่ต้องห่อ library ไว้ ไม่ใช่เพื่อความสวย แต่เพื่อ **จุดควบคุมจุดเดียว**
> วันที่ต้องอัปเกรด antd v6 → v7 แล้ว API เปลี่ยน · หรือวันที่อยากเปลี่ยนไปใช้ library อื่น
> ถ้าทุกไฟล์ import ผ่าน `base/` → แก้ 20 ไฟล์ใน `base/`
> ถ้า import ตรงกระจาย → ต้องไล่แก้ทุกไฟล์ในโปรเจกต์
>
> แต่ก็ **ไม่ต้องห่อทุกอย่าง** — `Modal`, `Steps`, `Tabs`, `Upload`, `Checkbox` ที่ import ตรงนั้นถูกแล้ว เพราะยังไม่มีตัวห่อ และยังไม่มีเหตุผลต้องสร้าง การห่อของที่ใช้ที่เดียวคือการเพิ่มงานเปล่า ๆ

**แก้ยังไง**
เปลี่ยน 12 ไฟล์นี้ให้ import จาก `@/components/base` — เป็นงานง่ายที่สุดในเอกสารนี้ ประมาณ 15 นาที

---

#### 3.8 ปุ่มไอคอนล้วน 16 ปุ่ม แต่เอกสารรับรองไว้ 6

**อาการ**
`ACTION_BUTTONS.md` มีกฎใหญ่ว่า *"ทุกปุ่มต้องมีไอคอน + คำ"* และมีข้อยกเว้น 6 ปุ่มที่ **ตั้งใจ** ให้มีแต่ไอคอน (เพราะแถวแคบมาก ใส่คำแล้วล้น) — พร้อมเหตุผลกำกับทุกปุ่ม

สแกนจริงเจอ 16 ปุ่ม คือมี **10 ปุ่มที่เพิ่มเข้ามาทีหลังโดยไม่ได้ขึ้นทะเบียน**:

| ไฟล์ | บรรทัด | มี `aria-label` |
|---|---|---|
| `products/[id]/edit/_components/CustomizationEditor.tsx` | 117, 119, 121 | ✓ |
| `reports/reviews/settings/_components/AspectsTab.tsx` | 65, 67, 105 | ✓ |
| `reports/reviews/_components/ReviewCard.tsx` | **114, 118** | ❌ **ไม่มี** |
| `shared/categories/CategoryManagerDialog.tsx` | 101, 110 | ✓ |

**ทำไมสำคัญ**
ปุ่มที่มีแต่ไอคอนนั้น "ว่างเปล่า" สำหรับ **screen reader** (โปรแกรมอ่านหน้าจอของผู้พิการทางสายตา) — ผู้ใช้จะได้ยินแค่คำว่า "ปุ่ม" โดยไม่รู้ว่าปุ่มอะไร `aria-label` คือข้อความที่ใส่ไว้ให้ screen reader อ่านแทน

`ReviewCard.tsx:114,118` (ปุ่มปักหมุด / ทำเครื่องหมายอ่านแล้ว) ใช้ antd `<Tooltip>` ครอบแทน — tooltip ขึ้นตอนเอาเมาส์ชี้ ซึ่งช่วยคนที่มองเห็นและใช้เมาส์ แต่**ไม่ช่วยคนที่ใช้ screen reader หรือคีย์บอร์ดอย่างเดียว**

**แก้ยังไง**
1. เติม `aria-label` ให้ 2 ปุ่มใน `ReviewCard.tsx` (เร่งด่วนกว่าข้ออื่นในกลุ่มนี้)
2. ขึ้นทะเบียน 10 ปุ่มลง `ACTION_BUTTONS.md §4.1` พร้อมเหตุผล — ถ้าหาเหตุผลไม่ได้ แปลว่าควรใส่คำกำกับ

---

#### 3.9 import heroicons เองแทนที่จะใช้ `actionIcon`

**อาการ**
`ACTION_BUTTONS.md §1.2` เขียนว่า *"ไม่ import heroicons เองสำหรับความหมายที่มีในตารางข้างบนแล้ว"* แต่ยังพบ:

| ไอคอน | ความหมายใน `actionIcon` | ไฟล์ที่ import เอง |
|---|---|---|
| `PencilSquareIcon` | `edit` | NoteBox · ReplyBox · AspectsTab |
| `EyeIcon` | `view` | RecipeCard:99 · ReviewCard |
| `ArrowPathIcon` | `retry` | ReviewFiltersBar |
| `ArrowTopRightOnSquareIcon` | `external` | CoordinateInput |

กรณีที่ชัดที่สุดคือ `recipes/_components/RecipeCard.tsx:99` — เขียน `<Button icon={<EyeIcon/>} aria-label={t("common.view")} />` เองทั้งที่มี `<ViewButton />` สำเร็จรูปอยู่แล้ว

**ทำไมสำคัญ**
เหตุผลเดียวกับข้อ 3.7 — ยิ่งมีจุดที่ต้องแก้มาก ยิ่งมีจุดที่จะลืมแก้มาก

**แก้ยังไง**
เปลี่ยนเป็น `<ViewButton />`, `<EditButton />`, `<RetryButton />` หรือ `icon={actionIcon("external")}` ตามกรณี

---

### 🟡 กลุ่มที่ 3 — โครงสร้างและเอกสาร

---

#### 3.10 มีชั้นโฟลเดอร์ที่ไม่มีในกติกา

**อาการ**
`COMPONENT_MAP.md` วางกฎที่เก็บ component ไว้ 3 ชั้น:

```
ใช้ได้ทุกที่ ไม่ผูกกับโดเมน  →  components/base/
ใช้ ≥ 2 หน้าจอ                →  components/shared/<concern>/
ใช้ 1 หน้าจอ                  →  app/owner/<route>/_components/
```

แต่ของจริงมีชั้นที่ 4 ที่ไม่มีในกฎ: `src/app/owner/orders/_components/` เก็บ `SlipImage` · `DeliverySection` · `RefundSection` ซึ่งถูกใช้โดย **2 หน้าจอ** (manageOrders และ preOrderRound) ผ่าน relative path `../../_components/`

**ทำไมสำคัญ**
กติกาเขียนไว้ชัดว่า *"page-local ตัวไหนมี screen ที่ 2 มาใช้ → ย้ายขึ้น `shared/<concern>/`"* — ถ้าปล่อยให้มี "ชั้นกลาง" โดยไม่บันทึกไว้ คนใหม่จะไม่รู้ว่าควรวางของใหม่ที่ไหน แล้วจะเกิดชั้นที่ 5, 6 ตามมา

**แก้ยังไง** — เลือกทางใดทางหนึ่ง แล้วบันทึกลงเอกสาร:
- **ทาง A:** ย้ายขึ้น `components/shared/orders/` ตามกฎที่มี
- **ทาง B:** ยอมรับชั้น "section-level" อย่างเป็นทางการ แล้วเขียนกติกาเพิ่มใน `COMPONENT_MAP.md` ว่าใช้เมื่อไหร่

(หมายเหตุ: `products/_components/ProductFormFields` ก็ใช้ 2 หน้าเหมือนกัน แต่กรณีนี้ **บันทึกไว้แล้ว** ในเอกสาร — ถือว่าโอเค)

---

#### 3.11 หน้าฟอร์ม 4 หน้าเขียนโครงเดียวกันซ้ำ 4 รอบ

**อาการ**
หน้าเพิ่ม/แก้ไขทั้ง 4 หน้า — `addEmployee` · `editEmployee` · `addProducts` · `products/[id]/edit` — ไม่ได้ใช้ layout ร่วมเหมือนหน้าอื่น แต่เขียน markup เดียวกันเองทุกหน้า:

```tsx
<div className="flex flex-col gap-5">
  ...
  <div className="flex gap-2 mt-4">   {/* แถวปุ่ม บันทึก/ยกเลิก */}
```

**ทำไมสำคัญ**
ระบบมี `ListPageLayout` · `DashboardPageLayout` · `TabbedPageLayout` แต่ไม่มี `FormPageLayout` ทั้งที่หน้าฟอร์มมี 4 หน้าและหน้าตาเหมือนกัน — ถ้าวันหนึ่งอยากเปลี่ยนระยะห่างหรือย้ายปุ่มไปอยู่แถบล่างติดจอ ต้องแก้ 4 ที่

**แก้ยังไง**
สร้าง `components/shared/layout/FormPageLayout.tsx` รับ `children` + `actions` แล้วให้ 4 หน้าใช้ร่วม (งานไม่ใหญ่ แต่ไม่เร่ง — ทำตอน Phase 4)

---

#### 3.12 เอกสารพูดถึงของที่ไม่มีแล้ว — เหลือ 5 จุด

**อาการ**

| เอกสาร | เขียนว่า | ความจริง |
|---|---|---|
| `COMPONENT_MAP.md` | `base/ErrorMessage.tsx` — กล่อง error แดง | **ไม่มีไฟล์นี้** และไม่มีใครใช้ |
| `COMPONENT_MAP.md:56` | Attendance เป็น consumer ของ `DashboardPageLayout` | หน้านี้ถูกลบไปแล้ว |
| ~~`COMPONENT_MAP.md`~~ | ~~`UploadImageBox` ใช้ที่ Add/Edit Product, Store Design~~ | ✅ **แก้แล้ว 2026-10-10** — แถวถูกขีดฆ่าพร้อมเหตุผล |
| `ACTION_BUTTONS.md §4.1` (บรรทัด 170, 211, 224, 226) | อ้าง `CartPanel.tsx` · `ProductPickerGrid.tsx` | POS ถูก refactor แล้ว เหลือ `BillCard` · `PaymentAside` · `ScanSearchBox` ฯลฯ |
| `ACTION_BUTTONS.md:234` | "⚠️ พบ (ยังไม่แก้): ปุ่มลบในตาราง `/owner/products` ลบทันทีไม่ถามยืนยัน" | **แก้แล้ว** (`ProductsView.tsx:140`) |
| `MOCKS.md:17` | backend อยู่ที่ `D:\1.2569\MeowMeeCake\NextJS-MeowMeeCake` | จริง ๆ คือ `D:\Cream\MeowMeeCake-Backend\NextJS-MeowMeeCake` |

**ข้อสังเกตจากรอบทวน:** `SCREEN_MAP.md` **อัปเดตทันแล้ว** (ลงวันที่ 2026-10-10 มีหน้า `/owner/shipping` และระบุชัดว่า Attendance ไม่มีในโค้ดแล้ว) — ปัญหากระจุกอยู่ที่ `COMPONENT_MAP.md` กับ `ACTION_BUTTONS.md` เท่านั้น

**ทำไมสำคัญ**
> 💡 **แนวคิดที่ควรจำ: เอกสารที่ผิด แย่กว่าไม่มีเอกสาร**
> ถ้าไม่มีเอกสาร คนจะไปอ่านโค้ด (ซึ่งถูกเสมอ)
> ถ้ามีเอกสารที่ผิด คนจะเชื่อแล้วทำพลาด — เช่น นักศึกษาใหม่อ่านเจอ `base/ErrorMessage` แล้วพยายาม import จะงงอยู่ครึ่งชั่วโมงว่าทำไมหาไม่เจอ

**แก้ยังไง**
แก้ 5 บรรทัดที่เหลือ — ใช้เวลา 15 นาที และควรทำ **ทุกครั้ง** ที่แก้โค้ดในรอบถัดไป (ดู Phase 5)

---

#### 3.13 component ใหม่ 7 ตัวยังไม่ขึ้นทะเบียนใน `COMPONENT_MAP` · 🆕 *เจอในรอบทวน*

**อาการ**
`COMPONENT_MAP.md` ประกาศตัวเองว่าเป็น *"ทะเบียน component ทุกตัว"* และมีเหตุผลกำกับว่า *"กันสร้างซ้ำ · ให้ทุกคนวาง component ที่เดียวกัน"* — แต่ของใหม่จาก 51 commit ล่าสุดยังไม่ได้ลงทะเบียน:

| component | ที่อยู่ | อยู่ใน COMPONENT_MAP |
|---|---|---|
| `ShippingZonesView` | `app/owner/shipping/` | ✗ |
| `ShippingZoneFormFields` | `app/owner/shipping/_components/` | ✗ |
| `DashboardTab` | `app/owner/orders/preOrderRound/_components/` | ✗ |
| `RoundDashboardDrawer` | 〃 | ✗ |
| `RenameRoleModal` | `app/owner/employees/permissions/_components/` | ✗ |
| `FlowSteps` | `components/customer/` | ✗ |
| `OrderSuccess` | `app/customer/account/_components/` | ✗ |
| `ReceiptUpload` | `app/owner/finance/expenses/_components/` | ✓ |

**ทำไมสำคัญ**
ทะเบียนที่ไม่ครบ = ทะเบียนที่เชื่อไม่ได้ และเมื่อเชื่อไม่ได้ คนก็เลิกเปิด — แล้วกฎ *"ก่อนสร้าง component ใหม่ ให้เช็คก่อนว่ามีอยู่แล้วไหม"* ก็ใช้ไม่ได้จริง

เห็นผลแล้วในข้อ 3.6: `ShippingZonesView` สร้างตารางสี `ZONE_COLOR` ขึ้นมาเอง ทั้งที่ `DeliveryZonesView` มีตรรกะ `"gold"` แบบเดียวกันอยู่ก่อนแล้ว — ถ้าทะเบียนครบและเปิดดูก่อน อาจเห็นและแชร์กันได้

> 💡 **สังเกตความต่างระหว่างข้อ 3.13 กับ 3.12**
> 3.12 = เอกสารเขียน **ผิด** (พูดถึงของที่ไม่มี)
> 3.13 = เอกสารเขียน **ไม่ครบ** (ของที่มีแต่ไม่ได้พูดถึง)
> ทั้งคู่ทำให้เอกสารเชื่อไม่ได้เท่ากัน แต่ 3.13 เกิดง่ายกว่ามาก เพราะ "ลืมเพิ่ม" ง่ายกว่า "เขียนผิด"
> ทางแก้ระยะยาวคือทำให้มันเป็นส่วนหนึ่งของ checklist ตอน review ไม่ใช่พึ่งความจำ

**แก้ยังไง**
เพิ่ม 7 แถว และใส่บรรทัดใน Definition of Done ของทีมว่า *"สร้าง component ใหม่ = เพิ่มแถวใน `COMPONENT_MAP.md` ใน PR เดียวกัน"*

---

## 4. แผนการแก้ — 6 Phase (Phase 0 เสร็จแล้ว)

> **หลักคิดในการจัดลำดับ**
> 1. **ซ่อมเครื่องมือก่อนซ่อมบ้าน** — ถ้า `npm run check` ยังแดง เราจะไม่รู้ว่างานที่ทำไปทำให้อะไรพังหรือเปล่า
> 2. **สร้างรั้วก่อนไล่เก็บ** — ถ้าแก้ `text-gray-400` 90 จุดโดยไม่มีสคริปต์ตรวจ อีก 2 เดือนมันจะกลับมา 30 จุด
> 3. **ของที่กระทบผู้ใช้ มาก่อนของที่กระทบนักพัฒนา**
> 4. **เอกสารปิดท้าย** — เพราะต้องรู้ผลจริงก่อนถึงจะเขียนถูก

---

### ~~Phase 0 — ทำให้ด่านตรวจกลับมาเขียว~~ · ✅ **เสร็จแล้ว** 2026-10-10

| งาน | ผล |
|---|---|
| `rm -rf .next` | ✅ |
| `npm run check` | ✅ ผ่านทั้ง 4 ด่าน (exit 0) |

**ทำไมต้องก่อน:** ทุก Phase ถัดไปจะจบด้วยการรัน `npm run check` — ถ้ามันแดงอยู่แล้วตั้งแต่แรก เราจะแยกไม่ออกว่า error ใหม่หรือเก่า

---

### Phase 1 — สร้างรั้วกันถอยหลัง · ⏱ ครึ่งวัน

เพิ่มกฎลง `scripts/check-theme.mjs` (หรือสร้าง `scripts/check-ui.mjs` ใหม่) ให้ตรวจ 3 เรื่องที่ตอนนี้ไม่มีใครตรวจ:

| กฎ | ตรวจอะไร | อ้างอิง |
|---|---|---|
| **ห้าม `text-gray-400`** | grep ทั้ง `src/` | `THEME.md §4` |
| **`PlusIcon` ต้องมาจาก `solid`** | ห้าม `PlusIcon` จาก `24/outline` | `ACTION_BUTTONS.md §1.1` |
| **ปุ่มไอคอนล้วนต้องมี `aria-label`** | หา `<Button ... icon={...} />` ที่ self-closing | `ACTION_BUTTONS.md §4.1` |
| **`<Tag color=` ต้องมาจาก `enumConfig`** | ห้ามพิมพ์ชื่อสี antd ลงไปตรง ๆ | `THEME.md §2` · ข้อ 3.6 |

**เทคนิคสำคัญ:** ให้สคริปต์มี **allowlist** — ไฟล์/บรรทัดที่ยกเว้นได้ พร้อมเหตุผล จะได้เปิดใช้กฎทันทีโดยไม่ต้องรอแก้ครบ 90 จุด แล้วค่อย ๆ ลบรายการออกจาก allowlist ใน Phase ถัด ๆ ไป

> 💡 **แนวคิดที่ควรจำ: Ratchet (เฟืองกันถอย)**
> เฟืองกันถอยคือกลไกที่หมุนไปข้างหน้าได้ แต่หมุนกลับไม่ได้
> allowlist ทำหน้าที่แบบเดียวกัน: **จุดเดิมยังผ่านได้ แต่จุดใหม่เพิ่มไม่ได้**
> เป็นวิธีมาตรฐานในการจัดการหนี้ทางเทคนิคของโปรเจกต์ใหญ่ — ดีกว่ารอ "วันว่างแก้ให้หมดทีเดียว" ที่ไม่เคยมาถึง

**Definition of Done:** `npm run check` ยังเขียว · เพิ่ม `text-gray-400` ใหม่ 1 จุดแล้วสคริปต์ต้องแดง

---

### Phase 2 — แก้สิ่งที่กระทบผู้ใช้จริง · ⏱ ครึ่งวัน

| ลำดับ | งาน | ข้อ |
|---|---|---|
| ~~2.1~~ | ~~ทำ `UploadImageBox` ให้อัปโหลดจริง~~ | ✅ `d380b4c` |
| 2.2 | เติม `usePermission` ให้ 6 ViewModel + ซ่อนปุ่มใน View | 3.3 |
| 2.3 | เติม `aria-label` ให้ `ReviewCard.tsx:114,118` | 3.8 |

**ทดสอบยังไง:** ตาม `MOCKS.md` — ชี้ backend ไป DB ทดสอบในเครื่อง (`mongodb://127.0.0.1:27017/meowmeecake-test`) แล้ว login ด้วยบัญชี `e2.staff@meowmeecake.test` (สิทธิ์จำกัด) เทียบกับ `e2.owner@meowmeecake.test` (สิทธิ์เต็ม) ว่าเห็นปุ่มต่างกันจริง

**Definition of Done:** พนักงานสิทธิ์จำกัดเปิดทั้ง 6 หน้าแล้วไม่เห็นปุ่มที่กดไม่ได้ · ปุ่มใน `ReviewCard` อ่านออกด้วย screen reader

---

### Phase 3 — กวาดเรื่องหน้าตา · ⏱ 1–1.5 วัน

เรียงจากง่ายไปยาก ทำทีละข้อแล้ว commit แยก จะ review ง่าย

| ลำดับ | งาน | จำนวนจุด | ข้อ |
|---|---|---|---|
| 3.1 | เปลี่ยน import antd → `@/components/base` | 12 ไฟล์ | 3.7 |
| 3.2 | เปลี่ยน heroicons ที่ import เอง → `actionIcon` / ปุ่มกลาง | ~8 ไฟล์ | 3.9 |
| 3.3 | `PlusIcon` outline → `actionIcon("add")` · แก้ solid ที่ควรเป็น outline | 12 + 2 ไฟล์ | 3.5 |
| 3.4 | ย้ายสี `<Tag>` ไป `enumConfig` → ใช้ `StatusBadge` (รวมลบ `ZONE_COLOR` · `GROUP_TAG` · `tagColorFor`) | **17 จุด** | 3.6 |
| 3.5 | ไล่ `text-gray-400` → `gray-600` / `--text-muted` **ทีละไฟล์** พร้อมลบออกจาก allowlist | 90 จุด | 3.4 |

**คำเตือนสำคัญสำหรับข้อ 3.5:** อย่าใช้ find-and-replace รวดเดียว บางจุดเป็นไอคอน decoration ที่เปลี่ยนแล้วหน้าตาเพี้ยน ต้องเปิดดูหน้าจอจริงประกอบ

**Definition of Done:** allowlist ใน Phase 1 ว่างเปล่า · `npm run check` เขียว · เปิดดูหน้าจอจริงแล้วไม่เพี้ยน

---

### Phase 4 — จัดโครงสร้าง · ⏱ ครึ่งวัน

| งาน | ข้อ |
|---|---|
| ย้าย `orders/_components/` (SlipImage · DeliverySection · RefundSection) ขึ้น `components/shared/orders/` **หรือ** บันทึกชั้น section-level ลงกติกา | 3.10 |
| สร้าง `FormPageLayout` ให้ 4 หน้าฟอร์มใช้ร่วม | 3.11 |

**ทำไมอยู่ท้าย ๆ:** งานกลุ่มนี้ "ย้ายไฟล์" ซึ่งทำให้ diff ใหญ่และ review ยาก ควรทำตอนที่เรื่องอื่นนิ่งแล้ว

**Definition of Done:** ไม่มี relative import `../../_components/` เหลือ · 4 หน้าฟอร์มใช้ layout เดียวกัน

---

### Phase 5 — ปรับเอกสารให้ตรงความจริง · ⏱ 1 ชั่วโมง

| เอกสาร | แก้อะไร |
|---|---|
| `COMPONENT_MAP.md` | ลบแถว `ErrorMessage` · ลบ Attendance (บรรทัด 56) · **เพิ่ม 7 component ใหม่** (ข้อ 3.13) · เพิ่ม component ที่ย้ายใน Phase 4 |
| `ACTION_BUTTONS.md` | แก้ §4.1 (ชื่อไฟล์ POS ใหม่ บรรทัด 170/211/224/226 + ขึ้นทะเบียน 10 ปุ่มไอคอนล้วน) · ลบคำเตือนบรรทัด 234 ที่แก้แล้ว |
| `MOCKS.md:17` | แก้ path backend → `D:\Cream\MeowMeeCake-Backend\NextJS-MeowMeeCake` |
| `THEME.md` · `ACTION_BUTTONS.md` | เพิ่มบรรทัด "กฎข้อนี้ตรวจอัตโนมัติโดย `npm run check`" ในกฎที่เพิ่มใน Phase 1 |
| **ไฟล์นี้** | อัปเดตสถานะแต่ละข้อเป็น ✅ |

**Definition of Done:** สุ่มอ่านเอกสาร 5 จุด แล้วเปิดโค้ดตามได้ทุกจุด

---

### สรุปตารางงาน

| Phase | ชื่อ | เวลา | ขึ้นกับ Phase ก่อน? | สถานะ |
|---|---|---|---|---|
| 0 | ซ่อมด่านตรวจ | 10 นาที | — | ✅ **เสร็จ** 2026-10-10 |
| 1 | สร้างรั้วกันถอยหลัง | ครึ่งวัน | ต้องผ่าน 0 | ⬜ ถัดไป |
| 2 | แก้สิ่งที่กระทบผู้ใช้ | ครึ่งวัน | ทำคู่ขนานกับ 1 ได้ | ⬜ |
| 3 | กวาดหน้าตา | 1–1.5 วัน | ต้องผ่าน 1 (ใช้ allowlist) | ⬜ |
| 4 | จัดโครงสร้าง | ครึ่งวัน | ควรรอ 3 จบ | ⬜ |
| 5 | ปรับเอกสาร | 1 ชั่วโมง | ต้องผ่าน 4 | ⬜ |
| | **เหลือทั้งหมด** | **~2–3 วัน** | | |

---

## 5. ภาคผนวก — คำสั่งที่ใช้ตรวจ (ทำซ้ำได้)

รันจาก `D:\Cream\MeowMeeCake-Frontend\NextJS-MeowMeeCake-Frontend`

```bash
# ด่านมาตรฐานของโปรเจกต์
npm run check                      # = lint:i18n + lint:theme + tsc --noEmit + eslint

# ข้อ 3.4 — นับ text-gray-400
grep -rno "text-gray-400" src/app/owner src/components/shared | wc -l

# ข้อ 3.5 — PlusIcon solid vs outline
grep -rl 'PlusIcon.*24/solid'   src/app/owner src/components
grep -rl 'PlusIcon.*24/outline' src/app/owner src/components

# ข้อ 3.3 — ViewModel ที่มี mutation แต่ไม่มี usePermission
for f in $(find src/app/owner -name "use*ViewModel.ts"); do
  [ "$(grep -c useMutation "$f")" -gt 0 ] && ! grep -q usePermission "$f" && echo "$f"
done

# ข้อ 3.7 — import antd ตรงทั้งที่มีตัวห่อ
for C in Tag Divider Progress Empty Spin Input; do
  echo "-- $C --"; grep -rln "import .*\b$C\b.*from \"antd\"" src/app/owner src/components/shared
done

# ปุ่มลบทุกปุ่มมี ConfirmDeletePopup ไหม
for f in $(grep -rl DeleteButton src/app/owner); do
  grep -q ConfirmDeletePopup "$f" || echo "ไม่มี popup: $f"
done

# ข้อ 3.6 — สี Tag ที่ไม่ได้มาจาก enumConfig
grep -rn '<Tag color=' src/app/owner | grep -v antColor

# ข้อ 3.13 — component ใหม่ขึ้นทะเบียนใน COMPONENT_MAP แล้วหรือยัง
for c in $(find src/app/owner src/components -name "*.tsx" -newer package.json \
            -exec basename {} .tsx \;); do
  grep -q "$c" docs/COMPONENT_MAP.md || echo "ยังไม่ขึ้นทะเบียน: $c"
done
```

> **หมายเหตุเรื่องการนับปุ่มไอคอนล้วน (ข้อ 3.8):** `grep` ธรรมดานับผิด เพราะ regex `<Button[\s\S]*?/>` จะไปหยุดที่ `/>` ของไอคอนข้างใน (`icon={<PlusIcon />}`) ไม่ใช่ `/>` ของตัวปุ่มเอง — ต้องเขียนตัวไล่อ่านที่ข้ามวงเล็บปีกกาและเครื่องหมายคำพูดก่อน ถึงจะได้ตัวเลขที่ถูก (16 ปุ่ม ไม่ใช่ 72)
> นี่เป็นบทเรียนทั่วไป: **อย่าใช้ regex แยกโครงสร้างที่ซ้อนกันได้** — เจอบ่อยทั้งกับ HTML, JSON และ JSX

---

## 6. สิ่งที่อยากให้จำ 5 ข้อ

1. **กฎที่ไม่มีเครื่องตรวจ = กฎที่จะถูกลืม** — หลักฐานอยู่ในเอกสารนี้ทั้งฉบับ: ทุกเรื่องที่มีสคริปต์ตรวจผ่านหมด ทุกเรื่องที่อาศัยความจำหลุดหมด
2. **แยกให้ออกระหว่าง "ความปลอดภัย" กับ "ประสบการณ์ผู้ใช้"** — การเช็คสิทธิ์ที่ frontend ไม่ใช่ security แต่ก็ยังต้องมี
3. **เอกสารที่ผิดอันตรายกว่าไม่มีเอกสาร** — แก้โค้ดแล้วต้องแก้เอกสารในรอบเดียวกัน
4. **ไล่เก็บหนี้ด้วย ratchet ไม่ใช่ big bang** — หยุดเลือดก่อน (กันเพิ่ม) แล้วค่อย ๆ ถอน ดีกว่ารอวันว่างที่ไม่เคยมี
5. **เจอ "1 ใน 32 หน้าทำไม่เหมือนเพื่อน" ให้สงสัยไว้ก่อน** — ความแตกต่างมักเป็นร่องรอยของสิ่งที่ลืมทำ ไม่ใช่การตัดสินใจ

---

*ตรวจโดยอ่านโค้ดและรันสคริปต์ของโปรเจกต์จริง ไม่มีการแก้ไขไฟล์ใด ๆ ระหว่างตรวจ*
**ประวัติการตรวจ**

| รอบ | วันที่ | commit | ผล |
|---|---|---|---|
| 1 | 2026-10-09 | `4f0202e` | เจอ 12 ประเด็น |
| 2 | 2026-10-10 | `6d9352f` | หลัง merge `main` (+51 commit) — ข้อ 3.1 แก้แล้ว · ปรับตัวเลขทั้งหมด |
| 3 | 2026-10-10 | `089ccda` | ตรวจเต็มรูปแบบรวมโค้ดใหม่ — ข้อ 3.2 แก้แล้ว · ข้อ 3.6 พบว่าใหญ่กว่าเดิม (4 → 17 จุด) · เจอข้อ 3.13 ใหม่ |

*ทุกเลขบรรทัดอ้างอิงสถานะ ณ `089ccda` — ถ้า `main` ขยับอีก ให้รันคำสั่งใน §5 ทวนก่อนลงมือ*

> **ข้อสังเกตจากการตรวจ 3 รอบ:** ตัวเลขในรายงานแบบนี้ **หมดอายุเร็วมาก** — แค่ 1 วันกับ 51 commit ก็เปลี่ยนไป 5 จุดแล้ว
> นี่คือเหตุผลที่ §4 Phase 1 (เปลี่ยนกฎให้เป็นสคริปต์) สำคัญกว่าการไล่แก้: **สคริปต์ไม่หมดอายุ รายงานหมด**
