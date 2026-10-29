"use client";
// ─────────────────────────────────────────────────────────────
// ป๊อปอัพเลือกคำสั่งซื้อ/พรีออเดอร์ของตัวเองเพื่อแนบในแชท — 2 แท็บ · 20 รายการล่าสุดของแต่ละแบบ (ใหม่สุดก่อน)
// โหลดเมื่อเปิดป๊อปอัพครั้งแรกเท่านั้น (cache ร่วมกับหน้าประวัติไม่ได้ — คนละ params)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Package, ReceiptText } from "lucide-react";
import { shopOrdersService } from "@/services/shopOrders";
import { shopPreordersService } from "@/services/shopPreorders";
import type { ChatAttachRef, ChatAttachmentKind } from "@/types/chat";
import ShopModal from "../ShopModal";
import { baht } from "../shopStyles";

export type PickedOrder = ChatAttachRef;

interface Row extends PickedOrder {
  status: string;
  created_at: string;
}

const PICK_LIMIT = 20;

export default function OrderPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (o: PickedOrder) => void }) {
  const t = useTranslations("chat");
  const ts = useTranslations("shop.orderStatus");
  const locale = useLocale();
  const [tab, setTab] = useState<ChatAttachmentKind>("order");

  const ordersQ = useQuery({
    queryKey: ["shop", "chat", "pick", "orders"],
    queryFn: async (): Promise<Row[]> =>
      (await shopOrdersService.list({ limit: PICK_LIMIT })).data.map((o) => ({
        kind: "order",
        id: o._id,
        doc_no: o.order_no,
        total_amount: o.total_amount,
        status: o.order_status,
        created_at: o.created_at,
      })),
    enabled: open,
    staleTime: 60_000,
  });
  const preordersQ = useQuery({
    queryKey: ["shop", "chat", "pick", "preorders"],
    queryFn: async (): Promise<Row[]> =>
      (await shopPreordersService.list({ limit: PICK_LIMIT })).data.map((p) => ({
        kind: "preorder",
        id: p._id,
        doc_no: p.preorder_no,
        total_amount: p.total_amount,
        status: p.order_status,
        created_at: p.created_at,
      })),
    enabled: open,
    staleTime: 60_000,
  });
  const q = tab === "order" ? ordersQ : preordersQ;
  const rows = q.data ?? [];
  const dateOf = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <ShopModal open={open} onClose={onClose} title={t("pickTitle")} maxWidth="max-w-lg">
      <div role="tablist" aria-label={t("pickTitle")} className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
        {(["order", "preorder"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`h-[40px] rounded-lg text-sm font-semibold transition ${tab === k ? "bg-white text-[#4A342E] shadow-sm" : "text-stone-600 hover:text-[#4A342E]"}`}
          >
            {k === "order" ? t("tabOrders") : t("tabPreorders")}
          </button>
        ))}
      </div>

      {q.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label={t("loading")}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : q.isError ? (
        <p className="m-0 py-8 text-center text-sm text-red-600">{t("pickFailed")}</p>
      ) : rows.length === 0 ? (
        <p className="m-0 py-8 text-center text-sm text-stone-500">{tab === "order" ? t("noOrders") : t("noPreorders")}</p>
      ) : (
        <ul className="m-0 list-none space-y-2 p-0">
          {rows.map((r) => {
            const Icon = r.kind === "order" ? ReceiptText : Package;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onPick({ kind: r.kind, id: r.id, doc_no: r.doc_no, total_amount: r.total_amount })}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#8C5A3C]/15 bg-white px-3 py-2.5 text-left transition hover:border-[#8C5A3C]/40 hover:bg-[#FAF6F0]"
                >
                  <Icon size={20} className="shrink-0 text-[#8C5A3C]" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[#4A342E]">{r.doc_no}</span>
                    <span className="block text-xs text-stone-500">
                      {dateOf(r.created_at)} · {ts(r.status as Parameters<typeof ts>[0])}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-[#4A342E]">{baht(r.total_amount)}</span>
                  <ChevronRight size={16} className="shrink-0 text-stone-400" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ShopModal>
  );
}
