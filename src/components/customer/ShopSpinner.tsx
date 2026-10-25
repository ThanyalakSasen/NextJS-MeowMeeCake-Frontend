// วงหมุนระหว่างโหลดของหน้าร้าน
// เป็น <span> ไม่ใช่ <div> โดยตั้งใจ: หน้าที่สลับ "วงหมุน" → "เนื้อหา" ใต้ div ตัวนอกเดียวกัน (shopPage) React จะใช้
// div ของวงหมุนเป็น div แรกของเนื้อหาต่อ (ชนิดเดียวกัน ตำแหน่งเดียวกัน) → browser นับว่ากล่องเดิมเลื่อนจากกลางจอ
// ไปบนสุดและขยาย = layout shift (Lighthouse มือถือ CLS 0.19 ที่ตะกร้า · ชำระเงิน · รายละเอียดคำสั่งซื้อ/พรีออเดอร์)
// ชนิด element ต่างกัน = React สร้างกล่องเนื้อหาใหม่ ไม่นับเป็นการเลื่อน
export default function ShopSpinner({ label }: { label: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className="block h-10 w-10 animate-spin rounded-full border-4 border-[#8C5A3C]/20 border-t-[#8C5A3C]"
    />
  );
}
