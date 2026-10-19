"use client";
// ─────────────────────────────────────────────────────────────
// CategoryShippingButton — ปุ่ม "จัดส่งนอกจังหวัด" (มุมขวาบน หน้าค่าจัดส่งหน้าร้านออนไลน์) + modal หน้าเดียว
//   หัวข้อหมวด + สวิตช์ทั้งหมวด · กดลูกศรลงเพื่อกางสินค้าในหมวด + สวิตช์รายสินค้า (ShippingScopePanel)
// หน้าจัดการข้อมูลสินค้ามีแค่สวิตช์รายหมวด (ในหน้าต่าง "จัดการหมวดหมู่สินค้า") · ตั้งรายสินค้าได้ที่นี่เท่านั้น
// สิทธิ์ store_info · ซ่อนเองถ้าไม่มี store_info.view · ดึงข้อมูลเฉพาะตอนเปิด
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { TruckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/base";
import { usePermission } from "@/context/PermissionsContext";
import { useCategoryShipping } from "@/hooks/useCategoryShipping";
import { useProductShipping } from "@/hooks/useProductShipping";
import { ShippingScopePanel } from "./ShippingScopePanel";

/** mount ใหม่ทุกครั้งที่เปิด — ค้นหา/การกางหมวดค้างรอบก่อนถูกล้าง */
function Body() {
  const cats = useCategoryShipping();
  const prods = useProductShipping();
  return <ShippingScopePanel cats={cats} prods={prods} />;
}

export function CategoryShippingButton() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const perm = usePermission("store_info");

  if (!perm.view) return null;

  return (
    <>
      <Button icon={<TruckIcon className="h-4 w-4" />} onClick={() => setOpen(true)}>
        {t("shippingZones.categories.button")}
      </Button>
      <Modal
        open={open}
        title={t("shippingZones.categories.title")}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnHidden
        width={760}
      >
        {open && <Body />}
      </Modal>
    </>
  );
}
