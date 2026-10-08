"use client";
// /customer/account/preorders/[id]/success — สั่งพรีออเดอร์สำเร็จ (BACKLOG4 U8) · เนื้อหาอยู่ใน _components/OrderSuccess
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import OrderSuccess from "../../../_components/OrderSuccess";

export default function PreorderSuccessPage() {
  const t = useTranslations("shop.preorders");
  const { id } = useParams<{ id: string }>();
  return (
    <CustomerAuthGate message={t("loginToViewOne")}>
      <OrderSuccess kind="preorder" id={id ?? ""} />
    </CustomerAuthGate>
  );
}
