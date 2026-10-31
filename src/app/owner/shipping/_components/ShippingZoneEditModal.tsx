"use client";
// โมดัลเพิ่ม/แก้ไขโซนค่าจัดส่ง (editing.code = null คือเพิ่มโซนใหม่) — แยกไฟล์ให้ View โหลดแบบ next/dynamic เมื่อเปิดครั้งแรก (antd Modal + ฟอร์มไม่ต้องโหลดตอนเปิดหน้า)
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { modalButtonIcons } from "@/components/shared/actions";
import type { useShippingZonesViewModel } from "../useShippingZonesViewModel";
import { ShippingZoneFormFields } from "./ShippingZoneFormFields";

type VM = ReturnType<typeof useShippingZonesViewModel>;

export function ShippingZoneEditModal(vm: VM) {
  const t = useTranslations();
  const isNew = vm.editing?.code === null;
  return (
    <Modal
      open={!!vm.editing}
      title={!vm.editing ? "" : vm.editing.code === null ? t("shippingZones.addTitle") : t("shippingZones.editTitle", { code: vm.showCode(vm.editing.code) })}
      width={640}
      onCancel={vm.closeEdit}
      onOk={vm.onSave}
      confirmLoading={vm.saving}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      {...modalButtonIcons(isNew ? "add" : "save")}
      okButtonProps={{ ...modalButtonIcons(isNew ? "add" : "save").okButtonProps, disabled: !vm.canSave }}
      destroyOnHidden
    >
      {vm.editing && (
        <ShippingZoneFormFields
          code={vm.editing.code}
          form={vm.editing.form}
          errors={vm.errors}
          taken={vm.takenProvinces}
          onChange={vm.setForm}
        />
      )}
    </Modal>
  );
}
