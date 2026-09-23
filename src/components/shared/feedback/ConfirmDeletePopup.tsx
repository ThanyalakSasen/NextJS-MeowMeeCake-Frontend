"use client";
import { Popconfirm } from "antd";
import { useTranslations } from "next-intl";
import { actionIcon } from "@/components/shared/actions";
/** ยืนยันก่อนลบ — ครอบปุ่ม/ไอคอนที่เป็น trigger */
export function ConfirmDeletePopup({
  onConfirm,
  title,
  children,
}: {
  onConfirm: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");
  return (
    <Popconfirm
      title={title ?? t("confirmDelete")}
      okText={t("delete")}
      cancelText={t("cancel")}
      // ปุ่มของ Popconfirm เป็นขนาด small เสมอ — ไอคอนชุดเดียวกับ DeleteButton / ปุ่ม Cancel ของ Modal
      okButtonProps={{ danger: true, icon: actionIcon("delete", "small") }}
      cancelButtonProps={{ icon: actionIcon("cancel", "small") }}
      onConfirm={onConfirm}
    >
      {children}
    </Popconfirm>
  );
}
