"use client";
// แท็บ "คำสำหรับวิเคราะห์" — คำ/วลีในข้อความรีวิว → หัวข้อ (ระบบวิเคราะห์ข้อความใช้จัดหมวดรีวิวที่ลูกค้าไม่ได้เลือกหัวข้อ)
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { Button, Card, Input, Select, Tag } from "@/components/base";
import { DataTable, SearchInput } from "@/components/shared/data";
import { ConfirmDeletePopup, LoadingSpin } from "@/components/shared/feedback";
import { DeleteButton, EditButton, RetryButton, actionIcon, modalButtonIcons } from "@/components/shared/actions";
import { FormField } from "@/components/shared/form";
import type { SemanticTerm } from "@/types/review";
import type { useReviewSettingsViewModel } from "../useReviewSettingsViewModel";

type VM = ReturnType<typeof useReviewSettingsViewModel>;

export function TermsTab({ vm }: { vm: VM }) {
  const t = useTranslations();
  const e = vm.termEdit;

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 rounded-xl border border-brown-100 bg-brown-50 px-4 py-3 text-sm text-brown-800">{t("reviewSettings.terms.intro")}</p>
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={vm.termSearch} onChange={vm.setTermSearch} placeholder={t("reviewSettings.terms.searchPlaceholder")} />
          <Select
            size="small"
            style={{ width: 180 }}
            value={vm.termAspect}
            options={[{ value: "all", label: t("reviewSettings.terms.allAspects") }, ...vm.aspectOptions]}
            onChange={(v: string) => vm.setTermAspect(v)}
          />
          <span className="text-xs text-gray-400">{t("reviewSettings.terms.count", { shown: vm.terms.length, total: vm.termTotal })}</span>
          {vm.perm.create && (
            <Button className="ml-auto" type="primary" icon={actionIcon("add")} onClick={vm.openNewTerm} disabled={vm.aspectOptions.length === 0}>
              {t("reviewSettings.terms.add")}
            </Button>
          )}
        </div>
        {vm.termsError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-gray-600">{t("common.loadFailed")}</p>
            <RetryButton onClick={() => vm.refetchTerms()} />
          </div>
        ) : vm.termsLoading ? (
          <LoadingSpin />
        ) : (
          <DataTable<SemanticTerm>
            inCard
            rows={vm.terms}
            rowKey={(x) => x._id}
            emptyText={t("reviewSettings.terms.empty")}
            columns={[
              { key: "term", title: t("reviewSettings.terms.term"), width: 180, render: (x) => <span className="font-semibold text-brown-800">{x.term}</span> },
              {
                key: "synonyms",
                title: t("reviewSettings.terms.synonyms"),
                render: (x) =>
                  x.synonyms.length ? (
                    <span className="flex flex-wrap gap-1">{x.synonyms.map((s) => <Tag key={s} className="!m-0">{s}</Tag>)}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  ),
              },
              { key: "aspect", title: t("reviewSettings.terms.aspect"), width: 160, render: (x) => x.aspect?.aspect_name_th ?? "—" },
            ]}
            actions={
              vm.perm.update || vm.perm.delete
                ? (x) => (
                    <div className="flex justify-end gap-1">
                      {vm.perm.update && <EditButton size="small" onClick={() => vm.openEditTerm(x)} />}
                      {vm.perm.delete && (
                        <ConfirmDeletePopup title={t("reviewSettings.terms.deleteConfirm", { term: x.term })} onConfirm={() => vm.onDeleteTerm(x)}>
                          <DeleteButton size="small" />
                        </ConfirmDeletePopup>
                      )}
                    </div>
                  )
                : undefined
            }
          />
        )}
      </Card>

      <Modal
        open={!!e}
        title={e?.id ? t("reviewSettings.terms.editTitle") : t("reviewSettings.terms.addTitle")}
        onCancel={vm.closeTerm}
        onOk={vm.onSaveTerm}
        confirmLoading={vm.savingTerm}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        {...modalButtonIcons(e?.id ? "save" : "add")}
        destroyOnHidden
      >
        {e && (
          <div className="flex flex-col gap-3">
            <FormField label={t("reviewSettings.terms.term")} required>
              <Input value={e.form.term} maxLength={100} placeholder={t("reviewSettings.terms.termPlaceholder")}
                onChange={(ev) => vm.setTermForm({ ...e.form, term: ev.target.value })} />
            </FormField>
            <FormField label={t("reviewSettings.terms.aspect")} required>
              <Select value={e.form.aspect_id || undefined} options={vm.aspectOptions}
                onChange={(v: string) => vm.setTermForm({ ...e.form, aspect_id: v })} />
            </FormField>
            <FormField label={t("reviewSettings.terms.synonymsLabel")}>
              <Select mode="tags" open={false} tokenSeparators={[","]} value={e.form.synonyms} placeholder={t("reviewSettings.terms.synonymsPlaceholder")}
                onChange={(v: string[]) => vm.setTermForm({ ...e.form, synonyms: v })} />
            </FormField>
          </div>
        )}
      </Modal>
    </div>
  );
}
