// class ของปุ่ม/การ์ดที่หน้า flow สั่งซื้อใช้ร่วมกัน (ตะกร้า · ชำระเงิน · ออเดอร์) — โทนเดียวกับหน้ารายละเอียดสินค้า
export const shopCard = "rounded-2xl border border-[#8C5A3C]/10 bg-white p-5 shadow-sm sm:p-6";

export const shopButton =
  "inline-flex h-[44px] items-center justify-center gap-2 rounded-xl border border-[#8C5A3C]/30 bg-white px-5 text-sm font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none";

export const shopButtonPrimary =
  "inline-flex h-[44px] items-center justify-center gap-2 rounded-xl bg-[#4A342E] px-5 text-sm font-bold text-white shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#8C5A3C] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none";

export const shopInput =
  "h-[44px] w-full rounded-xl border border-[#8C5A3C]/25 bg-white px-3.5 text-sm text-[#4A342E] outline-none transition placeholder:text-gray-500 focus:border-[#8C5A3C] focus:ring-2 focus:ring-[#8C5A3C]/20";

/** ระยะบนของเนื้อหา — ใต้ Navbar แบบ fixed (เท่าหน้ารายละเอียดสินค้า) */
export const shopPage = "w-full min-h-screen pt-46 pb-16 text-[#4A342E] sm:pt-50 md:pt-44";

export const baht = (n: number) =>
  `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ── บัตรสินค้า — ใช้ร่วมกันทุกหน้า (สินค้าทั้งหมด · หน้าแรก · สินค้าคล้าย · พรีออเดอร์) ให้หน้าตาและขนาดเท่ากัน ──
/** ตารางบัตรสินค้า: มือถือ (<640) 2 · จอกลาง (640–1279) 3 · จอใหญ่ (≥1280) 4 คอลัมน์ — ทุกหน้าใช้ตัวนี้ บัตรจะกว้างเท่ากัน
 *  (สินค้าแนะนำ/สินค้าคล้ายกันใช้ RecommendationGrid — คอลัมน์เท่ากัน แต่แสดงเฉพาะแถวเต็ม) */
export const productGrid = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4";
/** กรอบบัตร — h-full + flex-col: บัตรในแถวเดียวกันสูงเท่ากัน ราคา/ปุ่มชิดล่างตรงกัน */
export const productCardFrame =
  "group flex h-full flex-col overflow-hidden rounded-xl border border-[#8C5A3C]/10 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";
export const productCardImage = "relative aspect-square w-full overflow-hidden bg-stone-50";
export const productCardBody = "flex flex-1 flex-col gap-2 p-3 sm:p-4";
export const productCardTitle = "m-0 line-clamp-1 text-sm font-semibold text-[#4A342E] md:text-[0.9444rem] xl:text-base";
export const productCardSubtitle = "m-0 line-clamp-1 min-h-[1.5em] text-xs text-stone-500";
/** ปุ่มล่างสุดของบัตร (เพิ่มลงตะกร้า / เลือกสินค้า) */
export const productCardButton =
  "flex h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-[#8C5A3C]/30 bg-white px-2 text-sm font-bold text-[#4A342E] shadow-sm transition-all duration-200 hover:bg-[#4A342E] hover:text-white active:scale-[0.98]";
