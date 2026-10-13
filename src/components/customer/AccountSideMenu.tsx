"use client";
// ─────────────────────────────────────────────────────────────
// เมนูบัญชีของลูกค้า (ด้านซ้ายบนจอใหญ่ · ลิ้นชักจากปุ่มแฮมเบอร์เกอร์บน Navbar เมื่อจอเล็กกว่า md) — ย่อจาก FrontOffice SideBarMenu.tsx
// 6 เมนู: ข้อมูลของฉัน · ที่อยู่ · เปลี่ยนรหัสผ่าน · สมาชิกของฉัน · ประวัติการสั่งซื้อ · ประวัติพรีออเดอร์
// (รายการโปรด อยู่ในเมนูผู้ใช้บน Navbar · การแจ้งเตือนเข้าจากกระดิ่ง)
// แบ่ง 2 หัวข้อแบบต้นแบบ: "บัญชีของฉัน" / "คำสั่งซื้อของฉัน" (BACKLOG4 U2)
// มือถือ: register กับ sidebarMenuStore → Navbar โชว์ปุ่มแฮมเบอร์เกอร์แทนโลโก้ · กดแล้วเปิดลิ้นชักนี้
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserIcon, KeyIcon, ShoppingBagIcon, MapPinIcon, CalendarDaysIcon, StarIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useSidebarMenuStore } from "@/app/customer/store/sidebarMenuStore";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import DoorLogoutIcon from "./DoorLogoutIcon";

const GROUPS = [
  {
    titleKey: "groupAccount",
    items: [
      { href: "/customer/account", labelKey: "profile", icon: UserIcon },
      { href: "/customer/account/address", labelKey: "address", icon: MapPinIcon },
      { href: "/customer/changepassword", labelKey: "changePassword", icon: KeyIcon },
      { href: "/customer/account/member", labelKey: "member", icon: StarIcon },
    ],
  },
  {
    titleKey: "groupOrders",
    items: [
      { href: "/customer/account/purchases", labelKey: "purchases", icon: ShoppingBagIcon },
      { href: "/customer/account/preorders", labelKey: "preorders", icon: CalendarDaysIcon },
    ],
  },
] as const;

export default function AccountSideMenu() {
  const t = useTranslations("shop.accountMenu");
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useCustomerSession();
  const mobileOpen = useSidebarMenuStore((s) => s.isMobileOpen);
  const setMobileOpen = useSidebarMenuStore((s) => s.setMobileOpen);
  const register = useSidebarMenuStore((s) => s.register);
  const unregister = useSidebarMenuStore((s) => s.unregister);

  // บอก Navbar ว่าหน้านี้มีเมนูบัญชี → โชว์ปุ่มแฮมเบอร์เกอร์บนจอเล็ก (unregister ปิดลิ้นชักให้ด้วยตอนเปลี่ยนหน้า)
  useEffect(() => {
    register();
    return unregister;
  }, [register, unregister]);

  // ลิ้นชักเปิดอยู่: Esc ปิด · ล็อกการเลื่อนหน้าข้างหลัง
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, setMobileOpen]);
  // ประวัติการสั่งซื้อ = รวมหน้ารายละเอียด /customer/account/purchases/[id]
  const isActive = (href: string) =>
    pathname === href || ((href.endsWith("/purchases") || href.endsWith("/preorders")) && !!pathname?.startsWith(`${href}/`));

  const onLogout = async () => {
    setMobileOpen(false);
    await signOut();
    router.replace("/customer");
  };

  const item = (active: boolean) =>
    `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
      active ? "bg-[#4A342E] text-white shadow-sm" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
    }`;

  const menu = (
    <div className="flex flex-col gap-2 rounded-2xl border border-stone-100 bg-white p-2 shadow-sm">
      {GROUPS.map((group, gi) => (
        <div key={group.titleKey} className={`flex flex-col gap-2 ${gi > 0 ? "mt-2 border-t border-stone-100 pt-2" : ""}`}>
          <p className="m-0 px-3.5 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-stone-400">{t(group.titleKey)}</p>
          {group.items.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={item(isActive(href))}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(labelKey)}
            </Link>
          ))}
        </div>
      ))}
      <button type="button" onClick={() => void onLogout()} className={`${item(false)} mt-2 border-t border-stone-100`}>
        <DoorLogoutIcon className="h-4 w-4 shrink-0" />
        {t("logout")}
      </button>
    </div>
  );

  return (
    <>
      {/* จอ md ขึ้นไป: เมนูด้านซ้าย */}
      <nav aria-label={t("aria")} className="hidden w-56 shrink-0 md:block">
        {menu}
      </nav>

      {/* จอเล็ก: ลิ้นชักจากซ้าย เปิดด้วยปุ่มแฮมเบอร์เกอร์บน Navbar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label={t("aria")}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <nav aria-label={t("aria")} className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-3 overflow-y-auto bg-stone-50 p-4 shadow-xl">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={t("closeMenu")}
                className="rounded-xl p-2 text-stone-600 hover:bg-stone-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {menu}
          </nav>
        </div>
      )}
    </>
  );
}
