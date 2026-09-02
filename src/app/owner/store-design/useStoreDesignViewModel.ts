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
      editTarget ? bannersService.update(editTarget._id, toInput(v)) : bannersService.create(toInput(v)),
    onSuccess: () => {
      alert.success(t("storeDesign.saved"));
      invalidate();
      setModalOpen(false);
      setEditTarget(null);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("storeDesign.saveFailed")),
  });

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

    modalOpen,
    editTarget,
    saving: save.isPending,
    openAdd: () => { setEditTarget(null); setModalOpen(true); },
    openEdit: (b: Banner) => { setEditTarget(b); setModalOpen(true); },
    closeModal: () => { setModalOpen(false); setEditTarget(null); },
    onSubmit: (v: BannerFormValue) => save.mutate(v),
    onDelete: (id: string) => remove.mutate(id),
    onToggle: (b: BannerRow) => toggle.mutate({ id: b._id, is_active: b.status === "inactive" }),
  };
}
