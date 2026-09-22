# Debug Log — เชื่อมต่อ Frontend ↔ Backend

> บันทึกข้อผิดพลาด/บั๊กทั้งหมดที่เจอระหว่างเชื่อมต่อ `NextJS-MeowMeeCake-Frontend` เข้ากับ backend จริง
> (`D:\1.2569\MeowMeeCake\NextJS-MeowMeeCake`) — ทั้งสองโปรเจกต์พัฒนาแยกกันโดยอิงจาก
> `docs/API_CONTRACT.md` (อุดมคติ) ซึ่ง backend จริงไม่ได้ตรงตามนั้นทั้งหมด บันทึกนี้ไล่ตามลำดับที่เจอจริง
>
> อัปเดตล่าสุด: 2026-09-17

---

## 1. Environment / Tooling

| ปัญหา | สาเหตุ | แก้ |
|---|---|---|
| `node`/`npm` หายจาก PATH | `nvm4w` (nvm-windows) สร้าง junction `C:\nvm4w\nodejs` ไม่สำเร็จ — การสร้าง junction บน Windows ต้องใช้สิทธิ์ Administrator (หรือเปิด Developer Mode) แต่ `nvm use` รันจาก shell ทั่วไปที่ไม่ได้ elevate เลยรายงานว่าสำเร็จทั้งที่ junction ไม่ได้ถูกสร้างจริง | **แก้ชั่วคราว:** สร้าง junction เองด้วย `mklink /J "C:\nvm4w\nodejs" "$env:LOCALAPPDATA\nvm\v<version>"` — **แก้ถาวร:** เปิด **Developer Mode** (Settings → Privacy & security → For developers) ครั้งเดียว หลังจากนั้น `nvm use <version>` สร้าง/อัปเดต junction ให้เองอัตโนมัติทุกครั้ง ไม่ต้องทำมืออีก (ทดสอบสลับ 22.14.0 ↔ 20.18.2 แล้วผ่านทั้งคู่) — หมายเหตุ: ถ้ารัน `nvm use` แล้วเช็ค `node --version` **ในคำสั่งเดียวกัน** อาจเจอ error ชั่วคราว (path ยังไม่ refresh) แต่เรียกแยกคำสั่งใหม่จะเจอเวอร์ชันถูกต้องเสมอ ไม่ใช่บั๊ก |

---

## 2. การเชื่อมต่อ Backend ↔ Frontend (สองโปรเจกต์แยกกัน)

| ปัญหา | สาเหตุ | แก้ |
|---|---|---|
| Backend ปฏิเสธทุก request ข้าม origin (`403 CROSS_ORIGIN`) | Backend สมมติ same-origin ทั้งหมด (`src/middleware.ts` เดิม) — ไม่มี CORS allowlist | เพิ่ม `src/lib/cors.ts` + `ALLOWED_ORIGINS` env + แก้ `middleware.ts`/`session.ts` (cookie `SameSite=None`) ที่ backend |
| Login สำเร็จฝั่ง backend แต่ frontend เด้งกลับหน้า login วนไม่จบ | ชื่อ cookie ไม่ตรงกัน — backend ใช้ `session`, `proxy.ts` (frontend) รอ `mmc_session` ตามแผนเดิมใน `docs/AUTH_PLAN.md` | ตั้ง `NEXT_PUBLIC_AUTH_COOKIE=session` ใน frontend `.env.local` |
| `404 Not Found` ทุก API call | `NEXT_PUBLIC_API_BASE_URL` ไม่มี `/api` ต่อท้าย (backend เสิร์ฟใต้ `/api/*` จริง) | ตั้งเป็น `http://localhost:<port>/api` |
| สองโปรเจกต์ชนพอร์ตกัน (ทั้งคู่ default 3000) | ไม่มีใคร hardcode พอร์ต | Backend ใช้ 3000 (ค่า default), frontend ขยับไปพอร์ตอื่น (3001/3002) |
| แก้ `ALLOWED_ORIGINS` แล้ว CORS ยังไม่ผ่านจนกว่าจะ restart backend เต็มรูปแบบ | Edge middleware ไม่ hot-reload ค่า env เหมือน route handler ทั่วไป | ต้อง kill + start backend ใหม่ทุกครั้งที่แก้ env ที่ middleware อ่าน |
| **(2026-09-12)** พอร์ตชนกันซ้ำได้ทุกครั้งที่ dev ลืมพิมพ์ `-p 3001` มือ + เอกสาร backend (`docs/security-hardening.md` §3 "ตั้งค่าใช้งาน") เคยเขียนสลับฝั่งผิด (บอกว่า backend รัน port 4000, frontend 3000 — ตรงข้ามกับ `.env.local` จริงของทั้งคู่) | ไม่มีที่ไหน "ตรึง" พอร์ตไว้เป็นค่าเริ่มต้นจริง ต้องพึ่งความจำคน + เอกสารไม่ sync กับของจริง | Frontend `package.json`: `"dev": "next dev -p 3001"`, `"start": "next start -p 3001"` (ตรึงพอร์ตในสคริปต์ ไม่ต้องพิมพ์มือ) · Backend `docs/security-hardening.md` §3 "ตั้งค่าใช้งาน": แก้ให้ตรง `.env.local` จริง — backend port **3000** (default), `ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002` |

---

## 3. Auth

| ปัญหา | สาเหตุ | แก้ |
|---|---|---|
| `CategoryChip`/Avatar ฯลฯ พังตอน login เพราะ `user.fullname` เป็น `undefined` | Backend คืน user object ดิบ (`user_fullname`, `role_id: {role_name}` แบบ snake_case) แต่ frontend คาดหวัง DTO ตาม `docs/API_CONTRACT.md` (camelCase, มี `menuAccess`) | แรก ๆ ลองทำ DTO ฝั่ง backend (`authDto.ts`) แต่ภายหลังตัดสินใจ **ย้อนกลับ** ให้ backend คืนค่าดิบเหมือนเดิม แล้วแปลงที่ `src/lib/authClient.ts` (frontend) จุดเดียวแทน — `menuAccess` คำนวณจาก `role_type` เท่านั้น (owner = เต็ม, staff = ยังไม่มีสิทธิ์ละเอียด ดูหัวข้อ 9) |
| Login ด้วยรหัสผ่าน seed (`<REDACTED>`) ไม่ผ่าน (`401`) | บัญชี owner มีอยู่แล้วในฐานข้อมูล (คนละรหัสผ่านจากที่ seed กำหนด) — `npm run seed` ไม่ทับรหัสผ่านที่มีอยู่ | เขียนสคริปต์ `scripts/reset-owner-password.ts` (backend) รีเซ็ตรหัสผ่านตรง ๆ |

---

## 4. Path / Envelope ของทุก resource (ปัญหาระบบ ไม่ใช่แค่จุดเดียว)

| ปัญหา | สาเหตุ | แก้ |
|---|---|---|
| ทุก resource (`ingredients`, `products`, `orders`, ...) ยิงแล้ว `404` | Service ทุกไฟล์เขียน path ไม่มี `/admin` prefix (เช่น `/ingredients` แทนที่จะเป็น `/admin/ingredients`) | เพิ่ม `/admin` prefix ให้ครบ 16 service |
| List endpoint คืนมาแล้ว `.map is not a function` | Backend ห่อ list เป็น `{ data: { items, meta } }` (meta ซ้อนใน data) แต่ type frontend คาดหวัง `{ data: T[], meta }` (แยกกัน) | เพิ่ม `http.getList()` ใน `src/lib/http.ts` แกะให้ถูกชั้นจุดเดียว — ทุก service ต้องเรียกอันนี้แทน `http.get()` สำหรับ `.list()` |
| `ordersService.update()` เปลี่ยนสถานะไม่ได้ (`405`) | Backend ไม่มี `PATCH /admin/orders/[id]` ตรง ๆ (route นั้นมีแค่ GET/DELETE) ต้องเปลี่ยนสถานะผ่าน `/admin/orders/[id]/status` เท่านั้น | เปลี่ยนไปเรียก sub-route `/status` |
| **(2026-09-12)** ข้อความ error ภาษาไทยจาก backend (เช่น "อีเมลหรือรหัสผ่านไม่ถูกต้อง") ไม่เคยโชว์ที่ UI เลย — ตกไป fallback `"request failed (400)"` เสมอ ทุกจุดที่ใช้ `isApiError(e).message` (`LoginForm.tsx`, `useAttendanceViewModel.ts`, `useAddEmployeeViewModel.ts`, `useEditEmployeeViewModel.ts`, `useAddProductViewModel.ts`, `useEditProductViewModel.ts`, `useStoreDesignViewModel.ts`) · field-level validation error (`fieldErrors`) ก็เป็น `undefined` เสมอเช่นกัน | `toApiError()` (`src/lib/http.ts`) อ่าน error ผิดชั้น — คาดว่า backend ส่ง `{ message, errors }` ระดับบนสุด แต่ backend จริง (`src/lib/apiResponse.ts` `toErrorResponse()` / `src/middleware.ts` `deny()` ฝั่ง backend) ส่ง **nested**: `{ success:false, error:{ code, message, details } }` — `details` เป็น `{ issues: [{path,message,code}] }` เฉพาะตอน validation ไม่ผ่าน (backend `src/lib/validate.ts` `toIssues()`) | แก้ `toApiError()` ให้ unwrap `body.error.message`/`body.error.code` ตรง ๆ + เพิ่ม `toFieldErrors()` แปลง `body.error.details.issues[]` → `Record<path, message>` ให้ `ApiError.fieldErrors` · เพิ่ม `ApiError.code` (union `BackendErrorCode` อ้างอิง `HttpErrorCode` ของ backend + code อื่นจาก `apiResponse.ts`/`middleware.ts` ตรง ๆ) และ `BackendErrorBody` type ไว้ใน `src/types/api.ts` เป็น single source of truth ของ envelope นี้ |

---

## 5. Field name ไม่ตรงกับ backend (พังจริงตอน render)

| ปัญหา | ไฟล์ที่พัง | สาเหตุ | แก้ |
|---|---|---|---|
| `CategoryChip.tsx:5` — `Cannot read properties of undefined (reading 'length')` | Products/Ingredients ทุกหน้า (9 จุด) | `ProductCategory`/`IngredientCategory` type ใช้ field `category_name` เฉย ๆ แต่ backend จริงคือ `product_category_name`/`ingredient_category_name` | เปลี่ยน field name ใน type + แก้ 9 จุดที่ใช้ |
| Dropdown ไม่ขึ้นค่าเดิม, filter หมวดหมู่ไม่ทำงาน, ชื่อหมวดหมู่ว่างเปล่า | Ingredients, Products, POS, Recipes, Production (6 ไฟล์) | Backend **populate** `category_id`/`unit_id`/`ingredient_category_id` เป็น **object เต็ม** `{_id, name}` ตอน GET/list ไม่ใช่ string id ดิบ แต่โค้ดเอาไปเทียบ/ใช้เป็น key ตรง ๆ | สร้าง helper `src/lib/refId.ts` ดึง id ให้ถูกไม่ว่าจะเจอ string หรือ object |
| `RatingDisplay` จะ crash ทันทีที่ render (`.toFixed is not a function`) | Products (ทุกหน้าที่โชว์ดาว) | `avg_rating` เป็น Mongoose Decimal128 → คืนมาเป็น `{ $numberDecimal: "0" }` ไม่ใช่ number | normalize เป็น number ที่ `services/products.ts` |
| `MISSING_MESSAGE: enums.productType.ready` | Products (ทุกหน้าที่โชว์ product_type) | (1) `ProductType` เดิมใช้ `"ready"/"preorder"` แต่ backend จริงคือ `"inStore"/"online"/"preorder"` (2) **ข้อมูลเก่าในฐานข้อมูลจริง 25/35 รายการยังเป็น `"ready"` ค้างอยู่** จากก่อน schema เปลี่ยน — Mongoose ไม่ validate ย้อนหลังตอนอ่าน | เปลี่ยน type เป็นค่าจริง + เพิ่ม i18n key `productType.*` (th/en) + **normalize ข้อมูลเก่า `"ready"→"inStore"` ที่ `services/products.ts`** (ยังไม่ migrate ข้อมูลจริงใน DB) |

---

## 6. Ingredient Stock — ฟีเจอร์พังเงียบ 100% (บั๊กร้ายแรงที่สุดที่เจอ)

**อาการ:** กด "รับเข้า/เบิกใช้/ปรับยอด" ที่หน้า Ingredient Stock แล้ว **สต็อกไม่เคยเปลี่ยนจริงเลย** แต่ไม่มี error โชว์ (เพราะโค้ดมี `.catch(() => undefined)` กลืน error ไว้)

**สาเหตุ (2 อย่างซ้อนกัน):**
1. ส่ง field `quantity` แต่ backend ใช้ชื่อ `qty` → validation reject เงียบ ๆ
2. ส่ง `performed_by` เป็น **ชื่อคน** (string) แต่ backend ต้องการ **user id** (ObjectId ref, required)
3. (เพิ่มเติม) เดิมมีการยิง `PATCH /admin/ingredients` เพื่อแก้ `current_stock` ตรง ๆ ด้วย — แต่ backend **บล็อก field นี้ไว้ทั้ง `updateFields` และ zod schema** (ต้องเปลี่ยนผ่าน `ingredientTransactionService.createTransaction()` เท่านั้น) → PATCH นั้น succeed (200) แต่ไม่มีผลอะไรเลย

**แก้:** ตัด PATCH ที่ไม่มีผลออก, แก้ field เป็น `qty`, ใช้ `user.id` จริงสำหรับ `performed_by` — ทดสอบยืนยันสต็อกเปลี่ยนจริงแล้ว (60 → 70)

---

## 7. Order / Payment / POS — mismatch ลึกที่สุด (ต้องออกแบบใหม่ ไม่ใช่แค่ rename)

| ปัญหา | สาเหตุ |
|---|---|
| `Order` type เดิมทั้งหมด (`customer_name`, `items[]`, `due_date`, `lead_time_days`, `payment_slip_url`, `payment_verified_at`) ไม่มีอยู่จริงบน backend เลย | เป็น DTO ที่ "แต่งขึ้น" รวม Orders+OrderItems+Payments+Preorders ไว้ด้วยกันตามที่ `docs/API_CONTRACT.md` วางแผนไว้ แต่ backend จริงแยก collection ทั้งหมด และยังไม่มีใครประกอบ DTO นี้จริง |
| `order_type` ไม่ใช่ `"ready"/"preorder"` | Backend จริงคือ `"delivery"/"takeaway"` (วิธีรับของ) — "ready vs preorder" เป็นคนละมิติ (พรีออเดอร์อยู่คนละ collection `preorderModel` ทั้งหมด ยังไม่เชื่อมกับหน้านี้) |
| POS สั่งซื้อไม่ได้เลยตั้งแต่ต้น | `posCart.ts` ยิง `POST /orders` ด้วย body ที่ backend ไม่รู้จักแม้แต่ field เดียว (ไม่มี route แบบนั้นจริง ๆ) |
| Backend ไม่มีแนวคิด "ลูกค้าไม่ระบุตัวตน" | ทุกออเดอร์ต้องมี `user_id` จริงเสมอ (required) — POS เดิมให้พนักงานพิมพ์ชื่อลูกค้าอิสระ ผูกบัญชีไม่ได้ |
| `PATCH .../status` ตอบ `409 CONFLICT` เวลาสั่ง `"completed"` ตรง ๆ | Backend เป็น **state machine เดินทีละสถานะเท่านั้น**: `pending→confirmed→preparing→ready→completed` ห้ามข้าม |
| แก้ `payment_status` ผ่าน dropdown ไม่ได้ผลจริง | Payment เป็นคนละ resource (`/admin/payments`) มี flow `create(pending) → verify(approved/rejected)` ของตัวเอง ไม่ใช่ field ที่ PATCH ตรง ๆ บน order ได้ |

**แก้:**
- สร้างบัญชี "ลูกค้าทั่วไป" ตายตัว (`scripts/seed.ts` → `GUEST_CUSTOMER_EMAIL`) ให้ POS ผูกด้วย
- Rewrite `types/order.ts`, `services/orders.ts` ให้ตรงกับ `orderModel.ts` จริง
- สร้าง `types/payment.ts` + `services/payments.ts` ใหม่ทั้งคู่
- POS: create order → create payment → verify(true) → เดิน status ทีละสเต็ปจนถึง completed
- Manage Orders: ตัด items/สลิปออกจากตาราง (ต้อง fetch แยกต่อออเดอร์ ไม่คุ้ม N+1) — ย้ายไป fetch เต็มใน detail drawer แทน (`ordersService.get()` + `paymentsService.listByOrder()`), payment status เป็น badge อ่านอย่างเดียว

ทดสอบ end-to-end ผ่าน curl จริงจนจบ flow (สร้าง → จ่ายเงิน → verify → completed) แล้ว

---

## 8. Recipe / RecipeComponent

| ปัญหา | สาเหตุ | แก้ |
|---|---|---|
| Save สูตรแล้วข้อมูล steps หาย/ผิดรูป | Backend เก็บ `steps` เป็น **JSON string** ใน field `steps_content` ไม่ใช่ array | แปลง `steps ⇄ steps_content` ที่ `services/recipes.ts`/`recipeComponents.ts` จุดเดียว |
| `product_name`, `product_type`, `yield_unit_abbr` บน `Recipe` ไม่มีจริงบน backend | เป็น denormalized field ที่แต่งขึ้น | `product_name`/`yield_unit_abbr` ดึงจาก populate จริงที่ backend ให้มาอยู่แล้ว (`product_id`, `yield_unit_id`) ส่วน `product_type` ลบทิ้ง (ไม่มีที่มา) |
| `ingredient_name`/`component_name` ว่างเปล่าในสูตร | Backend **ไม่ populate** `ingredients.ingredient_id`/`components.component_id` ตอน list (populate แค่ `product_id`+`yield_unit_id`) | enrich ที่ `useRecipesViewModel.ts` โดย join กับ ingredients/components list ที่โหลดแยกอยู่แล้ว (ไม่เพิ่ม request) |
| **สร้างสูตรส่วนประกอบใหม่ไม่ได้เลย** (`400` แน่นอน) | `RecipeComponent.category` เป็น **fixed enum ภาษาไทย** ("เนื้อเค้ก","ครีม"...) แต่ backend บังคับ `componentcategory_id` เป็น **ObjectId อ้างอิงจริง** ไปยัง collection `component-categories` ที่ seed ไว้คนละชุดชื่อเลย ("ครีมและฟรอสติ้ง","ไส้ขนม"...) | เปลี่ยน `category` → `componentcategory_id` อ้างอิงจริง, เพิ่ม `types/componentCategory.ts` + `services/componentCategories.ts` ใหม่, ดึงชื่อมาโชว์ผ่าน dropdown จริงแทน enum ตายตัว |
| ส่ง component ref ไปสูตรหลักแล้ว backend reject | `components: [{component_id, quantity}]` ขาด `unit_id` (backend บังคับ required) | เติม `unit_id` อัตโนมัติจาก `yield_unit_id` ของ component นั้น ๆ ตอน save |

---

## 10. Production — เปลี่ยนสถานะ PATCH ไม่มีผล + item shape ผิดทั้งยวง

**อาการ:** เหมือนบั๊ก Ingredient Stock ทุกประการ (หัวข้อ 6) — กด "เริ่มผลิต/ปิดงาน/ยกเลิก" ที่หน้า
Production แล้ว **สถานะไม่เคยเปลี่ยนจริง** แต่ backend ตอบ `200` เฉย ๆ (ไม่มี error โชว์)

| ปัญหา | สาเหตุ | แก้ |
|---|---|---|
| `PATCH /admin/production-orders/[id]` ส่ง `production_status` ไปแล้วไม่มีผล | Backend `updateProductionOrder()` อ่านแค่ `production_date`/`assigned_to`/`production_note` จาก body เท่านั้น — เปลี่ยนสถานะต้องยิง sub-route เฉพาะทาง `POST .../[id]/start` (planned→in_progress), `.../complete` (in_progress→done, หักสต็อกวัตถุดิบให้ด้วย), `.../cancel` (→cancelled, คืนสต็อกที่หักไปแล้ว) — state machine เดียวกับ orders (หัวข้อ 7) | เพิ่ม `start()/complete()/cancel()` ใน `services/productionOrders.ts` (ยิง sub-route ตรง ๆ) · `useProductionViewModel.onChangeStatus` เปลี่ยนจาก PATCH เดียวเป็น dispatch ตาม `next` status · ลบ `statusChangePatch()` (`productionStatus.ts`) ทิ้ง — backend ตั้ง `started_at`/`completed_at` ให้เองแล้ว ไม่ต้องคำนวณฝั่ง client |
| สร้างใบสั่งผลิตพร้อมรายการไม่ได้เลย (`400` แน่นอน) | `ProductionOrderItem` เดิมส่งแค่ `product_id`+`planned_qty` แต่ backend บังคับทุกแถวต้องมี `recipe_id` จริง (และ `recipe.product_id` ต้องตรงกับ `product_id` ของแถวนั้นด้วย) — ฟีเจอร์นี้เขียนไว้ตั้งแต่ก่อนมี resource `recipes` ในโปรเจกต์ ไม่เคยอัปเดตหลัง Phase4 เพิ่ม recipes เข้ามา | `useProductionViewModel` โหลด `recipesService.list()` เพิ่ม สร้าง map `product_id → recipe_id` (เอาสูตรแรกที่เจอ) แล้ว **กรอง `productOptions` ให้เหลือเฉพาะสินค้าที่มีสูตรผูกแล้วเท่านั้น** (เลือกสินค้าที่ไม่มีสูตรไม่ได้ตั้งแต่ในฟอร์ม) · `ProductionOrderFormModal` แนบ `recipe_id` ไปกับแต่ละแถวตอน submit |
| `product_name`/`unit_abbr` ของแต่ละรายการว่างเปล่า, `assignee_name` ไม่มีจริงบน backend | Backend คืน item เป็น `{ product_id: {product_name_th,...}, recipe_id: {...}, item_status, actual_qty }` (populate เต็ม ไม่มี `product_name`/`unit_abbr` แบน ๆ), และ `assigned_to` เป็น populated object `{user_fullname, email}` ไม่ใช่ id + `assignee_name` แยกกัน | `types/productionOrder.ts` แยกเป็น `RawProductionOrder(Item)` (shape ดิบจาก backend) กับ `ProductionOrder(Item)` (shape UI เดิม มี `product_name`/`unit_abbr`/`assignee_name` แบน ๆ) — enrich ที่ `useProductionViewModel.orders` (join กับ products/units ที่โหลดแยกอยู่แล้ว ไม่เพิ่ม request) เพื่อไม่ต้องแก้ component ที่เหลือ (Card/Detail/Board/PlanTab/HistoryTab ใช้ field เดิมได้หมด) |

**ยังไม่ได้แก้ (รู้ตัว):** kanban (`StatusBoard`) ยังลากการ์ดข้ามไปคอลัมน์ใดก็ได้ (เช่น planned → done ตรง ๆ) โดยไม่เช็ค `NEXT_STATUS` ก่อนยิง — จะได้ `409 CONFLICT` จริงจาก backend (ไม่ใช่ silent no-op เหมือนก่อนแก้แล้ว) แต่ UX ยังไม่กันดักเอง

---

## 9. ที่ยังไม่ได้แก้ / รู้ตัวว่าเป็นข้อจำกัด

| เรื่อง | รายละเอียด |
|---|---|
| **Preorders** | อยู่คนละ collection ทั้งหมด (`preorderModel`/`preorderItemModel`/`preorderRoundModel`, เสิร์ฟที่ `/admin/preorders`) ยังไม่เชื่อมกับ frontend เลย — แท็บ "รับที่ร้าน/จัดส่ง" ใน Manage Orders ตอนนี้คือ `order_type` จริง ไม่ใช่ preorder |
| **staff `menuAccess`** | คำนวณจาก `role_type` อย่างเดียว (owner = สิทธิ์เต็ม, staff = ยังไม่มีสิทธิ์อะไรเลย) เพราะ backend ไม่มี endpoint ให้ staff ดึงสิทธิ์เมนูละเอียดของตัวเองแบบ self-serve (endpoint ที่มีอยู่ `/api/admin/permissions` ต้องมี `employees.view` ก่อน ซึ่งวนกลับมาปัญหาเดิม) |
| **`attendances.today()`** | ไม่มี route `/today` จริง — query `list({user_id, work_date})` แทน (แก้แล้ว แต่ยังไม่ได้ทดสอบ end-to-end) |
| **Dashboard `recent_orders`/`production_status` items_summary** | ปล่อยว่าง — ต้อง fetch เพิ่มต่อรายการ (N+1) ถึงจะได้ item summary จริง ยังไม่คุ้มที่จะทำตอนนี้ |
| **ข้อมูลเก่า `product_type: "ready"` ใน DB (25/35 รายการ)** | แก้แบบ normalize ตอนอ่านที่ frontend เท่านั้น — ยังไม่ได้ migrate ข้อมูลจริงใน MongoDB ให้สะอาด |
| **LINE notifications** | ต่อระบบไว้ครบแล้ว (DB + push) แต่ `LINE_CHANNEL_ACCESS_TOKEN`/`LINE_TARGET_ID` ยังเป็นค่าว่าง — ต้องใส่ค่าจริงถึงจะส่งเข้า LINE ได้จริง |
| **`npm audit`** | Frontend มี 3 vulnerabilities (2 high, 1 critical) ที่ยังไม่ได้ตรวจ |

---

## 11. Audit ครบวงจร (2026-09-17) — ไล่ตรวจทุกหน้าที่เหลือ ไม่ใช่แค่จุดที่เจอบั๊กระหว่างใช้งาน

หลังแก้ User Log / Banners / Sales Report (ระหว่าง session ก่อนหน้า) ได้ไล่ตรวจ **ทุกหน้าที่เหลือ**
เทียบ frontend จริงกับ backend จริงทีละไฟล์ (path, body shape, required/optional, enum, populate) แบ่งเป็น
6 กลุ่ม: Ingredients/Units, Recipes/ComponentCategories, Products/Promotions, Orders/Preorders/Finance,
Employees/Permissions/Attendance, Reviews/Dashboard — เรียงผลตามความร้ายแรงด้านล่าง

### 11.1 ฟีเจอร์ไม่มีอยู่จริง — เมนูมีจริง กดแล้ว 404 (ไม่ใช่แค่ "ยังไม่เชื่อมข้อมูล" ตามที่เข้าใจเดิม)

| เมนู | href | สถานะ backend |
|---|---|---|
| โปรโมชัน (ตั้งราคา + คูปอง/ส่วนลด) | `/owner/promotions/pricing`, `/owner/promotions/coupons` | พร้อมแล้ว (`/admin/promotions`, `/admin/promotion-usages`, `promotionModel.ts`) แต่ frontend ไม่มีไฟล์เลยสักไฟล์ (ไม่มี page/service/type) |
| รายงานความคิดเห็นลูกค้า (Reviews) | `/owner/reports/reviews` | พร้อมแล้ว (`/admin/reviews` + sentiment/visibility, `aspects`, `semantic-terms`) แต่ frontend ไม่มีไฟล์เลย |
| จัดการรอบพรีออเดอร์ | `/owner/orders/preOrderRound` | พร้อมแล้ว (`/admin/preorder-rounds`, `preorder-round-items`) แต่ frontend ไม่มีไฟล์เลย — เดิมเข้าใจว่า "พรีออเดอร์ยังไม่เชื่อมข้อมูล" (หัวข้อ 9) แต่จริง ๆ คือหน้านี้ไม่มีอยู่เลยสักไฟล์ กดเมนูแล้ว 404 ตรง ๆ |

### 11.2 บั๊กที่ทำให้ใช้งานพัง/ผิดพลาดจริง

| ปัญหา | ไฟล์ | สาเหตุ | แก้ |
|---|---|---|---|
| ปุ่ม "ปิดใช้งานพนักงาน" ไม่มีผลจริง — **ร้ายแรงสุด เพราะเป็นเรื่องความปลอดภัย** | `employeeForm.ts`, `EmployeeFormFields.tsx`, `useEmployeesViewModel.ts` | ฟอร์ม/สวิตช์/filter ทั้งหน้าผูกกับ `emp_status` แต่ backend เช็คว่า login ได้ไหมจาก **`is_active`** คนละ field กันโดยสิ้นเชิง (`types/user.ts` ไม่มี `is_active` เลยด้วยซ้ำ) — เจ้าของร้านกด "พ้นสภาพ" แล้วคิดว่าตัดสิทธิ์เข้าระบบแล้ว แต่จริง ๆ ยัง login ได้ปกติ (มีแค่ปุ่ม "ลบ" soft-delete ที่ตัด `is_active` จริง) | เพิ่ม `is_active` ใน `AppUser`/`AppUserInput`, ทำสวิตช์ "ระงับการเข้าระบบ" แยกผูกกับ `is_active` จริง คนละตัวกับ `emp_status` |
| สร้าง/แก้สินค้าพัง 3 ทาง | `ProductFormFields.tsx` | `product_name_eng`, `category_id`, `unit_id` backend บังคับ required จริงทั้งคู่ (model + zod) แต่ฟอร์มไม่มี `required` rule เลยสักช่อง | เพิ่ม `required` rule ทั้ง 3 ช่อง |
| รูปสินค้าใช้งานไม่ได้ทั้งระบบ (พังแบบมองไม่เห็นผลด้วยซ้ำ) | `components/shared/form/UploadImageBox.tsx`, `types/product.ts`, `ProductCard.tsx` | backend เก็บ `product_img` เป็น **array ของ URL** ที่ต้องได้จากอัปโหลดไฟล์จริงผ่าน `POST /admin/products/images` (multipart) ก่อน แต่ frontend แปลงรูปเป็น **base64 string เดี่ยว** ยัดตรง ๆ ในฟิลด์นี้เลย ไม่เคยเรียก endpoint อัปโหลดจริงสักครั้ง แถม `ProductCard.tsx` ก็ไม่ได้ render `product_img` ที่ไหนเลยด้วย | เขียนใหม่ทั้ง flow: อัปโหลดไฟล์จริงผ่าน endpoint นั้นก่อน ได้ URL กลับมาค่อยส่งเข้า `product_img` |
| เลือกประเภทสินค้า "พรีออเดอร์" แล้ว save ไม่ได้เลย | `ProductFormFields.tsx` | backend บังคับต้องมี `preorder_config` (`min_order_qty`/`max_order_qty`/`lead_time_days`) เมื่อ `product_type==="preorder"` และ**ห้าม**ส่ง `product_stock_quantity` มาด้วย แต่ฟอร์มไม่มีช่อง `preorder_config` เลย และส่ง stock quantity เสมอทุก type | เพิ่ม field `preorder_config` แบบมีเงื่อนไขตาม type, ไม่ส่ง stock ตอนเป็น preorder |
| สร้าง Role "Admin" ไม่ได้เลย | `RoleFormModal.tsx` | dropdown มีตัวเลือก `admin` แต่ backend enum `role_type` จริงมีแค่ `owner`/`staff`/`customer` (ไม่มี `admin`) — `types/role.ts` ก็ระบุผิดตามด้วย | ตัดตัวเลือก "Admin" ออกจาก dropdown (หรือถ้าต้องการ role นี้จริงต้องเพิ่ม enum ฝั่ง backend ก่อน) |
| เว้นว่างช่อง "จำนวนเต็มคลัง" (max_stock) แล้ว save ไม่ได้ | `IngredientFormModal.tsx` | ส่ง `max_stock: null` แต่ backend schema `.optional()` ไม่ใช่ `.nullable()` — บั๊กคลาสเดียวกับ `banner_link`/date range ที่แก้ไปแล้วในหัวข้อ 5 เป๊ะ | omit key ทิ้งแทนส่ง `null` (แพทเทิร์นเดียวกับ `bannerForm.ts` `toInput()`) |
| แก้ไขสูตรส่วนประกอบ เปลี่ยนหมวดหมู่ได้ในฟอร์มแต่ backend เพิกเฉยเงียบ ๆ | `ComponentFormModal.tsx` | backend `componentUpdate` omit `componentcategory_id` ออกเสมอ (เปลี่ยนไม่ได้หลังสร้าง) แต่ dropdown หมวดหมู่ไม่ได้ `disabled` ตอนแก้ไข — จุดเดียวกันแต่ฝั่ง `MainRecipeModal.tsx` ทำถูกแล้ว (`disabled={!!editTarget}` ที่ `product_id`) | เพิ่ม `disabled={!!editTarget}` ที่ dropdown หมวดหมู่ใน `ComponentFormModal.tsx` เหมือนกัน |

### 11.3 UX ไม่รัดกุม — ไม่ crash แต่ควรแก้

| ปัญหา | ไฟล์ | สาเหตุ | แก้ |
|---|---|---|---|
| Manage Orders: dropdown เปลี่ยนสถานะเลือกข้ามสเต็ปได้ (จะโดน `409`) | `orders/manageOrders/orderStatus.ts`, `ManageOrdersView.tsx` | ใช้ `ORDER_STATUS_FLOW` เต็มเสมอ ไม่ได้กรองตาม `NEXT_STATUS` ของสถานะปัจจุบัน — ปัญหาเดียวกับที่รู้อยู่แล้วในหน้า Production kanban (หัวข้อ 10) แต่จุดนี้ไม่เคยถูกบันทึกมาก่อน | derive options จาก `NEXT_STATUS[order.order_status]` แทนลิสต์เต็ม |
| ฟีเจอร์คำนวณต้นทุนอัตโนมัติของ Recipe/Component จาก backend ใช้ไม่ได้เลยจากหน้านี้ | `recipeForm.ts`, `componentForm.ts` | backend auto-calc `estimated_cost_per_batch` เฉพาะตอนไม่ส่ง field นี้มาเลย (`undefined`) แต่ฟอร์ม default เป็น `0` และส่งเสมอทุกครั้ง | ปล่อยให้ omit field นี้ได้ถ้าไม่กรอก แทนส่ง `0` เสมอ |
| Dashboard: การ์ด "ใกล้หมด" นับรวมสินค้า+วัตถุดิบ แต่ list ด้านล่างโชว์แค่วัตถุดิบ | `services/reports.ts` | ไม่เคยดึง `/admin/products/low-stock` เลย ทั้งที่ backend มี endpoint นี้พร้อมใช้ | เพิ่ม fetch + รวมเข้า widget หรือแยกเป็น 2 การ์ด |

### 11.4 เกรดต่ำ — ยังไม่ใช่บั๊กที่ trigger ได้จริงตอนนี้ (บันทึกไว้เผื่ออนาคต)

| เรื่อง | รายละเอียด |
|---|---|
| `types/ingredient.ts` ระบุ `ingredient_category_id`/`unit_id` เป็น optional | backend required จริง แต่ form บังคับ `required: true` อยู่แล้วเลย exploit ไม่ได้ตอนนี้ — type ไม่ตรงความจริงเฉย ๆ |
| Products: `purchase_cost`, `preparation_heating`, `yield_per_batch` | มีจริงทั้ง backend model และ i18n label (`fields.*`) แล้ว แต่ไม่มีช่องกรอกใน `ProductFormFields.tsx` เลย — แก้ไม่ได้จาก UI |
| Attendance: `recordAttendanceBody.note` เป็น optional ไม่ใช่ nullable | บั๊กคลาสเดียวกับ banner/max_stock แต่ยังไม่มีหน้า "บันทึกเวลาแทนพนักงาน" ที่เรียก endpoint นี้เลย (dormant — ยังไม่มีทางเกิดจริงจนกว่าจะสร้างหน้านี้) |
| `permissionModel.ts` enum `menu_key` ไม่มี `"preorder"` ทั้งที่ `schemas/rbac.ts` อนุญาต | backend-internal drift เท่านั้น — frontend `MenuKey` ไม่เคยเสนอค่านี้ เรียกไม่ถึงจากหน้าไหนเลย |
