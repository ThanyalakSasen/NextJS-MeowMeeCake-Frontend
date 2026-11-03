"use client";
// แก้ผู้รับ + ที่อยู่จัดส่งของพรีออเดอร์ (แบบจัดส่งที่ยังไม่ส่ง) — ค่าส่งคงเดิม · PATCH /admin/preorders/:id
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Form, FormItem, useAntForm, useFormValid, Input } from "@/components/base";
import { modalButtonIcons } from "@/components/shared/actions";
import type { DeliveryAddress } from "@/types/order";

const FIELDS: { name: keyof DeliveryAddress; max: number }[] = [
  { name: "recipient_name", max: 200 },
  { name: "recipient_phone", max: 10 },
  { name: "house_no", max: 300 },
  { name: "sub_district", max: 100 },
  { name: "district", max: 100 },
  { name: "province", max: 100 },
  { name: "zip_code", max: 5 },
];

export function EditPreorderAddressModal({
  address,
  saving,
  onClose,
  onSubmit,
}: {
  address: DeliveryAddress | null | undefined;
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: DeliveryAddress) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<DeliveryAddress>();
  const valid = useFormValid(form);

  const rulesOf = (name: keyof DeliveryAddress) => [
    { required: true, whitespace: true, message: t("validation.required") },
    ...(name === "recipient_phone" ? [{ pattern: /^0\d{8,9}$/, message: t("preorderRound.editAddress.phoneInvalid") }] : []),
    ...(name === "zip_code" ? [{ pattern: /^\d{5}$/, message: t("preorderRound.editAddress.zipInvalid") }] : []),
  ];

  const handleOk = async () => {
    const v = await form.validateFields();
    onSubmit(Object.fromEntries(FIELDS.map((f) => [f.name, String(v[f.name] ?? "").trim()])) as unknown as DeliveryAddress);
  };

  return (
    <Modal
      open
      title={t("preorderRound.editAddress.title")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      okButtonProps={{ ...modalButtonIcons("save").okButtonProps, disabled: !valid }}
      cancelButtonProps={modalButtonIcons("save").cancelButtonProps}
      width={520}
      destroyOnHidden
    >
      <p className="mb-3 text-sm text-gray-600">{t("preorderRound.editAddress.hint")}</p>
      <Form form={form} layout="vertical" initialValues={address ?? undefined}>
        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <FormItem
              key={f.name}
              name={f.name}
              label={t(`preorderRound.editAddress.${f.name}`)}
              rules={rulesOf(f.name)}
              className={f.name === "house_no" ? "sm:col-span-2" : undefined}
            >
              <Input maxLength={f.max} inputMode={f.name === "recipient_phone" || f.name === "zip_code" ? "numeric" : undefined} />
            </FormItem>
          ))}
        </div>
      </Form>
    </Modal>
  );
}
