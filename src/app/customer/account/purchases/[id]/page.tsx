"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/purchases/[id] — รายละเอียดออเดอร์ + ชำระเงิน (BACKLOG3-merge D1 · ย้ายมาจาก /customer/order/[id])
// path ตาม FrontOffice (ลิงก์ในกระดิ่ง/LINE ของ backend ชี้มาที่นี่ — G1) · รวม customer/payment + order/success + purchases/[id]
// ยกเลิกออเดอร์ (C4): POST /shop/orders/{id}/cancel — pending/confirmed เท่านั้น · ชำระแล้ว = รอร้านโอนคืน
// ?new=1 = เพิ่งสั่งจากหน้า checkout → แสดงแถบ "สั่งซื้อสำเร็จ"
// ชำระเงิน: ../../_components/SlipPaymentPanel (ใช้ร่วมกับพรีออเดอร์ D3) — QR พร้อมเพย์จาก backend + กำหนดชำระ 30 นาที + แนบสลิป
//   มีรายการชำระเงินที่ pending/failed อยู่แล้ว = แนบกับใบเดิม · ยังไม่มี = POST /shop/payments ก่อน
//   แล้ว POST /shop/payments/{id}/slip (multipart — backend PR #54)
// หมดเวลาแล้ว (late_upload) = แนบสลิปกับใบเดิมเพื่อเปิดออเดอร์กลับ (backend docs/customer-backend-merge.md §8.8)
// ─────────────────────────────────────────────────────────────
import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCheckCircle } from "react-icons/fa";
import { canCustomerCancel, shopOrdersService } from "@/services/shopOrders";
import { shopPaymentsService } from "@/services/shopPayments";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { baht, shopButton, shopButtonPrimary, shopCard, shopPage } from "@/components/customer/shopStyles";
import SlipPaymentPanel from "../../_components/SlipPaymentPanel";
import { shopOrderKey, shopOrderPaymentPageKey, shopOrdersKey } from "../../../lib/shopQueries";
import { DELIVERY_STATUS_LABEL, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, pickupDateText } from "../orderLabels";

const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

export default function OrderPage() {
  return (
    <CustomerAuthGate message="กรุณาเข้าสู่ระบบเพื่อดูคำสั่งซื้อ">
      {/* useSearchParams ต้องอยู่ใต้ Suspense (ไม่งั้น next build error) */}
      <Suspense fallback={null}>
        <OrderContent />
      </Suspense>
    </CustomerAuthGate>
  );
}

function OrderContent() {
  const { id } = useParams<{ id: string }>();
  const isNew = useSearchParams().get("new") === "1";
  const validId = isObjectId(id ?? "");

  const orderQ = useQuery({
    queryKey: shopOrderKey(id),
    queryFn: () => shopOrdersService.get(id),
    enabled: validId,
    retry: (count, e) => !(isApiError(e) && [403, 404].includes(e.status)) && count < 2,
  });
  const paymentQ = useQuery({
    queryKey: shopOrderPaymentPageKey(id),
    queryFn: () => shopPaymentsService.orderPaymentPage(id),
    enabled: validId && orderQ.isSuccess,
  });
  const qc = useQueryClient();
  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: shopOrderPaymentPageKey(id) });
    void qc.invalidateQueries({ queryKey: shopOrderKey(id) });
  }, [qc, id]);

  if (validId && (orderQ.isLoading || paymentQ.isLoading)) {
    return (
      <div className={`${shopPage} flex items-center justify-center`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8C5A3C]/20 border-t-[#8C5A3C]" aria-label="กำลังโหลด" />
      </div>
    );
  }

  const order = orderQ.data;
  if (!validId || !order) {
    return (
      <div className={`${shopPage} flex items-center justify-center px-4`}>
        <div className={`${shopCard} w-full max-w-md space-y-4 text-center`}>
          <h2 className="text-lg font-bold">ไม่พบคำสั่งซื้อนี้</h2>
          <Link href="/customer" className={`${shopButtonPrimary} w-full`}>
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb
          items={[
            { label: "บัญชีของฉัน", href: "/customer/account" },
            { label: "ประวัติการสั่งซื้อ", href: "/customer/account/purchases" },
            { label: order.order_no },
          ]}
          className="!mb-0"
        />

        {isNew && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
            <FaCheckCircle className="shrink-0 text-2xl" />
            <div>
              <p className="font-bold">สั่งซื้อสำเร็จ</p>
              <p className="text-sm">กรุณาชำระเงินและแนบสลิปด้านล่าง เพื่อให้ร้านเริ่มเตรียมสินค้า</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
          <section className={`${shopCard} space-y-4 lg:col-span-3`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-gray-500">เลขที่คำสั่งซื้อ</p>
                <h1 className="text-xl font-extrabold">{order.order_no}</h1>
                <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString("th-TH")}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs font-semibold">
                <span className="rounded-full bg-[#8C5A3C]/10 px-2.5 py-1 text-[#8C5A3C]">{ORDER_STATUS_LABEL[order.order_status]}</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{PAYMENT_STATUS_LABEL[order.payment_status]}</span>
              </div>
            </div>

            {order.order_status === "cancelled" && order.cancelled_reason && (
              <p className="rounded-xl bg-stone-100 p-3 text-sm text-stone-600">เหตุผลที่ยกเลิก: {order.cancelled_reason}</p>
            )}
            {order.order_status === "cancelled" && order.payment_status === "paid" && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">ร้านกำลังดำเนินการโอนเงินคืน — หากมีคำถามกรุณาติดต่อร้าน</p>
            )}

            <div className="space-y-2 border-t border-[#8C5A3C]/10 pt-4">
              {order.items.map((it) => (
                <div key={it._id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    {it.product_name}
                    {it.variant_name ? ` (${it.variant_name})` : ""} <span className="text-gray-500">×{it.quantity}</span>
                    {it.selected_options.map((o) => (
                      <span key={o.option_name} className="block text-xs text-gray-500">
                        + {o.option_name}
                        {o.text_value ? `: "${o.text_value}"` : ""}
                      </span>
                    ))}
                  </span>
                  <span className="font-semibold">{baht(it.total_price)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 border-t border-[#8C5A3C]/10 pt-4 text-sm">
              <Row label="ยอดรวมสินค้า" value={baht(order.subtotal)} />
              <Row label="ค่าจัดส่ง" value={order.order_type === "takeaway" ? "รับที่ร้าน" : baht(order.delivery_fee)} />
              {order.discount_amount > 0 && <Row label="ส่วนลด" value={`-${baht(order.discount_amount)}`} />}
              <div className="flex items-baseline justify-between pt-2">
                <span className="font-bold">ยอดชำระ</span>
                <span className="text-2xl font-extrabold text-[#8C5A3C]">{baht(order.total_amount)}</span>
              </div>
            </div>

            {order.order_type === "takeaway" && (order.pickup_point_name || order.pickup_date) && (
              <div className="border-t border-[#8C5A3C]/10 pt-4 text-sm">
                <p className="mb-1 font-semibold">นัดรับสินค้า</p>
                <p className="text-gray-600">
                  {order.pickup_date ? pickupDateText(order.pickup_date) : ""}
                  {order.pickup_point_name ? ` · ${order.pickup_point_name}` : ""}
                </p>
              </div>
            )}

            {order.order_type === "delivery" && order.delivery_status && order.order_status !== "cancelled" && (
              <div className="border-t border-[#8C5A3C]/10 pt-4 text-sm">
                <p className="mb-1 font-semibold">สถานะจัดส่ง</p>
                <p className="text-gray-600">
                  {DELIVERY_STATUS_LABEL[order.delivery_status] ?? order.delivery_status}
                  {order.tracking_no ? ` · เลขพัสดุ ${order.tracking_no}` : ""}
                </p>
              </div>
            )}

            {order.order_type === "delivery" && order.delivery_address && (
              <div className="border-t border-[#8C5A3C]/10 pt-4 text-sm">
                <p className="mb-1 font-semibold">ที่อยู่จัดส่ง</p>
                <p>
                  {order.delivery_address.recipient_name} · {order.delivery_address.recipient_phone}
                </p>
                <p className="text-gray-600">
                  {order.delivery_address.house_no} {order.delivery_address.sub_district} {order.delivery_address.district}{" "}
                  {order.delivery_address.province} {order.delivery_address.zip_code}
                </p>
              </div>
            )}
          </section>

          <section className={`${shopCard} space-y-4 lg:col-span-2`}>
            <h2 className="text-lg font-bold">การชำระเงิน</h2>
            {paymentQ.data ? (
              <SlipPaymentPanel kind="order" docId={order._id} page={paymentQ.data} fetchedAt={paymentQ.dataUpdatedAt} onChanged={refresh} />
            ) : (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">โหลดข้อมูลการชำระเงินไม่สำเร็จ กรุณารีเฟรชหน้านี้</p>
            )}
          </section>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/customer/account/purchases" className={shopButton}>
            ดูคำสั่งซื้อทั้งหมด
          </Link>
          <Link href="/customer/product" className={shopButton}>
            เลือกซื้อสินค้าต่อ
          </Link>
          {canCustomerCancel(order) && <CancelOrderButton orderId={order._id} orderNo={order.order_no} paid={order.payment_status === "paid"} />}
        </div>
      </div>
    </div>
  );
}

/** ยกเลิกออเดอร์ (C4) — ชำระแล้วยกเลิกได้ แต่ต้องรอร้านโอนคืน (แจ้งในหน้าต่างยืนยัน) */
function CancelOrderButton({ orderId, orderNo, paid }: { orderId: string; orderNo: string; paid: boolean }) {
  const qc = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => shopOrdersService.cancel(orderId),
    onSuccess: () => {
      alert.success(`ยกเลิกคำสั่งซื้อ ${orderNo} แล้ว`);
      qc.invalidateQueries({ queryKey: shopOrderKey(orderId) });
      qc.invalidateQueries({ queryKey: shopOrderPaymentPageKey(orderId) });
      qc.invalidateQueries({ queryKey: shopOrdersKey });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : "ยกเลิกคำสั่งซื้อไม่สำเร็จ"),
  });
  const onClick = async () => {
    const ok = await confirmAlert(
      paid
        ? "คำสั่งซื้อนี้ชำระเงินแล้ว — ยกเลิกแล้วร้านจะโอนเงินคืนให้ภายหลัง ยืนยันยกเลิกไหม?"
        : "ยืนยันยกเลิกคำสั่งซื้อนี้?",
      { title: `ยกเลิกคำสั่งซื้อ ${orderNo}`, confirmText: "ยกเลิกคำสั่งซื้อ", cancelText: "ไม่ยกเลิก", danger: true },
    );
    if (ok) cancel.mutate();
  };
  return (
    <button type="button" onClick={() => void onClick()} disabled={cancel.isPending}
      className="rounded-xl border border-red-600/30 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50">
      {cancel.isPending ? "กำลังยกเลิก..." : "ยกเลิกคำสั่งซื้อ"}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span className="font-semibold text-[#4A342E]">{value}</span>
    </div>
  );
}
