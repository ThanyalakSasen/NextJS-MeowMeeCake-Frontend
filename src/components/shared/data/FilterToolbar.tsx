// FilterToolbar — วาง search + filter + action ให้ layout เหมือนกันทุกหน้ารายการ
//
// ใช้ items-end ไม่ใช่ items-center — บางหน้ามีป้ายกำกับเหนือช่องกรอง (สต็อกสินค้า)
// บางหน้าไม่มี — พอเอามาวางแถวเดียวกัน items-center จะจัดกึ่งกลางของก้อนที่สูงไม่เท่ากัน
// ช่องค้นหาจึงลอยสูงกว่าช่องอื่นเท่าความสูงของป้าย — items-end ทำให้ขอบล่างของทุก control ตรงกัน
// (หน้าที่ทุกชิ้นสูงเท่ากันอยู่แล้ว เปลี่ยนแล้วหน้าตาเหมือนเดิม)
export function FilterToolbar({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-end gap-2">{left}</div>
      <div className="flex flex-wrap items-end gap-2">{right}</div>
    </div>
  );
}
