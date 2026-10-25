"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/member — สมาชิกของฉัน: แต้มสะสม + คูปอง (BACKLOG3-merge D4) · ยกจาก FrontOffice src/app/customer/account/member/page.tsx
// API: GET /shop/points (ยอด · ใกล้หมดอายุ · ประวัติ 50 รายการ · โบนัส · กติกา) · GET /shop/coupons (แลกได้ + ของฉัน)
//      POST /shop/coupons/redeem { promotion_id } (หักแต้ม → ได้คูปอง ใช้ได้ที่หน้า checkout)
// cache: แต้มใช้ key เดียวกับ checkout (shopPointsKey) · คูปองขึ้นต้นด้วย shopCouponsKey → แลกแล้ว checkout เห็นคูปองใหม่ทันที
// ไม่ยกมา: แชร์สินค้ารับแต้ม (POST /shop/points/share) อยู่ในหน้ารายละเอียดสินค้า (C1) · ที่นี่แสดงเป็นวิธีสะสมแต้มอย่างเดียว
//
// โครงหน้า: บัตรสมาชิก (แต้ม · มูลค่า · ความคืบหน้าถึงขั้นต่ำ · แต้มใกล้หมดอายุ · ตัวเลขสรุป) → แท็บ 4 แท็บ
//   คูปองของฉัน · แลกแต้ม · ประวัติแต้ม · วิธีสะสมแต้ม — แท็บอยู่ใน ?tab= (ลิงก์จากแจ้งเตือนคูปองเปิดแท็บคูปองได้ตรง ๆ)
//   ไม่ระบุแท็บ = มีคูปองพร้อมใช้ → คูปองของฉัน · ไม่มี → แลกแต้ม
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useState, type ComponentType, type KeyboardEvent, type ReactNode } from "react";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Award, Camera, CheckCircle2, ChevronRight, Clock, Gift, Share2, ShoppingBag, Sparkles, Star,
  Ticket, UserCheck,
} from "lucide-react";
import { shopLoyaltyService, pointsToBaht, type CatalogCoupon, type MyCoupon, type MyPoints } from "@/services/shopLoyalty";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import AccountSideMenu from "@/components/customer/AccountSideMenu";
import CouponTicket, { daysLeft } from "@/components/customer/CouponTicket";
import CouponCodeTicket from "@/components/customer/CouponCodeTicket";
import { baht, shopButton, shopButtonPrimary, shopPage } from "@/components/customer/shopStyles";
import { shopCouponOverviewKey, shopCouponsKey, shopPointsKey } from "../../lib/shopQueries";
import { formatDate as fmtDate } from "@/i18n/format";

const card = "rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6";

const COUPON_STATE: Record<MyCoupon["state"], string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  used: "border-stone-200 bg-stone-100 text-stone-500",
  expired: "border-red-200 bg-red-50 text-red-500",
};

/** ประวัติแต้มแสดงก่อนกี่รายการ (กด "ดูเพิ่มเติม" เพื่อดูทั้งหมด) */
const HISTORY_PREVIEW = 10;

const TABS = ["coupons", "redeem", "history", "earn"] as const;
type Tab = (typeof TABS)[number];
type HistoryFilter = "all" | "earn" | "spend";

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
      {/* useSearchParams ต้องอยู่ใต้ Suspense · fallback สูงเต็มจอกัน footer กระโดด (แบบหน้าบัญชี) */}
      <Suspense fallback={<div className="min-h-screen" />}>
        <MemberContent />
      </Suspense>
    </CustomerAuthGate>
  );
}

function MemberContent() {
  const t = useTranslations("shop.member");
  const tc = useTranslations("shop.common");
  const to = useTranslations("shop.orders");
  const ta = useTranslations("shop.accountMenu");
  const locale = useLocale();
  const formatDate = (iso: string) => fmtDate(iso, locale);
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { user } = useCustomerSession();
  // แต้มเปลี่ยนได้ตลอด (สั่งซื้อ · รีวิว) → โหลดใหม่ทุกครั้งที่เปิดหน้า
  const pointsQ = useQuery({ queryKey: shopPointsKey, queryFn: shopLoyaltyService.points, refetchOnMount: "always" });
  const couponsQ = useQuery({ queryKey: shopCouponOverviewKey, queryFn: shopLoyaltyService.overview });

  const redeem = useMutation({
    mutationFn: (c: CatalogCoupon) => shopLoyaltyService.redeem(c._id),
    onSuccess: () => {
      alert.success(t("redeemed"));
      setTab("coupons"); // ไปดูคูปองที่เพิ่งได้
    },
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
  const canRedeem = (c: CatalogCoupon) => balance >= c.points_cost && balance >= minToRedeem && !c.limit_reached;
  // แลกได้ขึ้นก่อน · ที่เหลือเรียงตามแต้มที่ต้องใช้น้อย → มาก
  const catalog = [...(couponsQ.data?.catalog ?? [])].sort(
    (a, b) => Number(canRedeem(b)) - Number(canRedeem(a)) || a.points_cost - b.points_cost,
  );
  const redeemableNow = catalog.filter(canRedeem).length;
  // พร้อมใช้ขึ้นก่อน (ใกล้หมดอายุก่อน) · ใช้แล้ว/หมดอายุ (ล่าสุดก่อน) แยกไว้ด้านล่าง
  const allCoupons = couponsQ.data?.coupons ?? [];
  const activeCoupons = allCoupons.filter((c) => c.state === "available").sort((a, b) => a.expires_at.localeCompare(b.expires_at));
  const oldCoupons = allCoupons.filter((c) => c.state !== "available");
  const toMin = Math.max(0, minToRedeem - balance);
  // ทางลัดใต้บัตร: คูปองพร้อมใช้ใบที่ใกล้หมดอายุที่สุดเหลือกี่วัน · ต้องสะสมอีกกี่แต้มถึงแลกใบที่ถูกที่สุดได้
  const soonestLeft = activeCoupons.length ? daysLeft(activeCoupons[0].expires_at) : null;
  const needs = catalog.filter((c) => !c.limit_reached).map((c) => Math.max(c.points_cost, minToRedeem) - balance).filter((n) => n > 0);
  const nextNeed = needs.length ? Math.min(...needs) : null;

  // แท็บจาก ?tab= · ไม่ระบุ = ตามว่ามีคูปองพร้อมใช้ไหม (รอโหลดคูปองเสร็จก่อนค่อยตัดสิน)
  const fromUrl = params.get("tab");
  const tab: Tab = TABS.includes(fromUrl as Tab) ? (fromUrl as Tab) : activeCoupons.length > 0 || couponsQ.isLoading ? "coupons" : "redeem";
  function setTab(next: Tab) {
    const q = new URLSearchParams(params.toString());
    q.set("tab", next);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  }

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb items={[{ label: to("myAccount"), href: "/customer/account" }, { label: ta("member") }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <AccountSideMenu />
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <header className="border-b border-stone-200 pb-5">
              <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-stone-800 sm:text-2xl">
                <Star className="h-6 w-6 text-[#4A342E]" aria-hidden="true" /> {t("title")}
              </h1>
            </header>
            {pointsQ.isLoading ? (
              <MemberSkeleton label={t("loading")} />
            ) : pointsQ.isError || !p ? (
              <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
                {t("refresh", { error: isApiError(pointsQ.error) ? pointsQ.error.message : t("loadFailed") })}
              </p>
            ) : (
              <>
                {/* ── บัตรสมาชิก (กะทัดรัด) — แถวบน: ป้ายบัตร + ชื่อ · กลาง: แต้ม + มูลค่า · ล่าง: ความคืบหน้าถึงขั้นต่ำ ── */}
                <section
                  aria-label={t("memberCard")}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3b2925] via-[#4a342e] to-[#8C5A3C] px-4 py-3.5 text-white shadow-md sm:px-5 sm:py-4"
                >
                  {/* ลายวงกลมจาง ๆ ให้ดูเป็นบัตร */}
                  <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full border-[18px] border-white/5" aria-hidden="true" />

                  <div className="relative flex items-center justify-between gap-3">
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /> {t("memberCard")}
                    </span>
                    <p className="m-0 min-w-0 truncate text-sm font-semibold text-stone-100">{user?.fullname || "-"}</p>
                  </div>

                  <div className="relative mt-2.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                    <p className="m-0 flex items-baseline gap-1.5">
                      <span className="sr-only">{t("balanceLabel")}</span>
                      <span className="text-3xl font-black leading-none tracking-tight text-amber-300">{balance.toLocaleString()}</span>
                      <span className="text-xs text-stone-200">{t("pointsUnit")}</span>
                    </p>
                    <span className="text-xs text-stone-200">{t("worth", { amount: baht(pointsToBaht(balance, p.rules)) })}</span>
                  </div>

                  {/* ยังไม่ถึงขั้นต่ำที่ใช้แต้มได้ → บอกว่าขาดอีกกี่แต้ม · ถึงแล้ว = บอกว่าใช้ได้ */}
                  <div className="relative mt-2.5">
                    {toMin > 0 ? (
                      <>
                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-white/15"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={minToRedeem}
                          aria-valuenow={balance}
                          aria-label={t("untilRedeem", { n: toMin.toLocaleString() })}
                        >
                          <div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, (balance / minToRedeem) * 100)}%` }} />
                        </div>
                        <p className="m-0 mt-1 text-[11px] text-stone-200">{t("untilRedeem", { n: toMin.toLocaleString() })}</p>
                      </>
                    ) : (
                      <p className="m-0 inline-flex items-center gap-1 text-[11px] text-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> {t("canUsePoints")}
                      </p>
                    )}
                  </div>
                </section>

                {p.expiring_soon.points > 0 && p.expiring_soon.first_date && (
                  <p className="m-0 -mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                    <span>
                      {t.rich("expiring", { n: p.expiring_soon.points.toLocaleString(), date: formatDate(p.expiring_soon.first_date), b: (c) => <strong>{c}</strong> })}
                    </span>
                  </p>
                )}

                {/* ── ทางลัด: คูปองพร้อมใช้ · คูปองที่แลกได้ — กดแล้วไปแท็บนั้น ── */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <ShortcutTile
                    tone="emerald"
                    icon={Ticket}
                    label={t("statCoupons")}
                    count={couponsQ.isLoading ? null : activeCoupons.length}
                    unit={t("couponUnit")}
                    active={tab === "coupons"}
                    onClick={() => setTab("coupons")}
                    sub={
                      couponsQ.isLoading ? (
                        tc("loadingDots")
                      ) : activeCoupons.length === 0 ? (
                        t("tileCouponsEmpty")
                      ) : soonestLeft !== null ? (
                        <span className="font-semibold text-red-600">
                          {soonestLeft === 0 ? t("tileCouponsExpireToday") : t("tileCouponsExpire", { n: soonestLeft })}
                        </span>
                      ) : (
                        t("tileCouponsReady")
                      )
                    }
                  />
                  <ShortcutTile
                    tone="amber"
                    icon={Gift}
                    label={t("statRedeemable")}
                    count={couponsQ.isLoading ? null : redeemableNow}
                    unit={t("couponUnit")}
                    active={tab === "redeem"}
                    onClick={() => setTab("redeem")}
                    sub={
                      couponsQ.isLoading
                        ? tc("loadingDots")
                        : redeemableNow > 0
                          ? t("tileRedeemReady")
                          : nextNeed !== null
                            ? t("tileRedeemNext", { n: nextNeed.toLocaleString() })
                            : t("tileRedeemEmpty")
                    }
                  />
                </div>

                {/* ── แท็บ ── */}
                <TabBar
                  tab={tab}
                  onChange={setTab}
                  labels={{
                    coupons: t("tabCoupons"),
                    redeem: t("tabRedeem"),
                    history: t("tabHistory"),
                    earn: t("tabEarn"),
                  }}
                  counts={{ coupons: activeCoupons.length, redeem: redeemableNow }}
                  ariaLabel={t("tabsLabel")}
                />

                <div role="tabpanel" id={`member-panel-${tab}`} aria-labelledby={`member-tab-${tab}`}>
                  {tab === "coupons" && (
                    <MyCouponsPanel
                      loading={couponsQ.isLoading}
                      failed={couponsQ.isError}
                      active={activeCoupons}
                      old={oldCoupons}
                      formatDate={formatDate}
                      onGoRedeem={() => setTab("redeem")}
                    />
                  )}
                  {tab === "redeem" && (
                    <RedeemPanel
                      loading={couponsQ.isLoading}
                      failed={couponsQ.isError}
                      catalog={catalog}
                      balance={balance}
                      minToRedeem={minToRedeem}
                      busyId={redeem.isPending ? (redeem.variables?._id ?? null) : null}
                      formatDate={formatDate}
                      onRedeem={(c) => void onRedeem(c)}
                    />
                  )}
                  {tab === "history" && <HistoryPanel history={p.history} formatDate={formatDate} />}
                  {tab === "earn" && <EarnPanel p={p} />}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ทางลัดใต้บัตรสมาชิก ─────────────────────────────────────────────────
const TILE_TONE = {
  emerald: { icon: "bg-emerald-50 text-emerald-600", ring: "border-emerald-300 ring-2 ring-emerald-200/70" },
  amber: { icon: "bg-amber-50 text-amber-700", ring: "border-amber-300 ring-2 ring-amber-200/70" },
} as const;

function ShortcutTile({
  tone,
  icon: Icon,
  label,
  count,
  unit,
  sub,
  active,
  onClick,
}: {
  tone: keyof typeof TILE_TONE;
  icon: ComponentType<{ className?: string }>;
  label: string;
  /** null = กำลังโหลด */
  count: number | null;
  unit: string;
  sub: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  const c = TILE_TONE[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? c.ring : "border-stone-100"
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-stone-600">{label}</span>
        <span className="mt-0.5 flex items-baseline gap-1">
          <span className="text-xl font-black leading-none text-stone-800">{count ?? "–"}</span>
          <span className="text-xs text-stone-500">{unit}</span>
        </span>
        <span className="mt-1 block text-xs text-stone-500">{sub}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-[#8C5A3C]" aria-hidden="true" />
    </button>
  );
}

// ── แท็บ (ลูกศรซ้าย/ขวาเลื่อนแท็บได้ · มือถือเลื่อนแนวนอน) ──────────────────
function TabBar({
  tab,
  onChange,
  labels,
  counts,
  ariaLabel,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  labels: Record<Tab, string>;
  counts: Partial<Record<Tab, number>>;
  ariaLabel: string;
}) {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = TABS.indexOf(tab);
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    onChange(next);
    document.getElementById(`member-tab-${next}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={ariaLabel} className="-mx-1 flex gap-1 overflow-x-auto rounded-2xl border border-stone-100 bg-white p-1 shadow-sm">
      {TABS.map((key) => {
        const selected = key === tab;
        const n = counts[key];
        return (
          <button
            key={key}
            id={`member-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`member-panel-${key}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(key)}
            onKeyDown={onKey}
            className={`flex h-[44px] min-w-fit flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition ${
              selected ? "bg-[#4A342E] text-white shadow" : "text-stone-600 hover:bg-[#8C5A3C]/10 hover:text-[#4A342E]"
            }`}
          >
            {labels[key]}
            {n ? (
              <span className={`rounded-full px-1.5 text-[11px] font-bold leading-5 ${selected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>{n}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// ── คูปองของฉัน ────────────────────────────────────────────────────────
function MyCouponsPanel({
  loading,
  failed,
  active,
  old,
  formatDate,
  onGoRedeem,
}: {
  loading: boolean;
  failed: boolean;
  active: MyCoupon[];
  old: MyCoupon[];
  formatDate: (iso: string) => string;
  onGoRedeem: () => void;
}) {
  const t = useTranslations("shop.member");
  const tcp = useTranslations("shop.coupons");
  const [showOld, setShowOld] = useState(false);
  if (loading) return <PanelNote>{t("loadingCoupons")}</PanelNote>;
  if (failed) return <PanelNote error>{t("couponsFailed")}</PanelNote>;

  const ticket = (c: MyCoupon) => {
    const left = c.state === "available" ? daysLeft(c.expires_at) : null;
    return (
      <li key={c._id}>
        <CouponTicket
          coupon={c}
          muted={c.state !== "available"}
          badge={
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${COUPON_STATE[c.state]}`}>{t(`state.${c.state}`)}</span>
          }
          meta={
            <>
              {c.min_order_amount > 0 && <span>{tcp("minOrderShort", { amount: baht(c.min_order_amount) })} · </span>}
              {left !== null ? (
                <span className="font-semibold text-red-600">{left === 0 ? tcp("expiresToday") : tcp("expiresInDays", { n: left })}</span>
              ) : (
                <span>{tcp("validUntilShort", { date: formatDate(c.expires_at) })}</span>
              )}
            </>
          }
        >
          {c.promotion_code && <CouponCodeTicket code={c.promotion_code} disabled={c.state !== "available"} className="pt-1" />}
        </CouponTicket>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      {active.length === 0 ? (
        <div className={`${card} flex flex-col items-center gap-3 py-10 text-center`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <Ticket className="h-7 w-7 text-amber-700" aria-hidden="true" />
          </span>
          <p className="m-0 text-sm text-stone-600">{t("noCoupons")}</p>
          <button type="button" onClick={onGoRedeem} className={shopButtonPrimary}>
            {t("goRedeem")}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-sm text-stone-500">{t("couponsHint")}</p>
            <Link href="/customer/product" className="text-sm font-semibold text-[#8C5A3C] hover:text-[#4A342E]">
              {t("shopNow")}
            </Link>
          </div>
          <ul className="m-0 grid list-none gap-3 p-0 xl:grid-cols-2">{active.map(ticket)}</ul>
        </>
      )}

      {old.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowOld((v) => !v)}
            aria-expanded={showOld}
            className="flex h-[44px] w-full items-center justify-center rounded-xl text-sm font-semibold text-[#8C5A3C] transition hover:bg-[#8C5A3C]/10"
          >
            {showOld ? t("hideOldCoupons") : t("showOldCoupons", { n: old.length })}
          </button>
          {showOld && <ul className="m-0 grid list-none gap-3 p-0 xl:grid-cols-2">{old.map(ticket)}</ul>}
        </div>
      )}
    </div>
  );
}

// ── แลกแต้มเป็นคูปอง ───────────────────────────────────────────────────
function RedeemPanel({
  loading,
  failed,
  catalog,
  balance,
  minToRedeem,
  busyId,
  formatDate,
  onRedeem,
}: {
  loading: boolean;
  failed: boolean;
  catalog: CatalogCoupon[];
  balance: number;
  minToRedeem: number;
  busyId: string | null;
  formatDate: (iso: string) => string;
  onRedeem: (c: CatalogCoupon) => void;
}) {
  const t = useTranslations("shop.member");
  const tcp = useTranslations("shop.coupons");
  if (loading) return <PanelNote>{t("loadingCoupons")}</PanelNote>;
  if (failed) return <PanelNote error>{t("couponsFailed")}</PanelNote>;
  if (catalog.length === 0) return <PanelNote>{t("noCatalog")}</PanelNote>;

  return (
    <div className="space-y-4">
      <p className="m-0 text-sm text-stone-500">{t("have", { n: balance.toLocaleString() })}</p>
      <ul className="m-0 grid list-none gap-3 p-0 xl:grid-cols-2">
        {catalog.map((c) => {
          const enough = balance >= c.points_cost && balance >= minToRedeem;
          const short = Math.max(c.points_cost, minToRedeem) - balance;
          const busy = busyId === c._id;
          const disabled = !enough || c.limit_reached || busyId !== null;
          // ความคืบหน้าแต้มของใบที่ยังแลกไม่ได้
          const need = Math.max(c.points_cost, minToRedeem);
          return (
            <li key={c._id}>
              <CouponTicket
                coupon={c}
                muted={c.limit_reached}
                badge={
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                    {t("pointsBadge", { points: c.points_cost.toLocaleString() })}
                  </span>
                }
                meta={
                  <>
                    {c.min_order_amount > 0 && <span>{tcp("minOrderShort", { amount: baht(c.min_order_amount) })} · </span>}
                    <span>{t("redeemBefore", { date: formatDate(c.end_date) })}</span>
                    {c.promotion_desc && <span className="mt-0.5 line-clamp-2 block">{c.promotion_desc}</span>}
                  </>
                }
              >
                {!enough && !c.limit_reached && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, (balance / need) * 100)}%` }} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRedeem(c)}
                  disabled={disabled}
                  className={`${enough && !c.limit_reached ? shopButtonPrimary : shopButton} mt-1 w-full sm:w-auto sm:self-end`}
                >
                  {busy ? t("redeeming") : c.limit_reached ? t("limitReached") : enough ? t("redeem") : t("needMore", { n: short.toLocaleString() })}
                </button>
              </CouponTicket>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── ประวัติแต้ม (กรอง ได้รับ/ใช้ไป) ──────────────────────────────────────
function HistoryPanel({ history, formatDate }: { history: MyPoints["history"]; formatDate: (iso: string) => string }) {
  const t = useTranslations("shop.member");
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const rows = history.filter((h) => (filter === "all" ? true : filter === "earn" ? h.points >= 0 : h.points < 0));
  const shown = showAll ? rows : rows.slice(0, HISTORY_PREVIEW);
  const earned = history.filter((h) => h.points > 0).reduce((s, h) => s + h.points, 0);
  const spent = history.filter((h) => h.points < 0).reduce((s, h) => s - h.points, 0);

  if (history.length === 0) return <PanelNote>{t("noHistory")}</PanelNote>;

  return (
    <section className={`${card} space-y-4`} aria-label={t("history")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5" role="group" aria-label={t("history")}>
          {(["all", "earn", "spend"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f);
                setShowAll(false);
              }}
              className={`h-9 rounded-full border px-3.5 text-xs font-semibold transition ${
                filter === f ? "border-[#4A342E] bg-[#4A342E] text-white" : "border-stone-200 text-stone-600 hover:border-[#8C5A3C]/50"
              }`}
            >
              {f === "all" ? t("filterAll") : f === "earn" ? t("filterEarn") : t("filterSpend")}
            </button>
          ))}
        </div>
        <p className="m-0 text-xs text-stone-500">{t("historySummary", { earned: earned.toLocaleString(), spent: spent.toLocaleString() })}</p>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">{t("noHistoryFilter")}</p>
      ) : (
        <ul className="m-0 list-none divide-y divide-stone-100 p-0">
          {shown.map((h) => {
            const plus = h.points >= 0;
            return (
              <li key={h._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${plus ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                  {plus ? <ArrowUpRight className="h-4 w-4" aria-hidden="true" /> : <ArrowDownRight className="h-4 w-4" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-semibold text-stone-800">{h.description}</p>
                  <p className="m-0 flex items-center gap-1 text-xs text-stone-500">
                    <Clock className="h-3 w-3" aria-hidden="true" /> {formatDate(h.created_at)}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-bold ${plus ? "text-emerald-600" : "text-red-500"}`}>
                  {plus ? "+" : ""}
                  {h.points.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > HISTORY_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="flex h-[44px] w-full items-center justify-center rounded-xl text-sm font-semibold text-[#8C5A3C] transition hover:bg-[#8C5A3C]/10"
        >
          {showAll ? t("showLessHistory") : t("showMoreHistory", { n: rows.length - HISTORY_PREVIEW })}
        </button>
      )}
      {showAll && history.length >= 50 && <p className="m-0 text-center text-xs text-stone-500">{t("latest50")}</p>}
    </section>
  );
}

// ── วิธีสะสม/ใช้แต้ม ────────────────────────────────────────────────────
function EarnPanel({ p }: { p: MyPoints }) {
  const t = useTranslations("shop.member");
  const te = useTranslations("shop.member.earn");
  return (
    <div className="space-y-4">
      <section className="space-y-3" aria-label={t("howToEarn")}>
        <h2 className="m-0 flex items-center gap-2 text-base font-bold text-stone-800">
          <Gift className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> {t("howToEarn")}
        </h2>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {earnWays(p, te).map(({ icon: Icon, title, desc, points, done }) => (
            <li key={title} className={`flex items-start gap-3 rounded-2xl border p-4 ${done ? "border-emerald-100 bg-emerald-50/40" : "border-stone-100 bg-white shadow-sm"}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-50">
                <Icon className="h-5 w-5 text-amber-700" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="m-0 text-sm font-semibold text-stone-800">{title}</p>
                  <span className="shrink-0 whitespace-nowrap rounded bg-amber-100/70 px-2 py-0.5 text-xs font-semibold text-amber-800">{t("pointsBadge", { points })}</span>
                </div>
                <p className="m-0 text-xs text-stone-500">{desc}</p>
                {done !== undefined && (
                  <p className={`m-0 flex items-center gap-1 text-xs font-semibold ${done ? "text-emerald-600" : "text-stone-500"}`}>
                    {done && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                    {done ? t("received") : t("notReceived")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
        {!p.bonuses.profile && !p.profile_complete && (
          <Link href="/customer/account" className="inline-block text-sm font-semibold text-[#8C5A3C] hover:text-[#4A342E]">
            {t("completeProfile")}
          </Link>
        )}
      </section>

      <section className={`${card} space-y-3`} aria-label={t("howToUse")}>
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

function PanelNote({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <p className={`m-0 rounded-2xl p-8 text-center text-sm ${error ? "bg-red-50 text-red-700" : "border border-dashed border-stone-200 bg-white text-stone-500"}`}>
      {children}
    </p>
  );
}

/** โครงระหว่างโหลด — ขนาดใกล้ของจริง กันหน้ากระโดด */
function MemberSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-label={label}>
      <div className="h-28 animate-pulse rounded-2xl bg-[#4a342e]/20" />
      <div className="h-[52px] animate-pulse rounded-2xl bg-stone-200/70" />
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="h-32 animate-pulse rounded-2xl bg-stone-200/70" />
        <div className="h-32 animate-pulse rounded-2xl bg-stone-200/70" />
      </div>
    </div>
  );
}
