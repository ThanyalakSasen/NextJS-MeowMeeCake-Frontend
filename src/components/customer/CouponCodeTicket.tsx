"use client";
// ป้ายรหัสคูปองแบบ "ตั๋ว" + ปุ่มคัดลอก — ใช้ในหน้าสมาชิก (คูปองของฉัน) และหน้าแจ้งเตือน
// ตัวพิมพ์ใหญ่ · monospace · เว้นระยะตัวอักษร (ลดสับสน O/0 · I/1) · ไม่ตัดรหัสด้วย … (ยาวให้ขึ้นบรรทัดใหม่)
// disabled = คูปองใช้แล้ว/หมดอายุ → สีเทา ขีดฆ่า ไม่มีปุ่มคัดลอก
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // http ที่ไม่ใช่ localhost / เบราว์เซอร์เก่า — ไม่มี clipboard API
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function CouponCodeTicket({ code, disabled = false, className = "" }: { code: string; disabled?: boolean; className?: string }) {
  const t = useTranslations("shop.coupons");
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  const shown = code.toUpperCase();

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span
        aria-label={t("codeLabel", { code: shown })}
        className={`inline-block break-all rounded-lg border border-dashed px-3 py-1 font-mono text-sm font-bold tracking-wider ${
          disabled ? "border-stone-300 bg-stone-50 text-stone-400 line-through" : "border-[#8C5A3C]/50 bg-[#FAF6F0] text-[#4A342E]"
        }`}
      >
        {shown}
      </span>
      {!disabled && (
        <button
          type="button"
          onClick={async () => setState((await copyText(shown)) ? "copied" : "failed")}
          className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#8C5A3C] transition hover:bg-[#e2d7c7]/40"
        >
          {state === "copied" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          <span aria-live="polite">{state === "copied" ? t("copied") : state === "failed" ? t("copyFailed") : t("copyCode")}</span>
        </button>
      )}
    </div>
  );
}
