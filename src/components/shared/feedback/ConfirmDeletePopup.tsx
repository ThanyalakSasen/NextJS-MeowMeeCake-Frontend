"use client";
// ยืนยันก่อนลบ — ครอบปุ่มที่เป็น trigger (เช่น <DeleteButton />) กดแล้วเปิด modal ยืนยันการลบกลางจอ
// (confirmAlert variant "delete" → AlertHost) เดิมเป็น antd Popconfirm เล็ก ๆ ติดปุ่ม — props เหมือนเดิมทุกอย่าง
import { cloneElement, isValidElement, type MouseEvent, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { confirmAlert } from "@/lib/alert";

export function ConfirmDeletePopup({
  onConfirm,
  title,
  children,
}: {
  onConfirm: () => void;
  /** คำถามยืนยัน เช่น t("coupons.deleteConfirm", { code }) — ไม่ส่ง = "ยืนยันการลบรายการนี้?" */
  title?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  if (!isValidElement(children)) return children;

  const trigger = children as ReactElement<{ onClick?: (e: MouseEvent) => void }>;
  return cloneElement(trigger, {
    onClick: async (e: MouseEvent) => {
      trigger.props.onClick?.(e);
      const ok = await confirmAlert(title ?? t("common.confirmDelete"), {
        title: t("alert.titleDelete"),
        note: t("alert.deleteIrreversible"),
        confirmText: t("common.delete"),
        cancelText: t("common.cancel"),
        variant: "delete",
      });
      if (ok) onConfirm();
    },
  });
}
