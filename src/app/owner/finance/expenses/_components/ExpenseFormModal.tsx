"use client";
// บันทึก/แก้ไขรายการค่าใช้จ่าย — antd Modal + base/Form
// แก้ไข modal ต้องพึ่ง parent ส่ง key={editTarget?._id ?? "new"} มาบังคับ remount ทุกครั้งที่เปลี่ยนเป้าหมาย
// (เหตุผลเต็มดู ComponentFormModal ของ Recipes)
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Form, FormItem, useAntForm, Input, TextArea, InputNumber, Select, DatePicker, Switch } from "@/components/base";
import { UploadImageBox } from "@/components/shared/form";
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from "@/constants/enumConfig";
import type { Expense } from "@/types/expense";
import type { ExpenseFormValue } from "../expenseForm";
import { emptyExpenseForm, fromExpense } from "../expenseForm";

export function ExpenseFormModal({
  open,
  editTarget,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editTarget: Expense | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: ExpenseFormValue) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<ExpenseFormValue>();

  const handleOk = async () => {
    const v = await form.validateFields();
    onSubmit(v);
  };

  return (
    <Modal
      open={open}
      title={editTarget ? t("finance.editTitle", { name: editTarget.description }) : t("finance.addTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={editTarget ? t("common.save") : t("finance.addExpense")}
      cancelText={t("common.cancel")}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={editTarget ? fromExpense(editTarget) : emptyExpenseForm}>
        <div className="grid grid-cols-2 gap-3">
          <FormItem name="date" label={t("finance.fieldDate")} rules={[{ required: true, message: t("validation.required") }]}>
            <DatePicker format="DD/MM/YYYY" />
          </FormItem>
          <FormItem name="category" label={t("finance.fieldCategory")} rules={[{ required: true, message: t("validation.required") }]}>
            <Select options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t(`enums.expenseCategory.${c}`) }))} />
          </FormItem>
        </div>

        <FormItem name="description" label={t("finance.fieldDescription")} rules={[{ required: true, message: t("validation.required") }]}>
          <Input placeholder={t("finance.descriptionPlaceholder")} />
        </FormItem>

        <div className="grid grid-cols-3 gap-3">
          <FormItem name="amount" label={t("finance.fieldAmount")} rules={[{ required: true, message: t("validation.required") }]}>
            <InputNumber min={0} step={0.01} />
          </FormItem>
          <FormItem name="payment_method" label={t("finance.fieldPaymentMethod")}>
            <Select options={EXPENSE_PAYMENT_METHODS.map((p) => ({ value: p, label: t(`enums.expensePaymentMethod.${p}`) }))} />
          </FormItem>
          <FormItem name="vendor" label={t("finance.fieldVendor")}>
            <Input placeholder={t("finance.vendorPlaceholder")} />
          </FormItem>
        </div>

        <FormItem name="note" label={t("finance.fieldNote")}>
          <TextArea rows={2} placeholder={t("finance.notePlaceholder")} />
        </FormItem>

        <FormItem name="receipt_url" label={t("finance.fieldReceipt")}>
          <UploadImageBox />
        </FormItem>

        <FormItem name="is_recurring" label={t("finance.fieldRecurring")} valuePropName="checked">
          <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
            <p className="text-sm text-gray-500">{t("finance.recurringHint")}</p>
            <Switch />
          </div>
        </FormItem>
      </Form>
    </Modal>
  );
}
