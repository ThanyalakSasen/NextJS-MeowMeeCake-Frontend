"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/preorders/[id]/review — เขียนรีวิวสินค้าในพรีออเดอร์ (BACKLOG3-merge D7 · แทน FrontOffice
// account/pendingreview/[id]?kind=preorder) · รีวิวได้เมื่อ completed + ชำระแล้ว · ส่ง preorder_item_ids
// ─────────────────────────────────────────────────────────────
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { shopPreordersService } from "@/services/shopPreorders";
import { isApiError } from "@/types/api";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { shopPage } from "@/components/customer/shopStyles";
import WriteReviewForm, { ReviewLoading, ReviewNotice } from "../../../_components/WriteReviewForm";
import { canReview } from "../../../../hooks/useReviewedItems";
import { shopPreorderKey } from "../../../../lib/shopQueries";

const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

export default function PreorderReviewPage() {
  return (
    <CustomerAuthGate message="กรุณาเข้าสู่ระบบเพื่อรีวิวสินค้า">
      <PreorderReviewContent />
    </CustomerAuthGate>
  );
}

function PreorderReviewContent() {
  const { id } = useParams<{ id: string }>();
  const validId = isObjectId(id ?? "");
  const preorderQ = useQuery({
    queryKey: shopPreorderKey(id),
    queryFn: () => shopPreordersService.get(id),
    enabled: validId,
    retry: (count, e) => !(isApiError(e) && [403, 404].includes(e.status)) && count < 2,
  });
  const p = preorderQ.data;
  const backHref = `/customer/account/preorders/${id}`;

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb
          items={[
            { label: "บัญชีของฉัน", href: "/customer/account" },
            { label: "ประวัติพรีออเดอร์", href: "/customer/account/preorders" },
            { label: p?.preorder_no ?? "พรีออเดอร์", href: backHref },
            { label: "รีวิวสินค้า" },
          ]}
          className="!mb-0"
        />
        {validId && preorderQ.isLoading ? (
          <ReviewLoading />
        ) : !p ? (
          <ReviewNotice text="ไม่พบพรีออเดอร์นี้" href="/customer/account/preorders" link="ดูพรีออเดอร์ทั้งหมด" />
        ) : !canReview(p) ? (
          <ReviewNotice text="รีวิวได้เมื่อพรีออเดอร์เสร็จสิ้นและชำระเงินแล้ว" href={backHref} link="กลับไปหน้ารายละเอียด" />
        ) : (
          <WriteReviewForm kind="preorder" docNo={p.preorder_no} items={p.items} backHref={backHref} />
        )}
      </div>
    </div>
  );
}
