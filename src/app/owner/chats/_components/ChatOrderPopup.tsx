"use client";
// ─────────────────────────────────────────────────────────────
// ป๊อปอัปรายละเอียดคำสั่งซื้อ/พรีออเดอร์ที่ลูกค้าแนบในแชท — เปิดทับหน้าแชท ไม่ต้องออกจากห้อง (ผู้ใช้เลือก 2026-10-27)
// ใช้เนื้อหาเดียวกับป๊อปอัปของหน้า Manage Orders / รอบพรีออเดอร์ (OrderDetailContent / PreorderDetailContent) แบบดูอย่างเดียว
// ทำรายการ (ตรวจสลิป · เปลี่ยนสถานะ · จัดส่ง · คืนเงิน) → ปุ่ม "เปิดหน้าจัดการคำสั่งซื้อ" ไปหน้าเต็ม (ลิงก์เดิม)
// ไม่มีสิทธิ์ดูคำสั่งซื้อ = backend ตอบ 403 → แสดงข้อความ + ปุ่มลิงก์เดิม
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/base";
import { DetailModal } from "@/components/shared/feedback";
import { usePermission } from "@/context/PermissionsContext";
import { ordersService } from "@/services/orders";
import { preordersService } from "@/services/preorders";
import { paymentsService } from "@/services/payments";
import { isApiError } from "@/types/api";
import type { ChatAttachment } from "@/types/chat";
import { OrderDetailContent } from "@/app/owner/orders/manageOrders/_components/OrderDetailContent";
import { PreorderDetailContent } from "@/app/owner/orders/preOrderRound/_components/PreorderDetailContent";
import { getNextOrderStatus, isFinalOrderStatus, paymentDueState } from "@/app/owner/orders/preOrderRound/preorderStatus";
import type { usePreOrderRoundViewModel } from "@/app/owner/orders/preOrderRound/usePreOrderRoundViewModel";
import { staffAttachmentHref } from "../useChatsViewModel";
import { actionIcon } from "@/components/shared/actions";

type PreorderVM = ReturnType<typeof usePreOrderRoundViewModel>;
const noop = () => undefined;

export function ChatOrderPopup({ attachment, onClose }: { attachment: ChatAttachment | null; onClose: () => void }) {
  const t = useTranslations();
  const paymentPerm = usePermission("payments");
  const id = attachment?.ref_id ?? null;
  const kind = attachment?.kind ?? null;

  const orderQ = useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => ordersService.get(id as string),
    enabled: kind === "order" && !!id,
    retry: (n, e) => !(isApiError(e) && [403, 404].includes(e.status)) && n < 2,
  });
  const preorderQ = useQuery({
    queryKey: ["preorders", "detail", id],
    queryFn: () => preordersService.get(id as string),
    enabled: kind === "preorder" && !!id,
    retry: (n, e) => !(isApiError(e) && [403, 404].includes(e.status)) && n < 2,
  });
  const paymentQ = useQuery({
    queryKey: ["payments", kind === "order" ? "by-order" : "by-preorder", id],
    queryFn: () => (kind === "order" ? paymentsService.listByOrder(id as string) : paymentsService.listByPreorder(id as string)),
    enabled: !!id && !!kind && paymentPerm.view,
  });

  const detailQ = kind === "order" ? orderQ : preorderQ;
  const payments = paymentQ.data?.data ?? [];
  const payment = payments[0] ?? null;
  const paidPayment = payments.find((p) => p.status === "paid") ?? null;
  const order = orderQ.data?.data ?? null;
  const preorder = preorderQ.data?.data ?? null;

  const forbidden = isApiError(detailQ.error) && detailQ.error.status === 403;
  const title = attachment
    ? kind === "order"
      ? t("orders.drawerTitle", { no: attachment.doc_no })
      : t("preorderRound.orderDrawerTitle", { no: attachment.doc_no })
    : "";

  return (
    <DetailModal
      open={!!attachment}
      title={title}
      onClose={onClose}
      size={640}
      footer={
        attachment && (
          <div className="flex justify-end gap-2">
            <Button icon={actionIcon("cancel")} onClick={onClose}>{t("common.close")}</Button>
            <Link href={staffAttachmentHref(attachment)}>
              <Button icon={actionIcon("external")} type="primary">{t("chat.openOrderPage")}</Button>
            </Link>
          </div>
        )
      }
    >
      {detailQ.isLoading && <p className="py-10 text-center text-gray-500">{t("common.loading")}</p>}
      {detailQ.isError && (
        <p className="py-10 text-center text-gray-500">{forbidden ? t("chat.noOrderPermission") : t("orders.orderNotFound")}</p>
      )}
      {kind === "order" && order && (
        <OrderDetailContent
          order={order}
          payment={payment}
          // ดูอย่างเดียวในแชท — ทำรายการที่หน้าจัดการคำสั่งซื้อ
          canViewPayment={paymentPerm.view}
          canApprovePayment={false}
          canRefundPayment={false}
          verifyingPayment={false}
          onVerifyPayment={noop}
          onRejectPayment={noop}
          canUpdateDelivery={false}
          savingDelivery={false}
          onSaveDelivery={noop}
          paidPaymentId={paidPayment?._id ?? null}
          refunding={false}
          onRefund={noop}
          canMarkReady={false}
          markingReady={false}
          onMarkReady={noop}
          canMarkShipped={false}
          markingShipped={false}
          onMarkShipped={noop}
        />
      )}
      {kind === "preorder" && preorder && (
        <PreorderDetailContent
          {...({
            perm: { view: true, create: false, update: false, delete: false, approve: false },
            canViewPayment: paymentPerm.view,
            canApprovePayment: false,
            canRefundPayment: false,
            selectedPayment: payment,
            paidPayment,
            verifyingPayment: false,
            savingDelivery: false,
            markingShipped: false,
            refunding: false,
            isFinalOrderStatus,
            getNextOrderStatus,
            paymentDueState,
            onAdvanceOrderStatus: noop,
            onCancelOrder: noop,
            onApprovePayment: noop,
            onRejectPayment: noop,
            onSaveDelivery: noop,
            onMarkShipped: noop,
            onRefund: noop,
          } as unknown as PreorderVM)}
          order={preorder}
        />
      )}
    </DetailModal>
  );
}
