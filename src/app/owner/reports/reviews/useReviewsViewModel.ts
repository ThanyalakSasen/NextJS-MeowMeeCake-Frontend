"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "รีวิวลูกค้า" (BACKLOG4 E4) — ยกจาก FrontOffice reports/reviews/ReviewTable (MVVM + i18n)
// กรอง/ค้นหา/เรียง/แบ่งหน้าที่ server + สรุปของชุดที่กรอง (summary=1 — I9) · เดิมโหลดทั้งหมดมากรองในหน้า
// จัดการต่อรีวิว (PATCH): สถานะ · ปักหมุด · ตอบกลับ (คำตอบสำเร็จรูป + คำตอบเก่าที่เคยใช้) · โน้ตภายใน
// เอาระบบ "อ่านแล้ว" ออกทั้งหน้า (2026-10-26) — ไม่มีป้าย "ใหม่"/ปุ่มอ่านแล้ว/ตัวกรองการอ่าน · ประเภทคำสั่งซื้อย้ายไปเป็นแท็บเหนือรายการ
// (เอาช่องติ๊กเลือก + ส่งออก CSV ออกแล้ว 2026-10-26 — ไม่มีคนใช้ · CSV ยังมีที่ตารางรายสินค้าในแดชบอร์ด)
// แก้แล้วอัปเดต cache ของหน้าปัจจุบันทันที แล้วโหลดชุดใหม่ (summary/ลำดับอาจเปลี่ยน) · สิทธิ์เมนู reports
// แดชบอร์ดสรุป = หน้า ./dashboard (คำนวณฝั่ง client จากรายการเดียวกัน — backend ไม่มี endpoint สรุป)
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { reviewAspectsService, reviewsService } from "@/services/reviews";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { Review, ReviewListParams, ReviewModeration, ReviewSort, ReviewStatus } from "@/types/review";
import { toReviewRow, type ReviewRow } from "./reviewRow";
import { REVIEWS_LIST_KEY, REVIEW_ASPECTS_KEY, REVIEW_FILTER_OPTIONS_KEY, REVIEWS_PAGE_SIZE, REVIEWS_DEFAULT_SORT, type ReviewsLinkView } from "./reviewsQuery";
import { sortByThai, sortOptionsThai } from "@/lib/thaiSort";

export type { ReviewRow };

const LIST_KEY = REVIEWS_LIST_KEY;
const SEARCH_DEBOUNCE_MS = 300;

export type Tri = "all" | "1" | "0";

export interface ReviewFilters {
  categoryId: string;
  productId: string;
  rating: number | null;
  negativeOnly: boolean;
  aspectId: string;
  aspectSentiment: "all" | "positive" | "negative";
  /** ไม่มี dropdown แล้ว — ตั้งจากทางลัด "รีวิวลบที่ยังไม่ตอบ" เท่านั้น (แสดงเป็นป้ายปิดได้) */
  replied: Tri;
  media: Tri;
  orderKind: "all" | "order" | "preorder";
  sort: ReviewSort;
}

const DEFAULT_FILTERS: ReviewFilters = {
  categoryId: "all",
  productId: "all",
  rating: null,
  negativeOnly: false,
  aspectId: "all",
  aspectSentiment: "negative",
  replied: "all",
  media: "all",
  orderKind: "all",
  sort: REVIEWS_DEFAULT_SORT,
};

/** ทางลัด "รีวิวลบที่ยังไม่ตอบ" — ปุ่มในหน้า · ปุ่มจากแดชบอร์ด · ลิงก์แจ้งเตือน ?view=negative_unreplied */
const unrepliedNegativeFilters = (productId?: string): ReviewFilters =>
  ({ ...DEFAULT_FILTERS, productId: productId ?? "all", negativeOnly: true, replied: "0", sort: "needs_reply" });

function toParams(f: ReviewFilters, q: string, page: number, limit: number): ReviewListParams {
  const p: ReviewListParams = { page, limit, sort: f.sort };
  if (q) p.q = q;
  if (f.categoryId !== "all") p.category_id = f.categoryId;
  if (f.productId !== "all") p.product_id = f.productId;
  if (f.rating) p.rating = f.rating;
  if (f.negativeOnly) p.sentiment_group = "negative";
  if (f.aspectId !== "all") {
    p.aspect_id = f.aspectId;
    if (f.aspectSentiment !== "all") p.sentiment = f.aspectSentiment;
  }
  if (f.replied !== "all") p.replied = Number(f.replied) as 0 | 1;
  if (f.media !== "all") p.has_media = Number(f.media) as 0 | 1;
  if (f.orderKind !== "all") p.order_kind = f.orderKind;
  return p;
}

/** enabled = แท็บจัดการรีวิวเปิดอยู่ — ไม่โหลดตอนอยู่แท็บแดชบอร์ด · initialView = ?view= จากลิงก์แจ้งเตือน */
export function useReviewsViewModel({ enabled = true, initialView }: { enabled?: boolean; initialView?: ReviewsLinkView } = {}) {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("reports_reviews");

  // ── ตัวกรอง ──
  const [filters, setFilters] = useState<ReviewFilters>(() =>
    initialView === "negative_unreplied" ? unrepliedNegativeFilters() : DEFAULT_FILTERS,
  );
  const [search, setSearchRaw] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(REVIEWS_PAGE_SIZE);
  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  const setFilter = <K extends keyof ReviewFilters>(key: K, value: ReviewFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const params = toParams(filters, q, page, pageSize);
  const listKey = [...LIST_KEY, params] as const;
  const listQ = useQuery({ queryKey: listKey, queryFn: () => reviewsService.list(params), placeholderData: keepPreviousData, enabled });
  const optionsQ = useQuery({ queryKey: REVIEW_FILTER_OPTIONS_KEY, queryFn: () => reviewsService.filterOptions(), staleTime: 60_000, enabled });
  const aspectsQ = useQuery({ queryKey: REVIEW_ASPECTS_KEY, queryFn: () => reviewAspectsService.list(), enabled });

  const rows = useMemo(() => (listQ.data?.data ?? []).map(toReviewRow), [listQ.data]);

  // ── จัดการรีวิว ──
  const patchCache = (id: string, patch: Partial<Review>) =>
    qc.setQueryData<Awaited<ReturnType<typeof reviewsService.list>>>(listKey, (old) =>
      old ? { ...old, data: old.data.map((r) => (r._id === id ? { ...r, ...patch } : r)) } : old,
    );
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: LIST_KEY });
    void qc.invalidateQueries({ queryKey: REVIEW_FILTER_OPTIONS_KEY });
  };

  const moderate = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReviewModeration }) => reviewsService.moderate(id, body),
    onSuccess: (doc) => {
      patchCache(doc._id, {
        status: doc.status,
        is_visible: doc.is_visible,
        is_pinned: doc.is_pinned,
        shop_reply: doc.shop_reply ?? null,
        internal_tags: doc.internal_tags ?? [],
        internal_note: doc.internal_note ?? null,
      });
      refresh();
    },
  });

  /** ใช้ร่วมทุก action — คืน true เมื่อสำเร็จ (component ปิดโหมดแก้ไขเอง) */
  const run = async (id: string, body: ReviewModeration, okKey?: Parameters<typeof t>[0]): Promise<boolean> => {
    try {
      await moderate.mutateAsync({ id, body });
      if (okKey) alert.success(t(okKey));
      return true;
    } catch (e) {
      alert.error(isApiError(e) ? e.message : t("reviews.updateFailed"));
      return false;
    }
  };

  const remove = useMutation({
    mutationFn: (id: string) => reviewsService.remove(id),
    onSuccess: () => {
      alert.success(t("reviews.deleted"));
      refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("reviews.deleteFailed")),
  });

  const activeAspects = (aspectsQ.data ?? []).filter((a) => !a.deleted_at);
  const options = optionsQ.data;

  return {
    perm,
    // isPending — render ฝั่ง server ด้วย (OwnerLayout SSR_PAGES) ตอนนั้น isLoading = false
    isLoading: listQ.isPending,
    isFetching: listQ.isFetching,
    isError: listQ.isError,
    refetch: () => listQ.refetch(),

    rows,
    total: listQ.data?.meta.total ?? 0,
    summary: listQ.data?.summary ?? null,
    page,
    pageSize,
    onPage: (p: number, size: number) => {
      setPage(size !== pageSize ? 1 : p);
      setPageSize(size);
    },

    search,
    setSearch: (v: string) => {
      setSearchRaw(v);
      setPage(1);
    },
    filters,
    setFilter,
    /** มีตัวกรอง/คำค้นที่ไม่ใช่ค่าเริ่มต้น — ปุ่ม "ล้างตัวกรอง" แสดงเฉพาะตอนนี้ */
    hasActiveFilters: search.trim() !== "" || JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS),
    resetFilters: () => {
      setFilters(DEFAULT_FILTERS);
      setSearchRaw("");
      setQ("");
      setPage(1);
    },
    /**
     * ทางลัดจากแถบสรุป/แดชบอร์ด: รีวิวลบที่ยังไม่ตอบ เรียงที่ควรตอบก่อน
     * productId = แดชบอร์ดกำลังดูสินค้านี้อยู่ → กรองสินค้าเดียวกัน (ตัวเลขตรงกับที่เพิ่งเห็น)
     */
    showUnrepliedNegative: (productId?: string) => {
      setFilters(unrepliedNegativeFilters(productId));
      setPage(1);
    },
    categoryOptions: sortByThai((options?.categories ?? []), (c) => c.category_name).map((c) => ({ value: c.category_id, label: `${c.category_name} (${c.review_count})` })),
    productOptions: sortByThai((options?.products ?? []), (p) => p.product_name_th).map((p) => ({ value: p.product_id, label: `${p.product_name_th} (${p.review_count})` })),
    aspectOptions: sortOptionsThai(activeAspects.map((a) => ({ value: a._id, label: a.aspect_name_th }))),
    replySuggestions: options?.reply_suggestions ?? [],

    onStatus: (r: ReviewRow, status: ReviewStatus) => void run(r._id, { status }, `reviews.statusChanged.${status}`),
    onTogglePin: (r: ReviewRow) => void run(r._id, { is_pinned: !r.is_pinned }),
    onSaveReply: (r: ReviewRow, text: string) => run(r._id, { shop_reply_text: text }, text.trim() ? "reviews.replySaved" : "reviews.replyRemoved"),
    onSaveNote: (r: ReviewRow, text: string) => run(r._id, { internal_note_text: text }, text.trim() ? "reviews.noteSaved" : "reviews.noteRemoved"),
    onDelete: (id: string) => remove.mutate(id),

  };
}
