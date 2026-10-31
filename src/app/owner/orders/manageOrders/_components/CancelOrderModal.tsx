"use client";
// ยืนยันยกเลิกออเดอร์ + กรอกเหตุผล (TC-ADM-42) — ใช้ทั้งปุ่ม "ยกเลิกออเดอร์" ในตาราง และตอนเลือก "ยกเลิก" จาก dropdown สถานะ
// ออเดอร์ที่ชำระแล้ว: แจ้งว่าจะเป็น "รอโอนคืน" — backend ไม่ตั้งคืนเงินให้อัตโนมัติ ร้านโอนแล้วกดยืนยันเองในรายละเอียดออเดอร์
// parent ส่ง key={order._id} มาบังคับ remount ทุกครั้งที่เปลี่ยนออเดอร์ (ฟอร์มเริ่มว่างเสมอ)
// ใช้กับพรีออเดอร์ด้วย (kind="preorder") — พรีออเดอร์ที่ชำระแล้ว backend บันทึกคืนเงินให้อัตโนมัติตอนยกเลิก ข้อความเตือนจึงต่างกัน
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import { Form, FormItem, useAntForm, useFormValid, TextArea } from "@/components/base";
import { modalButtonIcons } from "@/components/shared/actions";
import { formatCurrency } from "@/i18n/format";
import type { Order } from "@/types/order";
import type { Preorder } from "@/types/preorder";

export function CancelOrderModal({
  order,
  kind = "order",
  saving,
  onClose,
  onConfirm,
}: {
  order: Order | Preorder | null;
  kind?: "order" | "preorder";
  saving: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [form] = useAntForm<{ reason: string }>();
  // ปุ่มยืนยันกดได้เมื่อทุกช่องผ่าน rules — ผู้ใช้ขอ 2026-10-31
  const valid = useFormValid(form);

  const isPreorder = kind === "preorder";
  const no = !order ? "" : "preorder_no" in order ? order.preorder_no : order.order_no;

  const handleOk = async () => {
    const v = await form.validateFields();
    onConfirm(v.reason.trim());
  };

  return (
    <Modal
      open={!!order}
      title={order ? t(isPreorder ? "preorderRound.cancelOrderTitle" : "orders.cancelTitle", { no }) : ""}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      cancelButtonProps={modalButtonIcons("cancelAction").cancelButtonProps}
      okButtonProps={{ ...modalButtonIcons("cancelAction").okButtonProps, danger: true, disabled: !valid }}
      okText={t("orders.cancel")}
      cancelText={t("orders.keepOrder")}
      destroyOnHidden
    >
      {order?.payment_status === "paid" && (
        <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {t(isPreorder ? "preorderRound.cancelPaidNotice" : "orders.cancelPaidNotice", {
            amount: formatCurrency(order.total_amount, locale),
          })}
        </p>
      )}
      <Form form={form} layout="vertical">
        <FormItem
          name="reason"
          label={t("orders.cancelReasonField")}
          rules={[{ required: true, whitespace: true, message: t("orders.cancelReasonRequired") }]}
        >
          <TextArea rows={3} maxLength={300} showCount placeholder={t("orders.cancelReasonPlaceholder")} />
        </FormItem>
      </Form>
    </Modal>
  );
}
