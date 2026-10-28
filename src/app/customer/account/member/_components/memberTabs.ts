// แท็บของหน้าสมาชิก — ไฟล์ pure (ไม่มี "use client") ให้ page.tsx ฝั่ง server อ่าน ?tab= ได้
export const MEMBER_TABS = ["coupons", "redeem", "history", "earn"] as const;
export type MemberTab = (typeof MEMBER_TABS)[number];
export const isMemberTab = (v: unknown): v is MemberTab => MEMBER_TABS.some((x) => x === v);
