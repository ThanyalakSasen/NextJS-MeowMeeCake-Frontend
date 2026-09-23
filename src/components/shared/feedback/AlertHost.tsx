"use client";
// ─────────────────────────────────────────────────────────────
// AlertHost — ตัวแสดง modal ของ alert.* / confirmAlert (src/lib/alert.ts) · วางไว้ใน providers.tsx จุดเดียว
// แสดงหัวคิวทีละอัน · ทุกประเภทต้องกดปุ่มปิดเอง · สี/ไอคอนต่อประเภทอยู่ใน KIND_STYLE ด้านล่าง
// ─────────────────────────────────────────────────────────────
import { useState, useSyncExternalStore } from "react";
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/base";
import { actionIcon } from "@/components/shared/actions";
import { alertStore, type AlertKind, type AlertRequest } from "@/lib/alert";

type TitleKey = "titleSuccess" | "titleError" | "titleWarning" | "titleInfo" | "titleConfirm" | "titleDelete";

const KIND_STYLE: Record<AlertKind, { Icon: typeof CheckCircleIcon; ring: string; icon: string; titleKey: TitleKey }> = {
  success: { Icon: CheckCircleIcon, ring: "bg-green-50", icon: "text-green-600", titleKey: "titleSuccess" },
  error: { Icon: XCircleIcon, ring: "bg-red-50", icon: "text-red-600", titleKey: "titleError" },
  warning: { Icon: ExclamationTriangleIcon, ring: "bg-amber-50", icon: "text-amber-600", titleKey: "titleWarning" },
  info: { Icon: InformationCircleIcon, ring: "bg-blue-50", icon: "text-blue-600", titleKey: "titleInfo" },
  confirm: { Icon: QuestionMarkCircleIcon, ring: "bg-brown-50", icon: "text-brown-700", titleKey: "titleConfirm" },
};

/** confirm แบบ danger / ลบ ใช้สีแดง — confirm ธรรมดาใช้โทนน้ำตาลของแบรนด์ */
function styleOf(a: AlertRequest) {
  if (a.kind !== "confirm") return KIND_STYLE[a.kind];
  if (a.variant === "delete") return { Icon: TrashIcon, ring: "bg-red-50", icon: "text-red-600", titleKey: "titleDelete" as const };
  if (a.danger) return { ...KIND_STYLE.confirm, Icon: ExclamationTriangleIcon, ring: "bg-red-50", icon: "text-red-600" };
  return KIND_STYLE.confirm;
}

export function AlertHost() {
  const t = useTranslations();
  const current = useSyncExternalStore(alertStore.subscribe, alertStore.current, () => null);

  // เก็บอันล่าสุดไว้แสดงระหว่าง animation ปิด (current เป็น null ทันทีที่กดปิด) — ปรับ state ระหว่าง render
  // แบบมีเงื่อนไข (แพทเทิร์นที่ React แนะนำแทน useEffect)
  const [shown, setShown] = useState<AlertRequest | null>(current);
  if (current && current !== shown) setShown(current);

  const a = current ?? shown;
  if (!a) return null;

  const style = styleOf(a);
  const isConfirm = a.kind === "confirm";
  const close = (confirmed: boolean) => { if (current) alertStore.close(current.id, confirmed); };

  return (
    <Modal
      open={!!current}
      centered
      width={420}
      footer={null}
      closable={a.dismissible}
      // antd v6: maskClosable เลิกใช้แล้ว → mask.closable (คลิกพื้นหลังเพื่อปิด)
      mask={{ closable: a.dismissible }}
      keyboard={a.dismissible}
      onCancel={() => close(false)}
      // ไม่ใส่ title ของ Modal — หัวข้ออยู่ในตัวเนื้อหา (กลางกล่อง ใต้ไอคอน)
    >
      <div className="flex flex-col items-center gap-3 pt-3 text-center" role={isConfirm ? "alertdialog" : "alert"}>
        <span className={`flex h-14 w-14 items-center justify-center rounded-full ${style.ring}`}>
          <style.Icon className={`h-8 w-8 ${style.icon}`} aria-hidden />
        </span>
        <h3 className="text-lg font-semibold text-brown-900">{a.title ?? t(`alert.${style.titleKey}`)}</h3>
        <p className="whitespace-pre-line text-sm text-gray-600">{a.text}</p>
        {a.note && <p className="text-sm text-gray-400">{a.note}</p>}

        <div className="mt-3 flex w-full justify-center gap-2">
          {isConfirm ? (
            <>
              <Button icon={actionIcon("cancel")} onClick={() => close(false)}>
                {a.cancelText ?? t("common.cancel")}
              </Button>
              <Button
                type="primary"
                danger={a.danger || a.variant === "delete"}
                icon={actionIcon(a.variant === "delete" ? "delete" : "confirm")}
                onClick={() => close(true)}
                autoFocus
              >
                {a.confirmText ?? t("common.confirm")}
              </Button>
            </>
          ) : (
            // autoFocus: กด Enter ปิดได้ทันที (ไม่ต้องเอื้อมเมาส์ — เช่นหน้า POS)
            <Button type="primary" icon={actionIcon("save")} onClick={() => close(true)} autoFocus className="min-w-28">
              {t("common.ok")}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
