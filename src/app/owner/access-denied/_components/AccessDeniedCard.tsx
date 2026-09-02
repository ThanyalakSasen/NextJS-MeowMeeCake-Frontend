"use client";
// การ์ดหน้าปฏิเสธสิทธิ์ — redirect มาที่นี่เมื่อ permission gate ปฏิเสธ (ไม่มีใน sidebar)
import { useTranslations } from "next-intl";
import { NoSymbolIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/base";

export function AccessDeniedCard() {
  const t = useTranslations();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <NoSymbolIcon className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-lg font-semibold text-brown-900">{t("accessDenied.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{t("accessDenied.description")}</p>
        <Button type="primary" href="/owner/dashboard" className="mt-5">
          {t("accessDenied.back")}
        </Button>
      </div>
    </div>
  );
}
