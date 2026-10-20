"use client";
// ─────────────────────────────────────────────────────────────
// CategoryManagerButton — ปุ่ม "จัดการหมวดหมู่" + CategoryManagerDialog ของชนิดนั้น
// ซ่อนเองถ้าไม่มีสิทธิ์ create/update/delete ของเมนูนั้น · ดึงรายการหมวดเฉพาะตอนเปิด dialog
// หมวดสินค้ามีสวิตช์ "ส่งทั่วประเทศ" ในแต่ละแถวด้วย (useCategoryShipping · สิทธิ์ store_info)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useTranslations } from "next-intl";
import { TagIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/base";
import { useCategoryManager, type CategoryKind } from "@/hooks/useCategoryManager";
import { useCategoryShipping } from "@/hooks/useCategoryShipping";
import { CategoryManagerDialog } from "./CategoryManagerDialog";

const TITLE_KEY = {
  product: "categories.titleProduct",
  ingredient: "categories.titleIngredient",
  component: "categories.titleComponent",
} as const satisfies Record<CategoryKind, string>;

export function CategoryManagerButton({ kind }: { kind: CategoryKind }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  // เพิ่มทุกครั้งที่เปิด → dialog mount ใหม่ ช่องกรอก/โหมดแก้ไขค้างจากรอบก่อนถูกล้าง
  const [session, setSession] = useState(0);
  const manager = useCategoryManager(kind, { enabled: open });
  // หมวดสินค้า: สวิตช์ส่งทั่วประเทศในแต่ละแถว (สิทธิ์ store_info — ไม่มี view = ไม่แสดงสวิตช์)
  const withShipping = kind === "product";
  const shipping = useCategoryShipping({ enabled: open && withShipping });
  const { perm } = manager;

  if (!perm.create && !perm.update && !perm.delete) return null;

  return (
    <>
      <Button
        icon={<TagIcon className="h-4 w-4" />}
        onClick={() => {
          setSession((n) => n + 1);
          setOpen(true);
        }}
      >
        {t("categories.manage")}
      </Button>
      <CategoryManagerDialog
        key={session}
        open={open}
        title={t(TITLE_KEY[kind])}
        manager={manager}
        shipping={withShipping && shipping.perm.view ? shipping : undefined}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
