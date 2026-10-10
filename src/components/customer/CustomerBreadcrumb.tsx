// breadcrumb ฝั่งลูกค้า — แต่ละหน้าส่งรายการเอง (FrontOffice เดิมสร้างจาก pathname + วัดระยะจาก Navbar ด้วย JS
// ซึ่งซับซ้อนเกินจำเป็น — ที่นี่ใช้ระยะคงที่จาก padding ของแต่ละหน้าแทน)
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

export interface Crumb {
  label: string;
  /** ไม่ใส่ = หน้าปัจจุบัน (ไม่เป็นลิงก์) */
  href?: string;
}

export default function CustomerBreadcrumb({ items, className = "" }: { items: Crumb[]; className?: string }) {
  const t = useTranslations("shop.common");
  const crumbs: Crumb[] = [{ label: t("home"), href: "/customer" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className={`mb-6 ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-stone-500">
        {crumbs.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />}
            {c.href && i < crumbs.length - 1 ? (
              <Link href={c.href} className="hover:text-[#4A342E] hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className="font-semibold text-[#4A342E]" aria-current="page">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
