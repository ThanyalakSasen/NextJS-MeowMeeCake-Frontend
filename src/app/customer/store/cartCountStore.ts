import { create } from "zustand";

// จำนวนรายการในตะกร้า (โชว์ที่ไอคอนตะกร้าใน Navbar) — ย้ายมาจาก FrontOffice
// Navbar ตั้งค่าจาก GET /shop/cart · หน้าอื่นเรียก increment/decrement หลังเพิ่ม/ลบสินค้าสำเร็จ
interface CartCountStore {
  count: number;
  setCount: (n: number) => void;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCartCountStore = create<CartCountStore>((set) => ({
  count: 0,
  setCount: (n) => set({ count: n }),
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
  reset: () => set({ count: 0 }),
}));
