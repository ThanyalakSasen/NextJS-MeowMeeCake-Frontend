import { create } from "zustand";
import type { ChatRef } from "@/services/chat";

// เปิด/ปิดกล่องแชทลอย (ChatWidget) — ให้หน้าอื่นสั่งเปิดได้ เช่น ปุ่ม "แชทกับร้าน" ในหน้าติดต่อเรา
// pendingRef = การ์ดคำสั่งซื้อที่รอแนบไปกับข้อความถัดไป (ปุ่ม "สอบถามร้านเรื่องคำสั่งซื้อนี้" ในหน้ารายละเอียดคำสั่งซื้อ)
interface ChatWidgetStore {
  open: boolean;
  pendingRef: ChatRef | null;
  setOpen: (open: boolean) => void;
  setPendingRef: (ref: ChatRef | null) => void;
  /** เปิดกล่องแชทพร้อมแนบการ์ดคำสั่งซื้อรอไว้ */
  openWithRef: (ref: ChatRef) => void;
}

export const useChatWidgetStore = create<ChatWidgetStore>((set) => ({
  open: false,
  pendingRef: null,
  setOpen: (open) => set({ open }),
  setPendingRef: (pendingRef) => set({ pendingRef }),
  openWithRef: (ref) => set({ open: true, pendingRef: ref }),
}));
