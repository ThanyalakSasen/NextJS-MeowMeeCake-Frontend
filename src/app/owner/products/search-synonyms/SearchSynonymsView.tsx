"use client";
// View ของ "คำพ้องค้นหา" (BACKLOG4 E3) — คำอธิบาย · การ์ดเพิ่มกลุ่มคำ · ลองค้นหาแบบลูกค้า · ตารางกลุ่มคำ + modal แก้ไข
// ปุ่มเพิ่ม/แก้/ลบ ตามสิทธิ์ products.create/update/delete
import { Modal } from "antd";
import { useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button, Card, Tag } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { DataTable, SearchInput } from "@/components/shared/data";
import { ConfirmDeletePopup, LoadingSpin } from "@/components/shared/feedback";
import { DeleteButton, EditButton, RetryButton, modalButtonIcons } from "@/components/shared/actions";
import type { SearchSynonym } from "@/types/searchSynonym";
import type { useSearchSynonymsViewModel } from "./useSearchSynonymsViewModel";
import { SynonymGroupForm } from "./_components/SynonymGroupForm";
import { SearchTester } from "./_components/SearchTester";

type VM = ReturnType<typeof useSearchSynonymsViewModel>;

export function SearchSynonymsView(vm: VM) {
  const t = useTranslations();

  return (
    <ListPageLayout title={t("searchSynonyms.title")} description={t("searchSynonyms.description")}>
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <RetryButton onClick={() => vm.refetch()} />
        </div>
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="m-0 rounded-xl border border-brown-100 bg-brown-50 px-4 py-3 text-sm leading-relaxed text-brown-800">
            {t("searchSynonyms.example")}
          </p>

          {vm.perm.create && (
            <Card className="flex flex-col gap-3 p-4">
              <p className="m-0 text-sm font-semibold text-brown-800">{t("searchSynonyms.addTitle")}</p>
              <SynonymGroupForm form={vm.newForm} onChange={vm.setNewForm} clashes={vm.newClashes} error={vm.newError} />
              <div className="flex justify-end">
                <Button
                  type="primary"
                  icon={<PlusIcon className="h-4 w-4" />}
                  loading={vm.adding}
                  disabled={!vm.newForm.term.trim()}
                  onClick={vm.onAdd}
                >
                  {t("searchSynonyms.add")}
                </Button>
              </div>
            </Card>
          )}

          <SearchTester query={vm.testQuery} onQuery={vm.setTestQuery} result={vm.tester} />

          <Card className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 text-sm font-semibold text-brown-800">{t("searchSynonyms.listTitle", { n: vm.total })}</p>
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("searchSynonyms.searchPlaceholder")} />
            </div>
            <DataTable<SearchSynonym>
              inCard
              rows={vm.rows}
              rowKey={(g) => g._id}
              emptyText={vm.total === 0 ? t("searchSynonyms.empty") : t("searchSynonyms.noMatch")}
              columns={[
                { key: "term", title: t("searchSynonyms.term"), width: 200, render: (g) => <span className="font-semibold text-brown-800">{g.term}</span> },
                {
                  key: "synonyms",
                  title: t("searchSynonyms.synonyms"),
                  render: (g) =>
                    g.synonyms.length === 0 ? (
                      <span className="text-gray-300">—</span>
                    ) : (
                      <span className="flex flex-wrap gap-1">
                        {g.synonyms.map((s) => (
                          <Tag key={s} className="!m-0">{s}</Tag>
                        ))}
                      </span>
                    ),
                },
              ]}
              actions={
                vm.perm.update || vm.perm.delete
                  ? (g) => (
                      <div className="flex justify-end gap-1">
                        {vm.perm.update && <EditButton size="small" onClick={() => vm.openEdit(g)} />}
                        {vm.perm.delete && (
                          <ConfirmDeletePopup title={t("searchSynonyms.deleteConfirm", { term: g.term })} onConfirm={() => vm.onDelete(g)}>
                            <DeleteButton size="small" />
                          </ConfirmDeletePopup>
                        )}
                      </div>
                    )
                  : undefined
              }
            />
          </Card>
        </div>
      )}

      <Modal
        open={!!vm.editing}
        title={t("searchSynonyms.editTitle")}
        width={680}
        onCancel={vm.closeEdit}
        onOk={vm.onSaveEdit}
        confirmLoading={vm.saving}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        {...modalButtonIcons("save")}
        destroyOnHidden
      >
        {vm.editing && (
          <SynonymGroupForm form={vm.editing.form} onChange={vm.setEditForm} clashes={vm.editClashes} error={vm.editError} />
        )}
      </Modal>
    </ListPageLayout>
  );
}
