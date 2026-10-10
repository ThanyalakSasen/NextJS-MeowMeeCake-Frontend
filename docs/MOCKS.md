# ทดสอบโดยไม่มี mock — backend ในเครื่อง + DB ทดสอบ

> **เอกสารนี้คืออะไร:** mock (MSW) ถูกถอดออกแล้ว **2026-10-09** (BACKLOG4 I11 — handler ดัก path เก่าที่ไม่มี `/admin` จนใช้ไม่ได้ตั้งแต่ต่อ backend จริง)
> เอกสารนี้แทนที่คู่มือ MSW เดิม: วิธีทดสอบงานที่เรียก API กับ **backend จริงในเครื่อง** โดยไม่แตะข้อมูลจริง
> เนื้อหาเดิม (handler · fixture · credential ปลอม) ดูได้จาก git history ของไฟล์นี้และ `src/mocks/` (ก่อน commit ที่ถอด)

**สิ่งที่ถูกถอด:** `src/mocks/` · `src/components/providers/MSWReady.tsx` · `public/mockServiceWorker.js` · แพ็กเกจ `msw` · env `NEXT_PUBLIC_API_MOCK` (ค่าเดิมใน `.env.local` ไม่มีผลแล้ว ลบทิ้งได้)

---

## 1. ห้ามทดสอบกับ DB จริง

`.env.local` ของ backend ชี้ไป MongoDB Atlas (ข้อมูลร้านจริง) — ตอนทดสอบ **ทับด้วย env ตอนรัน** ให้ไป DB ในเครื่องเสมอ
(Next โหลด `.env.local` แต่ไม่ทับตัวแปรที่มีอยู่แล้วใน process — ค่าว่างก็นับว่ามี)

```bash
# backend (โปรเจกต์ D:\Cream\MeowMeeCake-Backend\NextJS-MeowMeeCake) — พอร์ต 3000
MONGODB_URI=mongodb://127.0.0.1:27017/meowmeecake-test \
EMAIL_USER= EMAIL_PASS= EMAIL_SERVICE= \
LINE_CHANNEL_ACCESS_TOKEN= LINE_TARGET_ID= \
npx next dev -p 3000
```

- `EMAIL_*` / `LINE_*` ว่าง = ไม่มีอีเมล/LINE ส่งออกจริงระหว่างทดสอบ
- frontend: `npm run dev` (พอร์ต 3001) กับ `.env.local` ที่ชี้ `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api`

## 2. ข้อมูลทดสอบ

DB `meowmeecake-test` มีข้อมูลจากชุดทดสอบที่ผ่านมา (BACKLOG3/4) — บัญชีที่ใช้บ่อย:

| บัญชี | role | ใช้ทดสอบ |
|---|---|---|
| `c3.checkout@meowmeecake.test` | ลูกค้า | ตะกร้า · checkout · แต้ม/คูปอง · รีวิว · ติดต่อร้าน |
| `e2.owner@meowmeecake.test` | เจ้าของร้าน | หลังร้านทุกหน้า |
| `e2.staff@meowmeecake.test` | พนักงาน (`store_info` ดู + แก้เท่านั้น) | หน้าที่แสดงตามสิทธิ์ |

รหัสผ่านอยู่ในสคริปต์ seed ของแต่ละชุดทดสอบ (ไม่ใส่ในเอกสารนี้) · สคริปต์ seed ต้อง **ปฏิเสธ** ถ้า `MONGODB_URI` ไม่ใช่ `mongodb://127.0.0.1:27017/meowmeecake-test`

## 3. วิธีทดสอบที่ใช้ในงานที่ผ่านมา

- **ระดับ API:** สคริปต์ `tsx` import `src/services/*` ของ frontend ตรง ๆ แล้วยิง backend ในเครื่อง (แนบ cookie เองด้วย interceptor ของ `http.raw`) · ตรวจผลกับ backend และกับ DB · **คืนค่าที่แก้ตอนจบ** (ข้อมูลร้าน · รีวิว · หัวข้อ ฯลฯ) และลบไฟล์ที่อัปโหลดระหว่างทดสอบ
- **ระดับหน้าจอ:** ขับ Chrome ในเครื่องแบบ headless ด้วย `playwright-core` (ไม่ต้องดาวน์โหลด browser) → login ผ่านฟอร์มจริง → ถ่ายภาพจอคอม/มือถือ + เก็บ console error / API ที่ล้ม (BACKLOG4 §10)
- ผลทดสอบแต่ละงานบันทึกไว้ในแถวของงานนั้นใน `BACKLOG3-merge.md` / `BACKLOG4-merge.md`
