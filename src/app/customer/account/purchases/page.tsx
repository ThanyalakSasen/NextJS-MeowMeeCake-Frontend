"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/purchases — ประวัติการสั่งซื้อของฉัน (BACKLOG3-merge D1)
// ยกจาก FrontOffice src/app/customer/account/purchases/page.tsx — ต่างจากต้นแบบ:
//   - ต้นแบบดึงออเดอร์/รายการสินค้า "ของทุกคน" มากรองฝั่ง client · ที่นี่ใช้ GET /shop/orders (ของตัวเองเท่านั้น)
//     กรองสถานะ + แบ่งหน้าที่ server แล้วดึงรายการสินค้าเฉพาะออเดอร์ที่แสดงอยู่ (list ของ backend ไม่ส่ง items มา)
//   - snapshot สินค้าในออเดอร์ไม่มีรูป → แสดงไอคอนแทน
//   - ปุ่มรีวิวสินค้า (D7) → purchases/[id]/review (ติ๊กรายการที่จะรีวิวในหน้าเดียว แทน ?next= / ?mode=combined ของต้นแบบ)
// ชำระเงิน / แนบสลิป / ยกเลิก อยู่ในหน้ารายละเอียด (/customer/account/purchases/[id])
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useQueries, useQuery, keepPreviousData } from "@tanstack/react-query";
import { ShoppingBag, CakeSlice } from "lucide-react";
import { shopOrdersService, type ShopOrder } from "@/services/shopOrders";
import type { OrderStatus } from "@/constants/enumConfig";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import AccountSideMenu from "@/components/customer/AccountSideMenu";
import { baht, shopButton, shopPage } from "@/components/customer/shopStyles";
import { shopOrderKey, shopOrdersKey } from "../../lib/shopQueries";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, pickupDateText } from "./orderLabels";
import ReviewLink from "../_components/ReviewLink";

const PAGE_SIZE = 10;
const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "คำสั่งซื้อทั้งหมด" },
  ...(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] })),
];
const actionLink =
  "whitespace-nowrap rounded-xl border border-[#8C5A3C]/30 bg-white px-4 py-2 text-xs font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#4A342E] hover:text-white";

export default function PurchasesPage() {
  return (
    <CustomerAuthGate message="กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ">
      <PurchasesContent />
    </CustomerAuthGate>
  );
}

function PurchasesContent() {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  const params = { page, limit: PAGE_SIZE, ...(filter === "all" ? {} : { order_status: filter }) };
  const listQ = useQuery({
    queryKey: [...shopOrdersKey, params],
    queryFn: () => shopOrdersService.list(params),
    placeholderData: keepPreviousData,
  });
  const orders = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // รายการสินค้าของออเดอร์ที่แสดงอยู่ — cache เดียวกับหน้ารายละเอียด (เปิดต่อไม่ต้องโหลดซ้ำ)
  const details = useQueries({
    queries: orders.map((o) => ({ queryKey: shopOrderKey(o._id), queryFn: () => shopOrdersService.get(o._id), staleTime: 60_000 })),
  });

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: "บัญชีของฉัน", href: "/customer/account" }, { label: "ประวัติการสั่งซื้อ" }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <AccountSideMenu />
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <header className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center">
              <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-stone-800 sm:text-2xl">
                <ShoppingBag className="h-6 w-6 text-[#4A342E]" aria-hidden="true" />
                ประวัติการสั่งซื้อของฉัน
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
              <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center text-sm text-stone-500">กำลังโหลดประวัติการสั่งซื้อ...</p>
            ) : listQ.isError ? (
              <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">โหลดประวัติการสั่งซื้อไม่สำเร็จ กรุณารีเฟรชหน้านี้</p>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center">
                <ShoppingBag className="h-8 w-8 text-stone-300" aria-hidden="true" />
                <p className="m-0 text-sm font-medium text-stone-500">
                  {filter === "all" ? "ยังไม่มีคำสั่งซื้อ" : "ยังไม่มีคำสั่งซื้อในหมวดนี้"}
                </p>
                {filter === "all" && <Link href="/customer/product" className={shopButton}>เลือกซื้อสินค้า</Link>}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((o, i) => (
                  <OrderCard key={o._id} order={o} detail={details[i]?.data ?? null} />
                ))}
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

function OrderCard({ order, detail }: { order: ShopOrder; detail: ShopOrder | null }) {
  const [expanded, setExpanded] = useState(false);
  const items = detail?.items ?? [];
  const shown = expanded ? items : items.slice(0, 1);
  const extra = items.length - 1;
  const unpaid = order.order_status !== "cancelled" && (order.payment_status === "pending" || order.payment_status === "failed");
  const href = `/customer/account/purchases/${order._id}`;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-2 border-b border-stone-100 pb-4 sm:flex-row sm:items-start">
        <div>
          <span className="block text-sm font-semibold text-stone-800">คำสั่งซื้อ #{order.order_no}</span>
          <span className="block text-xs text-stone-500">สั่งซื้อเมื่อ: {new Date(order.created_at).toLocaleString("th-TH")}</span>
        </div>
        <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_TONE[order.order_status]}`}>
          {ORDER_STATUS_LABEL[order.order_status]}
        </span>
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
                  {it.product_name_eng && <p className="m-0 truncate text-xs text-stone-400">{it.product_name_eng}</p>}
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
          <button
            type="button"
            className="w-full rounded-lg border border-dashed border-stone-200 py-2 text-xs text-stone-500 transition hover:bg-stone-50 hover:text-[#4A342E]"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "▲ ซ่อนรายการ" : `▼ ดูเพิ่มเติม (อีก ${extra} รายการ)`}
          </button>
        )}
      </div>

      <div className="flex flex-col justify-between gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center">
        <div className="space-y-0.5">
          <p className="m-0 text-xs text-stone-500">{order.order_type === "takeaway" ? "รับสินค้าด้วยตนเอง" : "จัดส่งตามที่อยู่ผู้รับ"}</p>
          {order.order_type === "takeaway" && (order.pickup_date || order.pickup_point_name) && (
            <p className="m-0 text-xs text-stone-700">
              นัดรับ{order.pickup_date ? ` ${pickupDateText(order.pickup_date)}` : ""}
              {order.pickup_point_name ? ` · ${order.pickup_point_name}` : ""}
            </p>
          )}
          <span className="block text-sm font-bold text-stone-800">ยอดรวม: {baht(order.total_amount)}</span>
          {unpaid && (
            <span className={`block text-xs font-medium ${order.has_payment && order.payment_status !== "failed" ? "text-amber-600" : "text-red-500"}`}>
              {order.payment_status === "failed"
                ? "สลิปไม่ผ่านการตรวจสอบ กรุณาอัปโหลดใหม่"
                : order.has_payment
                  ? "ส่งสลิปแล้ว รอร้านตรวจสอบ"
                  : "ยังไม่ได้ชำระเงิน"}
            </span>
          )}
          {order.order_status === "cancelled" && order.payment_status === "paid" && (
            <span className="block text-xs font-medium text-amber-600">รอร้านโอนเงินคืน</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unpaid && <Link href={href} className={actionLink}>{order.has_payment ? "ชำระเงิน / อัปโหลดสลิปใหม่" : "ชำระเงิน / อัปโหลดสลิป"}</Link>}
          <ReviewLink kind="order" doc={order} itemIds={detail?.items.map((it) => it._id)} href={`${href}/review`} className={actionLink} />
          <Link href={href} className={actionLink}>ดูรายละเอียด</Link>
        </div>
      </div>
    </article>
  );
}
