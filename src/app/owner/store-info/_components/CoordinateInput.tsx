"use client";
// ─────────────────────────────────────────────────────────────
// ช่องพิกัดร้าน — วางลิงก์ Google Maps (เต็ม/ย่อ) หรือพิมพ์ "ละติจูด, ลองจิจูด" (ยกจาก FrontOffice components/CoordinateInput)
// ลิงก์ย่อ (maps.app.goo.gl) → onResolveShortLink (ViewModel ยิง POST /admin/map-link — เบราว์เซอร์ตาม redirect ข้ามโดเมนเองไม่ได้)
// ระหว่างพิมพ์ใช้ draft · ออกจากช่องแล้วกลับไปแสดงค่าจริงจาก props (กด "ยกเลิก" แล้วเห็นค่าเดิมทันที)
// ─────────────────────────────────────────────────────────────
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/base";
import { isShortMapLink, parseCoordinates, type CoordinateError } from "@/lib/parseCoordinates";
import { isApiError } from "@/types/api";
import { actionIcon } from "@/components/shared/actions";

const format = (lat: number | null, lng: number | null) => (lat != null && lng != null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "");

export function CoordinateInput({ lat, lng, onChange, onResolveShortLink, disabled }: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  onResolveShortLink: (url: string) => Promise<{ lat: number; lng: number }>;
  disabled?: boolean;
}) {
  const t = useTranslations();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(false);
  // กันผลของลิงก์เก่ามาทับ ถ้าวางลิงก์ใหม่ระหว่างรอ
  const seq = useRef(0);

  const coordError = (code: CoordinateError) => (code === "empty" ? "" : t(`storeInfo.coord.${code}`));

  const resolve = async (url: string) => {
    const mine = ++seq.current;
    setResolving(true);
    setError("");
    try {
      const r = await onResolveShortLink(url.trim());
      if (mine !== seq.current) return;
      onChange(r.lat, r.lng);
      setDraft(null);
    } catch (e) {
      if (mine === seq.current) setError(isApiError(e) ? e.message : t("storeInfo.coord.resolveFailed"));
    } finally {
      if (mine === seq.current) setResolving(false);
    }
  };

  const handleChange = (value: string) => {
    setDraft(value);
    seq.current++;
    setResolving(false);
    if (!value.trim()) {
      setError("");
      onChange(null, null);
      return;
    }
    if (isShortMapLink(value)) return void resolve(value);
    const r = parseCoordinates(value);
    if (r.ok) {
      setError("");
      onChange(r.lat, r.lng);
    }
  };

  const handleBlur = () => {
    if (resolving) return;
    if (draft?.trim()) {
      const r = parseCoordinates(draft);
      if (!r.ok) {
        if (r.error !== "shortLink") setError(coordError(r.error));
        return; // คงข้อความไว้ให้แก้ต่อ
      }
      setError("");
    }
    setDraft(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        value={draft ?? format(lat, lng)}
        disabled={disabled}
        status={error ? "error" : undefined}
        placeholder={disabled ? t("storeInfo.notSet") : t("storeInfo.coord.placeholder")}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
      />
      {resolving && <span className="text-xs text-gray-500">{t("storeInfo.coord.resolving")}</span>}
      {!resolving && error && <span className="text-xs text-red-500">{error}</span>}
      {lat != null && lng != null ? (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 self-start text-xs text-gray-500 hover:text-gray-700 hover:underline"
        >
          {t("storeInfo.coord.check", { coord: format(lat, lng) })}
          {actionIcon("external", undefined, "h-3 w-3")}
        </a>
      ) : (
        <span className="text-xs text-amber-600">{t("storeInfo.coord.notSet")}</span>
      )}
    </div>
  );
}
