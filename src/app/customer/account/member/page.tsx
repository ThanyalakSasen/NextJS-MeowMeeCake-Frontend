"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/member — สมาชิกของฉัน: แต้มสะสม + คูปอง (BACKLOG3-merge D4) · ยกจาก FrontOffice src/app/customer/account/member/page.tsx
// API: GET /shop/points (ยอด · ใกล้หมดอายุ · ประวัติ 50 รายการ · โบนัส · กติกา) · GET /shop/coupons (แลกได้ + ของฉัน)
//      POST /shop/coupons/redeem { promotion_id } (หักแต้ม → ได้คูปอง ใช้ได้ที่หน้า checkout)
// cache: แต้มใช้ key เดียวกับ checkout (shopPointsKey) · คูปองขึ้นต้นด้วย shopCouponsKey → แลกแล้ว checkout เห็นคูปองใหม่ทันที
// ไม่ยกมา: แชร์สินค้ารับแต้ม (POST /shop/points/share) อยู่ในหน้ารายละเอียดสินค้า (C1) · ที่นี่แสดงเป็นวิธีสะสมแต้มอย่างเดียว
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ComponentType } from "react";
import {
  AlertTriangle, Award, Camera, CheckCircle2, Clock, Gift, Share2, ShoppingBag, Star, Ticket, UserCheck,
} from "lucide-react";
import { shopLoyaltyService, pointsToBaht, type CatalogCoupon, type MyCoupon, type MyPoints } from "@/services/shopLoyalty";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { baht, shopPage } from "@/components/customer/shopStyles";
import { shopCouponOverviewKey, shopCouponsKey, shopPointsKey } from "../../lib/shopQueries";
import { couponLabel } from "../../lib/couponLabel";
import { formatDate as fmtDate } from "@/i18n/format";

const card = "rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6";

const COUPON_STATE: Record<MyCoupon["state"], { className: string }> = {
  available: { className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  used: { className: "border-stone-200 bg-stone-100 text-stone-500" },
  expired: { className: "border-red-200 bg-red-50 text-red-500" },
};

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

export default function MemberPage() {
  const t = useTranslations("shop.member");
  return (
    <CustomerAuthGate message={t("loginToView")}>
      <MemberContent />
    </CustomerAuthGate>
  );
}

function MemberContent() {
  const t = useTranslations("shop.member");
  const te = useTranslations("shop.member.earn");
  const tcp = useTranslations("shop.coupons");
  const tc = useTranslations("shop.common");
  const to = useTranslations("shop.orders");
  const ta = useTranslations("shop.accountMenu");
  const locale = useLocale();
  const formatDate = (iso: string) => fmtDate(iso, locale);
  const qc = useQueryClient();
  const { user } = useCustomerSession();
  // แต้มเปลี่ยนได้ตลอด (สั่งซื้อ · รีวิว) → โหลดใหม่ทุกครั้งที่เปิดหน้า
  const pointsQ = useQuery({ queryKey: shopPointsKey, queryFn: shopLoyaltyService.points, refetchOnMount: "always" });
  const couponsQ = useQuery({ queryKey: shopCouponOverviewKey, queryFn: shopLoyaltyService.overview });

  const redeem = useMutation({
    mutationFn: (c: CatalogCoupon) => shopLoyaltyService.redeem(c._id),
    onSuccess: () => alert.success(t("redeemed")),
    onError: (e) => alert.error(isApiError(e) ? e.message : t("redeemFailed")),
    // สำเร็จหรือไม่ก็โหลดใหม่ — แต้ม/สิทธิ์อาจเปลี่ยนจากที่อื่น
    onSettled: () => Promise.all([qc.invalidateQueries({ queryKey: shopPointsKey }), qc.invalidateQueries({ queryKey: shopCouponsKey })]),
  });

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
  const progress = Math.round(Math.min((balance / Math.max(minToRedeem, 1)) * 100, 100));
  const catalog = couponsQ.data?.catalog ?? [];
  const myCoupons = couponsQ.data?.coupons ?? [];

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: to("myAccount"), href: "/customer/account" }, { label: ta("member") }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {pointsQ.isLoading ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center text-sm text-stone-500">{t("loading")}</p>
            ) : pointsQ.isError || !p ? (
              <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
                {t("refresh", { error: isApiError(pointsQ.error) ? pointsQ.error.message : t("loadFailed") })}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                  {/* ซ้าย: บัตรสมาชิก · แต้มใกล้หมดอายุ · วิธีสะสม/ใช้แต้ม */}
                  <div className="space-y-4 lg:col-span-5">
                    <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-[#5d423b] bg-gradient-to-br from-[#4a342e] to-[#8C5A3C] p-6 text-white shadow-md">
                      <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="m-0 truncate text-lg font-bold tracking-wide text-stone-100">{user?.fullname || "-"}</p>
                          <p className="m-0 mt-0.5 truncate text-xs text-stone-300">{user?.email}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                          Member card
                        </span>
                      </div>

                      <div className="relative z-10 space-y-1.5">
                        <div className="flex justify-between text-xs text-stone-300">
                          <span>
                            {balance >= minToRedeem ? t("readyToRedeem") : t("collectMore", { n: (minToRedeem - balance).toLocaleString() })}
                          </span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/30 p-0.5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                          <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <div className="relative z-10 flex items-end justify-between border-t border-white/10 pt-2">
                        <div>
                          <span className="block text-xs text-stone-300">{t("balanceLabel")}</span>
                          <div className="mt-1 text-2xl font-black leading-none text-amber-400">
                            {balance.toLocaleString()} <span className="text-xs font-normal text-stone-200">{t("pointsUnit")}</span>
                          </div>
                        </div>
                        <span className="text-xs text-stone-300">{t("worth", { amount: baht(pointsToBaht(balance, p.rules)) })}</span>
                      </div>
                    </div>

                    {p.expiring_soon.points > 0 && p.expiring_soon.first_date && (
                      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                        <p className="m-0">
                          {t.rich("expiring", { n: p.expiring_soon.points.toLocaleString(), date: formatDate(p.expiring_soon.first_date), b: (c) => <strong>{c}</strong> })}
                        </p>
                      </div>
                    )}

                    <div className={`${card} space-y-5`}>
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
                                  <span className={`text-[11px] font-semibold ${done ? "text-emerald-600" : "text-stone-400"}`}>{done ? t("received") : t("notReceived")}</span>
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

                      <section className="space-y-3 border-t border-stone-100 pt-4">
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
                  </div>

                  {/* ขวา: แลกคูปอง + คูปองของฉัน */}
                  <div className="space-y-6 lg:col-span-7">
                    <section className={`${card} space-y-4`}>
                      <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
                        <h2 className="m-0 flex items-center gap-2 text-lg font-bold text-stone-800">
                          <Ticket className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> {t("redeemCoupons")}
                        </h2>
                        <span className="text-xs text-stone-500">{t("have", { n: balance.toLocaleString() })}</span>
                      </div>
                      {couponsQ.isLoading ? (
                        <p className="py-6 text-center text-sm text-stone-500">{t("loadingCoupons")}</p>
                      ) : couponsQ.isError ? (
                        <p className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">{t("couponsFailed")}</p>
                      ) : catalog.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 py-6 text-center text-sm text-stone-500">{t("noCatalog")}</p>
                      ) : (
                        <ul className="m-0 list-none space-y-3 p-0">
                          {catalog.map((c) => {
                            const enough = balance >= c.points_cost && balance >= minToRedeem;
                            const busy = redeem.isPending && redeem.variables?._id === c._id;
                            const disabled = !enough || c.limit_reached || redeem.isPending;
                            return (
                              <li key={c._id} className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-50">
                                  <Ticket className="h-6 w-6 text-amber-700" aria-hidden="true" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <h3 className="m-0 truncate text-sm font-bold text-stone-800">{c.promotion_name}</h3>
                                  <p className="m-0 text-xs text-stone-500">
                                    {couponLabel(c, tcp)}
                                    {c.min_order_amount ? t("minOrder", { amount: baht(c.min_order_amount) }) : ""}
                                    {t("until", { date: formatDate(c.end_date) })}
                                  </p>
                                  {c.promotion_desc && <p className="m-0 line-clamp-1 text-xs text-stone-400">{c.promotion_desc}</p>}
                                  <div className="flex items-center justify-between gap-2 pt-1">
                                    <span className="rounded bg-amber-100/70 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                      {t("pointsBadge", { points: c.points_cost.toLocaleString() })}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => void onRedeem(c)}
                                      disabled={disabled}
                                      className="rounded-xl border border-[#8C5A3C]/30 bg-white px-3 py-1.5 text-xs font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#4A342E] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
                                    >
                                      {busy ? t("redeeming") : c.limit_reached ? t("limitReached") : enough ? t("redeem") : t("notEnough")}
                                    </button>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>

                    <section className={`${card} space-y-4`}>
                      <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
                        <h2 className="m-0 flex items-center gap-2 text-base font-bold text-stone-800">
                          <Gift className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> {t("myCoupons")}
                        </h2>
                        {myCoupons.some((c) => c.state === "available") && (
                          <Link href="/customer/cart" className="text-xs font-semibold text-[#8C5A3C] hover:text-[#4A342E]">{t("useInCart")}</Link>
                        )}
                      </div>
                      {myCoupons.length === 0 ? (
                        <p className="py-4 text-center text-sm text-stone-500">{couponsQ.isLoading ? tc("loadingDots") : t("noCoupons")}</p>
                      ) : (
                        <ul className="m-0 list-none divide-y divide-stone-100 p-0">
                          {myCoupons.map((c) => (
                            <li key={c._id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                              <div className="min-w-0 space-y-0.5">
                                <p className="m-0 truncate text-sm font-semibold text-stone-800">{c.promotion_name}</p>
                                <p className="m-0 text-xs text-stone-400">
                                  {couponLabel(c, tcp)}
                                  {c.min_order_amount ? t("minOrder", { amount: baht(c.min_order_amount) }) : ""}
                                  {t("validUntil", { date: formatDate(c.expires_at) })}
                                </p>
                              </div>
                              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${COUPON_STATE[c.state].className}`}>
                                {t(`state.${c.state}`)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </div>
                </div>

                <section className={`${card} space-y-4`}>
                  <h2 className="m-0 flex items-center gap-2 border-b border-stone-100 pb-3 text-base font-bold text-stone-800 sm:text-lg">
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
                            <p className="m-0 text-xs text-stone-400">{formatDate(h.created_at)}</p>
                          </div>
                          <span className={`shrink-0 text-sm font-bold ${h.points >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {h.points >= 0 ? "+" : ""}
                            {h.points.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {p.history.length >= 50 && <p className="m-0 text-center text-xs text-stone-400">{t("latest50")}</p>}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
