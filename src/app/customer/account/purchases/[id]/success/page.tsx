"use client";
// /customer/account/purchases/[id]/success — สั่งซื้อสำเร็จ (BACKLOG4 U8) · เนื้อหาอยู่ใน _components/OrderSuccess
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import OrderSuccess from "../../../_components/OrderSuccess";

export default function OrderSuccessPage() {
  const t = useTranslations("shop.orders");
  const { id } = useParams<{ id: string }>();
  return (
    <CustomerAuthGate message={t("loginToViewOne")}>
      <OrderSuccess kind="order" id={id ?? ""} />
    </CustomerAuthGate>
  );
}
