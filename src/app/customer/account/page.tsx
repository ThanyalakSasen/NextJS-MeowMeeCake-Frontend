"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account — บัญชีของฉัน (BACKLOG3-merge B2) · ยกจาก FrontOffice src/app/customer/account/page.tsx
//   + LineConnectCard + line-welcome (กรอกอีเมลของบัญชี LINE) — ชั้น API เป็น /shop/me* ของ backend หลัก
//   ข้อมูลส่วนตัว: PATCH /shop/me (ชื่อ · เบอร์ · วันเกิด) · อีเมลแก้ไม่ได้ (FrontOffice แก้ผ่าน /api/users ซึ่งหลักไม่เปิดให้ลูกค้า)
//   อาหารที่แพ้: PATCH /shop/me { user_allergies } — ตัวเลือกจาก /catalog/ingredients
//   LINE: /shop/me/line (ผูก → หน้ายินยอมของ LINE → backend กลับมาที่ /profile → /profile ส่งลูกค้าต่อมาที่นี่พร้อม ?line=)
//   บัญชีที่สมัครด้วย LINE แล้วไม่มีอีเมล: POST /shop/me/email (ตั้งอีเมลจริง + ส่งลิงก์ยืนยัน)
//   บัญชีพร้อมเพย์รับเงินคืน: PATCH /shop/me { refund_promptpay_id/name } — เว้นว่างเลข = ลบ (BACKLOG4 U9 · backend Q-BE12)
// ─────────────────────────────────────────────────────────────
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { MailWarning, Pencil, X } from "lucide-react";
import { isLinePlaceholderEmail, shopProfileService, type ShopProfile } from "@/services/shopProfile";
import { shopLineService } from "@/services/shopLine";
import { catalogService } from "@/services/catalog";
import { resendVerification } from "@/lib/authClient";
import { formatPromptpayId, isPromptpayId, normalizePromptpayId } from "@/lib/promptpay";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import AccountSideMenu from "@/components/customer/AccountSideMenu";
import { shopButton, shopButtonPrimary, shopInput, shopPage } from "@/components/customer/shopStyles";
import { shopEmailStatusKey, shopLineStatusKey, shopProfileKey } from "../lib/shopQueries";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{8,9}$/;
const section = "rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs sm:p-7";
const field = "space-y-1 rounded-xl border border-stone-100 bg-stone-50/50 p-3.5";

const LINE_RESULT: Record<string, { type: "success" | "info" | "error"; key: "lineLinked" | "lineCancelled" | "lineError" }> = {
  linked: { type: "success", key: "lineLinked" },
  cancelled: { type: "info", key: "lineCancelled" },
  error: { type: "error", key: "lineError" },
};

const birthdayText = (iso: string | null, locale: string) =>
  iso ? new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "th-TH", { day: "numeric", month: "long", year: "numeric" }) : "-";

export default function AccountPage() {
  const t = useTranslations("shop.account");
  return (
    <CustomerAuthGate message={t("loginToManage")}>
      <Suspense fallback={null}>
        <AccountContent />
      </Suspense>
    </CustomerAuthGate>
  );
}

function AccountContent() {
  const t = useTranslations("shop.account");
  const tc = useTranslations("shop.common");
  const profileQ = useQuery({ queryKey: shopProfileKey, queryFn: shopProfileService.get });
  const emailQ = useQuery({ queryKey: shopEmailStatusKey, queryFn: shopProfileService.emailStatus });
  useLineResultToast();

  const profile = profileQ.data;
  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: t("myAccount") }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <AccountSideMenu />
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <h1 className="m-0 text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">{t("profileTitle")}</h1>
            {profileQ.isLoading ? (
              <div className="h-10 w-10 animate-spin self-center rounded-full border-4 border-[#8C5A3C]/20 border-t-[#8C5A3C]" aria-label={tc("loading")} />
            ) : !profile ? (
              <p className="text-sm text-red-700">{t("loadFailed")}</p>
            ) : (
              <>
                {emailQ.data?.auth_provider === "line" && <LineAccountEmail status={emailQ.data} />}
                <ProfileSection profile={profile} />
                <RefundAccountSection profile={profile} />
                <LineSection authProvider={profile.auth_provider} />
                <AllergySection profile={profile} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** ผลจากการผูก LINE (backend → /profile → ที่นี่พร้อม ?line=) — แจ้งครั้งเดียวแล้วลบ query */
function useLineResultToast() {
  const t = useTranslations("shop.account");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const done = useRef(false);
  useEffect(() => {
    const result = params.get("line");
    if (!result || done.current) return;
    done.current = true;
    const msg =
      result === "error" && params.get("reason") === "login_required"
        ? { type: "error" as const, text: t("lineSessionExpired") }
        : (({ type, key }) => ({ type, text: t(key) }))(LINE_RESULT[result] ?? LINE_RESULT.error);
    alert[msg.type](msg.text);
    qc.invalidateQueries({ queryKey: shopLineStatusKey });
    qc.invalidateQueries({ queryKey: shopEmailStatusKey });
    router.replace(pathname, { scroll: false });
  }, [params, router, pathname, qc, t]);
}

// ── บัญชีที่สมัครด้วย LINE: กรอกอีเมลจริง / รอยืนยัน (แทนหน้า line-welcome ของ FrontOffice) ──
function LineAccountEmail({ status }: { status: { needs_email: boolean; email: string | null; email_verified: boolean } }) {
  const t = useTranslations("shop.account");
  const tc = useTranslations("shop.common");
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const save = useMutation({
    mutationFn: () => shopProfileService.setEmail(email.trim().toLowerCase()),
    onSuccess: (message) => {
      alert.success(message ?? t("emailSaved"));
      setEmail("");
      qc.invalidateQueries({ queryKey: shopEmailStatusKey });
      qc.invalidateQueries({ queryKey: shopProfileKey });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("emailSaveFailed")),
  });
  const resend = useMutation({
    mutationFn: () => resendVerification(status.email ?? ""),
    onSuccess: () => alert.success(t("resent")),
    onError: (e) => alert.error(isApiError(e) ? e.message : t("resendFailed")),
  });

  if (!status.needs_email && status.email_verified) return null;
  const canEdit = status.needs_email || !status.email_verified;
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
        <div>
          <h2 className="m-0 text-base font-bold text-amber-900">
            {status.needs_email ? t("addEmail") : t("awaitVerify")}
          </h2>
          <p className="m-0 mt-1 text-sm leading-relaxed text-amber-900/80">
            {status.needs_email
              ? t("lineNoEmail")
              : t.rich("sentTo", { email: status.email ?? "", b: (c) => <strong>{c}</strong> })}
          </p>
        </div>
      </div>
      {canEdit && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            className={shopInput}
            placeholder="you@example.com"
            aria-label={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="button"
            className={`${shopButtonPrimary} shrink-0`}
            disabled={!EMAIL_RE.test(email.trim()) || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? tc("saving") : t("saveAndSend")}
          </button>
          {!status.needs_email && status.email && (
            <button type="button" className={`${shopButton} shrink-0`} disabled={resend.isPending} onClick={() => resend.mutate()}>
              {resend.isPending ? t("sending") : t("resend")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// ── ข้อมูลส่วนตัว + หน้าต่างแก้ไข ──
function ProfileSection({ profile }: { profile: ShopProfile }) {
  const t = useTranslations("shop.account");
  const tc = useTranslations("shop.common");
  const locale = useLocale();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  // today = YYYY-MM-DD ณ ตอนเปิดหน้าต่าง (อ่านเวลาใน handler ไม่ใช่ตอน render — กติกา React Compiler)
  const [form, setForm] = useState({ name: "", phone: "", birthday: "", today: "" });
  const openEdit = () => {
    setForm({
      name: profile.user_fullname,
      phone: profile.user_phone ?? "",
      birthday: profile.user_birthdate ? profile.user_birthdate.slice(0, 10) : "",
      today: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };
  const save = useMutation({
    mutationFn: () =>
      shopProfileService.update({
        user_fullname: form.name.trim(),
        user_phone: form.phone.trim() || null,
        user_birthdate: form.birthday || null,
      }),
    onSuccess: (p) => {
      qc.setQueryData(shopProfileKey, p);
      setOpen(false);
      alert.success(t("profileSaved"));
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("profileSaveFailed")),
  });

  const name = form.name.trim();
  const problem =
    !name || name.length > 120
      ? t("nameRequired")
      : form.phone && !PHONE_RE.test(form.phone.trim())
        ? t("phoneInvalid")
        : form.birthday && form.birthday > form.today
          ? t("birthdayFuture")
          : null;
  const shownEmail = isLinePlaceholderEmail(profile.email) ? t("notSet") : profile.email;

  return (
    <section className={section}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="m-0 text-base font-bold text-stone-900">{t("accountInfo")}</h2>
        <button type="button" onClick={openEdit} className={`${shopButton} !px-3 !py-1.5 text-sm`}>
          <Pencil className="h-3.5 w-3.5" /> {t("edit")}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        {[
          { label: t("fullName"), value: profile.user_fullname || "-" },
          { label: t("email"), value: shownEmail },
          { label: t("phone"), value: profile.user_phone || "-" },
          { label: t("birthday"), value: birthdayText(profile.user_birthdate, locale) },
        ].map(({ label, value }) => (
          <div key={label} className={field}>
            <span className="block text-xs font-medium text-stone-400">{label}</span>
            <span className="block break-all font-semibold text-stone-800">{value}</span>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        title={t("editProfile")}
        onCancel={() => setOpen(false)}
        onOk={() => save.mutate()}
        okText={save.isPending ? tc("saving") : t("save")}
        cancelText={tc("cancel")}
        okButtonProps={{ disabled: !!problem || save.isPending }}
        destroyOnHidden
      >
        <div className="flex flex-col gap-3 text-sm">
          <label className="space-y-1">
            <span className="block font-semibold text-stone-700">{t("fullName")}</span>
            <input className={shopInput} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="block font-semibold text-stone-700">{t("email")}</span>
            <input className={`${shopInput} cursor-not-allowed bg-stone-100 text-stone-500`} value={shownEmail} disabled readOnly />
            <span className="block text-xs text-stone-400">{t("emailLocked")}</span>
          </label>
          <label className="space-y-1">
            <span className="block font-semibold text-stone-700">{t("phone")}</span>
            <input className={shopInput} inputMode="tel" maxLength={10} placeholder="0812345678" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} />
          </label>
          <label className="space-y-1">
            <span className="block font-semibold text-stone-700">{t("birthday")}</span>
            <input type="date" className={shopInput} max={form.today} value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
          </label>
          {problem && <p className="m-0 text-xs text-red-600">{problem}</p>}
          <p className="m-0 text-xs text-stone-400">{t("bonusHint")}</p>
        </div>
      </Modal>
    </section>
  );
}

// ── บัญชีพร้อมเพย์รับเงินคืน + หน้าต่างแก้ไข (ต้นแบบ FrontOffice) — เว้นว่างเลขแล้วบันทึก = ลบบัญชี ──
function RefundAccountSection({ profile }: { profile: ShopProfile }) {
  const t = useTranslations("shop.account");
  const tc = useTranslations("shop.common");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: "", name: "" });
  const openEdit = () => {
    setForm({ id: profile.refund_promptpay_id ?? "", name: profile.refund_promptpay_name ?? "" });
    setOpen(true);
  };

  const id = normalizePromptpayId(form.id);
  const name = form.name.trim();
  const save = useMutation({
    mutationFn: () => shopProfileService.update({ refund_promptpay_id: id || null, refund_promptpay_name: id ? name : null }),
    onSuccess: (p) => {
      qc.setQueryData(shopProfileKey, p);
      setOpen(false);
      alert.success(id ? t("refundSaved") : t("refundRemoved"));
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("refundSaveFailed")),
  });
  const problem = id && !isPromptpayId(id) ? t("refundIdInvalid") : id && !name ? t("refundNameRequired") : null;
  const current = profile.refund_promptpay_id;

  return (
    <section className={section}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-bold text-stone-900">{t("refundTitle")}</h2>
          <p className="m-0 mt-1 text-xs text-stone-500">{t("refundHint")}</p>
        </div>
        <button type="button" onClick={openEdit} className={`${shopButton} shrink-0 !px-3 !py-1.5 text-sm`}>
          <Pencil className="h-3.5 w-3.5" /> {current ? t("edit") : t("refundAdd")}
        </button>
      </div>
      {current ? (
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {[
            { label: t("refundId"), value: formatPromptpayId(current) },
            { label: t("refundName"), value: profile.refund_promptpay_name || "-" },
          ].map(({ label, value }) => (
            <div key={label} className={field}>
              <span className="block text-xs font-medium text-stone-400">{label}</span>
              <span className="block break-all font-semibold text-stone-800">{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="m-0 rounded-xl border border-dashed border-stone-300 px-3 py-4 text-center text-xs text-stone-400">{t("refundEmpty")}</p>
      )}

      <Modal
        open={open}
        title={t("refundTitle")}
        onCancel={() => setOpen(false)}
        onOk={() => save.mutate()}
        okText={save.isPending ? tc("saving") : t("save")}
        cancelText={tc("cancel")}
        okButtonProps={{ disabled: !!problem || save.isPending }}
        destroyOnHidden
      >
        <div className="flex flex-col gap-3 text-sm">
          <label className="space-y-1">
            <span className="block font-semibold text-stone-700">{t("refundId")}</span>
            <input className={shopInput} inputMode="numeric" maxLength={17} placeholder={t("refundIdPlaceholder")} value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value.replace(/[^\d\s-]/g, "") })} />
          </label>
          <label className="space-y-1">
            <span className="block font-semibold text-stone-700">{t("refundName")}</span>
            <input className={shopInput} maxLength={100} placeholder={t("refundNamePlaceholder")} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          {problem && <p className="m-0 text-xs text-red-600">{problem}</p>}
          <p className="m-0 text-xs text-stone-400">{t("refundModalHint")}</p>
        </div>
      </Modal>
    </section>
  );
}

// ── LINE: ผูก / ยกเลิก (ย่อจาก FrontOffice LineConnectCard) ──
function LineSection({ authProvider }: { authProvider: ShopProfile["auth_provider"] }) {
  const t = useTranslations("shop.account");
  const qc = useQueryClient();
  const statusQ = useQuery({ queryKey: shopLineStatusKey, queryFn: shopLineService.status });
  // ขอ authorize_url ใหม่ทุกครั้งที่กด (อายุ 10 นาที) แล้วเปลี่ยนหน้าทั้งหน้าไป LINE
  const connect = useMutation({
    mutationFn: shopLineService.status,
    onSuccess: (s) => {
      if (s.linked) return void qc.setQueryData(shopLineStatusKey, s);
      if (!s.authorize_url) return void alert.error(t("lineNotSetUp"));
      window.location.href = s.authorize_url;
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("lineConnectFailed")),
  });
  const unlink = useMutation({
    mutationFn: shopLineService.unlink,
    onSuccess: () => {
      alert.success(t("lineUnlinked"));
      qc.invalidateQueries({ queryKey: shopLineStatusKey });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("lineUnlinkFailed")),
  });
  const onUnlink = async () => {
    const ok = await confirmAlert(t("lineUnlinkConfirm"), {
      title: t("lineUnlinkTitle"),
      confirmText: t("unlink"),
      cancelText: t("no"),
      danger: true,
    });
    if (ok) unlink.mutate();
  };

  const linked = !!statusQ.data?.linked;
  return (
    <section className={`${section} flex flex-wrap items-center justify-between gap-3`}>
      <div>
        <h2 className="m-0 flex items-center gap-2 text-base font-bold text-stone-900">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#06C755] text-[10px] font-black text-white">LINE</span>
          LINE
        </h2>
        <p className="m-0 mt-1 text-xs text-stone-500">
          {linked ? t("lineLinkedHint") : t("lineConnectHint")}
        </p>
      </div>
      {statusQ.isLoading ? null : linked ? (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#06C755]">{t("linked")}</span>
          {/* บัญชีที่สมัครด้วย LINE ยกเลิกไม่ได้ — จะเข้าสู่ระบบไม่ได้อีก (ไม่มีรหัสผ่าน) */}
          {authProvider !== "line" && (
            <button type="button" onClick={() => void onUnlink()} disabled={unlink.isPending}
              className="rounded-xl border border-red-600/30 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50">
              {t("unlink")}
            </button>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => connect.mutate()} disabled={connect.isPending}
          className="rounded-xl bg-[#06C755] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#05b14c] disabled:opacity-60">
          {connect.isPending ? t("goingToLine") : t("connectLine")}
        </button>
      )}
    </section>
  );
}

// ── วัตถุดิบที่แพ้ — เพิ่ม/ลบแล้วบันทึกทันที ──
function AllergySection({ profile }: { profile: ShopProfile }) {
  const t = useTranslations("shop.account");
  const tc = useTranslations("shop.common");
  const qc = useQueryClient();
  const ingredientsQ = useQuery({ queryKey: ["catalog", "ingredients"], queryFn: catalogService.ingredients, staleTime: 10 * 60_000 });
  const save = useMutation({
    mutationFn: (list: string[]) => shopProfileService.update({ user_allergies: list }),
    onSuccess: (p) => qc.setQueryData(shopProfileKey, p),
    onError: (e) => alert.error(isApiError(e) ? e.message : t("allergySaveFailed")),
  });
  const list = profile.user_allergies;
  const options = (ingredientsQ.data ?? []).map((i) => i.ingredient_name).filter((n) => !list.includes(n));

  return (
    <section className={section}>
      <h2 className="m-0 text-base font-bold text-stone-900">{t("allergies")}</h2>
      <p className="m-0 mb-4 mt-1 text-xs text-stone-500">{t("allergyHint")}</p>
      <select className={`${shopInput} mb-3 max-w-sm`} value="" disabled={save.isPending} aria-label={t("addAllergy")}
        onChange={(e) => e.target.value && save.mutate([...list, e.target.value])}>
        <option value="" disabled>{ingredientsQ.isLoading ? tc("loadingDots") : t("addAllergyOption")}</option>
        {options.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      {list.length === 0 ? (
        <p className="m-0 rounded-xl border border-dashed border-stone-300 px-3 py-4 text-center text-xs text-stone-400">{t("noAllergies")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {list.map((name) => (
            <span key={name} className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFF8E7] py-1.5 pl-3.5 pr-2 text-xs font-semibold text-[#5C3A21]">
              {name}
              <button type="button" aria-label={t("removeItem", { name })} disabled={save.isPending}
                onClick={() => save.mutate(list.filter((a) => a !== name))}
                className="flex h-4 w-4 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-200/60 hover:text-red-500">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
