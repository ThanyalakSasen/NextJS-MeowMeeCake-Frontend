"use client";
// View ของ Store Design — กริดแบนเนอร์หน้าร้าน + modal เพิ่ม/แก้ไข
import { useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/base";
import { ListPageLayout } from "@/components/shared/layout";
import { LoadingSpin } from "@/components/shared/feedback";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { FilterToolbar, SearchInput, TypeTabBar } from "@/components/shared/data";
import type { useStoreDesignViewModel } from "./useStoreDesignViewModel";
import { BannerCard } from "./_components/BannerCard";
import { BannerFormModal } from "./_components/BannerFormModal";

type VM = ReturnType<typeof useStoreDesignViewModel>;

export function StoreDesignView(vm: VM) {
  const t = useTranslations();

  return (
    <ListPageLayout
      title={t("storeDesign.title")}
      description={t("storeDesign.description")}
      actions={
        <Button type="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={vm.openAdd}>
          {t("storeDesign.addBanner")}
        </Button>
      }
      toolbar={
        <FilterToolbar
          left={
            <>
              <TypeTabBar
                value={vm.tab}
                onChange={vm.setTab}
                options={[
                  { value: "all", label: `${t("common.all")} (${vm.counts.all})` },
                  { value: "active", label: `${t("enums.bannerStatus.active")} (${vm.counts.active})` },
                  { value: "scheduled", label: `${t("enums.bannerStatus.scheduled")} (${vm.counts.scheduled})` },
                  { value: "inactive", label: `${t("enums.bannerStatus.inactive")} (${vm.counts.inactive})` },
                ]}
              />
              <SearchInput value={vm.search} onChange={vm.setSearch} placeholder={t("storeDesign.searchPlaceholder")} />
            </>
          }
        />
      }
    >
      {vm.isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-gray-600">{t("common.loadFailed")}</p>
          <Button onClick={() => vm.refetch()}>{t("common.retry")}</Button>
        </div>
      ) : vm.isLoading ? (
        <LoadingSpin />
      ) : (
        <div className="flex flex-col gap-5">
          <StatCardsGrid>
            <StatCard label={t("storeDesign.statTotal")} value={vm.counts.all} sub={t("storeDesign.statTotalSub")} />
            <StatCard label={t("enums.bannerStatus.active")} value={vm.counts.active} sub={t("storeDesign.statActiveSub")} tone="up" />
            <StatCard label={t("enums.bannerStatus.scheduled")} value={vm.counts.scheduled} sub={t("storeDesign.statScheduledSub")} tone="warn" />
            <StatCard label={t("enums.bannerStatus.inactive")} value={vm.counts.inactive} sub={t("storeDesign.statInactiveSub")} tone="muted" />
          </StatCardsGrid>

          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {vm.rows.map((b) => (
              <BannerCard key={b._id} banner={b} onEdit={vm.openEdit} onDelete={vm.onDelete} onToggle={vm.onToggle} />
            ))}
            <button
              type="button"
              onClick={vm.openAdd}
              className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600"
            >
              <PlusIcon className="h-7 w-7" />
              <span className="text-sm font-medium">{t("storeDesign.addBanner")}</span>
              <span className="px-4 text-center text-xs leading-relaxed">{t("storeDesign.addCardHint")}</span>
            </button>
          </div>
        </div>
      )}

      <BannerFormModal
        key={vm.editTarget?._id ?? "new"}
        open={vm.modalOpen}
        editTarget={vm.editTarget}
        saving={vm.saving}
        onClose={vm.closeModal}
        onSubmit={vm.onSubmit}
      />
    </ListPageLayout>
  );
}
