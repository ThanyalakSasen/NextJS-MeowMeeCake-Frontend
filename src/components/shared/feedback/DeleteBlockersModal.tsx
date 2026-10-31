"use client";
// ─────────────────────────────────────────────────────────────
// "ลบยังไม่ได้" — เปิดเมื่อกดลบสินค้า/วัตถุดิบ/สูตรแล้วได้ 409 (ผู้ใช้ขอ 2026-10-31)
// รายการเหตุผลจาก backend (deleteBlockersService.list) + ปุ่มแก้ทีละข้อ:
//   สินค้าในรอบ → เอาออกจากรอบ (ยังไม่มีคนจอง) / ปิดการขายในรอบ (จองแล้ว — ออเดอร์เดิมกับรายการผลิตยังอยู่)
//   วัตถุดิบในสูตร/ส่วนประกอบ → ยกเลิกการเชื่อมต่อ · สูตรสุดท้ายของสินค้า → ยกเลิกการผูกสินค้าแล้วลบสูตร
//   ส่วนประกอบที่สูตรหลักใช้อยู่ → ยกเลิกการผูกกับสูตรหลัก
//   ข้อที่แก้ที่นี่ไม่ได้ (สต็อก · พรีออเดอร์ที่ยังไม่ผลิต · ใบสั่งผลิตค้าง) บอกวิธีแก้เป็นตัวหนังสือ
// แก้ครบ → ปุ่ม "ลบ" ใช้ได้ (ลบจริงในนี้เลย) · ผู้เรียก render เฉพาะตอนเปิด
// ─────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/base";
import { actionIcon, modalButtonIcons } from "@/components/shared/actions";
import { LoadFailed } from "./LoadFailed";
import { LoadingSpin } from "./LoadingSpin";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { deleteBlockersService } from "@/services/deleteBlockers";
import type { DeleteBlocker, DeleteBlockerEntity } from "@/types/deleteBlocker";

/** query ที่ต้องโหลดใหม่หลังแก้/ลบ — รายการหน้าเจ้าของ + ข้อมูลที่ปุ่มแก้ไปแตะ */
const INVALIDATE: Record<DeleteBlockerEntity, string[][]> = {
  product: [["products"], ["preorder-rounds"]],
  ingredient: [["ingredients"], ["recipes"], ["components"]],
  recipe: [["recipes"], ["products"]],
  component: [["components"], ["recipes"]],
};

export function DeleteBlockersModal({
  entity,
  id,
  onClose,
}: {
  entity: DeleteBlockerEntity;
  id: string;
  onClose: () => void;
}) {
  const t = useTranslations("deleteBlockers");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["delete-blockers", entity, id], queryFn: () => deleteBlockersService.list(entity, id) });
  const blockers = q.data ?? [];
  const refresh = () => {
    for (const key of INVALIDATE[entity]) void qc.invalidateQueries({ queryKey: key });
    return q.refetch();
  };

  const act = useMutation({
    mutationFn: (b: DeleteBlocker) => {
      const ref = b.ref_id as string;
      switch (b.action) {
        case "remove_from_round":
        case "close_round_item":
          return deleteBlockersService.releaseRound(id, ref);
        case "unlink_recipe":
          return deleteBlockersService.unlinkIngredient(id, "recipe", ref);
        case "unlink_component":
          return deleteBlockersService.unlinkIngredient(id, "component", ref);
        case "unlink_product":
          return deleteBlockersService.unlinkProductAndDelete(id);
        case "unlink_parent_recipe":
          return deleteBlockersService.unlinkComponent(id, ref);
        default:
          return Promise.resolve(null);
      }
    },
    onSuccess: (_r, b) => {
      // ยกเลิกการผูกสินค้า = ลบสูตรไปแล้วในตัว → ปิด modal
      if (b.action === "unlink_product") {
        alert.success(t("deleted"));
        for (const key of INVALIDATE[entity]) void qc.invalidateQueries({ queryKey: key });
        onClose();
        return;
      }
      alert.success(t("actionDone"));
      void refresh();
    },
    onError: (e) => {
      alert.error(isApiError(e) ? e.message : t("actionFailed"));
      void refresh();
    },
  });

  const del = useMutation({
    mutationFn: () => deleteBlockersService.remove(entity, id),
    onSuccess: () => {
      alert.success(t("deleted"));
      for (const key of INVALIDATE[entity]) void qc.invalidateQueries({ queryKey: key });
      onClose();
    },
    onError: (e) => {
      alert.error(isApiError(e) ? e.message : t("actionFailed"));
      void refresh();
    },
  });

  const run = async (b: DeleteBlocker) => {
    if (b.action === "unlink_product") {
      const ok = await confirmAlert(t("confirmUnlinkProduct", { label: b.label }), {
        title: t(`action.${b.action}`),
        confirmText: t(`action.${b.action}`),
        cancelText: tc("cancel"),
        variant: "delete",
      });
      if (!ok) return;
    }
    act.mutate(b);
  };

  const hintOf = (b: DeleteBlocker): string | null => {
    if (b.action === "close_round_item") return t("hint.closeRound");
    if (b.action) return null;
    if (b.kind === "stock") return t(entity === "product" ? "hint.stockProduct" : "hint.stockIngredient");
    if (b.kind === "preorders") return t("hint.preorders");
    if (b.kind === "production") return t("hint.production");
    return null;
  };

  const ready = q.isSuccess && blockers.length === 0;
  const icons = modalButtonIcons("delete");

  return (
    <Modal
      open
      title={t(`title.${entity}`)}
      onCancel={onClose}
      onOk={() => del.mutate()}
      okText={tc("delete")}
      cancelText={tc("close")}
      okButtonProps={{ ...icons.okButtonProps, danger: true, disabled: !ready, loading: del.isPending }}
      cancelButtonProps={icons.cancelButtonProps}
      width={600}
    >
      {q.isPending ? (
        <LoadingSpin />
      ) : q.isError ? (
        <LoadFailed onRetry={() => void q.refetch()} />
      ) : ready ? (
        <p className="flex items-center gap-2 text-green-700">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          {t("ready")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm text-gray-600">{t("intro")}</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {blockers.map((b) => {
              const hint = hintOf(b);
              return (
                <li
                  key={`${b.kind}-${b.ref_id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                >
                  <div className="flex min-w-0 gap-2">
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="min-w-0">
                      <p className="m-0 text-sm text-brown-800">
                        {t(`kind.${b.kind}`, { label: b.label, qty: b.qty ?? 0, unit: b.unit ?? "" })}
                      </p>
                      {hint && <p className="m-0 text-xs text-gray-500">{hint}</p>}
                    </div>
                  </div>
                  {b.action && (
                    <Button
                      size="small"
                      danger={b.action === "unlink_product"}
                      icon={actionIcon(b.action === "close_round_item" ? "off" : "unlink", "small")}
                      loading={act.isPending && act.variables === b}
                      disabled={act.isPending && act.variables !== b}
                      onClick={() => void run(b)}
                    >
                      {t(`action.${b.action}`)}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Modal>
  );
}
