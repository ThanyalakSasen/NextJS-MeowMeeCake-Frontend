"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Customer Reviews — อ่าน + ควบคุมการแสดงผลเท่านั้น (ไม่มีสร้าง/แก้ไขเนื้อหารีวิว
// เพราะ backend ไม่มี endpoint ให้ admin ทำแบบนั้นเลย — ดู types/review.ts)
// สิทธิ์เช็คจาก "products" ไม่ใช่ "reports" เพราะ endpoint จริงคือ /admin/reviews ใต้ products.*
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { reviewsService } from "@/services/reviews";
import { productsService } from "@/services/products";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { refId } from "@/lib/refId";
import type { Review } from "@/types/review";

export interface ReviewRow extends Review {
  userName: string;
  productName: string;
}

type RatingFilter = "all" | 1 | 2 | 3 | 4 | 5;
type VisibilityFilter = "all" | "visible" | "hidden";

export function useReviewsViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("products");

  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const reviewsQ = useQuery({ queryKey: ["reviews"], queryFn: () => reviewsService.list({ limit: 200 }) });
  const productsQ = useQuery({ queryKey: ["products", { limit: 200 }], queryFn: () => productsService.list({ limit: 200 }) });

  const rows: ReviewRow[] = useMemo(() => {
    return (reviewsQ.data?.data ?? []).map((r) => {
      const user = typeof r.user_id === "object" ? r.user_id : undefined;
      const product = typeof r.product_id === "object" ? r.product_id : undefined;
      return {
        ...r,
        userName: user?.user_fullname ?? "—",
        productName: product?.product_name_th ?? "—",
      };
    });
  }, [reviewsQ.data]);

  const productOptions = useMemo(
    () => (productsQ.data?.data ?? []).map((p) => ({ value: p._id, label: p.product_name_th })),
    [productsQ.data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchProduct = productId === "all" || refId(r.product_id) === productId;
      const matchRating = ratingFilter === "all" || r.rating === ratingFilter;
      const matchVisibility =
        visibilityFilter === "all" || (visibilityFilter === "visible" ? r.is_visible : !r.is_visible);
      const matchSearch =
        !q ||
        r.userName.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        (r.review_text ?? "").toLowerCase().includes(q);
      return matchProduct && matchRating && matchVisibility && matchSearch;
    });
  }, [rows, search, productId, ratingFilter, visibilityFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const avgRating = total > 0 ? rows.reduce((s, r) => s + r.rating, 0) / total : 0;
    const hidden = rows.filter((r) => !r.is_visible).length;
    const lowRating = rows.filter((r) => r.rating <= 2).length;
    return { total, avgRating, hidden, lowRating };
  }, [rows]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["reviews"] });

  const toggleVisibility = useMutation({
    mutationFn: ({ id, is_visible }: { id: string; is_visible: boolean }) => reviewsService.setVisibility(id, is_visible),
    onSuccess: invalidate,
    onError: () => alert.error(t("reviews.toggleFailed")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => reviewsService.remove(id),
    onSuccess: () => {
      alert.success(t("reviews.deleted"));
      invalidate();
    },
    onError: () => alert.error(t("reviews.deleteFailed")),
  });

  const selectedReview = rows.find((r) => r._id === selectedId) ?? null;

  return {
    perm,
    rows: filtered,
    stats,
    productOptions,
    isLoading: reviewsQ.isLoading || productsQ.isLoading,
    isError: reviewsQ.isError,
    refetch: () => reviewsQ.refetch(),

    search, setSearch,
    productId, setProductId,
    ratingFilter, setRatingFilter,
    visibilityFilter, setVisibilityFilter,

    selectedReview,
    drawerOpen,
    onView: (r: ReviewRow) => { setSelectedId(r._id); setDrawerOpen(true); },
    closeDrawer: () => setDrawerOpen(false),

    onToggleVisibility: (r: ReviewRow) => toggleVisibility.mutate({ id: r._id, is_visible: !r.is_visible }),
    onDelete: (id: string) => remove.mutate(id),
  };
}
