"use client";
// ─────────────────────────────────────────────────────────────
// เมนูบัญชีของลูกค้า (ด้านซ้ายบนจอใหญ่ · แถบบนสุดบนมือถือ) — ย่อจาก FrontOffice src/app/components/customer/SideBarMenu.tsx
// ครบทุกเมนูของต้นแบบแล้ว (8/8)
// แบ่ง 2 หัวข้อแบบต้นแบบ: "บัญชีของฉัน" / "คำสั่งซื้อของฉัน" (BACKLOG4 U2) — มือถือเป็นแถบเลื่อนแถวเดียว หัวข้อซ่อน
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserIcon, KeyIcon, ShoppingBagIcon, MapPinIcon, GiftIcon, HeartIcon, CalendarDaysIcon, BellIcon } from "@heroicons/react/24/solid";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import DoorLogoutIcon from "./DoorLogoutIcon";

const GROUPS = [
  {
    title: "บัญชีของฉัน",
    items: [
      { href: "/customer/account", label: "ข้อมูลส่วนตัว", icon: UserIcon },
      { href: "/customer/account/address", label: "ที่อยู่", icon: MapPinIcon },
      { href: "/customer/changepassword", label: "เปลี่ยนรหัสผ่าน", icon: KeyIcon },
      { href: "/customer/account/member", label: "สมาชิกของฉัน", icon: GiftIcon },
    ],
  },
  {
    title: "คำสั่งซื้อของฉัน",
    items: [
      { href: "/customer/account/purchases", label: "ประวัติการสั่งซื้อ", icon: ShoppingBagIcon },
      { href: "/customer/account/preorders", label: "ประวัติพรีออเดอร์", icon: CalendarDaysIcon },
      { href: "/customer/account/favorites", label: "รายการโปรด", icon: HeartIcon },
      { href: "/customer/account/notifications", label: "การแจ้งเตือน", icon: BellIcon },
    ],
  },
] as const;

export default function AccountSideMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useCustomerSession();
  // ประวัติการสั่งซื้อ = รวมหน้ารายละเอียด /customer/account/purchases/[id]
  const isActive = (href: string) =>
    pathname === href || ((href.endsWith("/purchases") || href.endsWith("/preorders")) && !!pathname?.startsWith(`${href}/`));

  const onLogout = async () => {
    await signOut();
    router.replace("/customer");
  };

  const item = (active: boolean) =>
    `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
      active ? "bg-[#4A342E] text-white shadow-sm" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
    }`;

  return (
    <nav aria-label="เมนูบัญชีของฉัน" className="w-full shrink-0 md:w-56">
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-stone-100 bg-white p-2 shadow-sm md:flex-col md:overflow-visible">
        {GROUPS.map((group, gi) => (
          <div key={group.title} className={`contents md:flex md:flex-col md:gap-2 ${gi > 0 ? "md:mt-2 md:border-t md:border-stone-100 md:pt-2" : ""}`}>
            <p className="m-0 hidden px-3.5 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-stone-400 md:block">{group.title}</p>
            {group.items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={item(isActive(href))} aria-current={isActive(href) ? "page" : undefined}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        ))}
        <button type="button" onClick={() => void onLogout()} className={`${item(false)} md:mt-2 md:border-t md:border-stone-100`}>
          <DoorLogoutIcon className="h-4 w-4 shrink-0" />
          ออกจากระบบ
        </button>
      </div>
    </nav>
  );
}
