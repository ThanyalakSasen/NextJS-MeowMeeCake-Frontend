/** grid responsive ของ StatCard — cols = จำนวนคอลัมน์บนจอ lg (ค่าเริ่มต้น 4)
 *  ใช้ cols={3} เมื่อมีการ์ด 3 ใบ ให้แบ่งเต็มแถวเท่า ๆ กันไม่เหลือช่องว่างด้านขวา */
const COLS_CLASS = {
  3: "grid grid-cols-1 gap-4 sm:grid-cols-3",
  4: "grid grid-cols-2 gap-4 lg:grid-cols-4",
} as const;

export function StatCardsGrid({ cols = 4, children }: { cols?: keyof typeof COLS_CLASS; children: React.ReactNode }) {
  return <div className={COLS_CLASS[cols]}>{children}</div>;
}
