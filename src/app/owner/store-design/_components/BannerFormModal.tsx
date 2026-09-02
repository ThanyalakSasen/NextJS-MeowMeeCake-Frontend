"use client";
// เพิ่ม/แก้ไขแบนเนอร์ — antd Modal + base/Form + UploadImageBox
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Form, FormItem, useAntForm, Input, InputNumber, Switch, RangePicker } from "@/components/base";
import { UploadImageBox } from "@/components/shared/form";
import type { Rule } from "antd/es/form";
import type { Banner } from "@/types/banner";
import { emptyBannerForm, fromBanner, type BannerFormValue } from "../bannerForm";

export function BannerFormModal({
  open,
  editTarget,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editTarget: Banner | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (v: BannerFormValue) => void;
}) {
  const t = useTranslations();
  const [form] = useAntForm<BannerFormValue>();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(editTarget ? fromBanner(editTarget) : emptyBannerForm);
  }, [open, editTarget, form]);

  const required: Rule[] = [{ required: true, message: t("validation.required") }];

  const handleOk = async () => {
    const v = await form.validateFields();
    onSubmit(v);
  };

  return (
    <Modal
      open={open}
      title={editTarget ? t("storeDesign.editTitle") : t("storeDesign.addTitle")}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={editTarget ? t("common.save") : t("storeDesign.addBanner")}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <FormItem name="banner_img" label={t("storeDesign.formImage")} extra={t("storeDesign.imageHint")}>
          <UploadImageBox />
        </FormItem>

        <FormItem name="banner_name" label={t("storeDesign.formName")} rules={required}>
          <Input placeholder={t("storeDesign.namePlaceholder")} />
        </FormItem>

        <div className="grid grid-cols-2 gap-3">
          <FormItem name="banner_link" label={t("storeDesign.formLink")}>
            <Input placeholder="https://..." />
          </FormItem>
          <FormItem name="sort_order" label={t("storeDesign.formOrder")}>
            <InputNumber min={1} />
          </FormItem>
        </div>

        <FormItem name="dateRange" label={t("storeDesign.formDateRange")}>
          <RangePicker style={{ width: "100%" }} />
        </FormItem>

        <FormItem name="is_active" label={t("storeDesign.formActive")} valuePropName="checked">
          <Switch />
        </FormItem>
      </Form>
    </Modal>
  );
}
