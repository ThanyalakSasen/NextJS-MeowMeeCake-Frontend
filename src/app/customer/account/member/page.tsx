"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/member — สมาชิกของฉัน: แต้มสะสม + คูปอง (BACKLOG3-merge D4) · ยกจาก FrontOffice src/app/customer/account/member/page.tsx
// API: GET /shop/points (ยอด · ใกล้หมดอายุ · ประวัติ 50 รายการ · โบนัส · กติกา) · GET /shop/coupons (แลกได้ + ของฉัน)
//      POST /shop/coupons/redeem { promotion_id } (หักแต้ม → ได้คูปอง ใช้ได้ที่หน้า checkout)
// cache: แต้มใช้ key เดียวกับ checkout (shopPointsKey) · คูปองขึ้นต้นด้วย shopCouponsKey → แลกแล้ว checkout เห็นคูปองใหม่ทันที
// ไม่ยกมา: แชร์สินค้ารับแต้ม (POST /shop/points/share) อยู่ในหน้ารายละเอียดสินค้า (C1) · ที่นี่แสดงเป็นวิธีสะสมแต้มอย่างเดียว
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
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
import AccountSideMenu from "@/components/customer/AccountSideMenu";
import { baht, shopPage } from "@/components/customer/shopStyles";
import { shopCouponOverviewKey, shopCouponsKey, shopPointsKey } from "../../lib/shopQueries";
import { couponLabel } from "../../lib/couponLabel";

const card = "rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

const COUPON_STATE: Record<MyCoupon["state"], { label: string; className: string }> = {
  available: { label: "พร้อมใช้", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  used: { label: "ใช้แล้ว", className: "border-stone-200 bg-stone-100 text-stone-500" },
  expired: { label: "หมดอายุ", className: "border-red-200 bg-red-50 text-red-500" },
};

type EarnWay = { icon: ComponentType<{ className?: string }>; title: string; desc: string; points: string; done?: boolean };

function earnWays(p: MyPoints): EarnWay[] {
  const r = p.rules;
  return [
    { icon: ShoppingBag, title: "ซื้อสินค้า", desc: `ทุก ${r.BAHT_PER_POINT} บาท รับ 1 แต้ม (ได้เมื่อคำสั่งซื้อเสร็จสมบูรณ์)`, points: `1 / ${r.BAHT_PER_POINT} บาท` },
    { icon: Gift, title: "สมัครสมาชิกใหม่", desc: "รับทันทีเมื่อยืนยันอีเมลเรียบร้อย", points: `+${r.WELCOME}`, done: p.bonuses.welcome },
    { icon: UserCheck, title: "กรอกข้อมูลส่วนตัวครบถ้วน", desc: "วันเกิด เบอร์โทร และที่อยู่จัดส่งอย่างน้อย 1 ที่", points: `+${r.PROFILE}`, done: p.bonuses.profile },
    { icon: Star, title: "รีวิวสินค้า", desc: "เขียนรีวิวสินค้าที่ซื้อ (ครั้งเดียวต่อสินค้า 1 รายการ)", points: `+${r.REVIEW}` },
    { icon: Camera, title: "รีวิวสินค้าพร้อมรูปถ่าย", desc: "แนบรูปสินค้าจริงในรีวิว", points: `+${r.REVIEW_PHOTO}` },
    { icon: Share2, title: "แชร์สินค้า", desc: "กดปุ่มแชร์ในหน้าสินค้า (ครั้งเดียวต่อสินค้า)", points: `+${r.SHARE}` },
  ];
}

export default function MemberPage() {
  return (
    <CustomerAuthGate message="กรุณาเข้าสู่ระบบเพื่อดูแต้มสะสมและคูปอง">
      <MemberContent />
    </CustomerAuthGate>
  );
}

function MemberContent() {
  const qc = useQueryClient();
  const { user } = useCustomerSession();
  // แต้มเปลี่ยนได้ตลอด (สั่งซื้อ · รีวิว) → โหลดใหม่ทุกครั้งที่เปิดหน้า
  const pointsQ = useQuery({ queryKey: shopPointsKey, queryFn: shopLoyaltyService.points, refetchOnMount: "always" });
  const couponsQ = useQuery({ queryKey: shopCouponOverviewKey, queryFn: shopLoyaltyService.overview });

  const redeem = useMutation({
    mutationFn: (c: CatalogCoupon) => shopLoyaltyService.redeem(c._id),
    onSuccess: () => alert.success("แลกคูปองสำเร็จ! ใช้ได้ที่หน้าชำระเงิน"),
    onError: (e) => alert.error(isApiError(e) ? e.message : "แลกคูปองไม่สำเร็จ"),
    // สำเร็จหรือไม่ก็โหลดใหม่ — แต้ม/สิทธิ์อาจเปลี่ยนจากที่อื่น
    onSettled: () => Promise.all([qc.invalidateQueries({ queryKey: shopPointsKey }), qc.invalidateQueries({ queryKey: shopCouponsKey })]),
  });

  const onRedeem = async (c: CatalogCoupon) => {
    const ok = await confirmAlert(`ใช้ ${c.points_cost.toLocaleString("th-TH")} แต้ม แลกคูปอง "${c.promotion_name}"`, {
      title: "ยืนยันการแลกคูปอง",
      confirmText: "แลกเลย",
      cancelText: "ยกเลิก",
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
        <CustomerBreadcrumb items={[{ label: "บัญชีของฉัน", href: "/customer/account" }, { label: "สมาชิกของฉัน" }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <AccountSideMenu />
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {pointsQ.isLoading ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center text-sm text-stone-500">กำลังโหลดข้อมูลสมาชิก...</p>
            ) : pointsQ.isError || !p ? (
              <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
                {isApiError(pointsQ.error) ? pointsQ.error.message : "โหลดข้อมูลสมาชิกไม่สำเร็จ"} — กรุณารีเฟรชหน้านี้
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
                            {balance >= minToRedeem ? "พร้อมใช้แต้มเป็นส่วนลดแล้ว" : `สะสมอีก ${(minToRedeem - balance).toLocaleString("th-TH")} แต้ม เพื่อเริ่มใช้แต้ม`}
                          </span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/30 p-0.5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                          <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <div className="relative z-10 flex items-end justify-between border-t border-white/10 pt-2">
                        <div>
                          <span className="block text-xs text-stone-300">คะแนนสะสมคงเหลือ</span>
                          <div className="mt-1 text-2xl font-black leading-none text-amber-400">
                            {balance.toLocaleString("th-TH")} <span className="text-xs font-normal text-stone-200">แต้ม</span>
                          </div>
                        </div>
                        <span className="text-xs text-stone-300">มูลค่า {baht(pointsToBaht(balance, p.rules))}</span>
                      </div>
                    </div>

                    {p.expiring_soon.points > 0 && p.expiring_soon.first_date && (
                      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                        <p className="m-0">
                          มี <strong>{p.expiring_soon.points.toLocaleString("th-TH")} แต้ม</strong> จะหมดอายุตั้งแต่วันที่{" "}
                          {formatDate(p.expiring_soon.first_date)} รีบใช้ก่อนหมดอายุนะ
                        </p>
                      </div>
                    )}

                    <div className={`${card} space-y-5`}>
                      <section className="space-y-3">
                        <h2 className="m-0 flex items-center gap-2 text-base font-bold text-stone-800">
                          <Gift className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> วิธีสะสมแต้ม
                        </h2>
                        <ul className="m-0 list-none space-y-2.5 p-0">
                          {earnWays(p).map(({ icon: Icon, title, desc, points, done }) => (
                            <li key={title} className="flex items-start gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200/60 bg-amber-50">
                                <Icon className="h-4 w-4 text-amber-700" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="m-0 text-sm font-semibold text-stone-800">{title}</p>
                                <p className="m-0 text-xs text-stone-500">{desc}</p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-0.5">
                                <span className="whitespace-nowrap rounded bg-amber-100/70 px-2 py-0.5 text-xs font-semibold text-amber-800">{points} แต้ม</span>
                                {done !== undefined && (
                                  <span className={`text-[11px] font-semibold ${done ? "text-emerald-600" : "text-stone-400"}`}>{done ? "ได้รับแล้ว" : "ยังไม่ได้รับ"}</span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                        {!p.bonuses.profile && !p.profile_complete && (
                          <Link href="/customer/account" className="inline-block text-xs font-semibold text-[#8C5A3C] hover:text-[#4A342E]">
                            กรอกข้อมูลส่วนตัวให้ครบ →
                          </Link>
                        )}
                      </section>

                      <section className="space-y-3 border-t border-stone-100 pt-4">
                        <h2 className="m-0 flex items-center gap-2 text-base font-bold text-stone-800">
                          <Award className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> การใช้แต้มเป็นส่วนลด
                        </h2>
                        <ul className="m-0 list-none space-y-2 p-0 text-sm text-stone-600">
                          {[
                            `100 แต้ม = ส่วนลด ${baht(pointsToBaht(100, p.rules))} ใช้ได้ที่หน้าชำระเงิน (ทีละ ${p.rules.REDEEM_STEP} แต้ม)`,
                            `ต้องมีแต้มสะสมอย่างน้อย ${p.rules.MIN_BALANCE_TO_REDEEM} แต้มจึงจะเริ่มใช้แต้มได้`,
                            `ใช้ลดได้ไม่เกิน ${Math.round(p.rules.MAX_REDEEM_RATIO * 100)}% ของยอดสินค้าต่อคำสั่งซื้อ`,
                            `แต้มมีอายุ ${p.rules.EXPIRY_DAYS} วันนับจากวันที่ได้รับ`,
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
                          <Ticket className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> แลกคูปอง
                        </h2>
                        <span className="text-xs text-stone-500">มี {balance.toLocaleString("th-TH")} แต้ม</span>
                      </div>
                      {couponsQ.isLoading ? (
                        <p className="py-6 text-center text-sm text-stone-500">กำลังโหลดคูปอง...</p>
                      ) : couponsQ.isError ? (
                        <p className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">โหลดคูปองไม่สำเร็จ</p>
                      ) : catalog.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 py-6 text-center text-sm text-stone-500">ยังไม่มีคูปองให้แลกในขณะนี้</p>
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
                                    {couponLabel(c)}
                                    {c.min_order_amount ? ` · ขั้นต่ำ ${baht(c.min_order_amount)}` : ""} · ถึง {formatDate(c.end_date)}
                                  </p>
                                  {c.promotion_desc && <p className="m-0 line-clamp-1 text-xs text-stone-400">{c.promotion_desc}</p>}
                                  <div className="flex items-center justify-between gap-2 pt-1">
                                    <span className="rounded bg-amber-100/70 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                      {c.points_cost.toLocaleString("th-TH")} แต้ม
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => void onRedeem(c)}
                                      disabled={disabled}
                                      className="rounded-xl border border-[#8C5A3C]/30 bg-white px-3 py-1.5 text-xs font-bold text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 hover:bg-[#4A342E] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
                                    >
                                      {busy ? "กำลังแลก..." : c.limit_reached ? "แลกครบสิทธิ์แล้ว" : enough ? "กดแลกรับ" : "แต้มไม่พอ"}
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
                          <Gift className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> คูปองของฉัน
                        </h2>
                        {myCoupons.some((c) => c.state === "available") && (
                          <Link href="/customer/cart" className="text-xs font-semibold text-[#8C5A3C] hover:text-[#4A342E]">ไปใช้ที่ตะกร้า →</Link>
                        )}
                      </div>
                      {myCoupons.length === 0 ? (
                        <p className="py-4 text-center text-sm text-stone-500">{couponsQ.isLoading ? "กำลังโหลด..." : "ยังไม่มีคูปอง ลองแลกด้วยแต้มสะสมดูสิ"}</p>
                      ) : (
                        <ul className="m-0 list-none divide-y divide-stone-100 p-0">
                          {myCoupons.map((c) => (
                            <li key={c._id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                              <div className="min-w-0 space-y-0.5">
                                <p className="m-0 truncate text-sm font-semibold text-stone-800">{c.promotion_name}</p>
                                <p className="m-0 text-xs text-stone-400">
                                  {couponLabel(c)}
                                  {c.min_order_amount ? ` · ขั้นต่ำ ${baht(c.min_order_amount)}` : ""} · ใช้ได้ถึง {formatDate(c.expires_at)}
                                </p>
                              </div>
                              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${COUPON_STATE[c.state].className}`}>
                                {COUPON_STATE[c.state].label}
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
                    <Clock className="h-5 w-5 text-[#4A342E]" aria-hidden="true" /> ประวัติการใช้และสะสมคะแนน
                  </h2>
                  {p.history.length === 0 ? (
                    <p className="py-6 text-center text-sm text-stone-500">ยังไม่มีประวัติการสะสมคะแนน</p>
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
                            {h.points.toLocaleString("th-TH")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {p.history.length >= 50 && <p className="m-0 text-center text-xs text-stone-400">แสดง 50 รายการล่าสุด</p>}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
