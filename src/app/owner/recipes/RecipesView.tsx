"use client";
// View ของ Recipes — JSX ล้วน รับ props จาก useRecipesViewModel
// 2 แท็บ: สูตรหลัก (การ์ด) · สูตรส่วนประกอบ (ตาราง) — ใช้ TabbedPageLayout ร่วมกับ Production
import { useTranslations, useLocale } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button, EmptyState, Select, Tag } from "@/components/base";
import { TabbedPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { DataTable, FilterToolbar, SearchInput, type Column } from "@/components/shared/data";
import { DetailDrawer, ConfirmDeletePopup, LoadingSpin } from "@/components/shared/feedback";
import { formatDate } from "@/i18n/format";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_COLORS } from "@/constants/enumConfig";
import type { RecipeComponent } from "@/types/recipeComponent";
import type { useRecipesViewModel } from "./useRecipesViewModel";
import { RecipeCard } from "./_components/RecipeCard";
import { RecipeDetail } from "./_components/RecipeDetail";
import { MainRecipeModal } from "./_components/MainRecipeModal";
import { ComponentFormModal } from "./_components/ComponentFormModal";

type VM = ReturnType<typeof useRecipesViewModel>;
type ComponentRow = RecipeComponent & { usedIn: string[] };

function MainTab(vm: VM) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-base text-gray-600">{t("recipes.planDescription", { n: vm.filteredRecipes.length })}</p>
        {vm.perm.create && (
          <Button type="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={vm.openAddRecipe}>
            {t("recipes.addRecipe")}
          </Button>
        )}
      </div>

      <StatCardsGrid>
        <StatCard label={t("recipes.statTotalRecipes")} value={vm.mainStats.total} sub={t("recipes.batch")} />
        <StatCard label={t("recipes.statWithComponents")} value={vm.mainStats.withComponents} tone="up" />
        <StatCard label={t("recipes.statAvgCost")} value={`${vm.mainStats.avgCost}/${t("recipes.batch")}`} />
        <StatCard label={t("recipes.statWithoutRecipe")} value={vm.mainStats.withoutRecipe} tone={vm.mainStats.withoutRecipe > 0 ? "warn" : "muted"} />
      </StatCardsGrid>

      {vm.mainStats.withoutRecipe > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("recipes.withoutRecipeAlert", { names: vm.productsWithoutRecipe.map((p) => p.product_name_th).join(", ") })}
        </div>
      )}

      <FilterToolbar
        left={
          <>
            <SearchInput value={vm.mainSearch} onChange={vm.setMainSearch} placeholder={t("recipes.searchRecipePlaceholder")} />
            <div style={{ minWidth: 170 }}>
              <Select
                value={vm.mainCategoryFilter}
                onChange={(v) => vm.setMainCategoryFilter(v as string)}
                options={[
                  { value: "all", label: t("common.all") },
                  ...vm.productCategories.map((c) => ({ value: c._id, label: c.category_name })),
                ]}
              />
            </div>
          </>
        }
      />

      {vm.isLoading ? (
        <LoadingSpin />
      ) : vm.filteredRecipes.length === 0 ? (
        <EmptyState description={t("recipes.emptyRecipes")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vm.filteredRecipes.map((r) => (
            <RecipeCard
              key={r._id}
              recipe={r}
              canUpdate={vm.perm.update}
              canDelete={vm.perm.delete}
              onView={() => vm.onViewRecipe(r)}
              onEdit={() => vm.openEditRecipe(r)}
              onDelete={() => vm.onDeleteRecipe(r._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentsTab(vm: VM) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<ComponentRow>[] = [
    {
      key: "component_name",
      title: t("recipes.colComponentName"),
      render: (c) => <span className="font-medium text-brown-900">{c.component_name}</span>,
    },
    {
      key: "category",
      title: t("recipes.fieldCategory"),
      render: (c) => {
        const cfg = RECIPE_CATEGORY_COLORS[c.category];
        return <Tag style={{ background: cfg.bg, color: cfg.text, borderColor: "transparent" }}>{t(`enums.recipeCategory.${c.category}`)}</Tag>;
      },
    },
    {
      key: "ingredients",
      title: t("recipes.ingredientsTitle"),
      render: (c) => <span className="text-gray-600">{t("recipes.itemsCount", { n: c.ingredients.length })}</span>,
    },
    {
      key: "yield",
      title: t("recipes.fieldYieldQty"),
      render: (c) => <span className="text-gray-600">{c.yield_qty} {c.yield_unit_abbr}</span>,
    },
    {
      key: "cost",
      title: t("recipes.fieldCost"),
      align: "right",
      render: (c) => <span className="font-semibold text-brown-900">฿{c.estimated_cost_per_batch}</span>,
    },
    {
      key: "usedIn",
      title: t("recipes.usedInTitle"),
      render: (c) => (
        c.usedIn.length === 0
          ? <span className="text-gray-400">{t("recipes.notUsedYet")}</span>
          : <div className="flex flex-wrap gap-1">
              {c.usedIn.map((name) => (
                <span key={name} className="rounded bg-pink-50 px-1.5 py-0.5 text-sm font-medium text-pink-700">{name}</span>
              ))}
            </div>
      ),
    },
    {
      key: "updated",
      title: t("common.status"),
      render: (c) => <span className="text-gray-400">{formatDate(c.updated_at, locale)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-base text-gray-600">{t("recipes.subDescription", { n: vm.filteredComponents.length })}</p>
        {vm.perm.create && (
          <Button type="primary" icon={<PlusIcon className="h-4 w-4" />} onClick={vm.openAddComponent}>
            {t("recipes.addComponent")}
          </Button>
        )}
      </div>

      <StatCardsGrid>
        <StatCard label={t("recipes.statTotalComponents")} value={vm.subStats.total} />
        <StatCard label={t("recipes.statUsed")} value={vm.subStats.used} tone="up" />
        <StatCard label={t("recipes.statAvgCost")} value={`${vm.subStats.avgCost}/${t("recipes.batch")}`} />
      </StatCardsGrid>

      <FilterToolbar
        left={
          <>
            <SearchInput value={vm.subSearch} onChange={vm.setSubSearch} placeholder={t("recipes.searchComponentPlaceholder")} />
            <div style={{ minWidth: 170 }}>
              <Select
                value={vm.subCategoryFilter}
                onChange={(v) => vm.setSubCategoryFilter(v as VM["subCategoryFilter"])}
                options={[
                  { value: "all", label: t("common.all") },
                  ...RECIPE_CATEGORIES.map((c) => ({ value: c, label: t(`enums.recipeCategory.${c}`) })),
                ]}
              />
            </div>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={vm.filteredComponents}
        loading={vm.isLoading}
        emptyText={t("recipes.emptyComponents")}
        actions={
          vm.perm.update || vm.perm.delete
            ? (c) => (
                <div className="flex justify-end gap-2">
                  {vm.perm.update && (
                    <Button size="small" onClick={() => vm.openEditComponent(c)}>{t("common.edit")}</Button>
                  )}
                  {vm.perm.delete && (
                    c.usedIn.length > 0 ? (
                      <Button size="small" danger disabled title={t("recipes.deleteComponentBlocked")}>
                        {t("common.delete")}
                      </Button>
                    ) : (
                      <ConfirmDeletePopup title={t("recipes.deleteComponentConfirm", { name: c.component_name })} onConfirm={() => vm.onDeleteComponent(c._id)}>
                        <Button size="small" danger>{t("common.delete")}</Button>
                      </ConfirmDeletePopup>
                    )
                  )}
                </div>
              )
            : undefined
        }
      />
    </div>
  );
}

export function RecipesView(vm: VM) {
  const t = useTranslations();

  return (
    <>
      <TabbedPageLayout
        title={t("recipes.title")}
        activeKey={vm.activeTab}
        onChange={(k) => vm.setActiveTab(k as VM["activeTab"])}
        items={[
          { key: "main", label: t("recipes.tabMain", { n: vm.mainStats.total }), children: <MainTab {...vm} /> },
          { key: "components", label: t("recipes.tabComponents", { n: vm.subStats.total }), children: <ComponentsTab {...vm} /> },
        ]}
      />

      <MainRecipeModal
        key={vm.recipeEditTarget?._id ?? "new-recipe"}
        open={vm.recipeFormOpen}
        editTarget={vm.recipeEditTarget}
        productOptions={vm.eligibleProductOptions}
        componentOptions={vm.componentOptions}
        ingredientOptions={vm.ingredientOptions}
        yieldUnitOptions={vm.productYieldUnitOptions}
        saving={vm.savingRecipe}
        onClose={vm.closeRecipeForm}
        onSubmit={vm.onSaveRecipe}
      />

      <ComponentFormModal
        key={vm.componentEditTarget?._id ?? "new-component"}
        open={vm.componentFormOpen}
        editTarget={vm.componentEditTarget}
        ingredientOptions={vm.ingredientOptions}
        yieldUnitOptions={vm.allUnitOptions}
        saving={vm.savingComponent}
        onClose={vm.closeComponentForm}
        onSubmit={vm.onSaveComponent}
      />

      <DetailDrawer
        open={vm.drawerOpen}
        title={vm.detailRecipe?.recipe_name ?? ""}
        onClose={vm.closeDrawer}
      >
        {vm.detailRecipe && <RecipeDetail recipe={vm.detailRecipe} />}
      </DetailDrawer>
    </>
  );
}
