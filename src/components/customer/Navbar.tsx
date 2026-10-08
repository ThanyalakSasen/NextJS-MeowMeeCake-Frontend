"use client";
// ─────────────────────────────────────────────────────────────
// Navbar ของหน้าร้าน — ย้ายมาจาก FrontOffice (components/customer/Navbar.tsx)
// เปลี่ยนจากเดิม: session = useCustomerSession (backend cookie แทน next-auth) · จำนวนในตะกร้า = GET /shop/cart
// · โลโก้ = StoreLogo (โลโก้ที่ร้านอัปโหลด) · ออกจากระบบ = logout ของ backend (ไม่มีม่าน LogoutCurtain)
// ตัดออก (backend ยังไม่รองรับ — BACKLOG2 §16): กระดิ่งแจ้งเตือนลูกค้า · เมนู "เซ็ตขนม"
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { FaShoppingCart, FaUser } from "react-icons/fa";
import { AiOutlineSearch } from "react-icons/ai";
import { useState, useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import StoreLogo from "./StoreLogo";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { shopCartService } from "@/services/shopCart";
import { useCartCountStore } from "@/app/customer/store/cartCountStore";
import { useSidebarMenuStore } from "@/app/customer/store/sidebarMenuStore";
import { LOGIN_PATH } from "@/constants/auth";
import DoorLogoutIcon from "./DoorLogoutIcon";
import { NotificationBell } from "./CustomerNotifications";

const noopSubscribe = () => () => {};

/** เมนูหลักแถวล่าง — เพิ่มทีละหน้าตามที่ย้ายมาแล้ว (ช่วง 1 ของการรวม FrontOffice) */
const NAV_LINKS = [
  { href: "/customer", labelKey: "home" },
  { href: "/customer/product", labelKey: "allProducts" },
  { href: "/customer/preorder", labelKey: "preorder" },
  { href: "/customer/contact-us", labelKey: "contact" },
] as const;

export default function Navbar() {
  const t = useTranslations("shop.nav");
  const { user, status, signOut } = useCustomerSession();
  // Navbar อยู่ใต้ <Suspense> (CustomerChrome) จึงอาจ hydrate หลัง session โหลดเสร็จแล้ว — รอบ hydrate ใช้สถานะเดียวกับ
  // server (ยังไม่รู้ session) ก่อนเสมอ แล้วค่อยวาดตาม session หลัง hydrate เสร็จ กัน hydration mismatch
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [showDropdown, setShowDropdown] = useState(false);
  // มือถือ: ช่องค้นหาย่อเป็นไอคอน กดแล้วค่อยกางช่องค้นหาเต็มความกว้างใต้แถบบน
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const count = useCartCountStore((s) => s.count);
  const setCount = useCartCountStore((s) => s.setCount);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  // ช่องค้นหาตาม URL: เปลี่ยนหน้า หรือ ?q= ถูกเปลี่ยนจากที่อื่น → ใช้ค่าจาก URL (ปรับ state ระหว่าง render แทน useEffect)
  const urlQuery = searchParams.get("q") || "";
  const [syncedKey, setSyncedKey] = useState(`${pathname}|${urlQuery}`);
  if (syncedKey !== `${pathname}|${urlQuery}`) {
    setSyncedKey(`${pathname}|${urlQuery}`);
    if (urlQuery !== searchTerm.trim()) setSearchTerm(urlQuery);
  }
  const hasSidebarMenu = useSidebarMenuStore((s) => s.mountedCount > 0);
  const setSidebarOpen = useSidebarMenuStore((s) => s.setMobileOpen);

  const isHomePage = pathname === "/customer";
  // หน้าที่อยู่ในเมนู "บัญชีของฉัน" (SideBarMenu) — รวมหน้าเปลี่ยนรหัสผ่านด้วย
  const isAccountPage =
    (pathname?.startsWith("/customer/account") || pathname?.startsWith("/customer/changepassword")) ?? false;
  // หน้าสินค้าทั้งหมด: ค้นหาทันทีระหว่างพิมพ์ (ไม่ต้องกดปุ่มค้นหา)
  const isProductListPage = pathname === "/customer/product";

  /** URL หน้าสินค้าทั้งหมดพร้อมคำค้นใหม่ — คงพารามิเตอร์อื่น (เช่น category) ไว้ ลบ q ถ้าคำค้นว่าง */
  const productListUrl = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) params.set("q", term);
    else params.delete("q");
    const qs = params.toString();
    return `/customer/product${qs ? `?${qs}` : ""}`;
  };

  // หยุดพิมพ์ 150ms แล้วค่อยอัปเดต ?q= · ใช้ replace ไม่ใช่ push — ไม่ให้ทุกตัวอักษรเป็นประวัติย้อนกลับของเบราว์เซอร์
  useEffect(() => {
    if (!isProductListPage) return;
    const trimmed = searchTerm.trim();
    if (trimmed === (searchParams.get("q")?.trim() || "")) return;
    const timer = setTimeout(() => router.replace(productListUrl(trimmed), { scroll: false }), 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, isProductListPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (isProductListPage) {
      setShowMobileSearch(false);
      router.replace(productListUrl(trimmed), { scroll: false });
      return;
    }
    if (!trimmed) return;
    setShowMobileSearch(false);
    router.push(`/customer/product?q=${encodeURIComponent(trimmed)}`);
  };

  // จำนวนรายการในตะกร้า — ดึงใหม่ทุกครั้งที่เปลี่ยนหน้า (หน้าอื่นเพิ่ม/ลบสินค้าแล้ว)
  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") setCount(0);
      return;
    }
    let alive = true;
    shopCartService
      .get()
      .then((cart) => {
        if (alive) setCount(cart.summary?.item_count ?? cart.items.length);
      })
      .catch(() => {
        if (alive) setCount(0);
      });
    return () => {
      alive = false;
    };
  }, [pathname, status, setCount]);

  const handleLogout = async () => {
    setShowDropdown(false);
    await signOut();
    setCount(0);
    router.replace(LOGIN_PATH);
  };

  const searchForm = (
    <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchAria")}
        className="w-full h-11 pl-4 pr-14 text-base text-[#4A342E] bg-white placeholder-gray-400 rounded-xl outline-none focus:ring-2 focus:ring-white shadow-inner transition"
      />
      <button
        type="submit"
        aria-label={t("search")}
        className="absolute right-1 top-1 bottom-1 px-5 bg-[#8C5A3C] !text-white rounded-xl hover:bg-[#8C5A3C]/90 flex items-center justify-center transition"
      >
        <AiOutlineSearch size={24} className="!text-white" />
      </button>
    </form>
  );

  const linkClass = (active: boolean) =>
    `relative flex items-center px-4 py-2.5 text-base font-semibold transition-all duration-150 ${
      active
        ? "text-[#4A342E] bg-[#4A342E]/10 border-l-4 border-[#4A342E] pl-3.5"
        : "text-stone-600 hover:bg-stone-100/70 hover:text-stone-900"
    }`;

  return (
    <nav
      data-customer-navbar
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 shadow-md ${
        isHomePage ? "bg-[#4A342E]/95 !text-white backdrop-blur-md" : "bg-[#4A342E] !text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* มือถือ: flex แถวเดียว · จอ md ขึ้นไป: grid 3 คอลัมน์ [โลโก้ | ช่องค้นหา | ผู้ใช้/ตะกร้า] */}
        <div className="flex items-center justify-between gap-3 py-4 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-12">
          {/* มือถือ + หน้าที่มี SideBarMenu: ปุ่มเปิดเมนูวางแทนโลโก้ */}
          {hasSidebarMenu && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flex-shrink-0 p-2 rounded-xl !text-white hover:bg-white/10 transition"
              aria-label={t("openMenu")}
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className={`${hasSidebarMenu ? "hidden md:flex" : "flex"} flex-shrink-0 items-center md:justify-self-start`}>
            <Link href="/customer" aria-label={t("logoHome")}>
              <StoreLogo size={80} />
            </Link>
          </div>

          {/* ช่องค้นหา (จอ md ขึ้นไป) */}
          <div className="hidden md:block md:self-end w-full">{searchForm}</div>

          {/* ฝั่งขวา 2 แถว: บน = ผู้ใช้ (เล็ก) · ล่าง = ตะกร้า (ระดับเดียวกับช่องค้นหา) */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 md:self-stretch md:justify-between md:justify-self-end">
            <ul className="flex items-center justify-end gap-4 text-sm font-medium">
              <li className="relative">
                {!hydrated || status === "loading" ? (
                  <span className="!text-white">...</span>
                ) : user ? (
                  <>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 cursor-pointer !text-white hover:!text-[#e2d7c7] transition py-0.5"
                      onClick={() => setShowDropdown((v) => !v)}
                      aria-label={t("accountMenu")}
                      aria-expanded={showDropdown}
                    >
                      <FaUser size={18} className="!text-white" />
                      <span className="hidden md:inline max-w-[100px] lg:max-w-[140px] truncate text-sm font-semibold !text-white">
                        {user.fullname || user.email}
                      </span>
                    </button>
                    {showDropdown && (
                      <div className="absolute right-0 top-full mt-2.5 w-60 bg-white rounded-2xl shadow-xl py-2 z-50 border border-stone-200/80 overflow-hidden">
                        <Link
                          href="/customer/account"
                          onClick={() => setShowDropdown(false)}
                          className={linkClass(
                            pathname === "/customer/account" ||
                              (pathname.startsWith("/customer/account/") && !pathname.startsWith("/customer/account/purchases")),
                          )}
                        >
                          {t("myAccount")}
                        </Link>
                        <Link
                          href="/customer/account/purchases"
                          onClick={() => setShowDropdown(false)}
                          className={linkClass(pathname.startsWith("/customer/account/purchases"))}
                        >
                          {t("myOrders")}
                        </Link>
                        <div className="my-1 border-t border-stone-100" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="group w-full flex items-center gap-2.5 px-4 py-2.5 text-base font-semibold text-rose-600 hover:bg-rose-50/80 hover:text-rose-700 transition duration-150"
                        >
                          <DoorLogoutIcon className="w-4 h-4 shrink-0 text-rose-500 group-hover:text-rose-700 transition-colors" />
                          <span>{t("logout")}</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={`${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`}
                    className="flex items-center gap-2 !text-white hover:!text-[#e2d7c7] transition text-sm font-semibold"
                    aria-label={t("login")}
                  >
                    <FaUser size={18} className="!text-white" />
                    <span className="hidden md:inline !text-white">{t("login")}</span>
                  </Link>
                )}
              </li>
            </ul>

            {/* แถวล่าง: ปุ่มค้นหา (มือถือ) + กระดิ่ง + ตะกร้า */}
            <ul className="flex items-center justify-end md:justify-start gap-3 md:gap-4 text-base font-medium">
              <li className="md:hidden">
                <button
                  type="button"
                  onClick={() => setShowMobileSearch((v) => !v)}
                  aria-label={t("search")}
                  aria-expanded={showMobileSearch}
                  className="flex items-center p-1 !text-white hover:!text-[#e2d7c7] transition"
                >
                  <AiOutlineSearch size={26} className="!text-white" />
                </button>
              </li>
              {/* กระดิ่งแจ้งเตือน (D6) — เฉพาะลูกค้าที่ login (guest ไม่มีแจ้งเตือน) */}
              {status === "authenticated" && (
                <li>
                  <NotificationBell />
                </li>
              )}
              <li>
                <Link
                  href="/customer/cart"
                  aria-label={count > 0 ? t("cartWithCount", { count }) : t("cart")}
                  className={`relative flex items-center justify-center gap-2 p-2 md:h-11 md:min-w-11 md:py-0 lg:px-2 whitespace-nowrap rounded-xl transition shadow-sm text-base !bg-[#fff] !text-[#4A342E] ${
                    pathname === "/customer/cart" ? "ring-2 ring-white" : "hover:bg-[#8C5A3C]/90"
                  }`}
                >
                  <FaShoppingCart size={22} />
                  <span className="hidden lg:inline font-bold">{t("cart")} {count > 0 && <span>({count})</span>}</span>
                  {count > 0 && (
                    <span className="lg:hidden absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 !text-white text-[11px] font-bold leading-5 text-center">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ช่องค้นหาแบบกาง (มือถือ) */}
        {showMobileSearch && <div className="md:hidden pb-2">{searchForm}</div>}

        {/* แถวล่าง: เมนูหลัก — ซ่อนในหน้าบัญชีเพราะมีเมนูของตัวเองแล้ว */}
        {!isAccountPage && (
          <div className="border-t border-[#8C5A3C]/40 py-2.5">
            <ul className="flex items-center justify-center gap-10 text-base font-medium">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`pb-1 transition inline-block ${
                      pathname === l.href || (l.href === "/customer/preorder" && !!pathname?.startsWith("/customer/preorder/"))
                        ? "font-bold border-b-2 border-[#e2d7c7] !text-[#e2d7c7]"
                        : "!text-white hover:!text-[#e2d7c7]"
                    }`}
                  >
                    {t(l.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
