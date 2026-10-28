import { Suspense } from "react";
import ChatsPageClient from "./ChatsPageClient";

// แชทลูกค้า (หลังร้าน) — ห้องที่เลือกอยู่ใน ?id= (useSearchParams → ต้องอยู่ใต้ Suspense)
export default function ChatsRoute() {
  return (
    <Suspense>
      <ChatsPageClient />
    </Suspense>
  );
}
