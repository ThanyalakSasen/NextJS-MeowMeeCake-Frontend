// MOCK (D17) — แบนเนอร์หน้าร้าน · banner_img ว่าง = การ์ดโชว์ gradient placeholder
import type { Banner } from "@/types/banner";

const T = "2026-08-01T00:00:00.000Z";

export const bannersFixture: Banner[] = [
  {
    _id: "bn_1", banner_name: "โปรโมชันเปิดร้านสาขาใหม่", banner_description: "ลด 20% ทุกเมนู",
    banner_img: "", banner_link: "/promotions", start_date: null, end_date: null,
    sort_order: 1, is_active: true, created_at: T, updated_at: T,
  },
  {
    _id: "bn_2", banner_name: "เทศกาลมัทฉะ", banner_description: "เมนูมัทฉะพิเศษประจำฤดู",
    banner_img: "", banner_link: "/products?category=matcha", start_date: null, end_date: null,
    sort_order: 2, is_active: true, created_at: T, updated_at: T,
  },
  {
    _id: "bn_3", banner_name: "พรีออเดอร์เค้กคริสต์มาส", banner_description: "จองล่วงหน้ารับส่วนลด",
    banner_img: "", banner_link: "/preorder", start_date: "2026-11-15T00:00:00.000Z", end_date: "2026-12-25T00:00:00.000Z",
    sort_order: 3, is_active: true, created_at: T, updated_at: T,
  },
  {
    _id: "bn_4", banner_name: "แบนเนอร์ปีใหม่ (ปีที่แล้ว)", banner_description: "",
    banner_img: "", banner_link: null, start_date: null, end_date: "2026-01-05T00:00:00.000Z",
    sort_order: 4, is_active: false, created_at: T, updated_at: T,
  },
  {
    _id: "bn_5", banner_name: "สมาชิกใหม่รับฟรีคุกกี้", banner_description: "เฉพาะการสั่งซื้อครั้งแรก",
    banner_img: "", banner_link: "/signup", start_date: null, end_date: null,
    sort_order: 5, is_active: true, created_at: T, updated_at: T,
  },
];
