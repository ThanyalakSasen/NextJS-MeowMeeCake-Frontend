"use client";
// โมดัลเพิ่ม/แก้ไขโซนค่าจัดส่ง — แยกไฟล์ให้ View โหลดแบบ next/dynamic เมื่อเปิดครั้งแรก (antd Modal + ฟอร์มไม่ต้องโหลดตอนเปิดหน้า)
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { modalButtonIcons } from "@/components/shared/actions";
import type { useDeliveryZonesViewModel } from "../useDeliveryZonesViewModel";
import { DeliveryZoneForm } from "./DeliveryZoneForm";

type VM = ReturnType<typeof useDeliveryZonesViewModel>;

export function DeliveryZoneEditModal(vm: VM) {
  const t = useTranslations();
  return (
    <Modal
      open={!!vm.editing}
      title={vm.editing?.id ? t("deliveryZones.editTitle") : t("deliveryZones.addTitle")}
      width={640}
      onCancel={vm.closeEdit}
      onOk={vm.onSave}
      confirmLoading={vm.saving}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      {...modalButtonIcons("save")}
      destroyOnHidden
    >
      {vm.editing && <DeliveryZoneForm form={vm.editing.form} errors={vm.errors} otherCatchAll={vm.otherCatchAll} onChange={vm.setForm} />}
    </Modal>
  );
}
