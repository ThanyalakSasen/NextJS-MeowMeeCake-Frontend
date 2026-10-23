"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "รีวิวลูกค้า" (BACKLOG4 E4) — ยกจาก FrontOffice reports/reviews/ReviewTable (MVVM + i18n)
// กรอง/ค้นหา/เรียง/แบ่งหน้าที่ server + สรุปของชุดที่กรอง (summary=1 — I9) · เดิมโหลดทั้งหมดมากรองในหน้า
// จัดการต่อรีวิว (PATCH): สถานะ · ปักหมุด · อ่านแล้ว · ตอบกลับ (คำตอบสำเร็จรูป + คำตอบเก่าที่เคยใช้) · โน้ต/แท็กภายใน
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
import { REVIEWS_LIST_KEY, REVIEW_ASPECTS_KEY, REVIEW_FILTER_OPTIONS_KEY, REVIEWS_PAGE_SIZE, REVIEWS_DEFAULT_SORT } from "./reviewsQuery";
import { sortByThai, sortOptionsThai, thaiCompare } from "@/lib/thaiSort";

export type { ReviewRow };

const LIST_KEY = REVIEWS_LIST_KEY;
const SEARCH_DEBOUNCE_MS = 300;

export type Tri = "all" | "1" | "0";

/** คะแนน: ทั้งหมด · ดาวเดียว · รีวิวลบ (1–2 ดาว) */
export type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1" | "negative";

/** ตัวกรอง (ไม่มีหมวด — ซ้ำกับสินค้า) · sort อยู่นอกการ์ดตัวกรอง (เหนือรายการ) แต่เก็บรวมที่นี่ */
export interface ReviewFilters {
  productId: string;
  rating: RatingFilter;
  /** หัวข้อที่รีวิวพูดถึง (ทั้งชมและติ) · "all" = ไม่กรอง */
  aspectId: string;
  replied: Tri;
  /** "0" = ยังไม่อ่าน (read_at = null) · ตอบกลับ = อ่านแล้วอัตโนมัติ (backend) */
  read: Tri;
  media: Tri;
  orderKind: "all" | "order" | "preorder";
  sort: ReviewSort;
}

const DEFAULT_FILTERS: ReviewFilters = {
  productId: "all",
  rating: "all",
  aspectId: "all",
  replied: "all",
  read: "all",
  media: "all",
  orderKind: "all",
  sort: REVIEWS_DEFAULT_SORT,
};

function toParams(f: ReviewFilters, q: string, page: number, limit: number): ReviewListParams {
  const p: ReviewListParams = { page, limit, sort: f.sort };
  if (q) p.q = q;
  if (f.productId !== "all") p.product_id = f.productId;
  if (f.rating === "negative") p.sentiment_group = "negative";
  else if (f.rating !== "all") p.rating = Number(f.rating);
  if (f.aspectId !== "all") p.aspect_id = f.aspectId;
  if (f.replied !== "all") p.replied = Number(f.replied) as 0 | 1;
  if (f.read !== "all") p.read = Number(f.read) as 0 | 1;
  if (f.media !== "all") p.has_media = Number(f.media) as 0 | 1;
  if (f.orderKind !== "all") p.order_kind = f.orderKind;
  return p;
}

export function useReviewsViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("reports");

  // ── ตัวกรอง ──
  const [filters, setFilters] = useState<ReviewFilters>(DEFAULT_FILTERS);
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
  const listQ = useQuery({ queryKey: listKey, queryFn: () => reviewsService.list(params), placeholderData: keepPreviousData });
  const optionsQ = useQuery({ queryKey: REVIEW_FILTER_OPTIONS_KEY, queryFn: () => reviewsService.filterOptions(), staleTime: 60_000 });
  const aspectsQ = useQuery({ queryKey: REVIEW_ASPECTS_KEY, queryFn: () => reviewAspectsService.list() });

  const rows = useMemo(() => (listQ.data?.data ?? []).map(toReviewRow), [listQ.data]);
  const tagSuggestions = useMemo(() => [...new Set(rows.flatMap((r) => r.internalTags))].sort(thaiCompare), [rows]);

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
        read_at: doc.read_at ?? null,
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

  const markRead = useMutation({
    mutationFn: (ids: string[]) => reviewsService.markRead(ids),
    onSuccess: (res) => {
      alert.success(t("reviews.markedRead", { n: res.modified }));
      refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("reviews.updateFailed")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => reviewsService.remove(id),
    onSuccess: () => {
      alert.success(t("reviews.deleted"));
      refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("reviews.deleteFailed")),
  });

  // ── แท็กภายใน (modal) ──
  const [tagTarget, setTagTarget] = useState<ReviewRow | null>(null);
  const [tagDraft, setTagDraft] = useState<string[]>([]);

  // ── รายละเอียด (drawer — ผลวิเคราะห์ความรู้สึก) ──
  const [detailId, setDetailId] = useState<string | null>(null);

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
      setFilters({ ...DEFAULT_FILTERS, productId: productId ?? "all", rating: "negative", replied: "0", sort: "needs_reply" });
      setPage(1);
    },
    productOptions: sortByThai((options?.products ?? []), (p) => p.product_name_th).map((p) => ({ value: p.product_id, label: `${p.product_name_th} (${p.review_count})` })),
    aspectOptions: sortOptionsThai(activeAspects.map((a) => ({ value: a._id, label: a.aspect_name_th }))),
    replySuggestions: options?.reply_suggestions ?? [],


    onStatus: (r: ReviewRow, status: ReviewStatus) => void run(r._id, { status }, `reviews.statusChanged.${status}`),
    onTogglePin: (r: ReviewRow) => void run(r._id, { is_pinned: !r.is_pinned }),
    onSaveReply: (r: ReviewRow, text: string) => run(r._id, { shop_reply_text: text }, text.trim() ? "reviews.replySaved" : "reviews.replyRemoved"),
    onSaveNote: (r: ReviewRow, text: string) => run(r._id, { internal_note_text: text }, text.trim() ? "reviews.noteSaved" : "reviews.noteRemoved"),
    onDelete: (id: string) => remove.mutate(id),
    onMarkRead: (r: ReviewRow) => void run(r._id, { read: true }),
    /** รีวิวที่ยังไม่อ่านในหน้านี้ — ปุ่ม "อ่านแล้วทั้งหน้านี้" */
    unreadOnPage: rows.filter((r) => !r.read_at).length,
    onMarkPageRead: () => markRead.mutate(rows.filter((r) => !r.read_at).map((r) => r._id)),
    markingRead: markRead.isPending,
    /** ทางลัดจากแดชบอร์ด: รีวิวที่ยังไม่อ่าน ใหม่สุดก่อน · productId = สินค้าที่แดชบอร์ดดูอยู่ */
    showUnread: (productId?: string) => {
      setFilters({ ...DEFAULT_FILTERS, productId: productId ?? "all", read: "0", sort: "newest" });
      setPage(1);
    },

    tagTarget,
    tagDraft,
    setTagDraft,
    tagSuggestions,
    tagSaving: moderate.isPending && !!tagTarget,
    openTags: (r: ReviewRow) => {
      setTagTarget(r);
      setTagDraft(r.internalTags);
    },
    closeTags: () => setTagTarget(null),
    saveTags: async () => {
      if (!tagTarget) return;
      if (await run(tagTarget._id, { internal_tags: tagDraft }, "reviews.tagsSaved")) setTagTarget(null);
    },

    detail: rows.find((r) => r._id === detailId) ?? null,
    openDetail: (r: ReviewRow) => setDetailId(r._id),
    closeDetail: () => setDetailId(null),
  };
}
