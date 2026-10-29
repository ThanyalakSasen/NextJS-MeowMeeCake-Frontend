"use client";
// เปิดรอบที่ปิดแล้วกลับ (closed → open) — backend ให้ทำได้เฉพาะรอบที่ยังไม่มีใบสั่งผลิต และวันปิดรับต้องอยู่ในอนาคต
// (ไม่งั้นตัวตั้งเวลาปิดรอบซ้ำทันที) จึงให้เลือกวันปิดรับใหม่ได้ระหว่างวันนี้ถึงวันรับสินค้า
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { Form, FormItem, useAntForm, DatePicker } from "@/components/base";
import type { PreorderRound } from "@/types/preorderRound";
import { modalButtonIcons } from "@/components/shared/actions";

export function ReopenRoundModal({
  open,
  round,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  round: PreorderRound;
  saving: boolean;
  onClose: () => void;
  onSubmit: (closeDate: string) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<{ close_date: Dayjs }>();
  const pickup = dayjs(round.pickup_date);

  useEffect(() => {
    if (!open) return;
    const oldClose = dayjs(round.close_date);
    form.setFieldsValue({ close_date: oldClose.isAfter(dayjs()) ? oldClose : undefined });
  }, [open, round, form]);

  const handleOk = async () => {
    const { close_date } = await form.validateFields();
    // ปิดรับตอนสิ้นวันที่เลือก (ไม่เกินวันรับสินค้า) — วันนี้ก็ยังเปิดรับได้ถึงเที่ยงคืน
    const end = close_date.endOf("day");
    onSubmit((end.isAfter(pickup) ? pickup : end).toISOString());
  };

  return (
    <Modal
      open={open}
      title={t("preorderRound.reopenTitle", { name: round.round_name })}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons("save")}
      okText={t("preorderRound.reopenRound")}
      cancelText={t("common.cancel")}
      width={440}
      destroyOnHidden
    >
      <p className="mb-4 text-sm text-gray-600">{t("preorderRound.reopenHint")}</p>
      <Form form={form} layout="vertical">
        <FormItem
          name="close_date"
          label={t("preorderRound.reopenCloseDate")}
          rules={[{ required: true, whitespace: true, message: t("validation.required") }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            className="w-full"
            disabledDate={(d) => d.isBefore(dayjs(), "day") || d.isAfter(pickup, "day")}
          />
        </FormItem>
      </Form>
    </Modal>
  );
}
