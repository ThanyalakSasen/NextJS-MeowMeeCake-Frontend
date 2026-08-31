/** ข้อความ error พื้นแดงอ่อน มีขอบ — ใช้ใต้ฟอร์ม/หัวหน้า */
export function ErrorMessage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className={`rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 ${className}`}
    >
      {children}
    </p>
  );
}
