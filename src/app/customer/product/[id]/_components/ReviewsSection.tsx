"use client";
// ─────────────────────────────────────────────────────────────
// รีวิวลูกค้าในหน้ารายละเอียดสินค้า — ยกจาก FrontOffice ProductDetailClient (บล็อกที่ 2)
// API: /catalog/products/{id}/reviews (ปักหมุดก่อน แล้วใหม่ก่อน · ชื่อปิดบางส่วนโดย backend) · /reviews/summary (การกระจายดาว)
//      /sentiment (แง่มุมที่ลูกค้าพูดถึง → ตัวกรองหัวข้อ)
// ตัวกรองทำฝั่ง client จากรีวิว 100 รายการล่าสุด (สินค้าร้านเดียว รีวิวไม่เยอะ) · จำนวนรวมจาก summary
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { formatDate } from "@/i18n/format";
import { FaImage, FaStar, FaThumbtack } from "react-icons/fa";
import { catalogService, type CatalogReview } from "@/services/catalog";
import { resolveUploadUrl } from "@/lib/uploads";

type Filter = { kind: "all" } | { kind: "star"; star: number } | { kind: "media" } | { kind: "aspect"; id: string };

const filterCls = (active: boolean) =>
  `rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
    active ? "border-[#4A342E] bg-[#4A342E] text-white" : "border-[#8C5A3C]/20 bg-white text-[#4A342E] hover:bg-[#8C5A3C]/10"
  }`;

const reviewerName = (r: CatalogReview, fallback: string) =>
  r.reviewer_name || (typeof r.user_id === "object" && r.user_id ? r.user_id.user_fullname : "") || fallback;

const hasMedia = (r: CatalogReview) => (r.image?.length ?? 0) > 0 || !!r.video;

function Stars({ value }: { value: number }) {
  const t = useTranslations("shop.reviews");
  return (
    <span className="inline-flex gap-0.5" aria-label={t("stars", { n: value })}>
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar key={s} className={s <= Math.round(value) ? "text-amber-400" : "text-gray-200"} />
      ))}
    </span>
  );
}

export default function ReviewsSection({ productId }: { productId: string }) {
  const t = useTranslations("shop.reviews");
  const { name: localName } = useLocalName();
  const reviewsQ = useQuery({ queryKey: ["catalog", "product", productId, "reviews"], queryFn: () => catalogService.reviews(productId) });
  const summaryQ = useQuery({ queryKey: ["catalog", "product", productId, "reviews", "summary"], queryFn: () => catalogService.reviewSummary(productId) });
  const sentimentQ = useQuery({ queryKey: ["catalog", "product", productId, "sentiment"], queryFn: () => catalogService.sentiment(productId) });
  const [filter, setFilter] = useState<Filter>({ kind: "all" });

  const reviews = reviewsQ.data ?? [];
  const summary = summaryQ.data;
  const total = summary?.count ?? reviews.length;
  const aspects = (sentimentQ.data ?? []).filter((a) => a.total > 0 && a.aspect?.aspect_name_th);

  const shown = reviews.filter((r) => {
    if (filter.kind === "star") return Math.round(Number(r.rating)) === filter.star;
    if (filter.kind === "media") return hasMedia(r);
    if (filter.kind === "aspect") return (r.aspect_feedback ?? []).some((f) => f.aspect_id === filter.id);
    return true;
  });
  const isActive = (f: Filter) =>
    f.kind === filter.kind &&
    (f.kind !== "star" || (filter.kind === "star" && filter.star === f.star)) &&
    (f.kind !== "aspect" || (filter.kind === "aspect" && filter.id === f.id));

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-[#8C5A3C]/10 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="reviews-title">
      <div className="flex flex-col gap-5 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
        <h2 id="reviews-title" className="m-0 text-lg font-bold text-[#4A342E] sm:text-xl">
          {t("title", { n: total.toLocaleString() })}
        </h2>
        {summary && summary.count > 0 && (
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-3xl font-black text-[#8C5A3C]">{summary.average.toFixed(1)}</div>
              <Stars value={summary.average} />
            </div>
            <ul className="m-0 w-44 list-none space-y-0.5 p-0">
              {[5, 4, 3, 2, 1].map((s) => {
                const n = summary.distribution[String(s)] ?? 0;
                return (
                  <li key={s} className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="w-3">{s}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${summary.count ? (n / summary.count) * 100 : 0}%` }} />
                    </span>
                    <span className="w-6 text-right">{n}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {aspects.length > 0 && (
        <div className="space-y-2">
          <p className="m-0 text-xs font-bold text-[#4A342E]">{t("mentioned")}</p>
          <div className="flex flex-wrap gap-2">
            {aspects.map((a) => (
              <button
                key={a.aspect_id}
                type="button"
                aria-pressed={isActive({ kind: "aspect", id: a.aspect_id })}
                onClick={() => setFilter(isActive({ kind: "aspect", id: a.aspect_id }) ? { kind: "all" } : { kind: "aspect", id: a.aspect_id })}
                className={filterCls(isActive({ kind: "aspect", id: a.aspect_id }))}
              >
                {localName(a.aspect?.aspect_name_th, a.aspect?.aspect_name_eng)}
                <span className="ml-1.5 text-[11px] font-normal opacity-80">
                  👍 {a.positive}
                  {a.negative > 0 && ` · 👎 ${a.negative}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={isActive({ kind: "all" })} onClick={() => setFilter({ kind: "all" })} className={filterCls(isActive({ kind: "all" }))}>
          {t("all")}
        </button>
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            type="button"
            aria-pressed={isActive({ kind: "star", star })}
            onClick={() => setFilter({ kind: "star", star })}
            className={filterCls(isActive({ kind: "star", star }))}
          >
            {t("stars", { n: star })}
            {summary && <span className="ml-1 text-[11px] font-normal opacity-80">({summary.distribution[String(star)] ?? 0})</span>}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={isActive({ kind: "media" })}
          onClick={() => setFilter({ kind: "media" })}
          className={`flex items-center gap-1.5 ${filterCls(isActive({ kind: "media" }))}`}
        >
          <FaImage /> {t("withMedia")}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {reviewsQ.isLoading ? (
          <p className="animate-pulse py-8 text-center text-sm text-[#8C5A3C]">{t("loading")}</p>
        ) : reviewsQ.isError ? (
          <p className="py-8 text-center text-sm text-red-600">{t("loadFailed")}</p>
        ) : shown.length > 0 ? (
          shown.map((r) => <ReviewItem key={r._id} review={r} />)
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
            <p className="m-0 text-sm font-bold text-[#4A342E]">{reviews.length ? t("noMatch") : t("none")}</p>
            {reviews.length > 0 && <span className="mt-1 block text-xs text-gray-500">{t("tryOther")}</span>}
          </div>
        )}
        {total > reviews.length && reviews.length > 0 && (
          <p className="m-0 text-center text-xs text-gray-500">{t("latest", { n: reviews.length })}</p>
        )}
      </div>
    </section>
  );
}

function ReviewItem({ review: r }: { review: CatalogReview }) {
  const t = useTranslations("shop.reviews");
  const locale = useLocale();
  const name = reviewerName(r, t("customer"));
  const photos = (r.image ?? []).map((u) => resolveUploadUrl(u)).filter((u): u is string => !!u);
  const video = resolveUploadUrl(r.video);
  return (
    <article className={`flex flex-col gap-3 rounded-xl border p-4 sm:p-5 ${r.is_pinned ? "border-amber-200 bg-amber-50/40" : "border-gray-100 bg-gray-50/60"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8C5A3C] text-sm font-bold text-white" aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-xs font-bold text-[#4A342E] sm:text-sm">{name}</span>
            <div className="flex items-center gap-2 text-xs">
              <Stars value={Number(r.rating || 0)} />
              {r.from_preorder && <span className="rounded bg-[#8C5A3C]/10 px-1.5 text-[10px] font-semibold text-[#8C5A3C]">{t("preorder")}</span>}
            </div>
          </div>
        </div>
        <span className="flex items-center gap-2 text-[11px] text-gray-500">
          {r.is_pinned && (
            <span className="flex items-center gap-1 font-semibold text-amber-700">
              <FaThumbtack /> {t("pinned")}
            </span>
          )}
          {r.created_at ? formatDate(r.created_at, locale) : ""}
        </span>
      </div>

      <p className="m-0 text-xs text-gray-600 sm:pl-12 sm:text-sm">{r.review_text || t("noComment")}</p>

      {(r.aspect_feedback?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5 sm:pl-12">
          {r.aspect_feedback!.map((f) => (
            <span key={f.aspect_id} className="rounded-full border border-[#8C5A3C]/15 bg-white px-2 py-0.5 text-[11px] text-[#4A342E]">
              {f.aspect_name_th}
            </span>
          ))}
        </div>
      )}

      {(photos.length > 0 || video) && (
        <div className="flex flex-wrap gap-2 pt-1 sm:pl-12">
          {photos.map((url, idx) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-black/5 sm:h-20 sm:w-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={t("photoAlt", { n: idx + 1 })} className="h-full w-full object-cover" />
            </a>
          ))}
          {video && (
            <video src={video} controls preload="metadata" className="h-28 max-w-full rounded-xl border border-gray-200 bg-black sm:h-32">
              <track kind="captions" />
            </video>
          )}
        </div>
      )}

      {r.shop_reply && (
        <div className="rounded-xl border border-[#8C5A3C]/15 bg-white p-3 sm:ml-12">
          <p className="m-0 text-xs font-bold text-[#8C5A3C]">{t("shopReply")}</p>
          <p className="m-0 mt-1 whitespace-pre-line text-xs text-gray-600 sm:text-sm">{r.shop_reply.text}</p>
        </div>
      )}
    </article>
  );
}
