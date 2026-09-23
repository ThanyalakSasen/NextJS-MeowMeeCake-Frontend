"use client";
// สร้างใบสั่งผลิตจากรอบพรีออเดอร์ — เลือกได้เฉพาะรอบที่ "ปิดรับแล้ว" และยังไม่มีใบสั่งผลิต (backend
// รวมยอดสั่งจริงจากพรีออเดอร์ในรอบนั้นให้อัตโนมัติทีเดียว ไม่ต้องเลือกสินค้าเอง — ดู
// productionOrderService.createProductionFromRound ฝั่ง backend)
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { Form, FormItem, useAntForm, TextArea, Select, DatePicker } from "@/components/base";
import { formatDate } from "@/i18n/format";
import type { PreorderRound } from "@/types/preorderRound";
import type { ProductionOrderFromRoundInput } from "@/types/productionOrder";
import { modalButtonIcons } from "@/components/shared/actions";

interface StaffOption { _id: string; user_fullname: string }

interface FormValues {
  round_id: string;
  production_date: Dayjs;
  assigned_to?: string;
  production_note?: string;
}

export function CreateFromRoundModal({
  open,
  rounds,
  staff,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  rounds: PreorderRound[];
  staff: StaffOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: ProductionOrderFromRoundInput) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [form] = useAntForm<FormValues>();

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleRoundChange = (roundId: string) => {
    const round = rounds.find((r) => r._id === roundId);
    if (round) form.setFieldValue("production_date", dayjs(round.pickup_date));
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    onSubmit({
      round_id: v.round_id,
      production_date: v.production_date.toISOString(),
      assigned_to: v.assigned_to ?? null,
      production_note: v.production_note?.trim() || null,
    });
  };

  return (
    <Modal
      open={open}
      title={t("production.createFromRoundTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...modalButtonIcons("add")}
      okText={t("production.createSubmit")}
      cancelText={t("common.cancel")}
      width={520}
      destroyOnHidden
    >
      <p className="mb-4 text-sm text-gray-500">{t("production.createFromRoundHint")}</p>
      <Form form={form} layout="vertical">
        <FormItem
          name="round_id"
          label={t("production.fieldRound")}
          rules={[{ required: true, message: t("validation.required") }]}
        >
          <Select
            placeholder={t("production.selectRound")}
            onChange={(v) => handleRoundChange(v as string)}
            notFoundContent={t("production.noEligibleRounds")}
            options={rounds.map((r) => ({
              value: r._id,
              label: `${r.round_name} (${t("production.roundPickupDate", { date: formatDate(r.pickup_date, locale) })})`,
            }))}
          />
        </FormItem>
        <FormItem
          name="production_date"
          label={t("production.fieldDate")}
          rules={[{ required: true, message: t("validation.required") }]}
        >
          <DatePicker format="DD/MM/YYYY" />
        </FormItem>
        <FormItem name="assigned_to" label={t("production.fieldAssignee")}>
          <Select
            allowClear
            placeholder={t("production.assigneePlaceholder")}
            options={staff.map((s) => ({ value: s._id, label: s.user_fullname }))}
          />
        </FormItem>
        <FormItem name="production_note" label={t("production.fieldNote")}>
          <TextArea rows={2} placeholder={t("production.notePlaceholder")} />
        </FormItem>
      </Form>
    </Modal>
  );
}
