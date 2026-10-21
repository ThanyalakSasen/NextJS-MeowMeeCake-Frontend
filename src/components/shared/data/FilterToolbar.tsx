// FilterToolbar — วาง search + filter + action ให้ layout เหมือนกันทุกหน้ารายการ
//
// left = ช่องค้นหา + แท็บ · right = ตัวกรอง (dropdown / ช่วงวันที่ / เรียงลำดับ) ชิดขวา
// จอกว้าง (xl) อยู่แถวเดียวกันเสมอ — เดิม flex-wrap ทั้งก้อนทำให้ตัวกรองตกไปแถวสองเมื่อพื้นที่ไม่พอ
// จอแคบยังขึ้นบรรทัดใหม่ได้ (ตัวกรองยังชิดขวาด้วย ml-auto)
//
// ใช้ items-end ไม่ใช่ items-center — บางหน้ามีป้ายกำกับเหนือช่องกรอง (FilterField)
// บางหน้าไม่มี — พอเอามาวางแถวเดียวกัน items-center จะจัดกึ่งกลางของก้อนที่สูงไม่เท่ากัน
// ช่องค้นหาจึงลอยสูงกว่าช่องอื่นเท่าความสูงของป้าย — items-end ทำให้ขอบล่างของทุก control ตรงกัน
export function FilterToolbar({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 xl:flex-nowrap">
      <div className="flex min-w-0 flex-wrap items-end gap-2">{left}</div>
      <div className="ml-auto flex flex-wrap items-end justify-end gap-2 xl:flex-nowrap">{right}</div>
    </div>
  );
}
