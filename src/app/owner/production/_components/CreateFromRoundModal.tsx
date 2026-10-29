"use client";
// สร้างใบสั่งผลิตจากรอบพรีออเดอร์ — เลือกรอบที่ "ปิดรับแล้ว" แล้วดูล่วงหน้าก่อนกดสร้าง (backend
// previewProductionFromRound ใช้ตัวรวมยอดชุดเดียวกับ createProductionFromRound ตัวเลขจึงตรงกับใบที่จะได้จริง):
// สินค้า/จำนวนที่จะผลิต · สูตรที่จะใช้ · ยอดของออเดอร์ที่ยังไม่ชำระ (ไม่นับ) · เหตุที่สร้างไม่ได้ (ปุ่มสร้างปิดไว้)
import { useEffect } from "react";
import Link from "next/link";
import { Modal } from "antd";
import { useTranslations, useLocale } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import { Form, FormItem, useAntForm, TextArea, Select, DatePicker, Tag } from "@/components/base";
import { LoadFailed } from "@/components/shared/feedback";
import { formatDate } from "@/i18n/format";
import type { PreorderRound } from "@/types/preorderRound";
import type { ProductionFromRoundPreview, ProductionOrderFromRoundInput } from "@/types/productionOrder";
import { modalButtonIcons } from "@/components/shared/actions";
import { sortOptionsThai } from "@/lib/thaiSort";
import { NOTICE_TAG } from "@/constants/enumConfig";

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
  roundsLoading,
  roundsWithProduction,
  roundId,
  onRoundChange,
  preview,
  previewLoading,
  previewError,
  onRetryPreview,
  staff,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  /** รอบที่ปิดรับแล้วทั้งหมด — รอบที่อยู่ใน roundsWithProduction โชว์ท้ายรายการแบบเลือกไม่ได้ */
  rounds: PreorderRound[];
  roundsLoading: boolean;
  roundsWithProduction: Set<string>;
  roundId: string | null;
  onRoundChange: (id: string | null) => void;
  preview: ProductionFromRoundPreview | null;
  previewLoading: boolean;
  previewError: boolean;
  onRetryPreview: () => void;
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

  const handleRoundChange = (id: string | undefined) => {
    onRoundChange(id ?? null);
    const round = rounds.find((r) => r._id === id);
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

  // preview ของรอบอื่นที่ค้างใน cache ระหว่างโหลดรอบใหม่ — ไม่ใช้
  const current = preview && preview.round._id === roundId ? preview : null;
  const canCreate = !!current && current.blockers.length === 0 && !previewLoading;
  const buttons = modalButtonIcons("add");

  const roundOptions = [...rounds]
    .sort((a, b) => Number(roundsWithProduction.has(a._id)) - Number(roundsWithProduction.has(b._id)))
    .map((r) => {
      const taken = roundsWithProduction.has(r._id);
      return {
        value: r._id,
        disabled: taken,
        label: (
          <span className="flex items-center justify-between gap-2">
            <span className="truncate">
              {r.round_name}{" "}
              <span className="text-gray-500">({t("production.roundPickupDate", { date: formatDate(r.pickup_date, locale) })})</span>
            </span>
            {taken && <Tag className="!m-0 shrink-0">{t("production.roundHasProduction")}</Tag>}
          </span>
        ),
        // ค้นด้วยชื่อรอบ (label เป็น ReactNode)
        searchText: r.round_name,
      };
    });

  return (
    <Modal
      open={open}
      title={t("production.createFromRoundTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      {...buttons}
      okButtonProps={{ ...buttons.okButtonProps, disabled: !canCreate }}
      okText={t("production.createSubmit")}
      cancelText={t("common.cancel")}
      width={640}
      destroyOnHidden
    >
      <p className="mb-4 text-sm text-gray-600">{t("production.createFromRoundHint")}</p>
      <Form form={form} layout="vertical">
        <FormItem
          name="round_id"
          label={t("production.fieldRound")}
          rules={[{ required: true, whitespace: true, message: t("validation.required") }]}
        >
          <Select
            showSearch
            allowClear
            loading={roundsLoading}
            placeholder={t("production.selectRound")}
            onChange={(v) => handleRoundChange(v as string | undefined)}
            notFoundContent={t("production.noEligibleRounds")}
            filterOption={(input, opt) => String(opt?.searchText ?? "").toLowerCase().includes(input.toLowerCase())}
            options={roundOptions}
          />
        </FormItem>

        <div className="mb-5">
          <PreviewPanel
            roundId={roundId}
            preview={current}
            loading={previewLoading}
            error={previewError}
            onRetry={onRetryPreview}
            onClose={onClose}
          />
        </div>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormItem
            name="production_date"
            label={t("production.fieldDate")}
            rules={[{ required: true, whitespace: true, message: t("validation.required") }]}
          >
            <DatePicker format="DD/MM/YYYY" className="w-full" />
          </FormItem>
          <FormItem name="assigned_to" label={t("production.fieldAssignee")}>
            <Select
              allowClear
              placeholder={t("production.assigneePlaceholder")}
              options={sortOptionsThai(staff.map((s) => ({ value: s._id, label: s.user_fullname })))}
            />
          </FormItem>
        </div>
        <FormItem name="production_note" label={t("production.fieldNote")}>
          <TextArea rows={2} placeholder={t("production.notePlaceholder")} />
        </FormItem>
      </Form>
    </Modal>
  );
}

/** สิ่งที่จะได้ถ้ากดสร้าง — ตาราง สินค้า | จะผลิต | ยังไม่ชำระ | สูตร + แถบเหตุที่สร้างไม่ได้/ยอดที่ไม่นับ */
function PreviewPanel({
  roundId,
  preview,
  loading,
  error,
  onRetry,
  onClose,
}: {
  roundId: string | null;
  preview: ProductionFromRoundPreview | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("production");

  if (!roundId) {
    return <p className="m-0 rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-600">{t("previewPick")}</p>;
  }
  if (error && !loading) {
    return <LoadFailed className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 py-6 text-center" onRetry={onRetry} size="small" />;
  }
  if (!preview) {
    return <p className="m-0 rounded-lg border border-gray-200 px-3 py-6 text-center text-sm text-gray-600">{t("previewLoading")}</p>;
  }

  const toProduce = preview.products.filter((p) => p.planned_qty > 0);
  const unpaidQty = preview.products.reduce((s, p) => s + p.unpaid_qty, 0);
  const showUnpaidCol = unpaidQty > 0;

  return (
    <div className={`flex flex-col gap-3 ${loading ? "opacity-60" : ""}`}>
      {preview.blockers.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <p className="m-0 font-semibold">{t("blockedTitle")}</p>
          {preview.blockers.map((b) => (
            <p key={b} className="m-0">
              • {t(`blocker.${b}`, { no: preview.existing_production?.production_no ?? "-" })}
              {b === "already_has_production" && preview.existing_production && (
                <>
                  {" "}
                  <Link
                    href={`/owner/production?id=${encodeURIComponent(preview.existing_production._id)}`}
                    onClick={onClose}
                    className="font-semibold underline"
                  >
                    {t("viewExisting")}
                  </Link>
                </>
              )}
            </p>
          ))}
        </div>
      )}

      {preview.products.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <p className="m-0 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-brown-800">
            {t("previewTitle", { n: toProduce.length, orders: preview.paid_order_count })}
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="px-3 py-1.5 font-medium">{t("colProduct")}</th>
                <th className="px-3 py-1.5 text-right font-medium">{t("colToProduce")}</th>
                {showUnpaidCol && <th className="px-3 py-1.5 text-right font-medium">{t("colUnpaid")}</th>}
                <th className="px-3 py-1.5 font-medium">{t("colRecipe")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {preview.products.map((p) => (
                <tr key={p.product_id} className={p.planned_qty === 0 ? "text-gray-500" : "text-gray-800"}>
                  <td className="px-3 py-1.5">{p.product_name_th}</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{p.planned_qty}</td>
                  {showUnpaidCol && <td className="px-3 py-1.5 text-right text-gray-600">{p.unpaid_qty || "-"}</td>}
                  <td className="px-3 py-1.5">
                    {p.recipe ? (
                      <span className="text-gray-700">{p.recipe.recipe_name}</span>
                    ) : p.planned_qty > 0 ? (
                      <Tag color={NOTICE_TAG.missingRecipe} className="!m-0">{t("noRecipe")}</Tag>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {preview.unpaid_order_count > 0 && (
        <p className="m-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("unpaidNotice", { n: preview.unpaid_order_count, qty: unpaidQty })}
        </p>
      )}
    </div>
  );
}
