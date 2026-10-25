"use client";
// โมดัลแก้ไขโซนค่าจัดส่ง — แยกไฟล์ให้ View โหลดแบบ next/dynamic เมื่อเปิดครั้งแรก (antd Modal + ฟอร์มไม่ต้องโหลดตอนเปิดหน้า)
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { modalButtonIcons } from "@/components/shared/actions";
import type { useShippingZonesViewModel } from "../useShippingZonesViewModel";
import { ShippingZoneFormFields } from "./ShippingZoneFormFields";

type VM = ReturnType<typeof useShippingZonesViewModel>;

export function ShippingZoneEditModal(vm: VM) {
  const t = useTranslations();
  return (
    <Modal
      open={!!vm.editing}
      title={!vm.editing ? "" : vm.editing.code ? t("shippingZones.editTitle", { code: vm.editing.code }) : t("shippingZones.addTitle")}
      width={640}
      onCancel={vm.closeEdit}
      onOk={vm.onSave}
      confirmLoading={vm.saving}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      {...modalButtonIcons("save")}
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
