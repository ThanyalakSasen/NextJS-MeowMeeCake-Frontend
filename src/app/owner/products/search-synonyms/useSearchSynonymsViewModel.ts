"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ "คำพ้องค้นหา" (BACKLOG4 E3) — ยกจาก FrontOffice owner/products/search-synonyms (MVVM + i18n)
// CRUD ผ่าน /admin/search-synonyms (สิทธิ์ products.*) · เตือนคำซ้ำข้ามกลุ่ม (ไม่บล็อก) · ตรวจก่อนส่งแบบเดียวกับ backend
// "ลองค้นหาแบบลูกค้า": ผลสินค้ามาจาก /catalog/products?search= ตัวเดียวกับหน้าร้าน (U4 — server ขยายคำพ้องเอง)
//   ต่างจากต้นแบบที่โหลดสินค้าทั้งหมดมาค้นฝั่ง client (H6) · คำที่ใช้ค้นแสดงจาก expandQueryWithSynonyms (สำเนากติกา backend)
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { searchSynonymsService } from "@/services/searchSynonyms";
import { catalogService } from "@/services/catalog";
import { usePermission } from "@/context/PermissionsContext";
import { expandQueryWithSynonyms } from "@/lib/searchSynonyms";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { SearchSynonym, SearchSynonymInput } from "@/types/searchSynonym";
import { EMPTY_SYNONYM_FORM, cleanSynonymInput, filterGroups, findClashes, validateSynonym, type SynonymError } from "./synonymForm";

const KEY = ["search-synonyms"] as const;
const TESTER_DEBOUNCE_MS = 350;

export function useSearchSynonymsViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("products");

  const q = useQuery({ queryKey: KEY, queryFn: searchSynonymsService.list });
  const groups = useMemo(() => q.data ?? [], [q.data]);

  const [search, setSearch] = useState("");
  const rows = useMemo(() => filterGroups(groups, search), [groups, search]);

  // ── เพิ่ม ──
  const [newForm, setNewForm] = useState<SearchSynonymInput>(EMPTY_SYNONYM_FORM);
  const [newError, setNewError] = useState<SynonymError | null>(null);
  // ── แก้ไข (modal) ──
  const [editing, setEditing] = useState<{ id: string; form: SearchSynonymInput } | null>(null);
  const [editError, setEditError] = useState<SynonymError | null>(null);

  const errorText = (e: SynonymError | null) => (e ? t(`searchSynonyms.errors.${e.key}` as Parameters<typeof t>[0], e.values) : undefined);
  const failText = (e: unknown, fallback: string) => (isApiError(e) ? e.message : fallback);

  const create = useMutation({
    mutationFn: (body: SearchSynonymInput) => searchSynonymsService.create(body),
    onSuccess: (doc) => {
      qc.setQueryData<SearchSynonym[]>(KEY, (old) => [...(old ?? []), doc].sort((a, b) => a.term.localeCompare(b.term, "th")));
      alert.success(t("searchSynonyms.added", { term: doc.term }));
      setNewForm(EMPTY_SYNONYM_FORM);
    },
    onError: (e) => alert.error(failText(e, t("searchSynonyms.saveFailed"))),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: SearchSynonymInput }) => searchSynonymsService.update(id, body),
    onSuccess: (doc) => {
      qc.setQueryData<SearchSynonym[]>(KEY, (old) => (old ?? []).map((g) => (g._id === doc._id ? doc : g)));
      alert.success(t("searchSynonyms.saved"));
      setEditing(null);
    },
    onError: (e) => alert.error(failText(e, t("searchSynonyms.saveFailed"))),
  });

  const remove = useMutation({
    mutationFn: (g: SearchSynonym) => searchSynonymsService.remove(g._id),
    onSuccess: (_, g) => {
      qc.setQueryData<SearchSynonym[]>(KEY, (old) => (old ?? []).filter((x) => x._id !== g._id));
      alert.success(t("searchSynonyms.deleted", { term: g.term }));
    },
    onError: (e) => alert.error(failText(e, t("searchSynonyms.deleteFailed"))),
  });

  const onAdd = () => {
    const err = validateSynonym(newForm, groups);
    setNewError(err);
    if (!err) create.mutate(cleanSynonymInput(newForm));
  };
  const onSaveEdit = () => {
    if (!editing) return;
    const err = validateSynonym(editing.form, groups, editing.id);
    setEditError(err);
    if (!err) update.mutate({ id: editing.id, body: cleanSynonymInput(editing.form) });
  };

  // ── ลองค้นหาแบบลูกค้า (หน่วงพิมพ์ก่อนยิง) ──
  const [testQuery, setTestQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(testQuery.trim()), TESTER_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [testQuery]);
  const testerQ = useQuery({
    queryKey: ["catalog", "products", "synonym-tester", debounced, groups],
    queryFn: () => catalogService.products({ search: debounced, limit: 100 }),
    enabled: debounced.length > 0,
    placeholderData: keepPreviousData,
  });
  const expansion = useMemo(() => expandQueryWithSynonyms(debounced, groups), [debounced, groups]);

  return {
    perm,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => q.refetch(),
    total: groups.length,
    rows,
    search,
    setSearch,

    newForm,
    setNewForm: (f: SearchSynonymInput) => {
      setNewForm(f);
      setNewError(null);
    },
    newError: errorText(newError),
    newClashes: findClashes(newForm, groups),
    adding: create.isPending,
    onAdd,

    editing,
    openEdit: (g: SearchSynonym) => {
      setEditError(null);
      setEditing({ id: g._id, form: { term: g.term, synonyms: g.synonyms } });
    },
    closeEdit: () => setEditing(null),
    setEditForm: (form: SearchSynonymInput) => {
      setEditing((e) => (e ? { ...e, form } : e));
      setEditError(null);
    },
    editError: errorText(editError),
    editClashes: editing ? findClashes(editing.form, groups, editing.id) : [],
    saving: update.isPending,
    onSaveEdit,
    onDelete: (g: SearchSynonym) => remove.mutate(g),

    testQuery,
    setTestQuery,
    tester: debounced
      ? {
          words: expansion.words,
          usedGroups: expansion.groups,
          loading: testerQ.isFetching,
          isError: testerQ.isError,
          products: testerQ.data?.data ?? [],
        }
      : null,
  };
}
