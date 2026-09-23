"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Store Design — จัดการแบนเนอร์หน้าร้าน
// โหลดครั้งเดียว (limit 100) filter ฝั่ง client · create/update/delete/toggle ผ่าน bannersService
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { bannersService } from "@/services/banners";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { Banner } from "@/types/banner";
import type { BannerStatus } from "@/constants/enumConfig";
import { getBannerStatus, toInput, type BannerFormValue } from "./bannerForm";

export interface BannerRow extends Banner {
  status: BannerStatus;
}

type TabFilter = "all" | BannerStatus;

export function useStoreDesignViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();

  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Banner | null>(null);

  const q = useQuery({
    queryKey: ["banners"],
    queryFn: () => bannersService.list({ limit: 100, sort: "sort_order" }),
  });

  const rows = useMemo<BannerRow[]>(
    () =>
      (q.data?.data ?? [])
        .map((b) => ({ ...b, status: getBannerStatus(b) }))
        .sort((a, b) => a.sort_order - b.sort_order),
    [q.data],
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter((b) => b.status === "active").length,
      scheduled: rows.filter((b) => b.status === "scheduled").length,
      inactive: rows.filter((b) => b.status === "inactive").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return rows.filter((b) => {
      const matchTab = tab === "all" || b.status === tab;
      const matchSearch = !kw || b.banner_name.toLowerCase().includes(kw);
      return matchTab && matchSearch;
    });
  }, [rows, tab, search]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["banners"] });

  const save = useMutation({
    mutationFn: (v: BannerFormValue) =>
      editTarget
        ? bannersService.update(editTarget._id, toInput(v))
        // ใหม่ = ต่อท้ายลำดับสุดท้ายเสมอ (ไม่มีให้กรอกในฟอร์มแล้ว — จัดลำดับด้วยการลากการ์ดแทน)
        : bannersService.create({ ...toInput(v), sort_order: rows.length > 0 ? Math.max(...rows.map((b) => b.sort_order)) + 1 : 1 }),
    onSuccess: () => {
      alert.success(t("storeDesign.saved"));
      invalidate();
      setModalOpen(false);
      setEditTarget(null);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("storeDesign.saveFailed")),
  });

  // จัดลำดับด้วยการลากการ์ด — การ์ดที่ N หลังลากแล้วต้องได้ sort_order = N เสมอ (1-based)
  // ยิง PATCH เฉพาะใบที่ sort_order เปลี่ยนจริงเท่านั้น (ลากแค่ 2 ใบ ไม่ต้องยิงทั้งลิสต์)
  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const current = new Map(rows.map((b) => [b._id, b.sort_order]));
      const changes = orderedIds
        .map((id, i) => ({ id, sort_order: i + 1 }))
        .filter(({ id, sort_order }) => current.get(id) !== sort_order);
      await Promise.all(changes.map(({ id, sort_order }) => bannersService.update(id, { sort_order })));
    },
    onSuccess: invalidate,
    onError: () => alert.error(t("storeDesign.reorderFailed")),
  });

  // จัดลำดับได้เฉพาะตอนเห็นลิสต์เต็ม ไม่ถูกกรอง — ไม่งั้นตำแหน่งการ์ดที่เห็นจะไม่ตรงกับ sort_order จริง
  const canReorder = tab === "all" && search.trim() === "";

  const onReorder = (draggedId: string, targetId: string) => {
    if (!canReorder || draggedId === targetId) return;
    const ids = rows.map((b) => b._id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reorder.mutate(ids);
  };

  const remove = useMutation({
    mutationFn: (id: string) => bannersService.remove(id),
    onSuccess: () => {
      alert.success(t("storeDesign.deleted"));
      invalidate();
    },
    onError: () => alert.error(t("storeDesign.deleteFailed")),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      bannersService.update(id, { is_active }),
    onSuccess: invalidate,
    onError: () => alert.error(t("storeDesign.toggleFailed")),
  });

  return {
    rows: filtered,
    counts,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => q.refetch(),

    tab, setTab,
    search, setSearch,

    canReorder, onReorder, reordering: reorder.isPending,

    modalOpen,
    editTarget,
    saving: save.isPending,
    openAdd: () => { setEditTarget(null); setModalOpen(true); },
    openEdit: (b: Banner) => { setEditTarget(b); setModalOpen(true); },
    closeModal: () => { setModalOpen(false); setEditTarget(null); },
    onSubmit: (v: BannerFormValue) => save.mutate(v),
    onDelete: (id: string) => remove.mutate(id),
    onToggle: (b: BannerRow) => toggle.mutate({ id: b._id, is_active: !b.is_active }),
  };
}
