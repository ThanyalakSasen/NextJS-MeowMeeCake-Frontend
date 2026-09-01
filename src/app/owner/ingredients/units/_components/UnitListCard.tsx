"use client";
// การ์ดรายการหน่วยนับ 1 กลุ่ม (วัตถุดิบ หรือ สินค้า) — ใช้ซ้ำทั้ง 2 คอลัมน์
import { Empty } from "antd";
import { useTranslations } from "next-intl";
import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/base";
import { ConfirmDeletePopup } from "@/components/shared/feedback";
import type { Unit } from "@/types/unit";

export function UnitListCard({
  title,
  description,
  units,
  canCreate,
  canUpdate,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string;
  description: string;
  units: Unit[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onAdd: () => void;
  onEdit: (u: Unit) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations();
  const tUnitType = useTranslations("enums.unitType");

  return (
    <section className="section-card">
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-600">{description}</p>
        </div>
        {canCreate && (
          <Button size="small" icon={<PlusIcon className="h-4 w-4" />} onClick={onAdd}>
            {t("units.addUnit")}
          </Button>
        )}
      </div>

      {units.length === 0 ? (
        <div className="px-5 py-10">
          <Empty description={<span className="text-sm text-gray-600">{t("units.emptyGroup")}</span>} />
        </div>
      ) : (
        <ul>
          {units.map((u) => (
            <li
              key={u._id}
              className="flex items-center justify-between border-b border-gray-100 px-5 py-3 last:border-0"
            >
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-brown-800">
                  {u.unit_name}
                  <span className="text-gray-500">({u.unit_abbr})</span>
                  {u.usage_context.length > 1 && (
                    <span className="badge badge-info">{t("units.bothContexts")}</span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {tUnitType(u.unit_type as Parameters<typeof tUnitType>[0])}
                </p>
              </div>
              {(canUpdate || canDelete) && (
                <div className="flex shrink-0 items-center gap-2">
                  {canUpdate && (
                    <Button
                      size="small"
                      type="text"
                      aria-label={t("common.edit")}
                      icon={<PencilSquareIcon className="h-4 w-4" />}
                      onClick={() => onEdit(u)}
                    />
                  )}
                  {canDelete && (
                    <ConfirmDeletePopup
                      title={t("units.deleteConfirm", { name: u.unit_name })}
                      onConfirm={() => onDelete(u._id)}
                    >
                      <Button size="small" type="text" danger>
                        {t("common.delete")}
                      </Button>
                    </ConfirmDeletePopup>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
