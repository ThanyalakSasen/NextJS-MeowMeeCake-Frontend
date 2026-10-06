"use client";
// ─────────────────────────────────────────────────────────────
// ออเดอร์ของลูกค้า + ชำระเงิน — แทน FrontOffice customer/payment + customer/order/success
// (FrontOffice ใช้ลิงก์ชำระเงินแบบ token ใช้ครั้งเดียว — backend หลักไม่มี เลยรวมเป็นหน้าเดียวผูกกับ id ออเดอร์)
// ?new=1 = เพิ่งสั่งจากหน้า checkout → แสดงแถบ "สั่งซื้อสำเร็จ"
// ชำระเงิน: GET /shop/orders/{id}/payment (QR พร้อมเพย์จาก backend + กำหนดชำระ 30 นาที) → แนบสลิป:
//   มีรายการชำระเงินที่ pending/failed อยู่แล้ว = แนบกับใบเดิม · ยังไม่มี = POST /shop/payments ก่อน
//   แล้ว POST /shop/payments/{id}/slip (multipart — backend PR #54)
// หมดเวลาแล้ว (late_upload) = แนบสลิปกับใบเดิมเพื่อเปิดออเดอร์กลับ (backend docs/customer-backend-merge.md §8.8)
// ─────────────────────────────────────────────────────────────
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCheckCircle } from "react-icons/fa";
import { shopOrdersService } from "@/services/shopOrders";
import { shopPaymentsService, type ShopPaymentPage } from "@/services/shopPayments";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { baht, shopButton, shopButtonPrimary, shopCard, shopPage } from "@/components/customer/shopStyles";
import { shopOrderKey, shopOrderPaymentPageKey } from "../../lib/shopQueries";

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "รอดำเนินการ",
  confirmed: "ยืนยันแล้ว",
  preparing: "กำลังเตรียมสินค้า",
  ready: "พร้อมส่ง / พร้อมรับ",
  completed: "สำเร็จ",
  cancelled: "ยกเลิกแล้ว",
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "รอชำระ / รอตรวจสอบ",
  paid: "ชำระแล้ว",
  failed: "ชำระไม่สำเร็จ",
  refunded: "คืนเงินแล้ว",
};

const SLIP_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const SLIP_MAX_BYTES = 5 * 1024 * 1024;
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
        <CustomerBreadcrumb items={[{ label: `คำสั่งซื้อ ${order.order_no}` }]} className="!mb-0" />

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

            <div className="space-y-2 border-t border-[#8C5A3C]/10 pt-4">
              {order.items.map((it) => (
                <div key={it._id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    {it.product_name}
                    {it.variant_name ? ` (${it.variant_name})` : ""} <span className="text-gray-500">×{it.quantity}</span>
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
              <PaymentPanel orderId={order._id} page={paymentQ.data} fetchedAt={paymentQ.dataUpdatedAt} />
            ) : (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">โหลดข้อมูลการชำระเงินไม่สำเร็จ กรุณารีเฟรชหน้านี้</p>
            )}
          </section>
        </div>

        <div className="flex justify-center">
          <Link href="/customer/product" className={shopButton}>
            เลือกซื้อสินค้าต่อ
          </Link>
        </div>
      </div>
    </div>
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

/** วินาทีที่เหลือก่อนหมดเขตชำระ — ชดเชยนาฬิกาเครื่องลูกค้าด้วย server_time (null = ไม่มีกำหนด) */
function useSecondsLeft(page: ShopPaymentPage, fetchedAt: number): number | null {
  const [now, setNow] = useState(() => Date.now());
  const due = page.payment_due_at ? new Date(page.payment_due_at).getTime() : null;
  const offset = new Date(page.server_time).getTime() - fetchedAt;

  useEffect(() => {
    if (due === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [due]);

  return due === null ? null : Math.max(0, Math.floor((due - (now + offset)) / 1000));
}

const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

function PaymentPanel({ orderId, page, fetchedAt }: { orderId: string; page: ShopPaymentPage; fetchedAt: number }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const paid = page.payment_status === "paid" || page.payment_record_status === "paid";
  const awaitingReview = page.payment_record_status === "pending" && !!page.slip_url;
  const rejected = page.payment_record_status === "failed";
  // แนบกับรายการเดิมได้ (pending/failed) — หมดเวลาแล้วต้องแนบกับใบเดิมเท่านั้น (สร้างใบใหม่แบบไม่มีสลิป = 400)
  const reusablePaymentId =
    page.payment_id && (page.payment_record_status === "pending" || page.payment_record_status === "failed") ? page.payment_id : null;
  const canUpload = page.can_pay || (page.late_upload && !!reusablePaymentId);

  const secondsLeft = useSecondsLeft(page, fetchedAt);
  const showCountdown = page.can_pay && !awaitingReview && secondsLeft !== null;
  const expiredNow = showCountdown && secondsLeft === 0;

  // ครบกำหนดตอนเปิดหน้าอยู่ → ถาม backend ใหม่ (backend ยกเลิกออเดอร์ที่เลยกำหนดให้ตอนเปิดหน้าชำระเงิน)
  useEffect(() => {
    if (!expiredNow) return;
    qc.invalidateQueries({ queryKey: shopOrderPaymentPageKey(orderId) });
    qc.invalidateQueries({ queryKey: shopOrderKey(orderId) });
  }, [expiredNow, orderId, qc]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: shopOrderPaymentPageKey(orderId) });
    qc.invalidateQueries({ queryKey: shopOrderKey(orderId) });
  };

  const pickFile = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    if (f && !SLIP_TYPES.includes(f.type)) {
      alert.error("รองรับเฉพาะไฟล์รูป JPG, PNG, WEBP หรือ AVIF");
      f = null;
    } else if (f && f.size > SLIP_MAX_BYTES) {
      alert.error("ไฟล์สลิปต้องมีขนาดไม่เกิน 5 MB");
      f = null;
    }
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const uploadMutation = useMutation({
    mutationFn: async (slip: File) => {
      const paymentId = reusablePaymentId ?? (await shopPaymentsService.createForOrder(orderId, page.amount))._id;
      return shopPaymentsService.uploadSlip(paymentId, slip);
    },
    onSuccess: () => {
      alert.success(page.late_upload ? "ส่งสลิปแล้ว — เปิดคำสั่งซื้อกลับและรอร้านตรวจสอบ" : "ส่งสลิปแล้ว รอร้านตรวจสอบ");
      pickFile(null);
      refresh();
    },
    onError: (e) => {
      alert.error(isApiError(e) ? e.message : "ส่งสลิปไม่สำเร็จ กรุณาลองใหม่");
      // อาจมีรายการชำระเงินถูกสร้างไปแล้วก่อนอัปโหลดพัง — โหลดใหม่ให้รอบหน้าแนบกับใบเดิม
      refresh();
    },
  });

  if (paid) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4 text-green-800">
        <FaCheckCircle className="shrink-0 text-2xl" />
        <p className="text-sm font-semibold">ร้านได้รับการชำระเงินแล้ว ขอบคุณที่สั่งซื้อ</p>
      </div>
    );
  }

  if (page.late_upload && !reusablePaymentId) {
    // backend ยังไม่มีทางอัปโหลดสลิปโดยไม่มีรายการชำระเงิน (POST /shop/payments ไม่มีสลิป = 400) — docs/BACKLOG3-merge.md F1
    return (
      <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
        หมดเวลาชำระเงิน ระบบยกเลิกคำสั่งซื้อนี้แล้ว — หากโอนเงินไปแล้ว กรุณาติดต่อร้านพร้อมสลิปการโอน
      </p>
    );
  }

  if (!canUpload) {
    return (
      <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
        {page.blocked_reason ?? "คำสั่งซื้อนี้ชำระเงินไม่ได้แล้ว"} — กรุณาอย่าโอนเงินเข้าคำสั่งซื้อนี้
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {page.late_upload && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          หมดเวลาชำระเงินแล้ว — ถ้าโอนไปแล้ว แนบสลิปเพื่อขอเปิดคำสั่งซื้อกลับ (ต้องมีสินค้าเหลือพอ)
        </p>
      )}
      {awaitingReview && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">ส่งสลิปแล้ว รอร้านตรวจสอบ — แนบใหม่ได้ถ้าส่งรูปผิด</p>
      )}
      {rejected && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">สลิปล่าสุดตรวจสอบไม่ผ่าน กรุณาแนบสลิปใหม่</p>
      )}
      {showCountdown && (
        <p className={`rounded-xl p-3 text-center text-sm ${secondsLeft < 300 ? "bg-red-50 text-red-700" : "bg-[#FAF6F0] text-gray-700"}`}>
          กรุณาชำระและแนบสลิปภายใน <span className="font-mono text-base font-bold">{mmss(secondsLeft)}</span> นาที
        </p>
      )}

      {page.can_pay &&
        !awaitingReview &&
        (page.qr_image ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-[240px] w-[240px] items-center justify-center rounded-2xl border border-[#8C5A3C]/15 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.qr_image} alt="QR พร้อมเพย์" width={230} height={230} />
            </div>
            <p className="text-sm text-gray-600">สแกนจ่ายด้วยแอปธนาคาร (พร้อมเพย์)</p>
            {page.account_name && (
              <p className="text-sm">
                ชื่อบัญชี: <span className="font-semibold">{page.account_name}</span>
              </p>
            )}
            <p className="text-2xl font-extrabold text-[#8C5A3C]">{baht(page.amount)}</p>
          </div>
        ) : (
          <p className="rounded-xl bg-[#FAF6F0] p-3 text-sm text-gray-700">
            โอนยอด <span className="font-bold">{baht(page.amount)}</span> ตามช่องทางที่ร้านแจ้ง แล้วแนบสลิปด้านล่าง
          </p>
        ))}

      <div className="space-y-3 border-t border-[#8C5A3C]/10 pt-4">
        <label className="block text-sm font-semibold">
          {awaitingReview ? "แนบสลิปใหม่" : "แนบสลิปการโอน"}
          <input
            type="file"
            accept={SLIP_TYPES.join(",")}
            className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#8C5A3C]/10 file:px-3 file:py-2 file:font-semibold file:text-[#8C5A3C]"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            disabled={uploadMutation.isPending}
          />
        </label>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="ตัวอย่างสลิป" className="mx-auto max-h-64 rounded-xl border border-gray-200 object-contain" />
        )}
        <button
          type="button"
          className={`${shopButtonPrimary} w-full`}
          disabled={!file || uploadMutation.isPending || expiredNow}
          onClick={() => file && uploadMutation.mutate(file)}
        >
          {uploadMutation.isPending ? "กำลังส่งสลิป..." : "ส่งสลิป"}
        </button>
        <p className="text-center text-xs text-gray-500">รองรับ JPG, PNG, WEBP, AVIF ขนาดไม่เกิน 5 MB</p>
      </div>
    </div>
  );
}
