"use client";
// แก้ชื่อ/ช่วงเวลาของรอบ — เฉพาะ round_name/open_date/close_date/pickup_date (backend อนุญาตแค่นี้ —
// ดู schemas/preorderRound.ts updateRoundBody) ปิดใช้งานถ้ารอบ closed/cancelled แล้ว (ดู VM.editRoundOpen ที่ RoundDetailContent)
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { Form, FormItem, useAntForm, Input, DatePicker } from "@/components/base";
import { alert } from "@/lib/alert";
import type { PreorderRound, UpdateRoundInput } from "@/types/preorderRound";

interface FormValues {
  round_name: string;
  open_date: Dayjs;
  close_date: Dayjs;
  pickup_date: Dayjs;
}

export function EditRoundModal({
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
  onSubmit: (v: UpdateRoundInput) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<FormValues>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        round_name: round.round_name,
        open_date: dayjs(round.open_date),
        close_date: dayjs(round.close_date),
        pickup_date: dayjs(round.pickup_date),
      });
    }
  }, [open, round, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    if (!v.open_date.isBefore(v.close_date)) {
      alert.error(t("preorderRound.openBeforeCloseRequired"));
      return;
    }
    if (v.pickup_date.isBefore(v.close_date)) {
      alert.error(t("preorderRound.pickupAfterCloseRequired"));
      return;
    }
    onSubmit({
      round_name: v.round_name.trim(),
      open_date: v.open_date.toISOString(),
      close_date: v.close_date.toISOString(),
      pickup_date: v.pickup_date.toISOString(),
    });
  };

  return (
    <Modal
      open={open}
      title={t("preorderRound.editTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      width={520}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <FormItem
          name="round_name"
          label={t("preorderRound.fieldRoundName")}
          rules={[{ required: true, message: t("validation.required") }]}
        >
          <Input />
        </FormItem>
        <div className="grid grid-cols-3 gap-3">
          <FormItem name="open_date" label={t("preorderRound.fieldOpenDate")} rules={[{ required: true, message: t("validation.required") }]}>
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
          <FormItem name="close_date" label={t("preorderRound.fieldCloseDate")} rules={[{ required: true, message: t("validation.required") }]}>
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
          <FormItem name="pickup_date" label={t("preorderRound.fieldPickupDate")} rules={[{ required: true, message: t("validation.required") }]}>
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
        </div>
      </Form>
    </Modal>
  );
}
