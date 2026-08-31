/** การ์ดพื้นฐาน — ขอบมน + เส้นขอบบาง + พื้นขาว (ใช้ทำ section/widget) */
export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-xl bg-white border border-gray-100 ${className}`}>{children}</div>;
}
