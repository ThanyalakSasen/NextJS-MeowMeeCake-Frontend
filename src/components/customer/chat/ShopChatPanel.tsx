"use client";
// ─────────────────────────────────────────────────────────────
// แชทกับร้าน (ฝั่งลูกค้า) — แทนฟอร์ม "ส่งข้อความหาเรา" · ใช้ในหน้าติดต่อเรา (ฝังในการ์ด) และหน้า /customer/chat (เต็มจอ)
// - ต้อง login (guest เห็นปุ่มเข้าสู่ระบบ) · ข้อความใหม่จากร้านดึงทุก 4 วิ (useChatThread)
// - ปุ่ม 🧾 = เลือกคำสั่งซื้อ/พรีออเดอร์ของตัวเองแนบในแชท (ป๊อปอัพ OrderPicker) · ส่งได้ทั้งแนบอย่างเดียวหรือแนบ + ข้อความ
// - initialAttach (?order= / ?preorder= จากหน้ารายละเอียดคำสั่งซื้อ) = เลือกแนบไว้ให้ก่อน
// - เปิดอยู่ + มีข้อความใหม่จากร้าน = อ่านแล้วทันที (ตัวเลขบน Navbar หาย)
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Package, ReceiptText, X } from "lucide-react";
import { shopChatService } from "@/services/shopChat";
import { shopOrdersService } from "@/services/shopOrders";
import { shopPreordersService } from "@/services/shopPreorders";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { useChatThread } from "@/hooks/useChatThread";
import { LOGIN_PATH } from "@/constants/auth";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { ChatAttachment, ChatAttachmentKind } from "@/types/chat";
import ChatMessageList from "@/components/shared/chat/ChatMessageList";
import ChatComposer from "@/components/shared/chat/ChatComposer";
import { shopChatUnreadKey } from "@/app/customer/lib/shopQueries";
import { baht, shopButtonPrimary } from "../shopStyles";
import OrderPicker, { type PickedOrder } from "./OrderPicker";

/** ลิงก์หน้ารายละเอียดคำสั่งซื้อของลูกค้า */
export const customerAttachmentHref = (a: Pick<ChatAttachment, "kind" | "ref_id">) =>
  a.kind === "order" ? `/customer/account/purchases/${a.ref_id}` : `/customer/account/preorders/${a.ref_id}`;

export default function ShopChatPanel({
  storeName,
  heightClass = "h-[28rem]",
  initialAttach = null,
  compact = false,
}: {
  storeName: string;
  /** ความสูงส่วนข้อความ (tailwind) */
  heightClass?: string;
  initialAttach?: { kind: ChatAttachmentKind; id: string } | null;
  /** อยู่ในหน้าต่างแชทลอย (ChatWidget) — ไม่มีกรอบ/หัวของตัวเอง (หน้าต่างวาดหัวเอง) */
  compact?: boolean;
}) {
  const t = useTranslations("chat");
  const tc = useTranslations("shop.common");
  const { status } = useCustomerSession();
  const pathname = usePathname() ?? "/customer/chat";

  if (status === "loading") {
    return <div className={`${heightClass} animate-pulse rounded-2xl bg-[#FAF6F0]/60`} aria-busy="true" aria-label={tc("loadingDots")} />;
  }
  if (status !== "authenticated") {
    return (
      <div className={`space-y-3 py-10 text-center ${compact ? "px-4" : "rounded-2xl border border-dashed border-[#8C5A3C]/20 bg-[#FAF6F0]/50"}`}>
        <MessageCircle className="mx-auto h-8 w-8 text-[#8C5A3C]" aria-hidden="true" />
        <p className="m-0 text-sm text-gray-600">{t("loginFirst")}</p>
        <Link href={`${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`} className={shopButtonPrimary}>{tc("login")}</Link>
      </div>
    );
  }
  return <ChatBody storeName={storeName} heightClass={heightClass} initialAttach={initialAttach} compact={compact} />;
}

function ChatBody({
  storeName,
  heightClass,
  initialAttach,
  compact,
}: {
  compact: boolean;
  storeName: string;
  heightClass: string;
  initialAttach: { kind: ChatAttachmentKind; id: string } | null;
}) {
  const t = useTranslations("chat");
  const qc = useQueryClient();

  const markRead = useCallback(() => {
    void shopChatService
      .markRead()
      .then(() => qc.setQueryData(shopChatUnreadKey, 0))
      .catch(() => undefined);
  }, [qc]);

  const thread = useChatThread("me", shopChatService.thread, { onNewFromOther: markRead });

  // เปิดห้องแล้วมีข้อความค้างอ่าน → อ่านแล้ว
  const unreadOnOpen = thread.conversation?.customer_unread ?? 0;
  useEffect(() => {
    if (unreadOnOpen > 0) markRead();
  }, [unreadOnOpen, markRead]);

  // ── แนบคำสั่งซื้อ ──
  const [pickerOpen, setPickerOpen] = useState(false);
  const [picked, setPicked] = useState<PickedOrder | null>(null);
  // มาจากหน้ารายละเอียดคำสั่งซื้อ (?order= / ?preorder=) — โหลดเลขที่มาแสดงในชิป
  const initialQ = useQuery({
    queryKey: ["shop", "chat", "initial-attach", initialAttach?.kind, initialAttach?.id],
    enabled: !!initialAttach,
    queryFn: async (): Promise<PickedOrder> => {
      if (initialAttach!.kind === "order") {
        const o = await shopOrdersService.get(initialAttach!.id);
        return { kind: "order", id: o._id, doc_no: o.order_no, total_amount: o.total_amount };
      }
      const p = await shopPreordersService.get(initialAttach!.id);
      return { kind: "preorder", id: p._id, doc_no: p.preorder_no, total_amount: p.total_amount };
    },
    staleTime: Infinity,
  });
  const [initialDismissed, setInitialDismissed] = useState(false);
  const attachment = picked ?? (initialDismissed ? null : initialQ.data ?? null);
  const clearAttachment = () => {
    setPicked(null);
    setInitialDismissed(true);
  };

  const send = useMutation({
    mutationFn: (body: string) =>
      shopChatService.send({
        body: body || undefined,
        ...(attachment ? (attachment.kind === "order" ? { order_id: attachment.id } : { preorder_id: attachment.id }) : {}),
      }),
    onSuccess: (msg) => {
      thread.append(msg);
      clearAttachment();
    },
    onError: (e) =>
      alert.error(isApiError(e) && e.status === 429 ? t("rateLimited") : isApiError(e) ? e.message : t("sendFailed")),
  });

  const AttachIcon = attachment?.kind === "preorder" ? Package : ReceiptText;

  return (
    <div className={`flex flex-col overflow-hidden bg-[#FAF6F0]/50 ${compact ? "" : "rounded-2xl border border-[#8C5A3C]/15"}`}>
      <div className={`items-center gap-3 border-b border-[#8C5A3C]/10 bg-white px-4 py-3 ${compact ? "hidden" : "flex"}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4A342E] text-white">
          <MessageCircle size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-bold text-[#4A342E]">{storeName}</p>
          <p className="m-0 text-xs text-stone-500">{t("replyHint")}</p>
        </div>
      </div>

      {thread.status === "error" ? (
        <p className={`${heightClass} m-0 flex items-center justify-center p-6 text-center text-sm text-red-600`}>{t("loadFailed")}</p>
      ) : thread.status === "loading" ? (
        <div className={`${heightClass} animate-pulse bg-white/40`} aria-busy="true" aria-label={t("loading")} />
      ) : (
        <ChatMessageList
          className={heightClass}
          messages={thread.messages}
          viewer="customer"
          attachmentHref={customerAttachmentHref}
          hasMore={thread.hasMore}
          loadingOlder={thread.loadingOlder}
          onLoadOlder={() => void thread.loadOlder()}
          empty={
            <div className="m-auto max-w-xs py-8 text-center">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 text-[#8C5A3C]/60" aria-hidden="true" />
              <p className="m-0 text-sm font-semibold text-[#4A342E]">{t("emptyTitle", { store: storeName })}</p>
              <p className="m-0 mt-1 text-xs text-stone-500">{t("emptyHint")}</p>
            </div>
          }
        />
      )}

      <ChatComposer
        sending={send.isPending}
        disabled={thread.status !== "ready"}
        canSendEmpty={!!attachment}
        onSend={async (body) => {
          try {
            await send.mutateAsync(body);
            return true;
          } catch {
            return false;
          }
        }}
        leading={
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label={t("attachButton")}
            title={t("attachButton")}
            aria-haspopup="dialog"
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border border-[#8C5A3C]/25 bg-white text-[#8C5A3C] transition hover:bg-[#FAF6F0]"
          >
            <ReceiptText size={18} aria-hidden="true" />
          </button>
        }
        above={
          attachment && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#8C5A3C]/20 bg-[#FAF6F0] px-3 py-2 text-sm">
              <AttachIcon size={16} className="shrink-0 text-[#8C5A3C]" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-semibold">{attachment.doc_no}</span>
                <span className="text-stone-500"> · {baht(attachment.total_amount)}</span>
              </span>
              <button
                type="button"
                onClick={clearAttachment}
                aria-label={t("removeAttach")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-white"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )
        }
      />

      <OrderPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(o) => {
          setPicked(o);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
