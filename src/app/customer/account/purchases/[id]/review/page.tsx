"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/purchases/[id]/review — เขียนรีวิวสินค้าในออเดอร์ (BACKLOG3-merge D7 · แทน FrontOffice account/pendingreview/[id])
// รีวิวได้เมื่อ completed + ชำระแล้ว · ฟอร์มอยู่ที่ account/_components/WriteReviewForm (ใช้ร่วมกับพรีออเดอร์)
// ─────────────────────────────────────────────────────────────
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { shopOrdersService } from "@/services/shopOrders";
import { isApiError } from "@/types/api";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { shopPage } from "@/components/customer/shopStyles";
import WriteReviewForm, { ReviewLoading, ReviewNotice } from "../../../_components/WriteReviewForm";
import { canReview } from "../../../../hooks/useReviewedItems";
import { shopOrderKey } from "../../../../lib/shopQueries";

const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

export default function OrderReviewPage() {
  const t = useTranslations("shop.orders");
  return (
    <CustomerAuthGate message={t("loginToReview")}>
      <OrderReviewContent />
    </CustomerAuthGate>
  );
}

function OrderReviewContent() {
  const t = useTranslations("shop.orders");
  const { id } = useParams<{ id: string }>();
  const validId = isObjectId(id ?? "");
  const orderQ = useQuery({
    queryKey: shopOrderKey(id),
    queryFn: () => shopOrdersService.get(id),
    enabled: validId,
    retry: (count, e) => !(isApiError(e) && [403, 404].includes(e.status)) && count < 2,
  });
  const order = orderQ.data;
  const backHref = `/customer/account/purchases/${id}`;

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb
          items={[
            { label: t("myAccount"), href: "/customer/account" },
            { label: t("history"), href: "/customer/account/purchases" },
            { label: order?.order_no ?? t("order"), href: backHref },
            { label: t("reviewProducts") },
          ]}
          className="!mb-0"
        />
        {validId && orderQ.isLoading ? (
          <ReviewLoading />
        ) : !order ? (
          <ReviewNotice text={t("notFound")} href="/customer/account/purchases" link={t("viewAll")} />
        ) : !canReview(order) ? (
          <ReviewNotice text={t("reviewOnlyCompleted")} href={backHref} link={t("backToDetail")} />
        ) : (
          <WriteReviewForm kind="order" docNo={order.order_no} items={order.items} backHref={backHref} />
        )}
      </div>
    </div>
  );
}
