"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "ตั้งค่ารีวิว" (BACKLOG4 E4) — ยกจาก FrontOffice reports/reviews/settings (+ SemanticTermsTab) · สิทธิ์เมนู reports
// แท็บหัวข้อ (/admin/aspects): ปุ่มชอบ/ควรปรับปรุงในฟอร์มรีวิวของลูกค้า — เพิ่ม (≤ 20) · แก้ชื่อ · ไอคอน · คำแนะนำ ·
//   เปิด/ปิด · เลื่อนลำดับ (/reorder ทั้งชุด) · ลบ (soft) / กู้คืน
// แท็บคำวิเคราะห์ (/admin/semantic-terms): คำ/วลีในข้อความรีวิว → หัวข้อ (ให้ระบบวิเคราะห์ข้อความจัดหมวดได้)
// ไม่ยกมา: สถิติการถูกเลือกต่อหัวข้อ (มาจาก analytics — F3)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { reviewAspectsService, semanticTermsService } from "@/services/reviews";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { ReviewAspect, ReviewAspectInput, SemanticTerm, SemanticTermInput } from "@/types/review";
import { reviewAspectsKey } from "@/app/customer/lib/shopQueries";

const ASPECTS_KEY = ["review-aspects"] as const;
const TERMS_KEY = ["semantic-terms"] as const;
export const MAX_ASPECTS = 20;
export type SettingsTab = "aspects" | "terms";

export function useReviewSettingsViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("reports");
  const [tab, setTab] = useState<SettingsTab>("aspects");

  const fail = (e: unknown) => alert.error(isApiError(e) ? e.message : t("reviewSettings.saveFailed"));

  // ── หัวข้อ ──
  const aspectsQ = useQuery({ queryKey: ASPECTS_KEY, queryFn: reviewAspectsService.list });
  const all = useMemo(() => aspectsQ.data ?? [], [aspectsQ.data]);
  const aspects = all.filter((a) => !a.deleted_at);
  const deletedAspects = all.filter((a) => a.deleted_at);
  const refreshAspects = () => {
    void qc.invalidateQueries({ queryKey: ASPECTS_KEY });
    // ฟอร์มรีวิวหน้าร้าน (D7) ใช้ cache คนละชุด
    void qc.invalidateQueries({ queryKey: reviewAspectsKey });
  };
  const setAspects = (fn: (list: ReviewAspect[]) => ReviewAspect[]) => qc.setQueryData<ReviewAspect[]>(ASPECTS_KEY, (old) => fn(old ?? []));

  const [newTh, setNewTh] = useState("");
  const [newEng, setNewEng] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; th: string; eng: string } | null>(null);

  const createAspect = useMutation({
    mutationFn: () => reviewAspectsService.create({ aspect_name_th: newTh.trim(), aspect_name_eng: newEng.trim() || undefined }),
    onSuccess: (a) => {
      alert.success(t("reviewSettings.aspects.added", { name: a.aspect_name_th }));
      setNewTh("");
      setNewEng("");
      refreshAspects();
    },
    onError: fail,
  });

  const updateAspect = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReviewAspectInput }) => reviewAspectsService.update(id, body),
    onMutate: ({ id, body }) => setAspects((list) => list.map((a) => (a._id === id ? { ...a, ...body } : a))),
    onSuccess: (_, { body }) => {
      if (body.aspect_name_th !== undefined) {
        alert.success(t("reviewSettings.aspects.renamed"));
        setRenaming(null);
      }
      refreshAspects();
    },
    onError: (e) => {
      fail(e);
      refreshAspects();
    },
  });

  const removeAspect = useMutation({
    mutationFn: (a: ReviewAspect) => reviewAspectsService.remove(a._id),
    onSuccess: (_, a) => {
      alert.success(t("reviewSettings.aspects.deleted", { name: a.aspect_name_th }));
      refreshAspects();
    },
    onError: fail,
  });

  const restoreAspect = useMutation({
    mutationFn: (a: ReviewAspect) => reviewAspectsService.restore(a._id),
    onSuccess: (a) => {
      alert.success(t("reviewSettings.aspects.restored", { name: a.aspect_name_th }));
      refreshAspects();
    },
    onError: fail,
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => reviewAspectsService.reorder(ids),
    onMutate: (ids) =>
      setAspects((list) => {
        const order = new Map(ids.map((id, i) => [id, i]));
        return list.map((a) => (order.has(a._id) ? { ...a, display_order: order.get(a._id)! } : a)).sort((x, y) => x.display_order - y.display_order);
      }),
    onSettled: refreshAspects,
    onError: fail,
  });

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= aspects.length) return;
    const ids = aspects.map((a) => a._id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    reorder.mutate(ids);
  };

  // ── คำวิเคราะห์ ──
  const termsQ = useQuery({ queryKey: TERMS_KEY, queryFn: semanticTermsService.list, enabled: tab === "terms" });
  const [termSearch, setTermSearch] = useState("");
  const [termAspect, setTermAspect] = useState("all");
  const terms = useMemo(() => {
    const q = termSearch.trim().toLowerCase();
    return (termsQ.data ?? []).filter(
      (x) =>
        (termAspect === "all" || x.aspect?._id === termAspect) &&
        (!q || [x.term, ...x.synonyms].some((w) => w.toLowerCase().includes(q))),
    );
  }, [termsQ.data, termSearch, termAspect]);

  const [termEdit, setTermEdit] = useState<{ id: string | null; form: SemanticTermInput } | null>(null);
  const saveTerm = useMutation({
    mutationFn: ({ id, form }: { id: string | null; form: SemanticTermInput }) => {
      const body = { term: form.term.trim(), aspect_id: form.aspect_id, synonyms: [...new Set(form.synonyms.map((s) => s.trim()).filter(Boolean))] };
      return id ? semanticTermsService.update(id, body) : semanticTermsService.create(body);
    },
    onSuccess: () => {
      alert.success(t("reviewSettings.terms.saved"));
      setTermEdit(null);
      void qc.invalidateQueries({ queryKey: TERMS_KEY });
    },
    onError: fail,
  });
  const removeTerm = useMutation({
    mutationFn: (x: SemanticTerm) => semanticTermsService.remove(x._id),
    onSuccess: (_, x) => {
      alert.success(t("reviewSettings.terms.deleted", { term: x.term }));
      void qc.invalidateQueries({ queryKey: TERMS_KEY });
    },
    onError: fail,
  });

  return {
    perm,
    tab,
    setTab,

    aspectsLoading: aspectsQ.isLoading,
    aspectsError: aspectsQ.isError,
    refetchAspects: () => aspectsQ.refetch(),
    aspects,
    deletedAspects,
    activeCount: aspects.filter((a) => a.is_active).length,
    canAddAspect: perm.create && aspects.length < MAX_ASPECTS,
    newTh,
    setNewTh,
    newEng,
    setNewEng,
    adding: createAspect.isPending,
    onAddAspect: () => {
      if (newTh.trim()) createAspect.mutate();
    },
    renaming,
    startRename: (a: ReviewAspect) =>
      setRenaming({ id: a._id, th: a.aspect_name_th, eng: a.aspect_name_eng === a.aspect_name_th ? "" : a.aspect_name_eng }),
    setRenaming,
    saveRename: () => {
      if (!renaming?.th.trim()) return void alert.warning(t("reviewSettings.aspects.nameRequired"));
      updateAspect.mutate({ id: renaming.id, body: { aspect_name_th: renaming.th.trim(), aspect_name_eng: renaming.eng.trim() || renaming.th.trim() } });
    },
    onToggleActive: (a: ReviewAspect) => updateAspect.mutate({ id: a._id, body: { is_active: !a.is_active } }),
    onIcon: (a: ReviewAspect, icon: string) => updateAspect.mutate({ id: a._id, body: { icon } }),
    onPlaceholder: (a: ReviewAspect, text: string) => {
      const v = text.trim();
      if (v !== (a.placeholder_text ?? "")) updateAspect.mutate({ id: a._id, body: { placeholder_text: v || null } });
    },
    onMove: move,
    reordering: reorder.isPending,
    onDeleteAspect: (a: ReviewAspect) => removeAspect.mutate(a),
    onRestoreAspect: (a: ReviewAspect) => restoreAspect.mutate(a),

    termsLoading: termsQ.isLoading,
    termsError: termsQ.isError,
    refetchTerms: () => termsQ.refetch(),
    terms,
    termTotal: termsQ.data?.length ?? 0,
    termSearch,
    setTermSearch,
    termAspect,
    setTermAspect,
    termEdit,
    openNewTerm: () => setTermEdit({ id: null, form: { term: "", synonyms: [], aspect_id: aspects[0]?._id ?? "" } }),
    openEditTerm: (x: SemanticTerm) => setTermEdit({ id: x._id, form: { term: x.term, synonyms: x.synonyms, aspect_id: x.aspect?._id ?? "" } }),
    setTermForm: (form: SemanticTermInput) => setTermEdit((e) => (e ? { ...e, form } : e)),
    closeTerm: () => setTermEdit(null),
    savingTerm: saveTerm.isPending,
    onSaveTerm: () => {
      if (!termEdit) return;
      if (!termEdit.form.term.trim() || !termEdit.form.aspect_id) return void alert.warning(t("reviewSettings.terms.required"));
      saveTerm.mutate(termEdit);
    },
    onDeleteTerm: (x: SemanticTerm) => removeTerm.mutate(x),
    aspectOptions: aspects.map((a) => ({ value: a._id, label: a.aspect_name_th })),
  };
}
