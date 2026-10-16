"use client";
// ─────────────────────────────────────────────────────────────
// LazyAlertHost — วางใน providers.tsx แทน AlertHost
// กล่อง alert ใช้ antd (Modal) — โหลด chunk ของมันเมื่อมี alert.* / confirmAlert ครั้งแรกเท่านั้น
// หน้าที่ไม่เคยแจ้งเตือน (หน้าร้านส่วนใหญ่ตอนเปิดหน้า) จึงไม่ต้องดาวน์โหลด/รัน antd เลย
// คิวอยู่ใน alertStore (src/lib/alert.ts — ไม่ผูก antd) alert ที่สั่งระหว่างรอโหลดจะไม่หาย แค่ขึ้นช้ากว่าเดิมเล็กน้อยครั้งแรก
// ─────────────────────────────────────────────────────────────
import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { alertStore } from "@/lib/alert";

const AntdAlertHost = dynamic(() => import("./AntdAlertHost"), { ssr: false });

const hasAlert = () => alertStore.current() !== null;

export function LazyAlertHost() {
  const pending = useSyncExternalStore(alertStore.subscribe, hasAlert, () => false);
  // โหลดแล้วคาไว้ — ปิด alert แล้วไม่ต้อง unmount/โหลดใหม่
  const [needed, setNeeded] = useState(false);
  if (pending && !needed) setNeeded(true);
  return needed ? <AntdAlertHost /> : null;
}
