"use client";
// ─────────────────────────────────────────────────────────────
// RestoreDeletedButton — ปุ่ม "รายการที่ลบ" บนหัวหน้า + หน้าต่างกู้คืน (Final-Backlog N7)
// resources = ชนิดที่ลบได้จากหน้านั้น (เช่น หน้าสินค้า = สินค้า + หมวดหมู่สินค้า) — มีหลายชนิด = แบ่งหัวข้อในหน้าต่าง
// ซ่อนเองถ้าไม่มีสิทธิ์ update ของเมนู (backend ตรวจ update ตอนกู้คืน) · ดึงรายการเฉพาะตอนเปิด (trashService)
// กู้คืนแล้ว invalidate queryKey ของ resource นั้น → ตาราง/ตัวกรอง/ฟอร์มทุกหน้าเห็นรายการกลับมาทันที
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { Modal } from "antd";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Button, EmptyState } from "@/components/base";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import { actionIcon } from "@/components/shared/actions";
import { usePermission } from "@/context/PermissionsContext";
import type { MenuKey } from "@/constants/menuKeys";
import { formatDate } from "@/i18n/format";
import { alert } from "@/lib/alert";
import { trashService, type TrashRow } from "@/services/trash";
import { isApiError } from "@/types/api";
import { DELETED_RESOURCES, type DeletedResourceKey } from "./deletedResources";

const TRASH_KEY = "trash";

export function RestoreDeletedButton({ menu, resources }: { menu: MenuKey; resources: DeletedResourceKey[] }) {
  const t = useTranslations();
  const perm = usePermission(menu);
  const [open, setOpen] = useState(false);

  if (!perm.update) return null;

  return (
    <>
      <Button icon={actionIcon("reset")} onClick={() => setOpen(true)}>
        {t("trash.open")}
      </Button>
      {open && <RestoreDeletedDialog resources={resources} onClose={() => setOpen(false)} />}
    </>
  );
}

function RestoreDeletedDialog({ resources, onClose }: { resources: DeletedResourceKey[]; onClose: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();

  const queries = useQueries({
    queries: resources.map((key) => {
      const r = DELETED_RESOURCES[key];
      return {
        queryKey: [TRASH_KEY, r.path, r.params ?? {}],
        queryFn: () => trashService.listDeleted(r.path, r.params),
        staleTime: 0,
      };
    }),
  });

  const restore = useMutation({
    mutationFn: ({ key, row }: { key: DeletedResourceKey; row: TrashRow }) =>
      trashService.restore(DELETED_RESOURCES[key].path, row._id),
    onSuccess: (_, { key, row }) => {
      const r = DELETED_RESOURCES[key];
      alert.success(t("trash.restored", { name: r.label(row) }));
      void qc.invalidateQueries({ queryKey: [TRASH_KEY, r.path] });
      void qc.invalidateQueries({ queryKey: r.queryKey });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("trash.restoreFailed")),
  });

  const loading = queries.some((q) => q.isPending);
  const failed = queries.find((q) => q.isError);
  const total = queries.reduce((n, q) => n + (q.data?.length ?? 0), 0);
  const grouped = resources.length > 1;

  return (
    <Modal open title={t("trash.title")} onCancel={onClose} footer={null} destroyOnHidden width={560}>
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-gray-600">{t("trash.hint")}</p>
        {failed ? (
          <LoadFailed onRetry={() => queries.forEach((q) => q.isError && void q.refetch())} />
        ) : loading ? (
          <LoadingSpin />
        ) : total === 0 ? (
          <EmptyState description={t("trash.empty")} />
        ) : (
          resources.map((key, i) => {
            const rows = queries[i].data ?? [];
            if (rows.length === 0) return null;
            const r = DELETED_RESOURCES[key];
            return (
              <section key={key} className="flex flex-col gap-2">
                {grouped && (
                  <h3 className="m-0 text-sm font-semibold text-brown-900">
                    {t("trash.group", { name: t(`entities.${r.entity}`), n: rows.length })}
                  </h3>
                )}
                <ul className="m-0 flex list-none flex-col divide-y divide-gray-100 p-0">
                  {rows.map((row) => (
                    <li key={row._id} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm text-gray-800">{r.label(row)}</p>
                        <p className="m-0 text-xs text-gray-500">
                          {t("trash.deletedAt", { date: formatDate(row.deleted_at, locale, { withTime: true }) })}
                        </p>
                      </div>
                      <Button
                        size="small"
                        icon={actionIcon("reset", "small")}
                        loading={restore.isPending && restore.variables?.row._id === row._id}
                        disabled={restore.isPending && restore.variables?.row._id !== row._id}
                        onClick={() => restore.mutate({ key, row })}
                      >
                        {t("trash.restore")}
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </Modal>
  );
}
