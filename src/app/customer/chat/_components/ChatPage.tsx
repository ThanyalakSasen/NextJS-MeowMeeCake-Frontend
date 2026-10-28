"use client";
// ─────────────────────────────────────────────────────────────
// หน้าแชทกับร้าน (เต็มจอ) — ห้องเดียวกับที่ฝังในหน้าติดต่อเรา · ลิงก์จากไอคอนแชทบน Navbar / แจ้งเตือน "ร้านตอบกลับ"
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { storeInfoService } from "@/services/storeInfo";
import type { ChatAttachmentKind } from "@/types/chat";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import ShopChatPanel from "@/components/customer/chat/ShopChatPanel";
import { shopPage } from "@/components/customer/shopStyles";
import { storeInfoKey } from "../../lib/catalogQueries";

export default function ChatPage({ initialAttach }: { initialAttach: { kind: ChatAttachmentKind; id: string } | null }) {
  const t = useTranslations("chat");
  const tc = useTranslations("shop.contact");
  const infoQ = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000 });
  const storeName = infoQ.data?.store_name || tc("fallbackStoreName");

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-[12px] sm:px-[24px]">
        <CustomerBreadcrumb items={[{ label: t("pageTitle") }]} className="!mb-0" />
        <h1 className="m-0 text-2xl font-extrabold text-[#4A342E] sm:text-3xl">{t("pageTitle")}</h1>
        <ShopChatPanel storeName={storeName} heightClass="h-[60vh] min-h-[22rem]" initialAttach={initialAttach} />
      </div>
    </div>
  );
}
