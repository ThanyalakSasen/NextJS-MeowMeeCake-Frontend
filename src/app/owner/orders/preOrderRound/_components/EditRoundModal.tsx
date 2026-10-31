"use client";
// แก้ชื่อ/ช่วงเวลาของรอบ — เฉพาะ round_name/open_date/close_date/pickup_date (backend อนุญาตแค่นี้ —
// ดู schemas/preorderRound.ts updateRoundBody) ปิดใช้งานถ้ารอบ closed/cancelled แล้ว (ดู VM.editRoundOpen ที่ RoundDetailContent)
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { Form, FormItem, useAntForm, useFormValid, Input, DatePicker } from "@/components/base";
import { alert } from "@/lib/alert";
import type { PreorderRound, UpdateRoundInput } from "@/types/preorderRound";
import { modalButtonIcons } from "@/components/shared/actions";
import { notBeforeRule, roundDatesError, roundDatesPayload } from "./roundDates";

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
  // ปุ่มบันทึกกดได้เมื่อทุกช่องผ่าน rules (required + รูปแบบ) — ผู้ใช้ขอ 2026-10-31
  const valid = useFormValid(form);

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
    const err = roundDatesError(v);
    if (err) {
      alert.warning(t(err));
      return;
    }
    onSubmit({ round_name: v.round_name.trim(), ...roundDatesPayload(v) });
  };

  return (
    <Modal
      open={open}
      title={t("preorderRound.editTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons("save")}
      okButtonProps={{ ...modalButtonIcons("save").okButtonProps, disabled: !valid }}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      width={520}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <FormItem
          name="round_name"
          label={t("preorderRound.fieldRoundName")}
          rules={[{ required: true, whitespace: true, message: t("validation.required") }]}
        >
          <Input maxLength={200} />
        </FormItem>
        <div className="grid grid-cols-3 gap-3">
          <FormItem name="open_date" label={t("preorderRound.fieldOpenDate")} rules={[{ required: true, message: t("validation.required") }]}>
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
          <FormItem
            name="close_date"
            label={t("preorderRound.fieldCloseDate")}
            dependencies={["open_date"]}
            rules={[{ required: true, message: t("validation.required") }, notBeforeRule("open_date", t("preorderRound.openBeforeCloseRequired"))]}
          >
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
          <FormItem
            name="pickup_date"
            label={t("preorderRound.fieldPickupDate")}
            dependencies={["close_date"]}
            rules={[{ required: true, message: t("validation.required") }, notBeforeRule("close_date", t("preorderRound.pickupAfterCloseRequired"))]}
          >
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
        </div>
        <p className="-mt-2 text-xs text-gray-500">{t("preorderRound.closeDateHint")}</p>
      </Form>
    </Modal>
  );
}
