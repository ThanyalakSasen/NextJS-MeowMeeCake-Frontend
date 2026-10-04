import { create } from "zustand";

// ใช้ร่วมกันระหว่าง Navbar กับ SideBarMenu (เมนู "บัญชีของฉัน") — ย้ายมาจาก FrontOffice
// บนมือถือ Navbar แสดงปุ่มเปิดเมนูแทนโลโก้ เฉพาะหน้าที่มี SideBarMenu อยู่ (นับจำนวนที่ mount อยู่ เผื่อ render ซ้อน)
interface SidebarMenuStore {
  mountedCount: number;
  isMobileOpen: boolean;
  register: () => void;
  unregister: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarMenuStore = create<SidebarMenuStore>((set) => ({
  mountedCount: 0,
  isMobileOpen: false,
  register: () => set((s) => ({ mountedCount: s.mountedCount + 1 })),
  unregister: () => set((s) => ({ mountedCount: Math.max(0, s.mountedCount - 1), isMobileOpen: false })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
}));
