"use client";
// ─────────────────────────────────────────────────────────────
// ป๊อปอัพของหน้าร้าน (โทนเดียวกับ shopCard) — ขั้นตอนพรีออเดอร์ · เลือกออเดอร์ส่งในแชท
// Esc / แตะพื้นหลัง / ปุ่ม X = ปิด · ล็อกการเลื่อนหน้าข้างหลังระหว่างเปิด · โฟกัสปุ่มปิดตอนเปิด
// มือถือ: ชิดล่างเต็มกว้าง (bottom sheet) · จอใหญ่: กลางจอ
// ─────────────────────────────────────────────────────────────
import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

export default function ShopModal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** class ความกว้างสูงสุดของกล่อง (tailwind) */
  maxWidth?: string;
}) {
  const t = useTranslations("shop.common");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-2xl bg-white text-[#4A342E] shadow-2xl sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#8C5A3C]/10 px-5 py-3">
          <h2 id={titleId} className="m-0 text-lg font-bold">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-[#8C5A3C]/10 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
