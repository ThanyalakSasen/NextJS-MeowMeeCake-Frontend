"use client";

// Stub — เฟส 4 จะแทนที่ด้วย Screen #2 (Dashboard เต็ม)
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("nav");
  return (
    <div>
      <h1 className="text-xl font-medium text-brown-900">{t("dashboard")}</h1>
      <p className="mt-2 text-sm text-gray-500">stub — phase 4</p>
    </div>
  );
}
