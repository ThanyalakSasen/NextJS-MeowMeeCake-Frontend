import { useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";

/**
 * วันนี้ (ต้นวัน) ที่เปลี่ยนเองเมื่อข้ามเที่ยงคืน — แทน useState(() => dayjs()) ที่ค้างวันที่ตอนเปิดหน้าไว้ข้ามคืน
 * ตั้ง timer ถึงเที่ยงคืนถัดไป + เช็กอีกครั้งตอนแท็บกลับมาแสดง (เบราว์เซอร์หน่วง timer ของแท็บที่ซ่อน/เครื่องที่หลับ)
 */
export function useToday(): Dayjs {
  const [today, setToday] = useState<Dayjs>(() => dayjs().startOf("day"));

  useEffect(() => {
    const sync = () => setToday((cur) => (dayjs().isSame(cur, "day") ? cur : dayjs().startOf("day")));
    // +1 วิ กัน timer ทำงานก่อนเที่ยงคืนนิดเดียวแล้วได้วันเดิม
    const timer = setTimeout(sync, today.add(1, "day").diff(dayjs()) + 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [today]);

  return today;
}
