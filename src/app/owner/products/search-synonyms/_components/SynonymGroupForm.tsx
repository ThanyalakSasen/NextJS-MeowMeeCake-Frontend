"use client";
// ฟอร์มกลุ่มคำ (ใช้ทั้งการ์ดเพิ่ม และ modal แก้ไข) — คำหลัก + คำพ้อง (พิมพ์แล้ว Enter หรือคั่นด้วย ,)
// คำที่ซ้ำกับกลุ่มอื่น = เตือน (ไม่บล็อก) · error = ข้อความที่แปลแล้วจาก ViewModel
import { useTranslations } from "next-intl";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Input, Select } from "@/components/base";
import type { SearchSynonymInput } from "@/types/searchSynonym";
import { MAX_WORD_LENGTH } from "../synonymForm";

export function SynonymGroupForm({ form, onChange, clashes, error }: {
  form: SearchSynonymInput;
  onChange: (form: SearchSynonymInput) => void;
  clashes: { word: string; group: string }[];
  error?: string;
}) {
  const t = useTranslations();
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-brown-800">
          {t("searchSynonyms.term")}
          <span className="text-red-500"> *</span>
        </span>
        <Input
          value={form.term}
          maxLength={MAX_WORD_LENGTH}
          placeholder={t("searchSynonyms.termPlaceholder")}
          onChange={(e) => onChange({ ...form, term: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 md:col-span-2">
        <span className="text-sm text-brown-800">{t("searchSynonyms.synonymsLabel")}</span>
        <Select
          mode="tags"
          open={false}
          tokenSeparators={[","]}
          value={form.synonyms}
          placeholder={t("searchSynonyms.synonymsPlaceholder")}
          onChange={(v: string[]) => onChange({ ...form, synonyms: v })}
        />
      </label>
      {clashes.length > 0 && (
        <p className="m-0 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-700 md:col-span-3">
          <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {clashes.map((c) => t("searchSynonyms.clash", { word: c.word, group: c.group })).join(" · ")} — {t("searchSynonyms.clashHint")}
          </span>
        </p>
      )}
      {error && <p className="m-0 text-xs text-red-500 md:col-span-3">{error}</p>}
    </div>
  );
}
