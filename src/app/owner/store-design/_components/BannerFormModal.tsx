"use client";
// เพิ่ม/แก้ไขแบนเนอร์ — antd Modal + base/Form + BannerImageUpload
import { useEffect } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Form, FormItem, useAntForm, useFormValid, Input, TextArea, Switch, RangePicker } from "@/components/base";
import { BannerImageUpload } from "./BannerImageUpload";
import type { Rule } from "antd/es/form";
import type { Banner } from "@/types/banner";
import { modalButtonIcons } from "@/components/shared/actions";
import { emptyBannerForm, fromBanner, type BannerFormValue } from "../bannerForm";
import { isSafeLink } from "@/lib/safeLink";

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
  // ปุ่มบันทึกกดได้เมื่อทุกช่องผ่าน rules (required + รูปแบบ) — ผู้ใช้ขอ 2026-10-31
  const valid = useFormValid(form);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(editTarget ? fromBanner(editTarget) : emptyBannerForm);
  }, [open, editTarget, form]);

  const required: Rule[] = [{ required: true, whitespace: true, message: t("validation.required") }];
  // ลิงก์ไปอยู่ใน href ของหน้าร้านตรง ๆ — ว่างได้ · ไม่ว่างต้องเป็น https://… หรือ /… (lib/safeLink)
  const linkRule: Rule = {
    validator: (_, v?: string) =>
      !v?.trim() || isSafeLink(v) ? Promise.resolve() : Promise.reject(new Error(t("storeDesign.linkInvalid"))),
  };

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
      {...modalButtonIcons(editTarget ? "save" : "add")}
      okButtonProps={{ ...modalButtonIcons(editTarget ? "save" : "add").okButtonProps, disabled: !valid }}
      okText={editTarget ? t("common.save") : t("storeDesign.addBanner")}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <FormItem name="banner_img" label={t("storeDesign.formImage")} extra={t("storeDesign.imageHint")} rules={required}>
          <BannerImageUpload />
        </FormItem>

        <FormItem
          name="banner_name"
          label={t("storeDesign.formName")}
          extra={t("storeDesign.customerFacingHint")}
          rules={required}
        >
          <Input maxLength={120} placeholder={t("storeDesign.namePlaceholder")} />
        </FormItem>

        <FormItem
          name="banner_description"
          label={t("storeDesign.formDescription")}
          extra={t("storeDesign.customerFacingHint")}
        >
          <TextArea rows={3} maxLength={500} showCount placeholder={t("storeDesign.descriptionPlaceholder")} />
        </FormItem>

        <FormItem name="banner_link" label={t("storeDesign.formLink")} rules={[linkRule]}>
          <Input maxLength={1000} placeholder="https://..." />
        </FormItem>

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
