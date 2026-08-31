"use client";
import { Popconfirm } from "antd";
import { useTranslations } from "next-intl";
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
      okButtonProps={{ danger: true }}
      onConfirm={onConfirm}
    >
      {children}
    </Popconfirm>
  );
}
