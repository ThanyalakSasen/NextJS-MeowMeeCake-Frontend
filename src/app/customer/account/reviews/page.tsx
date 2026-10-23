"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/reviews — รีวิวของฉัน: ประวัติรีวิวทั้งหมด + คำตอบจากร้าน
// API: GET /shop/reviews (ของตัวเองเท่านั้น · backend ตัดข้อมูลภายใน/ผู้ตอบออก) — shopReviewsService.history
// cache: shopReviewHistoryKey ขึ้นต้นด้วย shopReviewsKey → เขียนรีวิวใหม่ (WriteReviewForm) แล้วหน้านี้โหลดใหม่เอง
// ตัวกรอง (ฝั่งหน้าเว็บ — โหลดรีวิวของตัวเองมาครบแล้ว) ใช้พร้อมกันได้ทุกกลุ่ม:
//   ค้นหาชื่อสินค้า/ข้อความรีวิว · สถานะ (ร้านตอบแล้ว / มีรูปหรือวิดีโอ / พรีออเดอร์) · จำนวนดาว · เรียงลำดับ
// รีวิวที่ร้านซ่อนยังแสดงให้เจ้าของเห็น (มีป้าย "ไม่แสดงบนหน้าสินค้า")
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { FaFilter, FaStar, FaTimes } from "react-icons/fa";
import { EyeOff, MessageSquareText, Search, Store } from "lucide-react";
import { shopReviewsService, type MyReviewDetail } from "@/services/shopReviews";
import { resolveUploadUrl } from "@/lib/uploads";
import { formatDate } from "@/i18n/format";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import AccountSideMenu from "@/components/customer/AccountSideMenu";
import ShopImage from "@/components/customer/ShopImage";
import { shopButton, shopInput, shopPage } from "@/components/customer/shopStyles";
import { shopReviewHistoryKey } from "../../lib/shopQueries";

type StatusFilter = "all" | "replied" | "media" | "preorder";
type SortKey = "newest" | "oldest" | "highest" | "lowest";

const STATUS_MATCH: Record<Exclude<StatusFilter, "all">, (r: MyReviewDetail) => boolean> = {
  replied: (r) => !!r.shop_reply,
  media: (r) => r.image.length > 0 || !!r.video,
  preorder: (r) => r.from_preorder,
};
const STATUS_LABEL = {
  replied: "filterReplied",
  media: "filterMedia",
  preorder: "filterPreorder",
} as const;
const SORT_LABEL = {
  newest: "sortNewest",
  oldest: "sortOldest",
  highest: "sortHighest",
  lowest: "sortLowest",
} as const;
const STAR_OPTIONS = [5, 4, 3, 2, 1] as const;

const time = (iso: string) => Date.parse(iso) || 0;
const COMPARE: Record<SortKey, (a: MyReviewDetail, b: MyReviewDetail) => number> = {
  newest: (a, b) => time(b.created_at) - time(a.created_at),
  oldest: (a, b) => time(a.created_at) - time(b.created_at),
  highest: (a, b) => b.rating - a.rating || time(b.created_at) - time(a.created_at),
  lowest: (a, b) => a.rating - b.rating || time(b.created_at) - time(a.created_at),
};

export default function MyReviewsPage() {
  const t = useTranslations("shop.myReviews");
  return (
    <CustomerAuthGate message={t("loginToView")}>
      <MyReviewsContent />
    </CustomerAuthGate>
  );
}

function Stars({ value }: { value: number }) {
  const t = useTranslations("shop.myReviews");
  return (
    <span className="inline-flex gap-0.5" aria-label={t("stars", { n: value })}>
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar key={s} className={s <= Math.round(value) ? "text-amber-400" : "text-gray-200"} />
      ))}
    </span>
  );
}

function MyReviewsContent() {
  const t = useTranslations("shop.myReviews");
  // ข้อความของแผงตัวกรอง — ชุดเดียวกับหน้าสินค้าทั้งหมด
  const tp = useTranslations("shop.products");
  const ta = useTranslations("shop.accountMenu");
  const to = useTranslations("shop.orders");
  // คำตอบจากร้านมาได้ตลอด → โหลดใหม่ทุกครั้งที่เปิดหน้า
  const q = useQuery({ queryKey: shopReviewHistoryKey, queryFn: shopReviewsService.history, refetchOnMount: "always" });
  const reviews = useMemo(() => q.data ?? [], [q.data]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [stars, setStars] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");

  // จำนวนในวงเล็บ = นับจากรีวิวทั้งหมด (ไม่ขึ้นกับตัวกรองอื่น)
  const statusCount = (s: Exclude<StatusFilter, "all">) => reviews.filter(STATUS_MATCH[s]).length;
  const starCount = (n: number) => reviews.filter((r) => Math.round(r.rating) === n).length;

  const keyword = search.trim().toLowerCase();
  const shown = useMemo(
    () =>
      reviews
        .filter((r) => status === "all" || STATUS_MATCH[status](r))
        .filter((r) => stars === null || Math.round(r.rating) === stars)
        .filter((r) => !keyword || `${r.product.name} ${r.review_text ?? ""}`.toLowerCase().includes(keyword))
        .sort(COMPARE[sort]),
    [reviews, status, stars, keyword, sort]
  );
  const filtered = status !== "all" || stars !== null || keyword !== "";

  // จอ <768px: สถานะ · คะแนน · การเรียง อยู่ในแผงเลื่อนเข้าจากขวา (แบบหน้าสินค้าทั้งหมด) · ช่องค้นหาแสดงตลอด
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!sheetOpen) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    // ล็อกการเลื่อนหน้าข้างหลังระหว่างเปิดแผง
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);
  /** ตัวเลือกในแผงถูกเปลี่ยนจากค่าเริ่มต้น (จุดแดงบนปุ่ม + ปุ่มล้าง) */
  const sheetActive = status !== "all" || stars !== null || sort !== "newest";

  /** ล้างตัวกรองทั้งหมด (รวมคำค้น) + เรียงล่าสุด */
  const clearFilters = () => {
    setSheetOpen(false);
    setSearch("");
    setStatus("all");
    setStars(null);
    setSort("newest");
  };

  /** chip: inline = จอ ≥768px (เม็ดเล็ก) · sheet = ในแผงจอเล็ก (สูง 44px แบบหน้าสินค้า) */
  const chip = (active: boolean, sheet: boolean) =>
    sheet
      ? `inline-flex h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition ${
          active ? "bg-[#8C5A3C] font-semibold text-white shadow-sm" : "bg-gray-50 text-[#4A342E] hover:bg-[#8C5A3C]/10"
        }`
      : `inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
          active ? "border-[#4A342E] bg-[#4A342E] text-white" : "border-stone-200 bg-white text-stone-600 hover:border-[#8C5A3C]/40"
        }`;
  /** เลือกในแผง = กรองทันทีแล้วปิดแผง (แบบหน้าสินค้า) */
  const pick = (sheet: boolean, apply: () => void) => () => {
    apply();
    if (sheet) setSheetOpen(false);
  };

  const statusChips = (sheet: boolean) => (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("filterLabel")}>
      <button type="button" className={chip(status === "all", sheet)} aria-pressed={status === "all"} onClick={pick(sheet, () => setStatus("all"))}>
        {t("filterAll")}
      </button>
      {(Object.keys(STATUS_LABEL) as Exclude<StatusFilter, "all">[]).map((s) => (
        <button key={s} type="button" className={chip(status === s, sheet)} aria-pressed={status === s} onClick={pick(sheet, () => setStatus(s))}>
          {t(STATUS_LABEL[s], { n: statusCount(s) })}
        </button>
      ))}
    </div>
  );

  const starChips = (sheet: boolean) => (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("filterStarsLabel")}>
      <button type="button" className={chip(stars === null, sheet)} aria-pressed={stars === null} onClick={pick(sheet, () => setStars(null))}>
        {t("allStars")}
      </button>
      {STAR_OPTIONS.map((n) => (
        <button key={n} type="button" className={chip(stars === n, sheet)} aria-pressed={stars === n} onClick={pick(sheet, () => setStars(n))}>
          <FaStar className={stars === n ? "text-amber-300" : "text-amber-400"} aria-hidden="true" />
          {t("starsChip", { n, count: starCount(n) })}
        </button>
      ))}
    </div>
  );

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb items={[{ label: to("myAccount"), href: "/customer/account" }, { label: ta("reviews") }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <AccountSideMenu />
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <header className="flex flex-col gap-3 border-b border-stone-200 pb-5">
              {/* หัวข้อ · จอ <768px: ปุ่มล้าง (เมื่อกำลังกรอง) + ปุ่มไอคอนตัวกรอง ชิดขวา · ตัวเลือกที่ใช้อยู่ใต้หัวข้อ */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-stone-800 sm:text-2xl">
                    <MessageSquareText className="h-6 w-6 text-[#4A342E]" aria-hidden="true" /> {t("title")}
                  </h1>
                  <p className="m-0 text-sm text-stone-500">
                    {filtered ? t("countFiltered", { shown: shown.length, n: reviews.length }) : t("count", { n: reviews.length })}
                  </p>
                  {reviews.length > 0 && (
                    <p className="m-0 truncate text-sm text-[#4A342E] md:hidden">
                      <span className="font-semibold">{status === "all" ? t("filterAll") : t(STATUS_LABEL[status], { n: statusCount(status) })}</span>
                      <span className="text-stone-500">
                        {" · "}
                        {stars === null ? t("allStars") : t("stars", { n: stars })} · {t(SORT_LABEL[sort])}
                      </span>
                    </p>
                  )}
                </div>
                {reviews.length > 0 && (
                  <div className="flex shrink-0 items-center gap-2 md:hidden">
                    {sheetActive && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="flex h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#8C5A3C] transition hover:bg-[#8C5A3C]/10"
                      >
                        <FaTimes size={14} aria-hidden="true" />
                        {tp("clearFilters")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSheetOpen(true)}
                      aria-label={tp("openFilters")}
                      aria-haspopup="dialog"
                      aria-expanded={sheetOpen}
                      className="relative flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-[#8C5A3C]/20 bg-white text-[#8C5A3C] shadow-sm transition hover:bg-[#8C5A3C]/10"
                    >
                      <FaFilter size={18} />
                      {sheetActive && (
                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" aria-label={tp("filterActive")} />
                      )}
                    </button>
                  </div>
                )}
              </div>
              {reviews.length > 0 && (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative min-w-0 flex-1">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden="true" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("searchPlaceholder")}
                        aria-label={t("searchLabel")}
                        className={`${shopInput} pl-10`}
                      />
                    </label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      aria-label={t("sortLabel")}
                      className={`${shopInput} hidden cursor-pointer md:block md:w-48`}
                    >
                      {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                        <option key={k} value={k}>{t(SORT_LABEL[k])}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden flex-col gap-2 md:flex">
                    {statusChips(false)}
                    {starChips(false)}
                  </div>
                </>
              )}
            </header>

            {/* แผงตัวกรอง (จอ <768px) — เลื่อนเข้าจากขวา เต็มความสูง · เลือกแล้วกรองทันทีและปิดแผง · Esc / แตะพื้นหลัง = ปิด */}
            {sheetOpen && (
              <div className="fixed inset-0 z-[60] flex justify-end md:hidden">
                <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} aria-hidden="true" />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="review-filter-title"
                  className="relative h-full w-[85vw] max-w-[360px] overflow-y-auto rounded-l-2xl bg-white px-[20px] pb-8 pt-4 shadow-2xl animate-slide-in-right"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 id="review-filter-title" className="m-0 flex items-center gap-2 text-base font-bold text-[#4A342E]">
                      <FaFilter className="text-[#8C5A3C]" size={16} />
                      {tp("filters")}
                    </h2>
                    <button
                      ref={closeBtnRef}
                      type="button"
                      onClick={() => setSheetOpen(false)}
                      aria-label={tp("closeFilters")}
                      className="flex h-[44px] w-[44px] items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100"
                    >
                      <FaTimes size={18} />
                    </button>
                  </div>

                  <h3 className="m-0 mb-2 text-sm font-semibold text-stone-600">{t("filterLabel")}</h3>
                  <div className="mb-5">{statusChips(true)}</div>

                  <h3 className="m-0 mb-2 text-sm font-semibold text-stone-600">{t("filterStarsLabel")}</h3>
                  <div className="mb-5">{starChips(true)}</div>

                  <h3 className="m-0 mb-2 text-sm font-semibold text-stone-600">{tp("sortBy")}</h3>
                  <div className="flex flex-wrap gap-2" role="group" aria-label={t("sortLabel")}>
                    {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                      <button key={k} type="button" className={chip(sort === k, true)} aria-pressed={sort === k} onClick={pick(true, () => setSort(k))}>
                        {t(SORT_LABEL[k])}
                      </button>
                    ))}
                  </div>

                  {/* ล้างตัวกรอง — กดไม่ได้เมื่อเป็นค่าเริ่มต้นอยู่แล้ว */}
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!sheetActive && !keyword}
                    className="mt-6 flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#8C5A3C]/30 text-sm font-semibold text-[#8C5A3C] transition hover:bg-[#8C5A3C]/10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-500 disabled:hover:bg-transparent"
                  >
                    <FaTimes size={14} aria-hidden="true" />
                    {tp("clearFilters")}
                  </button>
                </div>
              </div>
            )}

            {q.isLoading ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center text-sm text-stone-500">{t("loading")}</p>
            ) : q.isError ? (
              <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">{t("loadFailed")}</p>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center">
                <div className="rounded-full bg-amber-50/60 p-4">
                  <MessageSquareText className="h-12 w-12 text-[#D6C7BD]" aria-hidden="true" />
                </div>
                <p className="m-0 font-medium text-stone-500">{t("empty")}</p>
                <p className="m-0 text-xs text-stone-500">{t("emptyHint")}</p>
                <Link href="/customer/account/purchases" className={shopButton}>{t("goPurchases")}</Link>
              </div>
            ) : shown.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center">
                <p className="m-0 text-sm text-stone-500">{t("emptyFiltered")}</p>
                <button type="button" className={shopButton} onClick={clearFilters}>
                  {t("clearFilters")}
                </button>
              </div>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {shown.map((r) => (
                  <ReviewCard key={r._id} review={r} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review: r }: { review: MyReviewDetail }) {
  const t = useTranslations("shop.myReviews");
  const locale = useLocale();
  const productImg = resolveUploadUrl(r.product.image);
  const photos = r.image.map((u) => resolveUploadUrl(u)).filter((u): u is string => !!u);
  const video = resolveUploadUrl(r.video);
  const productName = r.product.name || t("productRemoved");

  const productHeader = (
    <span className="flex min-w-0 items-center gap-3">
      <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
        {productImg && <ShopImage src={productImg} alt={productName} width={112} height={112} sizes="56px" className="h-full w-full object-cover" />}
      </span>
      <span className="min-w-0 truncate text-sm font-bold text-[#4A342E] sm:text-base">{productName}</span>
    </span>
  );

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        {r.product.id && r.product.name ? (
          <Link href={`/customer/product/${r.product.id}`} className="min-w-0 hover:opacity-80">
            {productHeader}
          </Link>
        ) : (
          productHeader
        )}
        <span className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
          {r.from_preorder && (
            <span className="rounded bg-[#8C5A3C]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#8C5A3C]">{t("preorder")}</span>
          )}
          {r.hidden && (
            <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-[11px] font-semibold text-stone-600">
              <EyeOff className="h-3 w-3" aria-hidden="true" /> {t("hidden")}
            </span>
          )}
          {r.created_at ? formatDate(r.created_at, locale) : ""}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Stars value={r.rating} />
        <p className="m-0 whitespace-pre-line text-sm text-stone-700">{r.review_text || t("noComment")}</p>
      </div>

      {r.aspect_feedback.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {r.aspect_feedback.map((f) => (
            <span
              key={f.aspect_id}
              className={`rounded-full border px-2 py-0.5 text-[11px] ${
                f.sentiment === "positive" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {f.sentiment === "positive" ? t("liked") : t("improve")}: {f.aspect_name_th}
            </span>
          ))}
        </div>
      )}

      {(photos.length > 0 || video) && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url, idx) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="h-16 w-16 overflow-hidden rounded-xl border border-stone-200 bg-black/5 sm:h-20 sm:w-20">
              <ShopImage src={url} alt={t("photoAlt", { n: idx + 1 })} width={160} height={160} sizes="80px" className="h-full w-full object-cover" />
            </a>
          ))}
          {video && (
            <video src={video} controls preload="metadata" className="h-28 max-w-full rounded-xl border border-stone-200 bg-black sm:h-32">
              <track kind="captions" />
            </video>
          )}
        </div>
      )}

      {r.shop_reply ? (
        <div className="rounded-xl border-l-4 border-[#8C5A3C] bg-[#8C5A3C]/5 p-3 sm:p-4">
          <p className="m-0 flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#8C5A3C] sm:text-sm">
            <Store className="h-4 w-4" aria-hidden="true" /> {t("shopReply")}
            {r.shop_reply.replied_at && (
              <span className="font-normal text-stone-500">· {formatDate(r.shop_reply.replied_at, locale)}</span>
            )}
          </p>
          <p className="m-0 mt-1.5 whitespace-pre-line text-sm text-stone-700">{r.shop_reply.text}</p>
        </div>
      ) : (
        <p className="m-0 text-xs text-stone-500">{t("noReply")}</p>
      )}
    </li>
  );
}
