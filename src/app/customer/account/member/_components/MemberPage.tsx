"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/member — สมาชิกของฉัน: แต้มสะสม + คูปอง (BACKLOG3-merge D4 · ปรับหน้าใหม่ 2026-10-26)
//   บนสุด: บัตรสมาชิกขนาดกะทัดรัด (แต้ม · มูลค่า · แต้มใกล้หมดอายุ) + การ์ดทางลัด (คูปองที่ใช้ได้ · คูปองที่แลกได้ด้วยแต้มตอนนี้)
//   4 แท็บ (จำไว้ใน ?tab= — กดย้อนกลับ/แชร์ลิงก์แล้วเปิดแท็บเดิม): คูปองของฉัน · แลกแต้ม · ประวัติแต้ม · วิธีสะสม
// API: GET /shop/points (ยอด · ใกล้หมดอายุ · ประวัติ 50 รายการ · โบนัส · กติกา) · GET /shop/coupons (แลกได้ + ของฉัน)
//      POST /shop/coupons/redeem { promotion_id } (หักแต้ม → ได้คูปอง + แจ้งเตือนในเว็บพร้อมรหัส)
// cache: แต้มใช้ key เดียวกับ checkout (shopPointsKey) · คูปองขึ้นต้นด้วย shopCouponsKey → แลกแล้ว checkout เห็นคูปองใหม่ทันที
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ComponentType } from "react";
import {
  AlertTriangle, Award, Camera, CheckCircle2, ChevronRight, Clock, Gift, Share2, ShoppingBag, Star, Ticket, UserCheck,
} from "lucide-react";
import { shopLoyaltyService, pointsToBaht, type CatalogCoupon, type MyCoupon, type MyPoints } from "@/services/shopLoyalty";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import AccountSideMenu from "@/components/customer/AccountSideMenu";
import { CouponCodeTicket, CouponTicket } from "@/components/customer/CouponTicket";
import { baht, shopPage } from "@/components/customer/shopStyles";
import { shopCouponOverviewKey, shopCouponsKey, shopPointsKey } from "../../../lib/shopQueries";
import { couponLabel } from "../../../lib/couponLabel";
import { formatDate as fmtDate } from "@/i18n/format";
import { MEMBER_TABS, type MemberTab } from "./memberTabs";


const card = "rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6";

const COUPON_STATE: Record<MyCoupon["state"], string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  used: "border-stone-200 bg-stone-100 text-stone-600",
  expired: "border-red-200 bg-red-50 text-red-600",
};
const STATE_ORDER: Record<MyCoupon["state"], number> = { available: 0, used: 1, expired: 2 };

type EarnWay = { icon: ComponentType<{ className?: string }>; title: string; desc: string; points: string; done?: boolean };

function earnWays(p: MyPoints, t: ReturnType<typeof useTranslations<"shop.member.earn">>): EarnWay[] {
  const r = p.rules;
  return [
    { icon: ShoppingBag, title: t("buyTitle"), desc: t("buyDesc", { baht: r.BAHT_PER_POINT }), points: t("buyPoints", { baht: r.BAHT_PER_POINT }) },
    { icon: Gift, title: t("welcomeTitle"), desc: t("welcomeDesc"), points: `+${r.WELCOME}`, done: p.bonuses.welcome },
    { icon: UserCheck, title: t("profileTitle"), desc: t("profileDesc"), points: `+${r.PROFILE}`, done: p.bonuses.profile },
    { icon: Star, title: t("reviewTitle"), desc: t("reviewDesc"), points: `+${r.REVIEW}` },
    { icon: Camera, title: t("photoTitle"), desc: t("photoDesc"), points: `+${r.REVIEW_PHOTO}` },
    { icon: Share2, title: t("shareTitle"), desc: t("shareDesc"), points: `+${r.SHARE}` },
  ];
}

export default function MemberPage({ initialTab }: { initialTab: MemberTab }) {
  const t = useTranslations("shop.member");
  return (
    <CustomerAuthGate message={t("loginToView")}>
      <MemberContent initialTab={initialTab} />
    </CustomerAuthGate>
  );
}

function MemberContent({ initialTab }: { initialTab: MemberTab }) {
  const t = useTranslations("shop.member");
  const to = useTranslations("shop.orders");
  const ta = useTranslations("shop.accountMenu");
  const tc = useTranslations("shop.common");
  const locale = useLocale();
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useCustomerSession();
  // แต้มเปลี่ยนได้ตลอด (สั่งซื้อ · รีวิว) → โหลดใหม่ทุกครั้งที่เปิดหน้า
  const pointsQ = useQuery({ queryKey: shopPointsKey, queryFn: shopLoyaltyService.points, refetchOnMount: "always" });
  const couponsQ = useQuery({ queryKey: shopCouponOverviewKey, queryFn: shopLoyaltyService.overview });

  // แท็บ — state ในหน้า + ?tab= (router.replace ไม่เพิ่มประวัติทุกครั้งที่สลับ · ไม่เลื่อนหน้า)
  const [tab, setTabState] = useState<MemberTab>(initialTab);
  const setTab = (next: MemberTab) => {
    setTabState(next);
    router.replace(next === "coupons" ? pathname : `${pathname}?tab=${next}`, { scroll: false });
  };

  const redeem = useMutation({
    mutationFn: (c: CatalogCoupon) => shopLoyaltyService.redeem(c._id),
    onSuccess: () => {
      alert.success(t("redeemed"));
      setTab("coupons");
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("redeemFailed")),
    // สำเร็จหรือไม่ก็โหลดใหม่ — แต้ม/สิทธิ์อาจเปลี่ยนจากที่อื่น · แจ้งเตือนคูปองใหม่ขึ้นที่กระดิ่ง
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: shopPointsKey }),
        qc.invalidateQueries({ queryKey: shopCouponsKey }),
        qc.invalidateQueries({ queryKey: ["shop", "notifications"] }),
      ]),
  });

  // แลกแต้มเป็นคูปองส่วนลดบาท (100 แต้ม = ฿10 · ทีละ 10 แต้ม) → ได้คูปองของฉัน ใช้ที่หน้าชำระเงิน
  const convert = useMutation({
    mutationFn: (points: number) => shopLoyaltyService.convert(points),
    onSuccess: () => {
      alert.success(t("convertDone"));
      setTab("coupons");
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("convertFailed")),
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: shopPointsKey }),
        qc.invalidateQueries({ queryKey: shopCouponsKey }),
        qc.invalidateQueries({ queryKey: shopCouponOverviewKey }),
        qc.invalidateQueries({ queryKey: ["shop", "notifications"] }),
      ]),
  });
  const onConvert = async (points: number) => {
    if (!p) return;
    const ok = await confirmAlert(t("convertConfirm", { points: points.toLocaleString(), baht: baht(pointsToBaht(points, p.rules)) }), {
      title: t("convertTitle"),
      confirmText: t("convertNow"),
      cancelText: tc("cancel"),
    });
    if (ok) convert.mutate(points);
  };

  const onRedeem = async (c: CatalogCoupon) => {
    const ok = await confirmAlert(t("redeemConfirm", { points: c.points_cost.toLocaleString(), name: c.promotion_name }), {
      title: t("redeemTitle"),
      confirmText: t("redeemNow"),
      cancelText: tc("cancel"),
    });
    if (ok) redeem.mutate(c);
  };

  const p = pointsQ.data;
  const balance = p?.balance ?? 0;
  const minToRedeem = p?.rules.MIN_BALANCE_TO_REDEEM ?? 100;
  const catalog = couponsQ.data?.catalog ?? [];
  const myCoupons = couponsQ.data?.coupons ?? [];
  const usableCount = myCoupons.filter((c) => c.state === "available").length;
  const canRedeem = (c: CatalogCoupon) => balance >= c.points_cost && balance >= minToRedeem && !c.limit_reached;
  const redeemableCount = catalog.filter(canRedeem).length;

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb items={[{ label: to("myAccount"), href: "/customer/account" }, { label: ta("member") }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <AccountSideMenu />
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            {/* หัวข้อหน้า — ทุกหน้าในบัญชีมีชื่อหน้า (2026-10-26) */}
            <header className="border-b border-stone-200 pb-5">
              <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-stone-800 sm:text-2xl">
                <Star className="h-6 w-6 text-[#4A342E]" aria-hidden="true" /> {t("title")}
              </h1>
            </header>
            {pointsQ.isLoading ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center text-sm text-stone-500">{t("loading")}</p>
            ) : pointsQ.isError || !p ? (
              <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
                {t("refresh", { error: isApiError(pointsQ.error) ? pointsQ.error.message : t("loadFailed") })}
              </p>
            ) : (
              <>
                {/* ── บัตรสมาชิก (กะทัดรัด) + ทางลัดคูปอง ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[#5d423b] bg-gradient-to-br from-[#4a342e] to-[#8C5A3C] px-5 py-4 text-white shadow-md">
                    <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
                    <div className="relative z-10 min-w-0 flex-1">
                      <p className="m-0 truncate text-base font-bold text-stone-100">{user?.fullname || "-"}</p>
                      <p className="m-0 text-xs text-stone-300">{t("balanceLabel")}</p>
                      <p className="m-0 mt-0.5 text-2xl font-black leading-tight text-amber-400">
                        {balance.toLocaleString()} <span className="text-xs font-normal text-stone-200">{t("pointsUnit")}</span>
                      </p>
                      <p className="m-0 text-xs text-stone-300">{t("worth", { amount: baht(pointsToBaht(balance, p.rules)) })}</p>
                    </div>
                    <span className="relative z-10 shrink-0 self-start rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                      {t("cardBadge")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 rounded-2xl border border-[#8C5A3C]/15 bg-white p-3 shadow-sm">
                    <ShortcutRow
                      icon={<Ticket className="h-5 w-5 text-[#8C5A3C]" aria-hidden="true" />}
                      label={t("shortcutUsable")}
                      value={couponsQ.isPending ? "…" : t("couponCount", { n: usableCount })}
                      onClick={() => setTab("coupons")}
                    />
                    <ShortcutRow
                      icon={<Gift className="h-5 w-5 text-amber-600" aria-hidden="true" />}
                      label={t("shortcutRedeemable")}
                      value={couponsQ.isPending ? "…" : t("couponCount", { n: redeemableCount })}
                      onClick={() => setTab("redeem")}
                    />
                  </div>
                </div>

                {p.expiring_soon.points > 0 && p.expiring_soon.first_date && (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                    <p className="m-0">
                      {t.rich("expiring", {
                        n: p.expiring_soon.points.toLocaleString(),
                        date: fmtDate(p.expiring_soon.first_date, locale),
                        b: (c) => <strong>{c}</strong>,
                      })}
                    </p>
                  </div>
                )}

                {/* ── แท็บ ── */}
                <div role="tablist" aria-label={t("title")} className="grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1 sm:grid-cols-4">
                  {MEMBER_TABS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      id={`member-tab-${k}`}
                      aria-selected={tab === k}
                      aria-controls={`member-panel-${k}`}
                      onClick={() => setTab(k)}
                      className={`h-[44px] rounded-xl text-sm font-semibold transition ${
                        tab === k ? "bg-white text-[#4A342E] shadow-sm" : "text-stone-600 hover:text-[#4A342E]"
                      }`}
                    >
                      {t(`tabs.${k}`)}
                    </button>
                  ))}
                </div>

                <section role="tabpanel" id={`member-panel-${tab}`} aria-labelledby={`member-tab-${tab}`} className={`${card} space-y-4`}>
                  {tab === "coupons" && <MyCouponsTab coupons={myCoupons} loading={couponsQ.isPending} failed={couponsQ.isError} onRedeem={() => setTab("redeem")} />}
                  {tab === "redeem" && (
                    <RedeemTab
                      points={p}
                      converting={convert.isPending}
                      onConvert={(n) => void onConvert(n)}
                      catalog={catalog}
                      balance={balance}
                      loading={couponsQ.isPending}
                      failed={couponsQ.isError}
                      canRedeem={canRedeem}
                      busyId={redeem.isPending ? redeem.variables?._id ?? null : null}
                      onRedeem={(c) => void onRedeem(c)}
                    />
                  )}
                  {tab === "history" && <HistoryTab p={p} />}
                  {tab === "earn" && <EarnTab p={p} />}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-[#FAF6F0]"
    >
      {icon}
      <span className="min-w-0 flex-1 text-sm text-stone-700">{label}</span>
      <span className="shrink-0 text-sm font-bold text-[#4A342E]">{value}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" />
    </button>
  );
}

function MyCouponsTab({ coupons, loading, failed, onRedeem }: { coupons: MyCoupon[]; loading: boolean; failed: boolean; onRedeem: () => void }) {
  const t = useTranslations("shop.member");
  const tcp = useTranslations("shop.coupons");
  const locale = useLocale();
  const sorted = [...coupons].sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || a.expires_at.localeCompare(b.expires_at));
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 flex items-center gap-2 text-base font-bold text-stone-800">
          <Ticket className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> {t("myCoupons")}
        </h2>
        {coupons.some((c) => c.state === "available") && (
          <Link href="/customer/cart" className="text-xs font-semibold text-[#8C5A3C] hover:text-[#4A342E]">{t("useInCart")}</Link>
        )}
      </div>
      {loading ? (
        <p className="py-6 text-center text-sm text-stone-500">{t("loadingCoupons")}</p>
      ) : failed ? (
        <p className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">{t("couponsFailed")}</p>
      ) : sorted.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed border-stone-200 bg-stone-50 py-8 text-center">
          <p className="m-0 text-sm text-stone-600">{t("noCoupons")}</p>
          <button type="button" onClick={onRedeem} className="text-sm font-semibold text-[#8C5A3C] hover:underline">{t("goRedeem")}</button>
        </div>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 xl:grid-cols-2">
          {sorted.map((c) => (
            <li key={c._id}>
              <CouponCodeTicket
                code={c.promotion_code}
                type={c.discount_type}
                value={c.discount_value}
                title={c.promotion_name}
                muted={c.state !== "available"}
                badge={<span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${COUPON_STATE[c.state]}`}>{t(`state.${c.state}`)}</span>}
                lines={[
                  `${couponLabel(c, tcp)}${c.min_order_amount ? t("minOrder", { amount: baht(c.min_order_amount) }) : ""}`,
                  tcp("validUntil", { date: fmtDate(c.expires_at, locale) }),
                ]}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="m-0 text-xs text-stone-500">{t("couponHowTo")}</p>
    </>
  );
}

function RedeemTab({
  points, converting, onConvert, catalog, balance, loading, failed, canRedeem, busyId, onRedeem,
}: {
  points: MyPoints;
  converting: boolean;
  onConvert: (points: number) => void;
  catalog: CatalogCoupon[];
  balance: number;
  loading: boolean;
  failed: boolean;
  canRedeem: (c: CatalogCoupon) => boolean;
  busyId: string | null;
  onRedeem: (c: CatalogCoupon) => void;
}) {
  const t = useTranslations("shop.member");
  const tcp = useTranslations("shop.coupons");
  const locale = useLocale();
  // แลกได้ตอนนี้ขึ้นก่อน แล้วตามแต้มที่ใช้น้อยไปมาก
  const sorted = [...catalog].sort((a, b) => Number(canRedeem(b)) - Number(canRedeem(a)) || a.points_cost - b.points_cost);
  return (
    <>
      <PointsExchange points={points} busy={converting} onConvert={onConvert} />
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 flex items-center gap-2 text-base font-bold text-stone-800">
          <Gift className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> {t("redeemCoupons")}
        </h2>
        <span className="text-xs text-stone-500">{t("have", { n: balance.toLocaleString() })}</span>
      </div>
      {loading ? (
        <p className="py-6 text-center text-sm text-stone-500">{t("loadingCoupons")}</p>
      ) : failed ? (
        <p className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">{t("couponsFailed")}</p>
      ) : sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 py-8 text-center text-sm text-stone-500">{t("noCatalog")}</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 xl:grid-cols-2">
          {sorted.map((c) => {
            const ok = canRedeem(c);
            const busy = busyId === c._id;
            return (
              <li key={c._id}>
                <CouponTicket
                  type={c.discount_type}
                  value={c.discount_value}
                  title={c.promotion_name}
                  muted={!ok}
                  lines={[
                    `${couponLabel(c, tcp)}${c.min_order_amount ? t("minOrder", { amount: baht(c.min_order_amount) }) : ""}${t("until", { date: fmtDate(c.end_date, locale) })}`,
                    c.promotion_desc,
                  ]}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-amber-100/70 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {t("pointsBadge", { points: c.points_cost.toLocaleString() })}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRedeem(c)}
                      disabled={!ok || busyId !== null}
                      className="h-[40px] rounded-xl border border-[#8C5A3C]/30 bg-white px-3 text-sm font-bold text-[#4A342E] shadow-sm transition hover:bg-[#4A342E] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-500 disabled:shadow-none"
                    >
                      {busy ? t("redeeming") : c.limit_reached ? t("limitReached") : ok ? t("redeem") : t("notEnough")}
                    </button>
                  </div>
                </CouponTicket>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function HistoryTab({ p }: { p: MyPoints }) {
  const t = useTranslations("shop.member");
  const locale = useLocale();
  return (
    <>
      <h2 className="m-0 flex items-center gap-2 text-base font-bold text-stone-800">
        <Clock className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> {t("history")}
      </h2>
      {p.history.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">{t("noHistory")}</p>
      ) : (
        <ul className="m-0 list-none divide-y divide-stone-100 p-0">
          {p.history.map((h) => (
            <li key={h._id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 space-y-0.5">
                <p className="m-0 text-sm font-semibold text-stone-800">{h.description}</p>
                <p className="m-0 text-xs text-stone-500">{fmtDate(h.created_at, locale)}</p>
              </div>
              <span className={`shrink-0 text-sm font-bold ${h.points >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {h.points >= 0 ? "+" : ""}
                {h.points.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
      {p.history.length >= 50 && <p className="m-0 text-center text-xs text-stone-500">{t("latest50")}</p>}
    </>
  );
}

function EarnTab({ p }: { p: MyPoints }) {
  const t = useTranslations("shop.member");
  const te = useTranslations("shop.member.earn");
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="m-0 flex items-center gap-2 text-base font-bold text-stone-800">
          <Gift className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> {t("howToEarn")}
        </h2>
        <ul className="m-0 list-none space-y-2.5 p-0">
          {earnWays(p, te).map(({ icon: Icon, title, desc, points, done }) => (
            <li key={title} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200/60 bg-amber-50">
                <Icon className="h-4 w-4 text-amber-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-sm font-semibold text-stone-800">{title}</p>
                <p className="m-0 text-xs text-stone-500">{desc}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="whitespace-nowrap rounded bg-amber-100/70 px-2 py-0.5 text-xs font-semibold text-amber-800">{t("pointsBadge", { points })}</span>
                {done !== undefined && (
                  <span className={`text-[11px] font-semibold ${done ? "text-emerald-700" : "text-stone-500"}`}>{done ? t("received") : t("notReceived")}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {!p.bonuses.profile && !p.profile_complete && (
          <Link href="/customer/account" className="inline-block text-xs font-semibold text-[#8C5A3C] hover:text-[#4A342E]">
            {t("completeProfile")}
          </Link>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="m-0 flex items-center gap-2 text-base font-bold text-stone-800">
          <Award className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> {t("howToUse")}
        </h2>
        <ul className="m-0 list-none space-y-2 p-0 text-sm text-stone-600">
          {[
            t("rule100", { amount: baht(pointsToBaht(100, p.rules)), step: p.rules.REDEEM_STEP }),
            t("ruleMin", { n: p.rules.MIN_BALANCE_TO_REDEEM }),
            t("ruleMax", { percent: Math.round(p.rules.MAX_REDEEM_RATIO * 100) }),
            t("ruleExpiry", { days: p.rules.EXPIRY_DAYS }),
          ].map((text) => (
            <li key={text} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * แลกแต้มเป็นส่วนลด — 100 แต้ม = ส่วนลด ฿10 · ทีละ 10 แต้ม (กติกาจาก backend POINT_RULES)
 * เลือกจำนวนแต้ม (−/+ ทีละ 10 หรือกด "ใช้ทั้งหมด") → ได้คูปองส่วนลดบาท 1 ใบ เลือกใช้ที่หน้าชำระเงิน
 */
function PointsExchange({ points, busy, onConvert }: { points: MyPoints; busy: boolean; onConvert: (points: number) => void }) {
  const t = useTranslations("shop.member");
  const { balance, rules } = points;
  const step = rules.REDEEM_STEP;
  const min = rules.MIN_BALANCE_TO_REDEEM;
  const maxPts = balance - (balance % step);
  const [amount, setAmount] = useState(min);
  const clamp = (n: number) => Math.min(Math.max(min, n - (n % step)), Math.max(min, maxPts));
  const value = clamp(amount);
  const enough = balance >= min;
  const perMin = pointsToBaht(min, rules);
  return (
    <div className="space-y-3 rounded-2xl border border-[#8C5A3C]/20 bg-[#FAF6F0] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="m-0 flex items-center gap-2 text-base font-bold text-stone-800">
            <Award className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> {t("convertHeading")}
          </h2>
          <p className="m-0 mt-0.5 text-sm font-semibold text-[#8C5A3C]">
            {t("convertRule", { min: min.toLocaleString(), baht: baht(perMin), step: step.toLocaleString() })}
          </p>
        </div>
        <span className="text-xs text-stone-500">{t("have", { n: balance.toLocaleString() })}</span>
      </div>

      {!enough ? (
        <p className="m-0 rounded-xl bg-white px-3 py-2 text-sm text-stone-600">{t("convertNotEnough", { min: min.toLocaleString(), need: (min - balance).toLocaleString() })}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center overflow-hidden rounded-xl border border-[#8C5A3C]/30 bg-white">
            <button type="button" aria-label={t("convertLess")} disabled={busy || value <= min} onClick={() => setAmount(value - step)}
              className="flex h-[44px] w-[44px] items-center justify-center font-bold text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40">-</button>
            <input
              type="number"
              inputMode="numeric"
              min={min}
              max={maxPts}
              step={step}
              value={value}
              aria-label={t("convertPoints")}
              onChange={(e) => setAmount(Number(e.target.value) || min)}
              className="h-[44px] w-24 border-none text-center text-sm font-bold outline-none"
            />
            <button type="button" aria-label={t("convertMore")} disabled={busy || value >= maxPts} onClick={() => setAmount(value + step)}
              className="flex h-[44px] w-[44px] items-center justify-center font-bold text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40">+</button>
          </div>
          <button type="button" disabled={busy || value >= maxPts} onClick={() => setAmount(maxPts)}
            className="text-sm font-semibold text-[#8C5A3C] hover:underline disabled:opacity-40">{t("convertAll")}</button>
          <span className="text-sm text-stone-700">
            = {t("convertGet", { baht: baht(pointsToBaht(value, rules)) })}
          </span>
          <button type="button" disabled={busy} onClick={() => onConvert(value)}
            className="ml-auto h-[44px] rounded-xl bg-[#4A342E] px-4 text-sm font-bold text-white hover:bg-[#8C5A3C] disabled:opacity-50">
            {busy ? t("redeeming") : t("convertNow")}
          </button>
        </div>
      )}
      <p className="m-0 text-xs text-stone-500">{t("convertHint")}</p>
    </div>
  );
}
