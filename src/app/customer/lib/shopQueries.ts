// query key ของข้อมูลส่วนตัวลูกค้าในหน้าร้าน — useCustomerSession.signOut() ล้าง cache ทั้งหมดอยู่แล้ว
export const shopCartKey = ["shop", "cart"] as const;
export const shopAddressesKey = ["shop", "addresses"] as const;
export const shopOrderKey = (id: string) => ["shop", "orders", id] as const;
export const shopOrderPaymentPageKey = (id: string) => ["shop", "orders", id, "payment-page"] as const;
