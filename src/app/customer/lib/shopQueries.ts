// query key ของข้อมูลส่วนตัวลูกค้าในหน้าร้าน — useCustomerSession.signOut() ล้าง cache ทั้งหมดอยู่แล้ว
export const shopCartKey = ["shop", "cart"] as const;
export const shopAddressesKey = ["shop", "addresses"] as const;
export const shopOrderKey = (id: string) => ["shop", "orders", id] as const;
export const shopOrderPaymentPageKey = (id: string) => ["shop", "orders", id, "payment-page"] as const;
export const shopProfileKey = ["shop", "me"] as const;
export const shopEmailStatusKey = ["shop", "me", "email"] as const;
/** ต้องตรงกับ LINE_STATUS_KEY ของ /profile (useProfileViewModel) — ใช้ cache เดียวกัน */
export const shopLineStatusKey = ["shop", "me", "line"] as const;
/** ประวัติการสั่งซื้อ (ทุกหน้า/ตัวกรอง) — ขึ้นต้นเหมือนกันให้ invalidate ชุดเดียวได้ */
export const shopOrdersKey = ["shop", "orders", "list"] as const;
/** checkout (C3): แต้ม + คูปองที่ใช้ได้ — สร้างออเดอร์แล้วต้อง invalidate (ถูกหัก/ใช้ไป) */
export const shopPointsKey = ["shop", "points"] as const;
export const shopCouponsKey = ["shop", "coupons"] as const;
export const pickupLocationsKey = ["catalog", "pickup-locations"] as const;
