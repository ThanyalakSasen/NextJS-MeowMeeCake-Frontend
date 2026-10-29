"use client";
// สมาชิกสะสมแต้ม (แผงขวา) — กรอกเบอร์มือถือ → ผูกบิลกับสมาชิก (ได้แต้มตอนปิดงาน) · ไม่กรอก = ลูกค้าทั่วไป
// เบอร์ซ้ำหลายบัญชี = ให้เลือก · ไม่พบ = ขายต่อแบบลูกค้าทั่วไปได้
import { useTranslations } from "next-intl";
import { Button, Input } from "@/components/base";
import type { PosMember } from "@/types/pos";
import type { MemberLookup } from "../usePOSViewModel";

export function MemberCard({
  phone,
  searching,
  lookup,
  member,
  points,
  disabled,
  onPhoneChange,
  onSubmit,
  onPick,
  onClear,
}: {
  phone: string;
  searching: boolean;
  lookup: MemberLookup;
  member: PosMember | null;
  /** แต้มโดยประมาณจากยอดชำระปัจจุบัน */
  points: number;
  disabled: boolean;
  onPhoneChange: (v: string) => void;
  onSubmit: () => void;
  onPick: (m: PosMember) => void;
  onClear: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-2">
      <h3 className="m-0 text-[15px] font-semibold text-brown-800">{t("pos.memberTitle")}</h3>

      {member ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border-2 border-success bg-green-50 px-3 py-2">
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-brown-900">{member.user_fullname}</span>
            <span className="text-xs text-gray-600 tabular-nums">{member.user_phone}</span>
            <span className="text-xs text-gray-600">{t("pos.memberBalance", { n: member.points_balance })}</span>
            <span className="text-xs font-medium text-success">{t("pos.memberEarn", { n: points })}</span>
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="flex-none cursor-pointer border-none bg-transparent p-0 text-sm font-medium text-brown-800 underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("pos.memberChange")}
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <Input
              aria-label={t("pos.memberPhoneLabel")}
              placeholder={t("pos.memberPhonePlaceholder")}
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              value={phone}
              disabled={disabled}
              onChange={(e) => onPhoneChange(e.target.value)}
              onPressEnter={onSubmit}
            />
            <Button onClick={onSubmit} loading={searching} disabled={disabled || !phone.trim()}>
              {t("pos.memberSearch")}
            </Button>
          </div>

          {lookup.state === "idle" && <p className="m-0 text-xs text-gray-500">{t("pos.memberHint")}</p>}
          {lookup.state === "notFound" && (
            <p className="m-0 text-xs text-amber-800">{t("pos.memberNotFound", { phone: lookup.phone })}</p>
          )}
          {lookup.state === "error" && <p className="m-0 text-xs text-danger">{lookup.message}</p>}
          {lookup.state === "many" && (
            <div className="flex flex-col gap-1.5">
              <p className="m-0 text-xs text-gray-600">{t("pos.memberPickOne")}</p>
              {lookup.members.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => onPick(m)}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-brown-900 hover:border-brown-400"
                >
                  <span className="truncate">{m.user_fullname}</span>
                  <span className="flex-none text-xs text-gray-600">{t("pos.memberBalance", { n: m.points_balance })}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
