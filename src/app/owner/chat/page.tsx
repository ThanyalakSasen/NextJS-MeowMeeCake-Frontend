import { Suspense } from "react";
import ChatInbox from "./ChatInbox";

// แชทกับลูกค้า — กล่องข้อความของร้าน (สิทธิ์เมนู "chat": view = ดู/อ่าน · create = ตอบ)
// ห้องที่เลือกอยู่ใน ?c=<id> (ลิงก์จากแจ้งเตือน "แชทจากลูกค้า" เปิดห้องนั้นทันที) — อ่านด้วย useSearchParams จึงครอบ Suspense
export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatInbox />
    </Suspense>
  );
}
