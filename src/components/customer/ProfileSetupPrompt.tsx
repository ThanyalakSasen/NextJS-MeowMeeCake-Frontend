"use client";
// ─────────────────────────────────────────────────────────────
// ป๊อปอัป "กรอกข้อมูลบัญชีให้ครบ" — ผู้ใช้ที่เพิ่งสมัครด้วย Google/LINE (backend แจ้งเตือน ref_type "profile_setup")
// เด้งทุกหน้าของร้านจนกว่า:
//   - กด "กรอกข้อมูลเลย" → แจ้งเตือนอ่านแล้ว + ไปหน้าบัญชีพร้อมเปิดฟอร์มแก้ไข (?edit=profile)
//   - กรอกเบอร์/วันเกิดครบ → backend ตั้งอ่านแล้วให้เอง (resolveProfileSetupNotices)
// "ไว้ภายหลัง" = ปิดไว้จนจบการใช้งานรอบนี้ (sessionStorage) · แจ้งเตือนยังอยู่ในกระดิ่ง · เปิดเว็บรอบหน้าเด้งอีก
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserRoundPen } from "lucide-react";
import ShopModal from "./ShopModal";
import { shopButton, shopButtonPrimary } from "./shopStyles";
import { useCustomerNotifications } from "@/app/customer/hooks/useCustomerNotifications";

const LATER_KEY = "profile-setup-later";
const ACCOUNT_PATH = "/customer/account";

function readLater(): string | null {
  try {
    return window.sessionStorage.getItem(LATER_KEY);
  } catch {
    return null;
  }
}

export default function ProfileSetupPrompt() {
  const t = useTranslations("shop.profileSetup");
  const router = useRouter();
  const pathname = usePathname() ?? "";
  // limit เดียวกับกระดิ่งบน Navbar (cache ร่วม — ไม่ยิงเพิ่ม)
  const { items, markRead } = useCustomerNotifications(8);
  // id ที่กด "ไว้ภายหลัง" ในรอบนี้ (เริ่มจาก sessionStorage — อ่านตอนสร้าง state ครั้งแรกเท่านั้น)
  const [laterId, setLaterId] = useState<string | null>(() => (typeof window === "undefined" ? null : readLater()));

  const notice = items.find((n) => n.ref_type === "profile_setup" && !n.read_at);
  // อยู่หน้าบัญชีอยู่แล้ว = ไม่ต้องเด้งทับฟอร์ม
  const open = !!notice && notice._id !== laterId && !pathname.startsWith(ACCOUNT_PATH);
  if (!notice) return null;

  const later = () => {
    try {
      window.sessionStorage.setItem(LATER_KEY, notice._id);
    } catch {
      // เบราว์เซอร์ไม่ให้ใช้ storage — ปิดแค่ในหน้านี้
    }
    setLaterId(notice._id);
  };
  const fillNow = () => {
    void markRead(notice._id);
    router.push(`${ACCOUNT_PATH}?edit=profile`);
  };

  return (
    <ShopModal
      open={open}
      onClose={later}
      title={notice.title}
      maxWidth="max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={later} className={shopButton}>
            {t("later")}
          </button>
          <button type="button" onClick={fillNow} className={shopButtonPrimary}>
            {t("fillNow")}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF6F0] text-[#8C5A3C]">
          <UserRoundPen size={28} aria-hidden="true" />
        </span>
        <p className="m-0 text-sm leading-relaxed text-stone-700">{notice.message}</p>
        <p className="m-0 text-xs text-stone-500">{t("laterHint")}</p>
      </div>
    </ShopModal>
  );
}
