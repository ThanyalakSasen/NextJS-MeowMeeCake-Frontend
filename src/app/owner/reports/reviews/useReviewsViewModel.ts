"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "รีวิวลูกค้า" (BACKLOG4 E4) — ยกจาก FrontOffice reports/reviews/ReviewTable (MVVM + i18n)
// กรอง/ค้นหา/เรียง/แบ่งหน้าที่ server + สรุปของชุดที่กรอง (summary=1 — I9) · เดิมโหลดทั้งหมดมากรองในหน้า
// จัดการต่อรีวิว (PATCH): สถานะ · ปักหมุด · อ่านแล้ว · ตอบกลับ (คำตอบสำเร็จรูป + คำตอบเก่าที่เคยใช้) · โน้ต/แท็กภายใน
// เลือกหลายรายการ: อ่านแล้ว/ยังไม่อ่าน (/bulk) · ส่งออก CSV (ต้นแบบ xlsx — แอปนี้ใช้ CSV ทุกหน้า)
// แก้แล้วอัปเดต cache ของหน้าปัจจุบันทันที แล้วโหลดชุดใหม่ (summary/ลำดับอาจเปลี่ยน) · สิทธิ์เมนู reports
// ไม่ยกมา: แดชบอร์ด/analytics/รายสินค้า (F3 — backend ยังไม่มี)
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { reviewAspectsService, reviewsService } from "@/services/reviews";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { exportToCsv } from "@/lib/exportCsv";
import { formatDate } from "@/i18n/format";
import { isApiError } from "@/types/api";
import type { Review, ReviewListParams, ReviewModeration, ReviewSort, ReviewStatus } from "@/types/review";
import { toReviewRow, type ReviewRow } from "./reviewRow";

export type { ReviewRow };

const LIST_KEY = ["reviews", "admin"] as const;
const SEARCH_DEBOUNCE_MS = 300;

export type Tri = "all" | "1" | "0";

export interface ReviewFilters {
  categoryId: string;
  productId: string;
  rating: number | null;
  negativeOnly: boolean;
  aspectId: string;
  aspectSentiment: "all" | "positive" | "negative";
  replied: Tri;
  read: Tri;
  media: Tri;
  status: "all" | ReviewStatus;
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
  read: "all",
  media: "all",
  status: "all",
  orderKind: "all",
  sort: "newest",
};

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
  if (f.read !== "all") p.read = Number(f.read) as 0 | 1;
  if (f.media !== "all") p.has_media = Number(f.media) as 0 | 1;
  if (f.status !== "all") p.status = f.status;
  if (f.orderKind !== "all") p.order_kind = f.orderKind;
  return p;
}

export function useReviewsViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("reports");

  // ── ตัวกรอง ──
  const [filters, setFilters] = useState<ReviewFilters>(DEFAULT_FILTERS);
  const [search, setSearchRaw] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
  const optionsQ = useQuery({ queryKey: ["reviews", "filter-options"], queryFn: reviewsService.filterOptions, staleTime: 60_000 });
  const aspectsQ = useQuery({ queryKey: ["review-aspects"], queryFn: reviewAspectsService.list });

  const rows = useMemo(() => (listQ.data?.data ?? []).map(toReviewRow), [listQ.data]);
  const tagSuggestions = useMemo(() => [...new Set(rows.flatMap((r) => r.internalTags))], [rows]);

  // ── เลือกหลายรายการ (ล้างเมื่อเปลี่ยนชุดข้อมูล) ──
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionKey, setSelectionKey] = useState("");
  const currentKey = JSON.stringify(params);
  if (selectionKey !== currentKey) {
    setSelectionKey(currentKey);
    if (selected.size) setSelected(new Set());
  }

  // ── จัดการรีวิว ──
  const patchCache = (id: string, patch: Partial<Review>) =>
    qc.setQueryData<Awaited<ReturnType<typeof reviewsService.list>>>(listKey, (old) =>
      old ? { ...old, data: old.data.map((r) => (r._id === id ? { ...r, ...patch } : r)) } : old,
    );
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: LIST_KEY });
    void qc.invalidateQueries({ queryKey: ["reviews", "filter-options"] });
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

  const remove = useMutation({
    mutationFn: (id: string) => reviewsService.remove(id),
    onSuccess: () => {
      alert.success(t("reviews.deleted"));
      refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("reviews.deleteFailed")),
  });

  const bulk = useMutation({
    mutationFn: (read: boolean) => reviewsService.bulkRead([...selected], read),
    onSuccess: (_, read) => {
      alert.success(t(read ? "reviews.bulkReadDone" : "reviews.bulkUnreadDone", { n: selected.size }));
      setSelected(new Set());
      refresh();
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("reviews.updateFailed")),
  });

  const exportSelected = () => {
    const chosen = rows.filter((r) => selected.has(r._id));
    exportToCsv(
      `reviews_${new Date().toISOString().slice(0, 10)}.csv`,
      [t("reviews.csv.date"), t("reviews.csv.product"), t("reviews.csv.customer"), t("reviews.csv.order"), t("reviews.csv.rating"),
        t("reviews.csv.text"), t("reviews.csv.topics"), t("reviews.csv.status"), t("reviews.csv.reply"), t("reviews.csv.tags"), t("reviews.csv.note")],
      chosen.map((r) => [
        formatDate(r.created_at, locale, { withTime: true }),
        r.productName,
        r.userName,
        r.orderNo,
        r.rating,
        r.review_text ?? "",
        r.topics.map((x) => `${x.sentiment === "positive" ? "+" : x.sentiment === "negative" ? "-" : ""}${x.label}`).join(", "),
        t(`reviews.status.${r.status}`),
        r.shop_reply?.text ?? "",
        r.internalTags.join(", "),
        r.internal_note?.text ?? "",
      ]),
    );
    alert.success(t("reviews.exported", { n: chosen.length }));
  };

  // ── แท็กภายใน (modal) ──
  const [tagTarget, setTagTarget] = useState<ReviewRow | null>(null);
  const [tagDraft, setTagDraft] = useState<string[]>([]);

  // ── รายละเอียด (drawer — ผลวิเคราะห์ความรู้สึก) ──
  const [detailId, setDetailId] = useState<string | null>(null);

  const activeAspects = (aspectsQ.data ?? []).filter((a) => !a.deleted_at);
  const options = optionsQ.data;

  return {
    perm,
    isLoading: listQ.isLoading,
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
    /** ทางลัดจากแถบสรุป: รีวิวลบที่ยังไม่ตอบ เรียงที่ควรตอบก่อน */
    showUnrepliedNegative: () => {
      setFilters({ ...DEFAULT_FILTERS, negativeOnly: true, replied: "0", sort: "needs_reply" });
      setPage(1);
    },
    categoryOptions: (options?.categories ?? []).map((c) => ({ value: c.category_id, label: `${c.category_name} (${c.review_count})` })),
    productOptions: (options?.products ?? []).map((p) => ({ value: p.product_id, label: `${p.product_name_th} (${p.review_count})` })),
    aspectOptions: activeAspects.map((a) => ({ value: a._id, label: a.aspect_name_th })),
    replySuggestions: options?.reply_suggestions ?? [],

    selected,
    toggleSelect: (id: string) =>
      setSelected((s) => {
        const next = new Set(s);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    selectAllOnPage: (on: boolean) => setSelected(on ? new Set(rows.map((r) => r._id)) : new Set()),
    bulkBusy: bulk.isPending,
    onBulkRead: (read: boolean) => bulk.mutate(read),
    onExport: exportSelected,

    onStatus: (r: ReviewRow, status: ReviewStatus) => void run(r._id, { status }, `reviews.statusChanged.${status}`),
    onTogglePin: (r: ReviewRow) => void run(r._id, { is_pinned: !r.is_pinned }),
    onToggleRead: (r: ReviewRow) => void run(r._id, { read: !r.isRead }),
    onSaveReply: (r: ReviewRow, text: string) => run(r._id, { shop_reply_text: text }, text.trim() ? "reviews.replySaved" : "reviews.replyRemoved"),
    onSaveNote: (r: ReviewRow, text: string) => run(r._id, { internal_note_text: text }, text.trim() ? "reviews.noteSaved" : "reviews.noteRemoved"),
    onDelete: (id: string) => remove.mutate(id),

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
