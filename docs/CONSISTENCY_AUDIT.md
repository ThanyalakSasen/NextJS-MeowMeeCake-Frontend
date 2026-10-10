# ตรวจความสอดคล้องของ Component ฝั่งหลังร้าน (`/owner/*`)

> **เอกสารนี้คืออะไร:** ผลตรวจว่าโค้ดฝั่งหลังร้าน "ทำตามกติกาที่ตัวเองเขียนไว้" แค่ไหน — อะไรตรง อะไรหลุด และควรไล่เก็บตามลำดับไหน
> **เปิดอ่านเมื่อ:** รับงานต่อจากคนอื่น · จะเพิ่มหน้าใหม่แล้วอยากรู้ว่า "แบบที่ถูก" หน้าตาเป็นยังไง · วางแผน sprint เก็บหนี้ทางเทคนิค
> **ตรวจเมื่อ:** 2026-10-09 · **ทวนซ้ำเต็มรูปแบบ:** 2026-10-10 หลัง merge `main` (+51 commit) — ตรวจโค้ดใหม่ด้วยทั้งหมด
> **ขอบเขต:** `src/app/owner/**` (33 route) + `src/components/**` · **ไม่ได้แก้โค้ดใด ๆ** ระหว่างตรวจ
> **เกณฑ์ที่ใช้ตัดสิน:** `COMPONENT_MAP.md` · `ACTION_BUTTONS.md` · `ALERTS.md` · `THEME.md` (กติกาของโปรเจกต์เอง ไม่ใช่ความเห็นส่วนตัว)
>
> **เอกสารนี้ต่างจาก [`Final-Backlog.md`](Final-Backlog.md) ยังไง** — อ่านก่อนเริ่มงาน เพื่อไม่ทำซ้ำ (เคยเกิดมาแล้ว · ข้อ 3.15):
>
> | | `Final-Backlog.md` | ไฟล์นี้ |
> |---|---|---|
> | ถาม | *อะไรยังไม่เสร็จ / บล็อก deploy ไหม* | *โค้ดทำตามกติกาที่ทีมเขียนไว้เองไหม* |
> | ครอบคลุม | ทั้ง FE + BE · สิทธิ์ · env · การทดสอบ · การตัดสินใจ | เฉพาะ FE · ความสอดคล้องของ component |
> | เรื่องสิทธิ์ (P1–P11) | **เจ้าของเรื่อง** | อ้างอิงเท่านั้น — ไม่แก้เองแล้ว |
> | `text-gray-400` · ไอคอน · สี Tag · ของซ้ำ | ไม่มี | **เจ้าของเรื่อง** |
>
> **กติกา:** เรื่องสิทธิ์ → ทำผ่าน `Final-Backlog` §1 · เรื่องความสอดคล้องของ UI/โครงสร้าง → ทำผ่านไฟล์นี้

---

## 0. อ่าน 1 นาที

| | |
|---|---|
| **สรุปสั้นที่สุด** | โครงสร้างใหญ่แข็งแรงมาก · ที่หลุดคือ "รายละเอียดที่ไม่มีเครื่องตรวจอัตโนมัติ" |
| **`npm run check`** | ✅ **เขียวทั้ง 5 ด่าน** (i18n · theme · **ui** · tsc · eslint) — ด่าน ui เพิ่มใน Phase 1 |
| **เจอทั้งหมด** | 15 ประเด็น — ✅ **ปิดครบทั้ง 15** (2026-10-10) |
| **ยังไม่ได้ทำ** | ทดสอบด้วยตา — `TEST-PHASE3-TAG-COLORS.md` · `TEST-PHASE3-GRAY-TEXT.md` |
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

#### 3.3 ~~พนักงานเห็นปุ่มที่ตัวเองกดไม่ได้ (6 หน้า)~~ · ✅ **แก้แล้ว** (Phase 2 · 2026-10-10)

**อาการ**
ระบบมี `usePermission()` ไว้ซ่อนปุ่มตามสิทธิ์ของ role — แต่ 6 หน้าที่มีการแก้ข้อมูลลืมเรียก

**หลักฐาน** — ViewModel ที่มี `useMutation` แต่ไม่มี `usePermission`:

| ไฟล์ | mutation | backend เช็คอะไรจริง | แก้ด้วย |
|---|---|---|---|
| `store-design/useStoreDesignViewModel.ts` | 5 | `products.*` | `usePermission("products")` |
| `notificationsHistory/useNotificationHistoryViewModel.ts` | 3 | DELETE = **owner เท่านั้น** | เช็ค `roleType` |
| `employees/addEmployee/…` | 2 | `employees.create` | `usePermission("employees")` |
| `employees/editEmployee/…` | 2 | `employees.update` | 〃 |
| `products/addProducts/…` | 2 | `products.create` | `usePermission("products")` |
| `products/[id]/edit/…` | 2 | `products.update` | 〃 |

(อีก 20 ไฟล์ที่เหลือเรียกครบ)

> ⚠️ **ตอนลงมือแก้พบว่ารายงานตอนตรวจยังไม่ละเอียดพอ 2 ข้อ** — ถ้าเติม `usePermission` ไปตรง ๆ ตามที่เขียนไว้เดิมจะผิดทั้งคู่:
>
> **1. `store-design` ไม่มี menu key ของตัวเอง** — ตอนแรกดูเหมือนควรเป็น `"store_design"` แต่ `MENU_KEYS` ไม่มีค่านี้
> ไปอ่าน backend แล้วพบว่าแบนเนอร์อยู่ใต้สิทธิ์ **`products`** (`/api/admin/banners/route.ts` → `auth: { menu: "products" }`)
>
> **2. `notificationsHistory` ไม่ได้ใช้ menu permission เลย** — `/admin/notifications` GET/PATCH แค่ล็อกอินก็พอ
> แต่ **DELETE เป็น `requireRole(session, "owner")`** (`notifications/[id]/route.ts:25-26`) → ต้องเช็ค **role** ไม่ใช่ permission
>
> **บทเรียน:** "เติม `usePermission` ให้ครบ" เป็นคำสั่งที่ฟังดูง่าย แต่ถ้าไม่ไปอ่าน backend ก่อน จะได้ gate ที่ผิดโดยไม่มีใครรู้
> — เพราะ **gate ที่ผิดก็ยังดูเหมือนทำงาน** (ปุ่มซ่อน/โชว์ได้เหมือนกัน แค่ผิดเงื่อนไข)

**ทำไมสำคัญ — และสิ่งที่ *ไม่* ต้องกังวล**
ขอให้อ่านคอมเมนต์ใน `src/context/PermissionsContext.tsx:8` ให้ดี:

> ⚠️ นี่คือ "UX gate" เท่านั้น (ซ่อน/โชว์ปุ่ม) — ตัวบังคับสิทธิ์จริงอยู่ที่ backend

แปลว่า **นี่ไม่ใช่ช่องโหว่ความปลอดภัย** พนักงานที่ไม่มีสิทธิ์กดปุ่มไปก็โดน backend ปฏิเสธอยู่ดี แต่ประสบการณ์ที่ได้คือ "เห็นปุ่ม → กด → ขึ้น error" ซึ่งแย่กว่า "ไม่เห็นปุ่มตั้งแต่แรก" และไม่เหมือนอีก 20 หน้า

> 💡 **แนวคิดที่ควรจำ: Defense in Depth (ป้องกันหลายชั้น)**
> การเช็คสิทธิ์ที่ frontend = เพื่อ **ประสบการณ์ที่ดี**
> การเช็คสิทธิ์ที่ backend = เพื่อ **ความปลอดภัย**
> ต้องมีทั้งคู่ และห้ามสลับหน้าที่กัน — frontend เชื่อถือไม่ได้ เพราะผู้ใช้แก้โค้ดในเบราว์เซอร์ได้

**แก้ไปยังไง**

| หน้า | วิธี |
|---|---|
| **4 หน้าฟอร์ม** (add/edit พนักงาน · add/edit สินค้า) | `OwnerLayout` กั้นด้วย `.view` เท่านั้น → ViewModel เช็ค `.create`/`.update` เองแล้ว `router.replace(ACCESS_DENIED_PATH)` · View คืน `null` ระหว่างรอ redirect (กันภาพแวบ แบบเดียวกับ `OwnerLayout.tsx:81`) |
| **store-design** | ViewModel คืน `perm` · View ซ่อนปุ่มเพิ่ม 2 จุด + ปิด drag · `BannerCard` รับ `canUpdate`/`canDelete` (แบบเดียวกับ `products/_components/ProductCard`) |
| **notificationsHistory** | `useCurrentUser()` → `canDelete = roleType === "owner"` · ซ่อนปุ่ม "ลบทั้งหมด" และคอลัมน์ปุ่มลบในตาราง |

**ทำไมหน้าฟอร์มถึง redirect แทนที่จะซ่อนปุ่ม:** ซ่อนปุ่มบันทึกแล้วปล่อยให้กรอกฟอร์มจนเสร็จถือว่าแย่กว่าไม่ให้เข้าตั้งแต่แรก
และมีหน้า `/owner/access-denied` พร้อมใช้อยู่แล้ว — ใช้ทางเดียวกับที่ `OwnerLayout` ใช้จะได้ไม่มี 2 มาตรฐาน

**ทดสอบแล้ว:** login เป็น owner จริงแล้วยิงทั้ง 6 หน้า — **HTTP 200 ทุกหน้า** ไม่มี error ใน dev log

---

### 🟠 กลุ่มที่ 2 — หน้าตาไม่สม่ำเสมอ

---

#### 3.4 ~~`text-gray-400`~~ · ✅ **แก้แล้ว** (Phase 3 ขั้น 5) — 106 จุด / 60 ไฟล์ → `gray-500`

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

#### 3.5 ~~ไอคอน "เพิ่ม" มี 2 หน้าตา~~ · ✅ **แก้แล้ว** (Phase 3 ขั้น 3) — `PlusIcon` อยู่ที่ `ActionButtons.tsx` ที่เดียว

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

#### 3.6 ~~สีป้าย `Tag` มาจาก 3 แหล่ง~~ · ✅ **แก้แล้ว** (Phase 3 ขั้น 4) — มาจาก `enumConfig` ที่เดียว

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

#### 3.7 ~~import antd ข้าม base wrapper~~ · ✅ **แก้แล้ว** (Phase 3 ขั้น 1) — 10 ไฟล์

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

#### 3.8 ~~ปุ่มไอคอนล้วน 16 ปุ่ม เอกสารรับรอง 6~~ · ✅ **แก้แล้ว** — `aria-label` ครบ (Phase 2) · ขึ้นทะเบียนครบ (Phase 5)

**อาการ**
`ACTION_BUTTONS.md` มีกฎใหญ่ว่า *"ทุกปุ่มต้องมีไอคอน + คำ"* และมีข้อยกเว้น 6 ปุ่มที่ **ตั้งใจ** ให้มีแต่ไอคอน (เพราะแถวแคบมาก ใส่คำแล้วล้น) — พร้อมเหตุผลกำกับทุกปุ่ม

สแกนจริงเจอ 16 ปุ่ม คือมี **10 ปุ่มที่เพิ่มเข้ามาทีหลังโดยไม่ได้ขึ้นทะเบียน**:

| ไฟล์ | บรรทัด | มี `aria-label` |
|---|---|---|
| `products/[id]/edit/_components/CustomizationEditor.tsx` | 117, 119, 121 | ✓ |
| `reports/reviews/settings/_components/AspectsTab.tsx` | 65, 67, 105 | ✓ |
| `reports/reviews/_components/ReviewCard.tsx` | **114, 118** | ✅ **เติมแล้ว** (Phase 2) |
| `shared/categories/CategoryManagerDialog.tsx` | 101, 110 | ✓ |

**ทำไมสำคัญ**
ปุ่มที่มีแต่ไอคอนนั้น "ว่างเปล่า" สำหรับ **screen reader** (โปรแกรมอ่านหน้าจอของผู้พิการทางสายตา) — ผู้ใช้จะได้ยินแค่คำว่า "ปุ่ม" โดยไม่รู้ว่าปุ่มอะไร `aria-label` คือข้อความที่ใส่ไว้ให้ screen reader อ่านแทน

`ReviewCard.tsx:114,118` (ปุ่มปักหมุด / ทำเครื่องหมายอ่านแล้ว) ใช้ antd `<Tooltip>` ครอบแทน — tooltip ขึ้นตอนเอาเมาส์ชี้ ซึ่งช่วยคนที่มองเห็นและใช้เมาส์ แต่**ไม่ช่วยคนที่ใช้ screen reader หรือคีย์บอร์ดอย่างเดียว**

**แก้ยังไง**
1. ~~เติม `aria-label` ให้ 2 ปุ่มใน `ReviewCard.tsx`~~ ✅ **เสร็จ Phase 2** — ตอนนี้ปุ่มไอคอนล้วนมี `aria-label` ครบ 16/16
   และกฎ `icon-button-aria` มี baseline = 0 แล้ว คือ**ปิดสนิท** เพิ่มปุ่มที่ไม่มี `aria-label` อีกไม่ได้
2. ⬜ ขึ้นทะเบียน 10 ปุ่มลง `ACTION_BUTTONS.md §4.1` พร้อมเหตุผล — ถ้าหาเหตุผลไม่ได้ แปลว่าควรใส่คำกำกับ (ทำใน Phase 5)

---

#### 3.9 ~~import heroicons เองแทน `actionIcon`~~ · ✅ **แก้แล้ว** (Phase 3 ขั้น 2)

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

#### 3.10 ~~ชั้นโฟลเดอร์ที่ไม่มีในกติกา~~ · ✅ **แก้แล้ว** (Phase 4 + 5) — ย้าย `orders/_components` ขึ้น `shared/orders/` · บันทึกชั้น `<feature>/_components/` ลงกติกา

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

#### 3.11 ~~หน้าฟอร์ม 4 หน้าเขียนโครงซ้ำ~~ · ✅ **แก้แล้ว** (Phase 4) — `FormPageLayout` + `FormActions`

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

#### 3.12 ~~เอกสารพูดถึงของที่ไม่มีแล้ว~~ · ✅ **แก้แล้ว** (Phase 5)

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

#### 3.13 ~~component ใหม่ไม่ขึ้นทะเบียน~~ · ✅ **แก้แล้ว** (Phase 5) — ขึ้นครบ + เพิ่มของใหม่จาก Phase 3B/4

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
(ข้อนี้เขียนเป็นกติกาแล้วที่ `COMPONENT_MAP.md` §กติกา de-duplicate ข้อ 4)

---

#### 3.14 ~~โค้ดทำงานเหมือนกันกระจายหลายไฟล์~~ · ✅ **แก้แล้ว** (Phase 3B) — กลุ่ม A ครบ 5 รายการ

**อาการ**
ข้อ 3.10 / 3.11 คุมเรื่อง **"ตำแหน่ง"** (component ตัวเดียวถูกใช้ 2 หน้า → ควรย้ายขึ้น `shared/`)
ข้อนี้คือเรื่อง **"พฤติกรรม"** — component **คนละตัว คนละชื่อ แต่ทำงานเหมือนกัน** ซึ่ง grep หาไม่เจอ ต้องอ่านว่าโค้ด*ทำอะไร*

**วิธีสแกน** (ทำซ้ำได้ — สคริปต์อยู่ใน §5)
1. **จับบล็อกซ้ำ** — normalize ทุกบรรทัด ตัดคอมเมนต์/ช่องว่าง แล้วหา run ที่ตรงกันข้ามไฟล์ ≥ 5 บรรทัด → เจอ **128 คู่**
2. **จับโครงเหมือน** — ทำ signature ของแต่ละไฟล์จาก (JSX tag + hook + import) แล้ววัด Jaccard → เจอ **24 คู่ที่ ≥ 60%**

> ⚠️ **ตัวเลขดิบใช้ตัดสินไม่ได้** — "โครงเหมือน" ส่วนใหญ่แปลว่า convention ทำงานถูก ไม่ใช่ข้อบกพร่อง
> ต้องไล่อ่านแล้วแยกกลุ่มก่อน เกณฑ์ที่ใช้อยู่ที่ `COMPONENT_MAP.md` §กติกา de-duplicate

---

##### 🔴 กลุ่ม A — ซ้ำจริง ควรยุบ

**A1 · บล็อก "โหลดไม่สำเร็จ + ลองใหม่" — ซ้ำ 31 ไฟล์**

```tsx
{vm.isError ? (
  <div className="flex flex-col items-center gap-3 py-10 text-center">
    <p className="text-gray-600">{t("common.loadFailed")}</p>
    <RetryButton onClick={() => vm.refetch()} />
  </div>
) : vm.isLoading ? ( <LoadingSpin /> ) : ( ... )}
```

**และมันเพี้ยนไปแล้วจริง** — นี่คือหลักฐานที่ดีที่สุดในเอกสารนี้ว่าทำไม copy-paste ถึงไม่รอด:

| สีข้อความ | จำนวน | ไฟล์ที่หลุด |
|---|---|---|
| `text-gray-600` | 28 | (มาตรฐาน) |
| `text-gray-500` | 1 | `products/ProductsView.tsx:109` |
| `m-0 text-red-500` | 1 | `products/search-synonyms/_components/SearchTester.tsx:40` |
| `m-0 text-gray-600` | 1 | `orders/preOrderRound/_components/RoundDashboardDrawer.tsx:103` |

ปุ่มก็เขียน 2 แบบ: `onClick={() => vm.refetch()}` 18 ที่ · `onClick={vm.refetch}` 6 ที่

ไม่มีใครตั้งใจให้ต่าง — มันค่อย ๆ เพี้ยนตอนลอกไปวาง และ**ไม่มีทางรู้ว่าเพี้ยนจนกว่าจะเอามาเรียงเทียบกัน**

**A2 · ตัวอัปโหลดรูป 3 ตัว — 196 บรรทัด**

| ไฟล์ | บรรทัด |
|---|---|
| `products/_components/ProductImageUpload.tsx` | 65 |
| `store-design/_components/BannerImageUpload.tsx` | 61 |
| `finance/expenses/_components/ReceiptUpload.tsx` | 70 |

โครงเดียวกันหมด: `customRequest` → upload → `alert.error` · `listType="picture-card"` · `accept`
ต่างกันจริงแค่ **3 อย่างที่ทำเป็น prop ได้**: จำนวนรูปสูงสุด · ขนาดไฟล์สูงสุด · ชนิดไฟล์ที่รับ

`ReceiptUpload` ถูกสร้างตอนแก้ข้อ 3.1 (commit `d380b4c`) โดยลอกโครงจาก 2 ตัวแรก — **ตอนแก้บั๊กหนึ่ง ได้สร้างของซ้ำชิ้นที่ 3 ขึ้นมาพร้อมกัน** ซึ่งเป็นเรื่องปกติมากเวลาไม่มีของกลาง

**A3 · บล็อก Select กรองสถานะ — ซ้ำ 3 ไฟล์ ตัวอักษรต่อตัวอักษร**

```tsx
<div style={{ minWidth: 150 }}>
  <Select value={vm.status} onChange={(v) => vm.setStatus(v as VM["status"])} options={statusOptions} />
</div>
```
`ingredients/IngredientsView.tsx:114` · `ingredients/ingredientStock/IngredientStockView.tsx:74` · `products/productStock/ProductStockView.tsx:91` (ซ้ำกัน 19–20 บรรทัดติด)

**A4 · `updateRow` + `interface ItemRow` + ปุ่มลบแถว — ซ้ำ 2 ที่ เหมือนกันเป๊ะ**

```tsx
const updateRow = (key: string, patch: Partial<ItemRow>) =>
  setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
```
`orders/preOrderRound/_components/RoundFormModal.tsx:57` · `production/_components/ProductionOrderFormModal.tsx:63`
(ซ้ำแค่ 2 ครั้ง แต่ *เหมือนกันทุกตัวอักษร* จึงเข้าข้อยกเว้นของ rule of three)

**A5 · `PROVINCE_OPTIONS` — บรรทัดเดียวกัน 3 ที่**

```tsx
const PROVINCE_OPTIONS = THAI_PROVINCES.map((p) => ({ value: p, label: p }));
```
`orders/delivery-zones/_components/DeliveryZoneForm.tsx:10` · `ZoneChecker.tsx:9` (ชื่อ `OPTIONS`) · `shipping/ShippingZonesView.tsx:20`

---

##### 🟡 กลุ่ม B — โครงเหมือนเพราะทำตาม convention (ยุบ *scaffolding* ได้ แต่อย่ายุบตัว component)

| คู่ | เหมือน | ทำไมถึงไม่ควรยุบทั้งตัว |
|---|---|---|
| `RoundFormModal` ↔ `ProductionOrderFormModal` | 85% | คนละโดเมน — ยุบแค่ A4 พอ |
| `StockActionModal` ↔ `AdjustStockModal` | 83% | วัตถุดิบมี 3 โหมด + note · สินค้าตั้งค่าใหม่อย่างเดียว |
| `IngredientFormModal` ↔ `RoundItemFormModal` | 83% | ฟิลด์คนละชุด |
| `OrderDetailContent` ↔ `PreorderDetailContent` | 82% | ยุบส่วนที่ซ้ำไปแล้ว (`SlipImage` · `DeliverySection` · `RefundSection`) |

**แต่มีของที่ควรดึงออกมา:** ทั้ง 8+ ไฟล์เขียน scaffolding เดียวกัน — `useAntForm()` + `useEffect` เซ็ตค่าเริ่มต้น + `<Modal {...modalButtonIcons(...)}>` + prop ชื่อ `target` / `saving` / `onClose`
→ ทำ `<FormModal>` ครอบได้ **โดยไม่ต้องยุบตัว modal แต่ละตัว**

---

##### 🟢 กลุ่ม C — ดูซ้ำแต่ไม่ซ้ำ (ถูกแล้ว ห้ามไปรื้อ)

| คู่ | ทำไมถึงถูก |
|---|---|
| `StarRating` ↔ `RatingDisplay` | คนละอย่าง และ **`StarRating.tsx:2` เขียนคอมเมนต์อธิบายไว้** ← ต้นแบบที่ควรลอก |
| `SectionCard` ↔ `base/Card` | composition ไม่ใช่ duplication |
| `DeliveryZoneForm` ↔ `ShippingZoneFormFields` (73%) | กติกาธุรกิจต่างกันจริง ทั้งคู่มีคอมเมนต์กำกับ |
| Tab components 8 ตัว | เหมือนเพราะใช้ `TabbedPageLayout` ตัวเดียวกัน = ระบบทำงานถูก |

> 💡 **แนวคิดที่ควรจำ: การยุบผิดแย่กว่าไม่ยุบ**
> ถ้ายุบกลุ่ม C เข้าด้วยกัน จะได้ component ที่มี prop แปลก ๆ เต็มไปหมดเพื่อรองรับทุกเคส (เรียกว่า *over-abstraction*)
> แก้ทีหลังยากกว่าปล่อยให้ซ้ำ เพราะตอนนั้นมี 5 หน้าพึ่งมันอยู่แล้ว
> **กฎง่าย ๆ: ซ้ำเล็กน้อย ถูกกว่า abstraction ที่ผิด**

---

#### 3.15 `usePermission` ใช้ menu key ผิด · ✅ **แก้แล้วบน `main`** (Final-Backlog P1–P3)

> ⚠️ **งานนี้ถูกทำซ้ำ — บันทึกไว้เป็นบทเรียน ไม่ใช่เพื่อแก้ตัว**
> ผมแก้ 3 จุดนี้ใน Phase 2B บน branch `fix/consistency` โดยไม่รู้ว่า **อีก session ทำไปแล้วบน `main`**
> (PR #68 `1d1040b` — Final-Backlog P1–P3 · merge 2026-10-10) ตอน merge จึงชน conflict 4 ไฟล์
>
> **ผลตัดสิน: ใช้ของ `main` ทั้งหมด** เพราะครอบคลุมกว่าจริง ๆ:
>
> | | ของผม (Phase 2B) | ของ `main` (P1–P3) |
> |---|---|---|
> | สต็อก/ประวัติวัตถุดิบ | เพิ่ม `canWriteStock` ใน ViewModel เดียว | แก้ **`ROUTE_MENU_MAP` + sidebar + 2 ViewModel** ให้เป็น `ingredients` ทั้งกลุ่ม |
> | หน่วยนับ | แยก `readPerm`/`writePerm` | เหมือนกัน + **เลิกเรียก `/admin/units`** ในหน้าที่ไม่จำเป็น (ใช้ `unitLabel()` จาก `unit_id` ที่ populate มา) |
> | POS guest | ✓ เหมือนกัน | ✓ เหมือนกัน |
> | **รีวิวลูกค้า (P1)** | ❌ **ไม่เจอ** | ✓ `/owner/reports/reviews` เคย gate ด้วย `products` แต่ backend ย้าย `/admin/reviews` ไป `reports` แล้ว |
>
> **ทำไมผมพลาด P1:** การสแกนของผมไล่แค่ `usePermission()` ใน **ViewModel** — แต่ระบบนี้มี gate **2 ชั้น**
> และผมลืมชั้นแรก คือ `ROUTE_MENU_MAP` ใน `constants/menuKeys.ts` ที่ `OwnerLayout` ใช้กั้นทั้งหน้า
> `useReviewsViewModel` ใช้ `reports` ถูกอยู่แล้ว เลยไม่ติดสแกน — ที่ผิดคือ route map ซึ่งผมไม่ได้เทียบ
>
> **บทเรียน 2 ข้อ:**
> 1. **ตรวจให้ครบทุกชั้นของกลไกเดียวกัน** — เจอ gate ที่ ViewModel แล้วอย่าเพิ่งหยุด ต้องถามว่ามีที่อื่นอีกไหม
> 2. **เช็คว่ามีใครทำอยู่ก่อนลงมือ** — `git log origin/main` และหาเอกสารแผนงานกลาง (ที่นี่คือ `Final-Backlog.md`)
>    ก่อนเริ่ม จะประหยัดกว่ามาแก้ conflict ทีหลัง

**อาการ
ข้อ 3.3 ตรวจว่า **"มี `usePermission` ไหม"** ซึ่งตอบได้ด้วย grep — แต่ตอบไม่ได้ว่า **"ใช้ key ถูกไหม"**
ต้องไล่ 3 ชั้น: **ViewModel → service → endpoint → menu key ของ backend** แล้วเทียบทีละตัว (backend 135 route · frontend 33 ViewModel)

**ผล: ตรง 26 จาก 30 ViewModel ที่มี gate** — ที่ไม่ตรง 4 จุด:

| # | ไฟล์ | frontend gate | backend ต้องการ | ผลกับพนักงาน |
|---|---|---|---|---|
| 1 | `orders/OrderInStore/usePOSViewModel.ts:106` | `orders` | `/admin/users` = **`employees.view`** | 🔴 **ปิดการขายไม่ได้เลย** |
| 2 | `ingredients/ingredientStock/…ViewModel.ts:42` | `stock.update` | POST `/admin/ingredient-transactions` = **`ingredients.update`** | 3 ปุ่มกดแล้ว 403 |
| 3 | `ingredients/units/useUnitsViewModel.ts:28` | `ingredients` | เขียน `/admin/units` = **`products.*`** | ปุ่มเพิ่มหน่วยกดแล้ว 403 |
| 4 | `production/useProductionViewModel.ts:100` | `production` | อ่าน `/admin/units` — `readMenus` ไม่มี `production` | ช่องหน่วยในฟอร์มว่าง |

**ข้อ 1 ร้ายแรงกว่าข้ออื่น — เป็นบั๊กจริง ไม่ใช่แค่ UX**
POS หา "ลูกค้าทั่วไป" ด้วย `usersService.list()` ซึ่งยิง `/admin/users` (ต้อง `employees.view`)
พนักงานเคาน์เตอร์ที่มีแค่ `orders.*` → `guestUserId` เป็น `null` → บรรทัด 236 `throw new Error(...)` → **ขายของไม่ได้**
(และระหว่างที่มันเคยทำงานได้ ก็แปลว่าพนักงานเคาน์เตอร์ต้องมีสิทธิ์เห็นรายชื่อพนักงานทั้งร้าน ซึ่งไม่ควร)

**แก้ไปยังไง**

| # | สถานะจริง |
|---|---|
| 1 POS guest | ✅ `main` — `posService.guestCustomer()` → `GET /admin/pos/guest-customer` (backend #83) |
| 2 สต็อกวัตถุดิบ | ✅ `main` — ย้ายทั้งกลุ่ม `/owner/ingredients/*` ไป `ingredients` ที่ `ROUTE_MENU_MAP` |
| 3 หน่วยนับ | ✅ `main` — ปุ่มตาม `products.*` · เลิกเรียก `/admin/units` ในหน้าที่ไม่ต้องใช้ |
| 4 `readMenus` ขาด `production` | **ถอนคำขอแล้ว** — แม่แบบบทบาทฝ่ายผลิตมี `ingredients`/`recipes`/`stock` ซึ่งอยู่ใน `readMenus` อยู่แล้ว (ดู `fix-backend.md`) |
| **P1 รีวิวลูกค้า** | ✅ `main` — จุดที่การสแกนของผมมองไม่เห็น (ดูกล่องด้านบน) |

**ทดสอบ:** `GET /api/admin/pos/guest-customer` คืน `{ _id, user_fullname: "ลูกค้าทั่วไป", email }` · 4 หน้าที่แก้ render ได้ HTTP 200 · BE log ยืนยันว่า POS เรียก endpoint ใหม่จริง

> 💡 **แนวคิดที่ควรจำ: กฎที่ข้าม 2 ระบบ ตรวจอัตโนมัติไม่ได้ง่าย ๆ**
> กฎ "มี `usePermission` ไหม" เขียนเป็น grep ได้ (และอยู่ใน `check-ui.mjs` แล้ว)
> แต่กฎ "key ตรงกับ backend ไหม" ต้องอ่านอีก repo — ซึ่ง CI ของ frontend มองไม่เห็น
>
> และที่อันตรายคือ **key ผิดก็ยังดูเหมือนทำงาน** — ปุ่มซ่อน/โชว์ได้ตามปกติ ผิดแค่เงื่อนไข
> จะรู้ตัวก็ต่อเมื่อมีพนักงานสิทธิ์จำกัดมาใช้จริง ซึ่งอาจเป็นวันเปิดร้าน
>
> ทางลดความเสี่ยงที่ทำได้จริง: **เขียน endpoint + menu key ที่คาดไว้เป็นคอมเมนต์ในทุก ViewModel ที่เรียก `usePermission`**
> (ทำไปแล้วในทั้ง 3 ไฟล์ที่แก้) แล้วรันตรวจข้าม repo ซ้ำทุกครั้งที่ pull backend — ดูคำสั่งใน §5

---

## 4. แผนการแก้ — ✅ เสร็จครบทุก Phase (2026-10-10)

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

### Phase 1 — สร้างรั้วกันถอยหลัง · ✅ **เสร็จแล้ว** 2026-10-10

สร้าง `scripts/check-ui.mjs` + `scripts/ui-baseline.json` และต่อเข้า `npm run check`

| กฎ | ตรวจอะไร | อ้างอิง | ของเดิมที่ค้าง |
|---|---|---|---|
| `no-gray-400` | ห้าม `text-gray-400` | `THEME.md §4` | 106 จุด / 60 ไฟล์ |
| `plus-icon-solid` | ห้าม `PlusIcon` จาก `24/outline` | `ACTION_BUTTONS.md §1.1` | 12 จุด / 12 ไฟล์ |
| `icon-button-aria` | `<Button ... icon={...} />` ที่ self-closing ต้องมี `aria-label` | `ACTION_BUTTONS.md §4.1` | 2 จุด / 1 ไฟล์ |
| `tag-color-enum` | `<Tag color=...>` ห้ามใส่ชื่อสี antd ตรง ๆ | `THEME.md §2` · ข้อ 3.6 | 18 จุด / 16 ไฟล์ |
| ~~error/retry~~ | ห้าม `common.loadFailed` นอก `QueryState.tsx` | ข้อ 3.14 A1 | ⏳ comment ไว้ — เปิดหลัง Phase 3B |

**คำสั่ง**
```bash
npm run check            # i18n → theme → ui → tsc → eslint  (ทั้ง 5 ด่าน)
npm run lint:ui          # เฉพาะกฎ UI
npm run lint:ui:update   # ขันเฟือง: เขียน baseline ใหม่จากสถานะปัจจุบัน
```

**กลไก ratchet** — เก็บ "จำนวนที่ยอมรับได้ต่อไฟล์" ใน `scripts/ui-baseline.json` (ไม่ใช่เลขบรรทัด เพราะบรรทัดขยับตลอด)

| สถานการณ์ | ผล |
|---|---|
| มากกว่า baseline | ✗ ไม่ผ่าน — เพิ่มของใหม่เข้ามา |
| เท่ากับ baseline | ผ่าน — ของเดิม รอ Phase 3/3B |
| น้อยกว่า baseline | ผ่าน + เตือนให้รัน `lint:ui:update` |
| ไฟล์ใหม่ที่ไม่มีใน baseline | ✗ ไม่ผ่านทันที — ไฟล์ใหม่ต้องสะอาดตั้งแต่แรก |

> 💡 **แนวคิดที่ควรจำ: Ratchet (เฟืองกันถอย)**
> เฟืองกันถอยคือกลไกที่หมุนไปข้างหน้าได้ แต่หมุนกลับไม่ได้ — baseline ทำหน้าที่แบบเดียวกัน
> **จุดเดิมยังผ่านได้ แต่จุดใหม่เพิ่มไม่ได้** · ดีกว่ารอ "วันว่างแก้ให้หมดทีเดียว" ที่ไม่เคยมาถึง
> และ**ห้ามใช้เลขบรรทัดเป็น key** — พอแก้โค้ดนิดเดียวบรรทัดขยับหมด allowlist จะใช้ไม่ได้ทันที

**ผลทดสอบ (ยืนยันแล้ว ไม่ได้เดา)**

| ทดสอบ | ผลที่ได้ |
|---|---|
| เพิ่ม `text-gray-400` ใน `base/Card.tsx` (ไฟล์ที่สะอาด) | ✗ ฟ้อง + `exit 1` |
| แก้ `UserLogView.tsx` จาก 3 → 2 จุด | ✓ ผ่าน + `↓ เหลือ 2 จาก 3 — ดีขึ้นแล้ว` + เตือนให้ขันเฟือง |
| สถานะปัจจุบัน | `npm run check` เขียวทั้ง 5 ด่าน |

**ของแถมที่เจอระหว่างทำ:** `npm run check` เดิมเรียก `check-i18n.mjs` **โดยไม่ใส่ `--strict`** → ต่อให้เจอ literal ภาษาไทย ก็ `exit 0` ไม่ได้กั้นอะไรเลย
แก้ให้ใส่ `--strict` แล้ว (ตอนนี้ผ่านอยู่แล้วจึงไม่กระทบ) — เป็นตัวอย่างของ "มีสคริปต์ แต่ไม่ได้เสียบสาย"

---

### Phase 2 — แก้สิ่งที่กระทบผู้ใช้จริง · ✅ **เสร็จแล้ว** 2026-10-10

| ลำดับ | งาน | ข้อ | ผล |
|---|---|---|---|
| ~~2.1~~ | ~~ทำ `UploadImageBox` ให้อัปโหลดจริง~~ | 3.1 | ✅ `d380b4c` |
| 2.2 | gate 6 ViewModel ตามสิทธิ์จริงของ backend | 3.3 | ✅ 11 ไฟล์ |
| 2.3 | เติม `aria-label` ให้ `ReviewCard.tsx:114,118` | 3.8 | ✅ กฎ `icon-button-aria` เหลือ 0 |

**สิ่งที่พบระหว่างทำ:** 2 ใน 6 หน้าต้องใช้วิธีต่างจากที่เขียนไว้ในแผน (รายละเอียดในข้อ 3.3) —
ต้องเปิดโค้ด backend อ่านทีละ route ก่อน ไม่งั้นได้ gate ที่ผิดเงื่อนไขแต่ดูเหมือนทำงาน

**ผลทดสอบ**

| ทดสอบ | ผล |
|---|---|
| `npm run check` | ✅ เขียวทั้ง 5 ด่าน |
| login owner จริง → ยิงทั้ง 6 หน้า | ✅ HTTP 200 ทุกหน้า · dev log ไม่มี error |
| ratchet ของ Phase 1 | ✅ จับได้เองว่า `icon-button-aria` เหลือ 0 → ขัน baseline ปิดกฎถาวรแล้ว |

> ⏳ **ยังไม่ได้ทดสอบด้วยบัญชีพนักงานสิทธิ์จำกัด** — ต้อง seed DB ทดสอบตาม `MOCKS.md`
> (`e2.staff@meowmeecake.test` เทียบกับ `e2.owner@meowmeecake.test`) แล้วดูว่าปุ่มหายจริงและหน้าฟอร์มเด้งไป access-denied จริง
> ตอนนี้ยืนยันได้แค่ "ฝั่ง owner ไม่พัง" ซึ่งยังไม่ครอบคลุมสิ่งที่แก้

---

### Phase 2B — gate ที่ใช้ menu key ผิด · ✅ **เสร็จแล้ว** 2026-10-10 · *(ข้อ 3.15)*

โผล่ขึ้นมาหลัง pull `main` ของ backend — ไม่ได้อยู่ในแผนเดิม เพราะตอนตรวจรอบแรกยังไม่ได้เทียบข้าม repo

| ลำดับ | งาน | แก้ที่ | ผล |
|---|---|---|---|
| 1 | POS → `posService.guestCustomer()` | frontend | ✅ BE log ยืนยันเรียก `/admin/pos/guest-customer` |
| 2 | ingredientStock → `canWriteStock` ถือ 2 เมนู | frontend | ✅ |
| 3 | units → แยก read `ingredients` / write `products` | frontend | ✅ |
| 4 | `readMenus` ของ `/admin/units` ขาด `production` | **backend** | ▢ บันทึกเป็น **Q-BE17** ใน `fix-backend.md` |

**ทำไมต้องแทรกก่อน Phase 3:** งานนี้คือ finding 3.3 ที่ยังไม่จบ (อาการเดียวกัน สาเหตุต่างกัน)
และแตะไฟล์เดียวกับที่ Phase 3 จะแก้สี/ไอคอน — ถ้าทำสลับกัน diff จะปนกันจนแยกไม่ออกว่าอันไหนเปลี่ยนตรรกะ อันไหนเปลี่ยนแค่สี

**ข้อควรระวังต่อจากนี้:** ทุกครั้งที่ pull `main` ของ backend ให้รันคำสั่งเทียบ menu key ใน §5 ซ้ำ —
backend เปลี่ยนสิทธิ์ของ route ได้โดยที่ `npm run check` ฝั่ง frontend ไม่มีทางรู้

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

### Phase 3B — ยุบของซ้ำ · ⏱ 1–1.5 วัน · *(ข้อ 3.14)*

**กติกาที่ใช้ตัดสิน:** `COMPONENT_MAP.md` §กติกา de-duplicate — ทำเฉพาะกลุ่ม A **ห้ามแตะกลุ่ม C**

#### ลำดับการทำ — เรียงตาม "ผลตอบแทน ÷ ความเสี่ยง"

| # | งาน | แตะกี่ไฟล์ | ความเสี่ยง | เวลา |
|---|---|---|---|---|
| 1 | **A5** ย้าย `PROVINCE_OPTIONS` ไป `constants/thaiProvinces.ts` | 3 | ต่ำมาก | 15 นาที |
| 2 | **A4** ดึง `ItemRow` + `updateRow` + ปุ่มลบแถว → `shared/form/EditableRows.tsx` | 2 | ต่ำ | 1 ชม. |
| 3 | **A3** ดึงบล็อก Select สถานะ → `shared/data/StatusFilterSelect.tsx` | 3 | ต่ำ | 45 นาที |
| 4 | **A2** ยุบตัวอัปโหลดรูป 3 → 1 | 3 | **กลาง** | 2–3 ชม. |
| 5 | **A1** ดึงบล็อก error/retry → `shared/feedback/QueryState.tsx` | **31** | กลาง | 3–4 ชม. |

**ทำไมเรียงแบบนี้:** เริ่มจากของเล็กที่ผิดพลาดยาก เพื่อให้ได้จังหวะและความมั่นใจก่อน
ส่วน A1 ไว้ท้ายสุดเพราะแตะ 31 ไฟล์ — ควรทำตอนที่ของอื่นนิ่งแล้ว ไม่งั้น review ปนกันจนดูไม่ออก

---

#### ขั้นที่ 1 · A5 — `PROVINCE_OPTIONS`

```ts
// src/constants/thaiProvinces.ts — เพิ่มท้ายไฟล์
export const PROVINCE_OPTIONS = THAI_PROVINCES.map((p) => ({ value: p, label: p }));
```
แล้ว import แทนที่ 3 จุด · `ShippingZoneFormFields.tsx:23` ทำ `.map()` เองพร้อมตรรกะ `taken` → **ปล่อยไว้** (ไม่ใช่ของซ้ำ)

#### ขั้นที่ 2 · A4 — แถวที่แก้/ลบได้

```tsx
// src/components/shared/form/EditableRows.tsx
export interface Row { key: string }
export function useEditableRows<T extends Row>(initial: T[] = []) {
  const [rows, setRows] = useState<T[]>(initial);
  const updateRow = (key: string, patch: Partial<T>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));
  return { rows, setRows, updateRow, removeRow };
}
export function RemoveRowButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) { ... }
```
`RemoveRowButton` ต้องมี `aria-label={t("common.delete")}` ในตัว — ได้แก้ข้อ 3.8 ไปด้วย

#### ขั้นที่ 3 · A3 — ตัวกรองสถานะ

```tsx
// src/components/shared/data/StatusFilterSelect.tsx
export function StatusFilterSelect<T extends string>({ value, onChange, options, minWidth = 150 }) { ... }
```

#### ขั้นที่ 4 · A2 — ตัวอัปโหลดรูป ⚠️ ระวังที่สุดในกลุ่มนี้

```tsx
// src/components/shared/form/ImageUpload.tsx
export function ImageUpload({
  value, onChange,
  max = 1,                    // ProductImageUpload = 8
  maxBytes,                   // ReceiptUpload = 5MB · อีก 2 ตัวไม่จำกัด
  accept = "image/*",         // ReceiptUpload รับ pdf ด้วย
  uploadFn,                   // endpoint ต่างกันต่อโดเมน
}: ImageUploadProps) { ... }
```

**ต้องทดสอบด้วยมือทั้ง 3 หน้า** เพราะนี่คือจุดที่เคยพังมาแล้ว (ข้อ 3.1 — ใบเสร็จอัปโหลดไม่ได้มาตลอดโดยไม่มีใครรู้) อย่าเชื่อแค่ว่า `tsc` ผ่าน:
- เพิ่มสินค้า → อัปโหลด 8 รูป → ครบไหม · อัปโหลดรูปที่ 9 → ถูกกันไหม
- แบนเนอร์ → อัปโหลด 1 รูป → แทนที่รูปเดิมได้ไหม
- ใบเสร็จ → อัปโหลดไฟล์ > 5MB → ขึ้น `alert.error` ไหม · ไฟล์ปกติ → บันทึกแล้วเปิดดูได้ไหม

#### ขั้นที่ 5 · A1 — `QueryState` (งานใหญ่สุด)

```tsx
// src/components/shared/feedback/QueryState.tsx
export function QueryState({
  isError, isLoading, onRetry, children,
}: { isError: boolean; isLoading: boolean; onRetry: () => void; children: React.ReactNode }) {
  const t = useTranslations();
  if (isError) return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-gray-600">{t("common.loadFailed")}</p>
      <RetryButton onClick={onRetry} />
    </div>
  );
  if (isLoading) return <LoadingSpin />;
  return <>{children}</>;
}
```

**วิธีทำให้ปลอดภัย — แบ่งเป็น 3 PR ย่อย อย่าทำรวดเดียว 31 ไฟล์:**

| PR | ขอบเขต | จุดประสงค์ |
|---|---|---|
| 1 | สร้าง `QueryState` + แปลง **3 ไฟล์แรก** | ให้ทีม review API ของ component ก่อนที่จะสายเกินแก้ |
| 2 | แปลงที่เหลือที่เป็น**มาตรฐาน** (`text-gray-600` + `() => vm.refetch()`) ~25 ไฟล์ | งานกล • diff ใหญ่แต่ซ้ำ ๆ |
| 3 | 3 ไฟล์ที่**เพี้ยน** — ตัดสินใจทีละตัว | ดูข้างล่าง |

**3 จุดที่เพี้ยน ต้องคิดก่อนแปลง — ไม่ใช่ลบทิ้งอัตโนมัติ:**

| ไฟล์ | เพี้ยนยังไง | ถามก่อนว่า |
|---|---|---|
| `ProductsView.tsx:109` | `text-gray-500` | ตั้งใจหรือพิมพ์พลาด? (น่าจะพลาด → ใช้มาตรฐาน) |
| `SearchTester.tsx:40` | `m-0 text-red-500` | อยู่ในกล่องทดสอบค้นหา สีแดงอาจตั้งใจ → อาจต้องมี prop `tone="inline"` |
| `RoundDashboardDrawer.tsx:103` | `m-0` | อยู่ใน drawer ที่ต้องการระยะต่างออกไป → ใช้ prop `className` |

**Definition of Done ของ Phase 3B:**
- `grep -rc 'common.loadFailed' src/app/owner --include=*.tsx` เหลือเฉพาะใน `QueryState.tsx` (+ ไฟล์ที่ตัดสินใจไว้ว่าต่างจริง พร้อมคอมเมนต์เหตุผล)
- `npm run check` เขียว
- ทดสอบด้วยมือครบ 3 หน้าอัปโหลด
- เพิ่มแถวของ component ใหม่ 5 ตัวลง `COMPONENT_MAP.md` (กติกา de-duplicate ข้อ 4)

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
| 1 | สร้างรั้วกันถอยหลัง | ครึ่งวัน | ต้องผ่าน 0 | ✅ **เสร็จ** 2026-10-10 |
| 2 | แก้สิ่งที่กระทบผู้ใช้ | ครึ่งวัน | ทำคู่ขนานกับ 1 ได้ | ✅ **เสร็จ** 2026-10-10 |
| ~~2B~~ | ~~gate ที่ใช้ key ผิด~~ (ข้อ 3.15) | — | — | ✅ **`main` ทำแล้ว** (P1–P3) — งานผมถูกแทนที่ |
| 3 | กวาดหน้าตา | 1–1.5 วัน | ต้องผ่าน 1 (ใช้ baseline) | ✅ **เสร็จ** 2026-10-10 |
| **3B** | **ยุบของซ้ำ** (ข้อ 3.14) | **1–1.5 วัน** | ควรรอ 3 จบ | ✅ **เสร็จ** 2026-10-10 |
| 4 | จัดโครงสร้าง | ครึ่งวัน | ควรรอ 3B จบ | ✅ **เสร็จ** 2026-10-10 |
| 5 | ปรับเอกสาร | 1 ชั่วโมง | ต้องผ่าน 4 | ✅ **เสร็จ** 2026-10-10 |
| | **เหลือทั้งหมด** | **0 — ครบทุก Phase** | | |

**ทำไม Phase 3B ต้องอยู่หลัง Phase 3:** Phase 3 แก้ `text-gray-400` / ไอคอน / สี Tag ซึ่งแตะไฟล์เดียวกับที่ Phase 3B จะยุบ
ถ้าทำสลับกัน จะต้องแก้ของเดิมแล้วมายุบทิ้งอีกรอบ — เสียเวลาสองเท่าและ diff อ่านยาก

**ทำไมไม่ควรข้าม Phase 1 ไปทำ 3B เลย:** ถ้ายังไม่มีสคริปต์ตรวจ พอยุบเสร็จแล้วอีก 2 เดือนก็จะมีคนลอกบล็อกเดิมกลับมาใหม่

---

### ⚠️ เช็กลิสต์ก่อนเริ่ม Phase ถัดไป (เพิ่มหลังเหตุการณ์ข้อ 3.15)

ทำทุกครั้งที่กลับมาทำงานต่อ — ใช้เวลา 2 นาที ประหยัดการแก้ conflict ได้เป็นชั่วโมง

```bash
git fetch origin
git log --oneline main..origin/main          # main ขยับไหม · มีใครแก้เรื่องเดียวกันหรือยัง
cd <backend> && git log --oneline -10        # backend เปลี่ยนสิทธิ์ของ route ไหม
```

| เช็ค | ทำไม |
|---|---|
| `origin/main` มี commit ใหม่ไหม | อาจมีคนแก้เรื่องเดียวกันไปแล้ว — merge ก่อนเริ่มเสมอ |
| เปิด [`Final-Backlog.md`](Final-Backlog.md) §1 และ §5 | งานที่จะทำอยู่ในนั้นไหม ถ้าอยู่ = เจ้าของเรื่องคือไฟล์นั้น |
| backend `main` ขยับไหม | สิทธิ์ของ route เปลี่ยนได้โดยที่ `npm run check` ฝั่งเรามองไม่เห็น (§5 มีคำสั่งเทียบ) |
| `npm run check` เขียวก่อนเริ่ม | จะได้แยกออกว่า error ที่เจอทีหลังเป็นของใหม่หรือของเก่า |

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

# ข้อ 3.14 A1 — บล็อก error/retry ซ้ำกี่ไฟล์ · เพี้ยนตรงไหน
grep -rln 'common.loadFailed' src/app/owner --include=*.tsx | wc -l
grep -rhn 'common.loadFailed' src/app/owner --include=*.tsx \
  | grep -oE 'className="[^"]*"' | sort | uniq -c | sort -rn

# ข้อ 3.14 — helper / ค่าคงที่ที่เขียนซ้ำ
grep -rn "const updateRow" src/app/owner
grep -rn "THAI_PROVINCES.map" src/

# ข้อ 3.15 — ViewModel ไหน gate ด้วย key อะไร (ฝั่ง frontend)
grep -rn "usePermission(" src/app/owner --include="use*ViewModel.ts"

# ข้อ 3.15 — route ไหนต้องการ key อะไร (ฝั่ง backend · รันใน repo ของ backend)
grep -rn "auth: { menu:\|withPermission(\|requireRole(" src/app/api/admin --include=route.ts
```

**ทุกครั้งที่ pull `main` ของ backend ให้เทียบ 2 คำสั่งสุดท้ายซ้ำ** — backend เปลี่ยนสิทธิ์ของ route ได้
โดยที่ `npm run check` ฝั่ง frontend ไม่มีทางรู้ (คนละ repo) ตัวอย่างจริงอยู่ในข้อ 3.15

**สแกนชั้นที่ 2 (หาโค้ดทำงานเหมือนกัน)** — สคริปต์เต็มอยู่ใน git history ของ PR ที่เพิ่มข้อ 3.14 · หลักการ:

```
blocks.mjs  normalize ทุกบรรทัด (ตัดคอมเมนต์/ช่องว่าง) → index บรรทัด → บรรทัดไหนโผล่หลายไฟล์
            ให้ขยายขึ้น-ลงจนไม่ตรง → run ยาว >= 5 บรรทัด = บล็อกซ้ำ

shape.mjs   signature ของไฟล์ = เซตของ (JSX tag + hook + ชื่อที่ import)
            เทียบคู่ด้วย Jaccard = |ร่วม| / |รวม| → >= 0.6 ถือว่าโครงเหมือน
```

> ⚠️ **สคริปต์ 2 ตัวนี้ชี้ "จุดที่ควรไปดู" ไม่ใช่ "จุดที่ต้องแก้"** ผลลัพธ์ต้องให้คนอ่านแล้วแยกกลุ่ม A/B/C เสมอ
> ห้ามเอาไปใส่ `npm run check` ให้มันฟ้อง error เพราะมันจะฟ้องกลุ่ม C (ที่ถูกต้องแล้ว) ด้วย

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
