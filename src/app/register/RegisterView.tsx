"use client";
// View ของ /register — markup ยกจาก FrontOffice src/app/register/page.jsx (ปรับเป็น i18n + AuthBackdrop เดียวกับ /login)
import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff, MailCheck, X } from "lucide-react";
import {
  AuthBackdrop, authInputClass, authLabelClass, authLinkClass, authMutedClass,
} from "@/components/shared/layout/AuthBackdrop";
import { LOGIN_PATH } from "@/constants/auth";
import type { useRegisterViewModel } from "./useRegisterViewModel";

type VM = ReturnType<typeof useRegisterViewModel>;

const fieldClass = authInputClass.replace(" pr-11", "");

export function RegisterView(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();
  const [pressed, setPressed] = useState(false);
  // ชื่อเดือนตามภาษาที่เลือก (ไม่ต้องเก็บใน catalog)
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", { month: "long" }).format(new Date(2000, i, 1)),
  }));
  const req = <span className="ml-0.5 text-red-500">*</span>;

  if (vm.doneEmail) {
    return (
      <AuthBackdrop title={t("register.doneTitle")} maxWidth={520}>
        <div className="flex flex-col items-center gap-4 text-center">
          <MailCheck className="h-12 w-12 text-[#F2AE00] md:text-[#8C5A3C]" aria-hidden="true" />
          <p className={`m-0 text-sm leading-relaxed ${authMutedClass}`}>
            {t("register.doneDetail", { email: vm.doneEmail })}
          </p>
          <p className={`m-0 text-xs ${authMutedClass}`}>{t("register.doneSpamHint")}</p>
          <button
            type="button"
            onClick={() => void vm.resend()}
            disabled={vm.resending}
            className="w-full rounded-xl border-[1.5px] border-[#e1d6cd] bg-white py-3 text-sm font-semibold text-[#4e342e] transition hover:enabled:border-[#bfaea2] disabled:cursor-wait disabled:opacity-60"
          >
            {vm.resending ? t("register.resending") : t("auth.resendVerification")}
          </button>
          <Link href={LOGIN_PATH} className={authLinkClass}>
            {t("register.goLogin")}
          </Link>
        </div>
      </AuthBackdrop>
    );
  }

  return (
    <AuthBackdrop title={t("register.title")} subtitle={t("register.subtitle")} maxWidth={520}>
      <form onSubmit={(e) => void vm.submit(e)} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="reg-name" className={authLabelClass}>{t("register.fullname")}{req}</label>
          <input id="reg-name" className={`${fieldClass} mt-1`} autoComplete="name" value={vm.form.fullname}
            placeholder={t("register.fullnamePlaceholder")} onChange={(e) => vm.set("fullname", e.target.value)} />
        </div>

        <div>
          <label htmlFor="reg-email" className={authLabelClass}>{t("auth.email")}{req}</label>
          <input id="reg-email" type="email" className={`${fieldClass} mt-1`} autoComplete="email" value={vm.form.email}
            placeholder="example@mail.com" onChange={(e) => vm.set("email", e.target.value)} />
        </div>

        <fieldset className="m-0 border-0 p-0">
          <legend className={`${authLabelClass} p-0`}>{t("register.birthdate")}{req}</legend>
          <div className="mt-1 grid grid-cols-3 gap-2">
            <input type="number" inputMode="numeric" min={1} max={31} aria-label={t("register.day")} placeholder={t("register.dayPlaceholder")}
              className={`${fieldClass} text-center`} value={vm.form.birthDay}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || (Number(v) >= 1 && Number(v) <= 31 && v.length <= 2)) vm.set("birthDay", v);
              }} />
            <select aria-label={t("register.month")} className={fieldClass} value={vm.form.birthMonth}
              onChange={(e) => vm.set("birthMonth", e.target.value)}>
              <option value="" disabled>{t("register.month")}</option>
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <input type="number" inputMode="numeric" aria-label={t("register.year")} placeholder={t("register.yearPlaceholder")}
              className={`${fieldClass} text-center`} value={vm.form.birthYear}
              onChange={(e) => { if (e.target.value.length <= 4) vm.set("birthYear", e.target.value); }} />
          </div>
        </fieldset>

        <div>
          <label htmlFor="reg-phone" className={authLabelClass}>{t("register.phone")}{req}</label>
          <input id="reg-phone" type="tel" inputMode="tel" className={`${fieldClass} mt-1`} autoComplete="tel" maxLength={10}
            value={vm.form.phone} placeholder="0812345678" onChange={(e) => vm.set("phone", e.target.value.replace(/\D/g, ""))} />
        </div>

        <div>
          <label htmlFor="reg-password" className={authLabelClass}>{t("auth.password")}{req}</label>
          <div className="relative mt-1">
            <input id="reg-password" type={vm.showPassword ? "text" : "password"} className={authInputClass} autoComplete="new-password"
              value={vm.form.password} placeholder={t("register.passwordPlaceholder")} onChange={(e) => vm.set("password", e.target.value)} />
            <button type="button" onClick={vm.toggleShowPassword}
              aria-label={vm.showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center text-[#a19285] hover:text-[#4e342e]">
              {vm.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* ประวัติแพ้อาหาร — ใช้เตือนตอนดูสินค้า (แนะนำสินค้า · ตรวจสารก่อภูมิแพ้) */}
        <div className="pt-1">
          <span className={authLabelClass}>{t("register.allergy")}</span>
          <div className="mb-3 mt-1 grid grid-cols-2 gap-2 rounded-xl bg-stone-100/50 p-1 md:bg-stone-100" role="radiogroup" aria-label={t("register.allergy")}>
            {([false, true] as const).map((v) => (
              <button key={String(v)} type="button" role="radio" aria-checked={vm.form.hasAllergy === v}
                onClick={() => vm.set("hasAllergy", v)}
                className={`rounded-lg py-2 text-xs font-semibold transition sm:text-sm ${
                  vm.form.hasAllergy === v
                    ? v ? "bg-[#4A342E] text-white shadow-sm" : "bg-white text-stone-800 shadow-sm"
                    : "text-stone-200 hover:text-white md:text-stone-500 md:hover:text-stone-800"
                }`}>
                {v ? t("register.hasAllergy") : t("register.noAllergy")}
              </button>
            ))}
          </div>

          {vm.form.hasAllergy && (
            <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/90 p-4 md:bg-stone-50/80">
              <select className={fieldClass} value="" aria-label={t("register.allergyPick")}
                onChange={(e) => vm.addAllergy(e.target.value)}>
                <option value="" disabled>{t("register.allergyPick")}</option>
                {vm.allergyOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">{t("register.allergyCount", { n: vm.form.allergies.length })}</span>
                {vm.form.allergies.length > 0 && (
                  <button type="button" onClick={vm.clearAllergies} className="text-[11px] text-stone-400 underline transition hover:text-red-500">
                    {t("register.allergyClear")}
                  </button>
                )}
              </div>
              {vm.form.allergies.length === 0 ? (
                <p className="m-0 rounded-xl border border-dashed border-stone-300 bg-white/50 px-2 py-3 text-center text-xs text-stone-400">
                  {t("register.allergyEmpty")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {vm.form.allergies.map((name) => (
                    <span key={name} className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFF8E7] py-1.5 pl-3.5 pr-2 text-xs font-semibold text-[#5C3A21]">
                      {name}
                      <button type="button" onClick={() => vm.removeAllergy(name)} aria-label={t("register.allergyRemove", { name })}
                        className="flex h-4 w-4 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-200/60 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={vm.busy}
          onMouseDown={() => setPressed(true)}
          onAnimationEnd={() => setPressed(false)}
          className={`mt-3 cursor-pointer rounded-xl border-none bg-[#f2ae00] py-3.5 text-base font-bold text-white shadow-[0_4px_12px_rgba(242,174,0,0.25)] transition-all disabled:cursor-wait disabled:opacity-70 ${
            vm.busy ? "" : "hover:enabled:-translate-y-px hover:enabled:bg-[#d99c00] hover:enabled:shadow-[0_6px_16px_rgba(242,174,0,0.35)]"
          } ${pressed ? "animate-jelly" : ""}`}
        >
          {vm.busy ? t("register.submitting") : t("register.submit")}
        </button>

        <p className={`m-0 text-center text-xs sm:text-sm ${authMutedClass}`}>
          {t("register.haveAccount")}{" "}
          <Link href={LOGIN_PATH} className={authLinkClass}>{t("auth.submit")}</Link>
        </p>
      </form>
    </AuthBackdrop>
  );
}
