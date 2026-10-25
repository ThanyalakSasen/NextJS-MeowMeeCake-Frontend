"use client";
// ปุ่ม "สอบถามร้านเรื่องคำสั่งซื้อนี้" — เปิดกล่องแชทลอยพร้อมแนบการ์ดคำสั่งซื้อ/พรีออเดอร์นี้รอไว้ (ลูกค้าพิมพ์คำถามต่อแล้วส่ง)
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import type { ChatRef } from "@/services/chat";
import { useChatWidgetStore } from "@/app/customer/store/chatWidgetStore";

export default function AskShopButton({ chatRef }: { chatRef: ChatRef }) {
  const t = useTranslations("shop.chat");
  const openWithRef = useChatWidgetStore((s) => s.openWithRef);
  return (
    <button
      type="button"
      onClick={() => openWithRef(chatRef)}
      className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#8C5A3C]/30 bg-white px-3.5 py-2 text-sm font-semibold text-[#4A342E] shadow-sm transition hover:bg-[#FAF6F0]"
    >
      <MessageCircle className="h-4 w-4 text-[#8C5A3C]" aria-hidden="true" />
      {chatRef.kind === "order" ? t("askAboutOrder") : t("askAboutPreorder")}
    </button>
  );
}
