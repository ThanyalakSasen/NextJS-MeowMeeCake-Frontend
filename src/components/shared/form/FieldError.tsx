// FieldError — ข้อความแจ้งข้อมูลไม่ถูกต้อง "ใต้ช่องที่กรอก" (แทนป๊อปอัป) · ใช้กับช่องที่ไม่ได้อยู่ใน antd Form
// ไม่มีข้อความ = ไม่แสดงอะไร · role="alert" ให้โปรแกรมอ่านหน้าจออ่านทันทีที่ขึ้น
export function FieldError({ message, id, className = "" }: { message?: string | null; id?: string; className?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={`m-0 mt-1 whitespace-pre-line text-xs text-red-600 ${className}`}>
      {message}
    </p>
  );
}
