"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/preorders — ประวัติพรีออเดอร์ (BACKLOG3-merge D3) · ยกจาก FrontOffice customer/account/preorders/page.tsx
// GET /shop/preorders (กรองสถานะ + แบ่งหน้าที่ server) · รายการไม่มี items → ดึงรายละเอียดทีละใบ (cache เดียวกับหน้ารายละเอียด)
// (เหมือนประวัติการสั่งซื้อ — backend Q-BE13)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useQueries, useQuery, keepPreviousData } from "@tanstack/react-query";
import { CalendarClock, CakeSlice } from "lucide-react";
import { shopPreordersService, type ShopPreorder } from "@/services/shopPreorders";
import type { OrderStatus } from "@/constants/enumConfig";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import AccountSideMenu from "@/components/customer/AccountSideMenu";
import { baht, shopButton, shopPage } from "@/components/customer/shopStyles";
import { shopPreorderKey, shopPreordersKey } from "../../lib/shopQueries";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, pickupDateText } from "../purchases/orderLabels";
import { thaiDate } from "../../preorder/lib/preorderDates";

const PAGE_SIZE = 10;
const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "พรีออเดอร์ทั้งหมด" },
  ...(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] })),
];
const actionLink =
  "whitespace-nowrap rounded-xl border border-[#8C5A3C]/30 bg-white px-4 py-2 text-xs font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#4A342E] hover:text-white";

export default function PreordersPage() {
  return (
    <CustomerAuthGate message="กรุณาเข้าสู่ระบบเพื่อดูประวัติพรีออเดอร์">
      <PreordersContent />
    </CustomerAuthGate>
  );
}

function PreordersContent() {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  const params = { page, limit: PAGE_SIZE, ...(filter === "all" ? {} : { order_status: filter }) };
  const listQ = useQuery({
    queryKey: [...shopPreordersKey, params],
    queryFn: () => shopPreordersService.list(params),
    placeholderData: keepPreviousData,
  });
  const preorders = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const details = useQueries({
    queries: preorders.map((p) => ({ queryKey: shopPreorderKey(p._id), queryFn: () => shopPreordersService.get(p._id), staleTime: 60_000 })),
  });

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: "บัญชีของฉัน", href: "/customer/account" }, { label: "ประวัติพรีออเดอร์" }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <AccountSideMenu />
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <header className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center">
              <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-stone-800 sm:text-2xl">
                <CalendarClock className="h-6 w-6 text-[#4A342E]" aria-hidden="true" /> ประวัติพรีออเดอร์
              </h1>
              <label className="flex items-center gap-2 self-start text-xs font-medium text-stone-600 sm:self-auto sm:text-sm">
                แสดงตามสถานะ:
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value as OrderStatus | "all");
                    setPage(1);
                  }}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#4A342E]/30 sm:text-sm"
                >
                  {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </label>
            </header>

            {listQ.isLoading ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center text-sm text-stone-500">กำลังโหลดประวัติพรีออเดอร์...</p>
            ) : listQ.isError ? (
              <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">โหลดประวัติพรีออเดอร์ไม่สำเร็จ กรุณารีเฟรชหน้านี้</p>
            ) : preorders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center">
                <CalendarClock className="h-8 w-8 text-stone-300" aria-hidden="true" />
                <p className="m-0 text-sm font-medium text-stone-500">{filter === "all" ? "ยังไม่มีพรีออเดอร์" : "ยังไม่มีพรีออเดอร์ในหมวดนี้"}</p>
                {filter === "all" && <Link href="/customer/preorder" className={shopButton}>ดูรอบพรีออเดอร์</Link>}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {preorders.map((p, i) => <PreorderCard key={p._id} preorder={p} detail={details[i]?.data ?? null} />)}
              </div>
            )}

            {pages > 1 && (
              <nav className="flex items-center justify-center gap-3 text-sm" aria-label="เปลี่ยนหน้า">
                <button type="button" className={shopButton} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>ก่อนหน้า</button>
                <span className="text-stone-600">หน้า {page} / {pages}</span>
                <button type="button" className={shopButton} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>ถัดไป</button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreorderCard({ preorder: p, detail }: { preorder: ShopPreorder; detail: ShopPreorder | null }) {
  const [expanded, setExpanded] = useState(false);
  const items = detail?.items ?? [];
  const shown = expanded ? items : items.slice(0, 1);
  const extra = items.length - 1;
  const unpaid = p.order_status !== "cancelled" && (p.payment_status === "pending" || p.payment_status === "failed");
  const href = `/customer/account/preorders/${p._id}`;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-2 border-b border-stone-100 pb-4 sm:flex-row sm:items-start">
        <div>
          <span className="block text-sm font-semibold text-stone-800">พรีออเดอร์ #{p.preorder_no}</span>
          <span className="block text-xs text-stone-500">
            {p.round?.round_name ?? "-"} · สั่งเมื่อ {new Date(p.created_at).toLocaleString("th-TH")}
          </span>
        </div>
        <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_TONE[p.order_status]}`}>{ORDER_STATUS_LABEL[p.order_status]}</span>
      </div>

      <div className="flex flex-col gap-3">
        {!detail ? (
          <div className="h-16 animate-pulse rounded-lg bg-stone-100" aria-label="กำลังโหลดรายการสินค้า" />
        ) : (
          shown.map((it) => (
            <div key={it._id} className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#FAF6F0] text-[#8C5A3C]">
                <CakeSlice className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 truncate text-sm font-semibold text-stone-800">{it.product_name || "สินค้า"}</p>
                  {it.variant_name && <p className="m-0 text-xs text-stone-400">ตัวเลือก: {it.variant_name}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-right">
                  <span className="text-xs text-stone-400">×{it.quantity}</span>
                  <span className="text-sm font-semibold text-stone-800">{baht(it.total_price)}</span>
                </div>
              </div>
            </div>
          ))
        )}
        {extra > 0 && (
          <button type="button" onClick={() => setExpanded((v) => !v)}
            className="w-full rounded-lg border border-dashed border-stone-200 py-2 text-xs text-stone-500 transition hover:bg-stone-50 hover:text-[#4A342E]">
            {expanded ? "▲ ซ่อนรายการ" : `▼ ดูเพิ่มเติม (อีก ${extra} รายการ)`}
          </button>
        )}
      </div>

      <div className="flex flex-col justify-between gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center">
        <div className="space-y-0.5">
          <p className="m-0 text-xs text-stone-500">
            {p.order_type === "takeaway"
              ? `รับเอง${p.pickup_date ? ` ${pickupDateText(p.pickup_date)}` : p.round ? ` ตั้งแต่ ${thaiDate(p.round.pickup_date)}` : ""}${p.pickup_point_name ? ` · ${p.pickup_point_name}` : ""}`
              : "จัดส่งตามที่อยู่ผู้รับ"}
          </p>
          <span className="block text-sm font-bold text-stone-800">ยอดรวม: {baht(p.total_amount)}</span>
          {unpaid && (
            <span className={`block text-xs font-medium ${p.has_payment && p.payment_status !== "failed" ? "text-amber-600" : "text-red-500"}`}>
              {p.payment_status === "failed" ? "สลิปไม่ผ่านการตรวจสอบ กรุณาอัปโหลดใหม่" : p.has_payment ? "ส่งสลิปแล้ว รอร้านตรวจสอบ" : `ยังไม่ได้ชำระเงิน${p.payment_due_at ? ` · ภายใน ${thaiDate(p.payment_due_at, true)}` : ""}`}
            </span>
          )}
          {p.order_status === "cancelled" && p.payment_status === "paid" && <span className="block text-xs font-medium text-amber-600">รอร้านโอนเงินคืน</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unpaid && <Link href={href} className={actionLink}>{p.has_payment ? "ชำระเงิน / อัปโหลดสลิปใหม่" : "ชำระเงิน / อัปโหลดสลิป"}</Link>}
          <Link href={href} className={actionLink}>ดูรายละเอียด</Link>
        </div>
      </div>
    </article>
  );
}
