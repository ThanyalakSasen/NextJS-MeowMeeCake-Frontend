"use client";
// ─────────────────────────────────────────────────────────────
// /customer/preorder — รอบพรีออเดอร์ (BACKLOG3-merge D3) · ยกจาก FrontOffice customer/preorder/page.tsx
// GET /catalog/preorder-rounds → รอบที่เปิดรับอยู่ (open) + รอบถัดไป (scheduled) · กดรอบ → /customer/preorder/[roundId]
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, CalendarDays, PackageOpen } from "lucide-react";
import { shopPreordersService, type StorefrontRound } from "@/services/shopPreorders";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { shopButtonPrimary, shopPage } from "@/components/customer/shopStyles";
import { preorderRoundsKey } from "../lib/shopQueries";
import { thaiDate } from "./lib/preorderDates";
import { isRoundOpen, useNow } from "./lib/useNow";
import { BasketBar, CountdownText, PreorderSteps } from "./_components/PreorderParts";

export default function PreorderRoundsPage() {
  const t = useTranslations("shop.preorderShop");
  const q = useQuery({ queryKey: preorderRoundsKey, queryFn: shopPreordersService.rounds, staleTime: 60_000 });
  const now = useNow();
  const rounds = q.data ?? [];
  // backend เปลี่ยน scheduled → open ด้วย cron — รอบที่ถึงเวลาเปิดแล้วแต่ cron ยังไม่วิ่งยังสั่งไม่ได้ (นับเป็นรอบถัดไป)
  const open = rounds.filter((r) => isRoundOpen(r, now));
  const upcoming = rounds.filter((r) => r.round_status === "scheduled");

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: t("crumb") }]} className="!mb-0" />
        <header>
          <h1 className="m-0 text-2xl font-bold text-stone-800 sm:text-3xl">{t("title")}</h1>
          <p className="m-0 mt-1 text-sm text-stone-500">{t("subtitle")}</p>
        </header>

        <BasketBar />

        {q.isLoading ? (
          <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center text-sm text-stone-500">{t("loadingRounds")}</p>
        ) : q.isError ? (
          <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">{t("roundsFailed")}</p>
        ) : (
          <>
            <section className="space-y-4" aria-labelledby="open-rounds">
              <h2 id="open-rounds" className="m-0 text-xl font-bold text-stone-800">{t("openRounds")}</h2>
              {open.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center">
                  <PackageOpen className="h-8 w-8 text-stone-300" aria-hidden="true" />
                  <p className="m-0 text-sm font-medium text-stone-600">{t("noOpen")}</p>
                  {upcoming.length > 0 && <p className="m-0 text-xs text-stone-400">{t("seeUpcoming")}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {open.map((r) => (
                    <RoundCard key={r._id} round={r} open />
                  ))}
                </div>
              )}
            </section>

            {upcoming.length > 0 && (
              <section className="space-y-4" aria-labelledby="upcoming-rounds">
                <h2 id="upcoming-rounds" className="m-0 text-xl font-bold text-stone-800">{t("upcoming")}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((r) => (
                    <RoundCard key={r._id} round={r} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <PreorderSteps />
      </div>
    </div>
  );
}

function RoundCard({ round: r, open }: { round: StorefrontRound; open?: boolean }) {
  const t = useTranslations("shop.preorderShop");
  const locale = useLocale();
  return (
    <article className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm ${open ? "border-[#8C5A3C]/30" : "border-stone-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="m-0 text-lg font-bold text-[#4A342E]">{r.round_name}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${open ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>
          {open ? t("open") : t("soon")}
        </span>
      </div>
      <ul className="m-0 list-none space-y-1.5 p-0 text-sm text-stone-600">
        <li className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 shrink-0 text-[#8C5A3C]" aria-hidden="true" />
          {open ? t("closesAt", { date: thaiDate(r.close_date, true, locale) }) : t("opensAt", { date: thaiDate(r.open_date, true, locale) })}
        </li>
        <li className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-[#8C5A3C]" aria-hidden="true" />
          {t("pickupFrom", { date: thaiDate(r.pickup_date, false, locale) })}
        </li>
      </ul>
      <p className="m-0 text-xs font-semibold text-amber-700">
        <CountdownText target={open ? r.close_date : r.open_date} prefix={open ? t("closesIn") : t("opensIn")} />
      </p>
      <Link href={`/customer/preorder/${r._id}`} className={`${shopButtonPrimary} w-full`}>
        {open ? (r.item_count ? t("viewItemsCount", { n: r.item_count }) : t("viewItems")) : t("viewUpcoming")}
      </Link>
    </article>
  );
}
