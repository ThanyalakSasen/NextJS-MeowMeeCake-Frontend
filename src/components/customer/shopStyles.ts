// class ของปุ่ม/การ์ดที่หน้า flow สั่งซื้อใช้ร่วมกัน (ตะกร้า · ชำระเงิน · ออเดอร์) — โทนเดียวกับหน้ารายละเอียดสินค้า
export const shopCard = "rounded-2xl border border-[#8C5A3C]/10 bg-white p-5 shadow-sm sm:p-6";

export const shopButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#8C5A3C]/30 bg-white px-5 text-sm font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none";

export const shopButtonPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4A342E] px-5 text-sm font-bold text-white shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#8C5A3C] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none";

export const shopInput =
  "h-11 w-full rounded-xl border border-[#8C5A3C]/25 bg-white px-3.5 text-sm text-[#4A342E] outline-none transition placeholder:text-gray-400 focus:border-[#8C5A3C] focus:ring-2 focus:ring-[#8C5A3C]/20";

/** ระยะบนของเนื้อหา — ใต้ Navbar แบบ fixed (เท่าหน้ารายละเอียดสินค้า) */
export const shopPage = "w-full min-h-screen pt-46 pb-16 text-[#4A342E] sm:pt-50 md:pt-44";

export const baht = (n: number) =>
  `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
