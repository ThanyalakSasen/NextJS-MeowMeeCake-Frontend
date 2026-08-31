# src/services/

1 ไฟล์ = 1 resource · map endpoint จาก `docs/API_CONTRACT.md` §3 เป็นฟังก์ชัน typed
**ที่เดียวที่เรียก `http` (axios)** — ViewModel เรียก service, ไม่เรียก `http`/`axios` ตรง

## แพตเทิร์น (ดู `products.ts` เป็นตัวอย่างเต็ม)

```ts
import { http } from "@/lib/http";
import type { ListResponse, ItemResponse } from "@/types/api";
import type { Order, OrderInput, OrderListParams } from "@/types/order";

export const ordersService = {
  list:   (params: OrderListParams = {}) => http.get<ListResponse<Order>>("/orders", { params }),
  get:    (id: string)                   => http.get<ItemResponse<Order>>(`/orders/${id}`),
  create: (body: OrderInput)             => http.post<ItemResponse<Order>>("/orders", body),
  update: (id: string, body: Partial<OrderInput>) => http.patch<ItemResponse<Order>>(`/orders/${id}`, body),
  remove: (id: string)                   => http.delete<EmptyResponse>(`/orders/${id}`),
};
```

## กติกา
- **ห้าม** ใส่ business logic (filter, คำนวณ, แปลงข้อมูล) — แค่ map endpoint · logic อยู่ ViewModel
- endpoint พิเศษ (เช่น `POST /attendances/check-in`) เพิ่มเป็น method ใน object เดียวกัน
- ทำ resource ใหม่: สร้าง `src/types/<resource>.ts` (DTO) ก่อน → แล้วค่อยเขียน service
- ทดสอบ: MSW handler ต้อง implement endpoint เดียวกันนี้ (`src/mocks/handlers/<resource>.ts`)

## สถานะ
| service | สถานะ |
|---|---|
| `products.ts` | ✅ reference pattern (เฟส 1) |
| resource อื่น ๆ | ⏳ สร้างพร้อม screen ที่ใช้ (เฟส 4) |
