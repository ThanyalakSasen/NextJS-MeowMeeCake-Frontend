"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/favorites — รายการโปรดของฉัน (BACKLOG3-merge D5) · ยกจาก FrontOffice src/app/customer/account/favorites/page.tsx
// API: GET /shop/favorites · DELETE /shop/favorites?productId= (ผ่าน useFavorites — cache เดียวกับปุ่มหัวใจในบัตรสินค้า)
// ต่างจากต้นแบบ: ปุ่ม "หยิบใส่ตะกร้า" ใช้ได้จริง (ต้นแบบไม่มี onClick) · สินค้าพรีออเดอร์ = ปุ่ม "ดูสินค้า" (สั่งผ่าน flow พรีออเดอร์ D3)
// · ชื่อ/รูปกดไปหน้าสินค้าได้
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { FaCheck, FaHeart, FaSpinner, FaStar } from "react-icons/fa";
import { Heart, ShoppingCart } from "lucide-react";
import type { FavoriteItem } from "@/services/shopFavorites";
import { resolveUploadUrl } from "@/lib/uploads";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import AccountSideMenu from "@/components/customer/AccountSideMenu";
import { baht, shopButton, shopPage } from "@/components/customer/shopStyles";
import { useFavorites } from "../../hooks/useFavorites";
import { useAddToCart } from "../../hooks/useAddToCart";

export default function FavoritesPage() {
  return (
    <CustomerAuthGate message="กรุณาเข้าสู่ระบบเพื่อดูรายการโปรด">
      <FavoritesContent />
    </CustomerAuthGate>
  );
}

function FavoritesContent() {
  const favorites = useFavorites();
  const { query: q, items } = favorites;

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: "บัญชีของฉัน", href: "/customer/account" }, { label: "รายการโปรด" }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <AccountSideMenu />
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <header className="space-y-1 border-b border-stone-200 pb-5">
              <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-stone-800 sm:text-2xl">
                <Heart className="h-6 w-6 text-[#4A342E]" aria-hidden="true" /> รายการโปรดของฉัน
              </h1>
              <p className="m-0 text-sm text-stone-500">สินค้าที่คุณบันทึกไว้ ({items.length} รายการ)</p>
            </header>

            {q.isLoading ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center text-sm text-stone-500">กำลังโหลดรายการโปรด...</p>
            ) : q.isError ? (
              <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">โหลดรายการโปรดไม่สำเร็จ กรุณารีเฟรชหน้านี้</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center">
                <div className="rounded-full bg-amber-50/60 p-4">
                  <Heart className="h-12 w-12 text-[#D6C7BD]" aria-hidden="true" />
                </div>
                <p className="m-0 font-medium text-stone-500">ยังไม่มีรายการโปรดในขณะนี้</p>
                <p className="m-0 text-xs text-stone-400">กดรูปหัวใจบนบัตรสินค้าเพื่อบันทึกไว้ดูทีหลัง</p>
                <Link href="/customer/product" className={shopButton}>ไปช้อปปิ้งเลย</Link>
              </div>
            ) : (
              <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <FavoriteCard
                    key={item.id}
                    item={item}
                    removing={favorites.pendingId === item.id}
                    onRemove={() => void favorites.toggle(item.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FavoriteCard({ item, removing, onRemove }: { item: FavoriteItem; removing: boolean; onRemove: () => void }) {
  const { addToCart, status } = useAddToCart();
  const [imgFailed, setImgFailed] = useState(false);
  const href = `/customer/product/${item.id}`;
  const img = resolveUploadUrl(item.image);

  return (
    <li className={`group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:border-stone-300 ${item.inStock ? "" : "opacity-75"}`}>
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-stone-100">
        <Link href={href} className="block h-full w-full" tabIndex={-1} aria-hidden="true">
          {img && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" onError={() => setImgFailed(true)} />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-stone-500">ไม่มีรูปภาพ</span>
          )}
        </Link>

        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={`ลบ ${item.name} ออกจากรายการโปรด`}
          title="ลบออกจากรายการโปรด"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur-md transition hover:bg-white disabled:opacity-60"
        >
          {removing ? <FaSpinner className="animate-spin text-xs text-stone-400" /> : <FaHeart className="text-base text-[#E05353]" />}
        </button>

        {!item.inStock && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-stone-900/80 px-3 py-1.5 text-xs font-bold text-white">หมดชั่วคราว</span>
          </div>
        )}
        {item.is_preorder && item.inStock && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#4A342E] px-2.5 py-1 text-[11px] font-bold text-white">พรีออเดอร์</span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div className="space-y-1">
          {item.category && <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#4A342E]">{item.category}</span>}
          <Link href={href} className="block">
            <h2 className="m-0 line-clamp-1 text-base font-bold leading-snug text-stone-800 hover:text-[#8C5A3C]">{item.name}</h2>
          </Link>
          {item.nameeg && <span className="line-clamp-1 block text-xs text-stone-400">{item.nameeg}</span>}
          {item.rating !== "-" && (
            <span className="flex items-center gap-1 pt-1 text-xs font-bold text-amber-500">
              <FaStar /> {Number(item.rating).toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-stone-200/60 pt-2">
          <span className="flex items-baseline gap-1.5">
            <span className={`text-lg font-bold ${item.originalPrice ? "text-red-600" : "text-stone-900"}`}>{baht(item.price)}</span>
            {item.originalPrice ? <span className="text-xs text-stone-400 line-through">{baht(item.originalPrice)}</span> : null}
          </span>

          {item.is_preorder ? (
            <Link href={href} className="rounded-xl border border-[#8C5A3C]/30 bg-white px-3 py-2 text-xs font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition hover:bg-[#4A342E] hover:text-white">
              ดูสินค้า
            </Link>
          ) : (
            <button
              type="button"
              disabled={!item.inStock || status === "loading" || status === "success"}
              onClick={() => void addToCart(item.id, 1)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 ${
                status === "success"
                  ? "border border-emerald-600 bg-emerald-600 text-white"
                  : "border border-[#8C5A3C]/30 bg-white text-[#4A342E] shadow-md shadow-[#4A342E]/20 hover:bg-[#4A342E] hover:text-white active:scale-[0.98]"
              } disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none`}
            >
              {!item.inStock ? (
                "สินค้าหมด"
              ) : status === "loading" ? (
                <><FaSpinner className="animate-spin" /> กำลังเพิ่ม...</>
              ) : status === "success" ? (
                <><FaCheck /> เพิ่มแล้ว</>
              ) : (
                <><ShoppingCart className="h-4 w-4" aria-hidden="true" /> หยิบใส่ตะกร้า</>
              )}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
