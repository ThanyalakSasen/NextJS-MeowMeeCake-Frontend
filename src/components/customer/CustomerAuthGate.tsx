"use client";
// หน้าที่ต้อง login (ตะกร้า · ชำระเงิน · ออเดอร์) — guest เห็นการ์ดชวนเข้าสู่ระบบ แล้วกลับมาหน้าเดิมผ่าน ?next=
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { LOGIN_PATH } from "@/constants/auth";
import { shopButtonPrimary, shopCard, shopPage } from "./shopStyles";

export default function CustomerAuthGate({ message, children }: { message: string; children: React.ReactNode }) {
  const t = useTranslations("shop.common");
  const { status } = useCustomerSession();
  const pathname = usePathname() ?? "";

  if (status === "authenticated") return <>{children}</>;

  return (
    <div className={`${shopPage} flex items-center justify-center px-4`}>
      {status === "loading" ? (
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8C5A3C]/20 border-t-[#8C5A3C]" aria-label={t("loading")} />
      ) : (
        <div className={`${shopCard} w-full max-w-md space-y-4 text-center`}>
          <h2 className="text-lg font-bold">{message}</h2>
          <Link href={`${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`} className={`${shopButtonPrimary} w-full`}>
            {t("login")}
          </Link>
        </div>
      )}
    </div>
  );
}
