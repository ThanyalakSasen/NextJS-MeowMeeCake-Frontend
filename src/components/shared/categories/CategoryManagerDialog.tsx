"use client";
// ─────────────────────────────────────────────────────────────
// CategoryManagerDialog — เพิ่ม / เปลี่ยนชื่อ / ลบหมวดหมู่ (สินค้า · วัตถุดิบ · ส่วนประกอบ) ใน modal เดียว
// presentational: ข้อมูล/สิทธิ์/การบันทึกมาจาก useCategoryManager(kind)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, Input, EmptyState } from "@/components/base";
import { LoadingSpin, ConfirmDeletePopup } from "@/components/shared/feedback";
import { EditButton, DeleteButton, RetryButton, actionIcon } from "@/components/shared/actions";
import type { useCategoryManager } from "@/hooks/useCategoryManager";

type Manager = ReturnType<typeof useCategoryManager>;

/** ความยาวชื่อหมวดสูงสุด — ตรงกับ backend schemas/catalog.ts nameOnly() */
const MAX_NAME = 100;

export function CategoryManagerDialog({
  open,
  title,
  manager,
  onClose,
}: {
  open: boolean;
  title: string;
  manager: Manager;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { perm } = manager;
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    if (await manager.onCreate(name)) setNewName("");
  };

  const saveEdit = async () => {
    const name = editName.trim();
    if (!editingId || !name) return;
    if (await manager.onRename(editingId, name)) setEditingId(null);
  };

  return (
    <Modal open={open} title={title} onCancel={onClose} footer={null} destroyOnHidden width={520}>
      <div className="flex flex-col gap-4">
        {perm.create && (
          <div className="flex gap-2">
            <Input
              value={newName}
              maxLength={MAX_NAME}
              onChange={(e) => setNewName(e.target.value)}
              onPressEnter={() => void add()}
              placeholder={t("categories.newPlaceholder")}
              aria-label={t("categories.newPlaceholder")}
            />
            <Button
              type="primary"
              icon={actionIcon("add")}
              loading={manager.creating}
              disabled={!newName.trim()}
              onClick={() => void add()}
            >
              {t("common.add")}
            </Button>
          </div>
        )}

        {manager.isLoading ? (
          <LoadingSpin className="py-8" />
        ) : manager.isError ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-gray-600">{t("common.loadFailed")}</p>
            <RetryButton onClick={manager.refetch} />
          </div>
        ) : manager.items.length === 0 ? (
          <EmptyState description={t("categories.empty")} />
        ) : (
          <ul className="flex max-h-[50vh] flex-col divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100">
            {manager.items.map((c) => (
              <li key={c.id} className="flex items-center gap-2 px-3 py-2">
                {editingId === c.id ? (
                  <>
                    <Input
                      size="small"
                      autoFocus
                      value={editName}
                      maxLength={MAX_NAME}
                      onChange={(e) => setEditName(e.target.value)}
                      onPressEnter={() => void saveEdit()}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      aria-label={t("categories.renameLabel", { name: c.name })}
                    />
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckIcon className="h-3.5 w-3.5" />}
                      loading={manager.savingId === c.id}
                      disabled={!editName.trim() || editName.trim() === c.name}
                      onClick={() => void saveEdit()}
                      aria-label={t("common.save")}
                    />
                    <Button
                      size="small"
                      icon={<XMarkIcon className="h-3.5 w-3.5" />}
                      onClick={() => setEditingId(null)}
                      aria-label={t("common.cancel")}
                    />
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{c.name}</span>
                    {perm.update && (
                      <EditButton
                        size="small"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditName(c.name);
                        }}
                      />
                    )}
                    {perm.delete && (
                      <ConfirmDeletePopup
                        title={t("categories.deleteConfirm", { name: c.name })}
                        onConfirm={() => manager.onDelete(c)}
                      >
                        <DeleteButton size="small" loading={manager.deletingId === c.id} />
                      </ConfirmDeletePopup>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="m-0 text-xs text-gray-500">{t("categories.deleteHint")}</p>
      </div>
    </Modal>
  );
}
