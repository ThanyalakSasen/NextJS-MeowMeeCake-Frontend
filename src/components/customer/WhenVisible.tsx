"use client";
// ─────────────────────────────────────────────────────────────
// WhenVisible — render ลูกเมื่อเลื่อนมาใกล้ (ห่างขอบจอ ≤ rootMargin) ครั้งแรก แล้วคาไว้
// ใช้กับส่วนใต้ขอบจอที่หนัก (รีวิว · สินค้าคล้ายกัน) — ไม่ยิง API/ไม่ render ตอนเปิดหน้า
// งานบน main thread ช่วงโหลดลดลง (Lighthouse TBT/LCP) · minHeight กันหน้ากระตุกตอนเนื้อหามา
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";

export default function WhenVisible({
  children,
  minHeight,
  rootMargin = "200px",
}: {
  children: React.ReactNode;
  /** ความสูงที่จองไว้ก่อนเนื้อหามา (px) */
  minHeight: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}
