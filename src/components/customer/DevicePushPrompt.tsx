"use client";
// ─────────────────────────────────────────────────────────────
// ชวนเปิดแจ้งเตือนบนเครื่อง (Web Push) — แจ้งเตือนเด้งขึ้นจอมือถือ/คอมแบบข้อความ SMS กดแล้วเปิดหน้าคำสั่งซื้อ/ชำระเงิน
// compact = แถบในกล่องกระดิ่ง (แสดงเฉพาะตอนยังไม่เปิด) · card = การ์ดในหน้าการแจ้งเตือน/หน้าคำสั่งซื้อ (มีปุ่มปิดด้วย)
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import { BellRing } from "lucide-react";
import { useDevicePush } from "@/app/customer/hooks/useDevicePush";

type Props = { variant?: "compact" | "card"; hideWhenOn?: boolean };

export function DevicePushPrompt(props: Props) {
  return <DevicePushPromptView {...props} push={useDevicePush()} />;
}

/** ใช้กับ hook ที่ผู้เรียกถือไว้แล้ว (กระดิ่งบน Navbar ถือ hook ตลอดเพื่อซิงก์ subscription ตอนเข้าเว็บ) */
export function DevicePushPromptView({ variant = "card", hideWhenOn = false, push }: Props & { push: ReturnType<typeof useDevicePush> }) {
  const t = useTranslations("shop.push");
  const { state, busy, enable, disable } = push;

  if (state === "loading" || state === "unavailable") return null;
  if (state === "on" && (hideWhenOn || variant === "compact")) return null;

  if (variant === "compact") {
    if (state === "denied") return null;
    return (
      <div className="flex items-center gap-2 border-b border-[#e2d7c7] bg-[#FAF6F0] px-4 py-2.5">
        <BellRing size={16} className="shrink-0 text-[#8C5A3C]" />
        <span className="flex-1 text-xs text-[#4A342E]">{state === "ios-install" ? t("iosInstallShort") : t("compactHint")}</span>
        {state === "off" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void enable()}
            className="shrink-0 rounded-lg bg-[#8C5A3C] px-2.5 py-1 text-xs font-semibold !text-white disabled:opacity-60"
          >
            {t("enable")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e2d7c7] bg-[#FAF6F0] p-4 sm:flex-row sm:items-center">
      <BellRing size={22} className="shrink-0 text-[#8C5A3C]" />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm font-bold text-[#4A342E]">{state === "on" ? t("onTitle") : t("title")}</p>
        <p className="m-0 mt-0.5 text-xs text-stone-600">
          {state === "on" ? t("onHint") : state === "denied" ? t("deniedHint") : state === "ios-install" ? t("iosInstall") : t("hint")}
        </p>
      </div>
      {state === "off" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void enable()}
          className="shrink-0 rounded-xl bg-[#8C5A3C] px-4 py-2 text-sm font-semibold !text-white disabled:opacity-60"
        >
          {t("enable")}
        </button>
      )}
      {state === "on" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void disable()}
          className="shrink-0 rounded-xl border border-[#e2d7c7] bg-white px-4 py-2 text-sm font-semibold text-[#4A342E] disabled:opacity-60"
        >
          {t("disable")}
        </button>
      )}
    </div>
  );
}
