// query key ของข้อมูลส่วนตัวลูกค้าในหน้าร้าน — useCustomerSession.signOut() ล้าง cache ทั้งหมดอยู่แล้ว
export const shopCartKey = ["shop", "cart"] as const;
export const shopAddressesKey = ["shop", "addresses"] as const;
export const shopOrderKey = (id: string) => ["shop", "orders", id] as const;
export const shopOrderPaymentPageKey = (id: string) => ["shop", "orders", id, "payment-page"] as const;
export const shopProfileKey = ["shop", "me"] as const;
export const shopEmailStatusKey = ["shop", "me", "email"] as const;
/** คำเตือนแพ้อาหารของทุกสินค้า (บัตรสินค้าทุกใบใช้ cache เดียว) — แก้อาหารที่แพ้แล้ว invalidate */
export const shopAllergenWarningsKey = ["shop", "me", "allergen-warnings"] as const;
/** ต้องตรงกับ LINE_STATUS_KEY ของ /profile (useProfileViewModel) — ใช้ cache เดียวกัน */
export const shopLineStatusKey = ["shop", "me", "line"] as const;
/** ประวัติการสั่งซื้อ (ทุกหน้า/ตัวกรอง) — ขึ้นต้นเหมือนกันให้ invalidate ชุดเดียวได้ */
export const shopOrdersKey = ["shop", "orders", "list"] as const;
/** ทุกอย่างของออเดอร์ (รายการ + ใบเดียว + หน้าชำระเงิน) — สถานะชำระเปลี่ยนจากหน้าอื่น (ชำระรวม) ต้อง invalidate ทั้งชุด */
export const shopOrdersAllKey = ["shop", "orders"] as const;
/** checkout (C3): แต้ม + คูปองที่ใช้ได้ — สร้างออเดอร์แล้วต้อง invalidate (ถูกหัก/ใช้ไป) */
export const shopPointsKey = ["shop", "points"] as const;
export const shopCouponsKey = ["shop", "coupons"] as const;
/** หน้าสมาชิก (D4): คูปองที่แลกได้ + คูปองของฉันทุกสถานะ — ขึ้นต้นด้วย shopCouponsKey (invalidate ชุดเดียวกัน) */
export const shopCouponOverviewKey = ["shop", "coupons", "overview"] as const;
export const pickupLocationsKey = ["catalog", "pickup-locations"] as const;
/** รายการโปรด (D5) — หน้า favorites + ปุ่มหัวใจในบัตรสินค้าทุกใบใช้ cache เดียวกัน (โหลดครั้งเดียวทั้งหน้า) */
export const shopFavoritesKey = ["shop", "favorites"] as const;
/** พรีออเดอร์ (D3) — รายการ/ใบเดียว/หน้าชำระเงิน · ขึ้นต้นเหมือนกันให้ invalidate ชุดเดียวได้ */
export const shopPreordersKey = ["shop", "preorders", "list"] as const;
export const shopPreordersAllKey = ["shop", "preorders"] as const;
export const shopPreorderKey = (id: string) => ["shop", "preorders", id] as const;
export const shopPreorderPaymentPageKey = (id: string) => ["shop", "preorders", id, "payment-page"] as const;
/** รอบพรีออเดอร์ (สาธารณะ) */
export const preorderRoundsKey = ["catalog", "preorder-rounds"] as const;
export const preorderRoundKey = (id: string) => ["catalog", "preorder-rounds", id] as const;
/** กระดิ่งแจ้งเตือน (D6) — ต่อท้ายด้วย limit (กระดิ่ง 8 · หน้าเต็ม 100) · อ่านแล้วแก้ทุกชุดพร้อมกัน */
export const shopNotificationsKey = ["shop", "notifications"] as const;
/** รีวิวของฉัน (D7) — ใช้ดูว่ารายการไหนรีวิวแล้ว · ส่งรีวิวแล้ว invalidate */
export const shopReviewsKey = ["shop", "reviews"] as const;
/** หน้า "รีวิวของฉัน" — ขึ้นต้นด้วย shopReviewsKey: เขียนรีวิวใหม่ (invalidate shopReviewsKey) แล้วหน้านี้โหลดใหม่ด้วย */
export const shopReviewHistoryKey = [...shopReviewsKey, "history"] as const;
export const reviewAspectsKey = ["catalog", "review-aspects"] as const;
/** แชทกับร้าน — ตัวเลขข้อความจากร้านที่ยังไม่อ่าน (ไอคอนแชทบน Navbar) · เปิดห้อง/อ่านแล้ว invalidate */
export const shopChatUnreadKey = ["shop", "chat", "unread"] as const;
/** หน้าชำระรวมหลายบิล (ตะกร้ารวม) */
export const paymentGroupKey = (id: string) => ["shop", "payment-groups", id] as const;
