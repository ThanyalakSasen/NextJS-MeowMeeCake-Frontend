"use client";
// ─────────────────────────────────────────────────────────────
// /customer/preorder/[roundId] — สินค้าในรอบพรีออเดอร์ (BACKLOG3-merge D3) · ยกจาก FrontOffice customer/preorder/[roundId]/page.tsx
// GET /catalog/preorder-rounds/{id} (เฉพาะรายการเปิดขาย + ราคา/โควตาเหลือ) · กดสินค้า → หน้าสินค้า ?round= (เลือกตัวเลือก/จำนวน)
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { shopPreordersService } from "@/services/shopPreorders";
import { isApiError } from "@/types/api";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { shopButton, shopInput, shopPage } from "@/components/customer/shopStyles";
import { preorderRoundKey } from "../../lib/shopQueries";
import { thaiDate } from "../lib/preorderDates";
import { isRoundOpen, useNow } from "../lib/useNow";
import { BasketBar, CountdownText, PreorderSteps, RoundProductCard } from "../_components/PreorderParts";

const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

export default function PreorderRoundPage() {
  const t = useTranslations("shop.preorderShop");
  const locale = useLocale();
  const { roundId } = useParams<{ roundId: string }>();
  const valid = isObjectId(roundId ?? "");
  const q = useQuery({
    queryKey: preorderRoundKey(roundId),
    queryFn: () => shopPreordersService.round(roundId),
    enabled: valid,
    retry: (n, e) => !(isApiError(e) && e.status === 404) && n < 2,
  });
  const [search, setSearch] = useState("");
  const now = useNow();

  const round = q.data;
  if (!valid || (q.isError && isApiError(q.error) && q.error.status === 404)) {
    return (
      <div className={`${shopPage} text-center`}>
        <p className="text-lg font-bold">{t("roundNotFound")}</p>
        <Link href="/customer/preorder" className={`${shopButton} mt-4`}>{t("allRounds")}</Link>
      </div>
    );
  }
  if (q.isLoading || !round) {
    return (
      <div className={`${shopPage} text-center`}>
        {q.isError ? <p className="text-sm text-red-700">{t("roundFailed")}</p> : <p className="animate-pulse text-sm text-[#8C5A3C]">{t("loadingRounds")}</p>}
      </div>
    );
  }

  const isOpen = isRoundOpen(round, now);
  const term = search.trim().toLowerCase();
  const items = round.items.filter(
    (it) => !term || it.product.product_name_th.toLowerCase().includes(term) || it.product.product_name_eng.toLowerCase().includes(term),
  );

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: t("crumb"), href: "/customer/preorder" }, { label: round.round_name }]} className="!mb-0" />

        <header className="flex flex-col gap-3 rounded-2xl border border-[#8C5A3C]/15 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="m-0 text-xl font-bold text-stone-800 sm:text-2xl">{round.round_name}</h1>
            <p className="m-0 mt-1 text-sm text-stone-600">
              {isOpen ? t("closesAt", { date: thaiDate(round.close_date, true, locale) }) : t("opensAt", { date: thaiDate(round.open_date, true, locale) })} ·{" "}
              {t("pickupFrom", { date: thaiDate(round.pickup_date, false, locale) })}
            </p>
          </div>
          <p className={`m-0 rounded-xl px-3 py-1.5 text-sm font-semibold ${isOpen ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>
            {isOpen ? <CountdownText target={round.close_date} prefix={t("closesIn")} /> : round.round_status === "scheduled" ? t("notOpenYet") : t("closed")}
          </p>
        </header>

        <BasketBar />

        <section className="space-y-4" aria-labelledby="round-items">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="round-items" className="m-0 text-xl font-bold text-stone-800">{t("roundItems", { n: round.items.length })}</h2>
            {round.items.length > 4 && (
              <input className={`${shopInput} sm:max-w-xs`} type="search" placeholder={t("searchRound")} aria-label={t("searchRound")} value={search} onChange={(e) => setSearch(e.target.value)} />
            )}
          </div>
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
              {round.items.length ? t("noMatch") : t("noItems")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {items.map((it) => (
                <RoundProductCard key={it._id} item={it} roundId={round._id} />
              ))}
            </div>
          )}
        </section>

        <PreorderSteps />
      </div>
    </div>
  );
}
