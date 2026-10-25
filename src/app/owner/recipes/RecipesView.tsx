"use client";
// View ของ Recipes — JSX ล้วน รับ props จาก useRecipesViewModel
// 2 แท็บ: สูตรหลัก (การ์ด) · สูตรส่วนประกอบ (ตาราง) — ใช้ TabbedPageLayout ร่วมกับ Production
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useOpenedOnce } from "@/hooks/useOpenedOnce";
import { Button, EmptyState, Select, Tag } from "@/components/base";
import { TabbedPageLayout } from "@/components/shared/layout";
import { StatCard, StatCardsGrid } from "@/components/shared/stats";
import { DataTable, FilterToolbar, PaginationBar, SearchInput, type Column, FilterField } from "@/components/shared/data";
import { ConfirmDeletePopup, LoadingSpin } from "@/components/shared/feedback";
import type { RecipeComponent } from "@/types/recipeComponent";
import { DeleteButton, EditButton, ViewButton, actionIcon } from "@/components/shared/actions";
import { CategoryManagerButton } from "@/components/shared/categories";
import type { useRecipesViewModel } from "./useRecipesViewModel";
import { RecipeCard } from "./_components/RecipeCard";
import { sortOptionsThai } from "@/lib/thaiSort";
import { RestoreDeletedButton } from "@/components/shared/restore";

// ฟอร์มสูตร (Form/Select/ตัวแก้วัตถุดิบ-ขั้นตอน) + ลิ้นชักรายละเอียด แยก chunk — โหลดเมื่อเปิดครั้งแรก
// ไม่ต้อง parse/รันตอนเปิดหน้า (โมดัล/ลิ้นชักไม่ render ฝั่ง server อยู่แล้ว — Portal ของ antd คืน null)
const MainRecipeModal = dynamic(() => import("./_components/MainRecipeModal").then((m) => m.MainRecipeModal), { ssr: false });
const ComponentFormModal = dynamic(() => import("./_components/ComponentFormModal").then((m) => m.ComponentFormModal), { ssr: false });
const DetailModal = dynamic(() => import("@/components/shared/feedback/DetailModal").then((m) => m.DetailModal), { ssr: false });
const RecipeDetail = dynamic(() => import("./_components/RecipeDetail").then((m) => m.RecipeDetail), { ssr: false });

type VM = ReturnType<typeof useRecipesViewModel>;
type ComponentRow = RecipeComponent & { usedIn: string[] };

function MainTab(vm: VM) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-base text-gray-600">{t("recipes.planDescription", { n: vm.filteredRecipes.length })}</p>
        {vm.perm.create && (
          <Button type="primary" icon={actionIcon("add")} onClick={vm.openAddRecipe}>
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
        left={<SearchInput value={vm.mainSearch} onChange={vm.setMainSearch} placeholder={t("recipes.searchRecipePlaceholder")} />}
        // ตัวกรองชิดขวา (ช่องค้นหา/แท็บอยู่ซ้าย) — แบบเดียวกับหน้าพนักงาน
        right={
          <>
            <FilterField label={t("filterLabel.productCategory")} minWidth={170}>
              <Select
                value={vm.mainCategoryFilter}
                onChange={(v) => vm.setMainCategoryFilter(v as string)}
                options={[
                  { value: "all", label: t("common.all") },
                  ...sortOptionsThai(vm.productCategories.map((c) => ({ value: c._id, label: c.product_category_name }))),
                ]}
              />
            </FilterField>
          </>
        }
      />

      {vm.isLoading ? (
        <LoadingSpin />
      ) : vm.filteredRecipes.length === 0 ? (
        <EmptyState description={t("recipes.emptyRecipes")} />
      ) : (
        <div className="flex flex-col">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vm.pagedRecipes.map((r) => (
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
          <PaginationBar page={vm.mainPage} pageSize={vm.mainPageSize} total={vm.filteredRecipes.length} onChange={vm.setMainPagination} />
        </div>
      )}
    </div>
  );
}

function ComponentsTab(vm: VM) {
  const t = useTranslations();

  const columns: Column<ComponentRow>[] = [
    {
      key: "component_name",
      title: t("recipes.colComponentName"),
      render: (c) => <span className="font-medium text-brown-900">{c.component_name}</span>,
    },
    {
      key: "category",
      title: t("recipes.fieldCategory"),
      render: (c) => <Tag>{c.category_name}</Tag>,
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
      // รายชื่อสูตรหลักยาวหลายบรรทัดทำให้ตารางรก — แสดงแค่จำนวนเป็นปุ่ม กดแล้วเปิดรายชื่อในป๊อปอัป
      render: (c) => (
        c.usedIn.length === 0
          ? <span className="text-gray-500">{t("recipes.notUsedYet")}</span>
          : <ViewButton size="small" label={t("recipes.usedInCount", { n: c.usedIn.length })} onClick={() => vm.openUsedIn(c)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-base text-gray-600">{t("recipes.subDescription", { n: vm.filteredComponents.length })}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <CategoryManagerButton kind="component" />
          {vm.perm.create && (
            <Button type="primary" icon={actionIcon("add")} onClick={vm.openAddComponent}>
              {t("recipes.addComponent")}
            </Button>
          )}
        </div>
      </div>

      <StatCardsGrid cols={3}>
        <StatCard label={t("recipes.statTotalComponents")} value={vm.subStats.total} />
        <StatCard label={t("recipes.statUsed")} value={vm.subStats.used} tone="up" />
        <StatCard label={t("recipes.statAvgCost")} value={`${vm.subStats.avgCost}/${t("recipes.batch")}`} />
      </StatCardsGrid>

      <FilterToolbar
        left={<SearchInput value={vm.subSearch} onChange={vm.setSubSearch} placeholder={t("recipes.searchComponentPlaceholder")} />}
        // ตัวกรองชิดขวา (ช่องค้นหา/แท็บอยู่ซ้าย) — แบบเดียวกับหน้าพนักงาน
        right={
          <>
            <FilterField label={t("filterLabel.componentCategory")} minWidth={170}>
              <Select
                value={vm.subCategoryFilter}
                onChange={(v) => vm.setSubCategoryFilter(v as string)}
                options={[{ value: "all", label: t("common.all") }, ...vm.componentCategoryOptions]}
              />
            </FilterField>
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
                    <EditButton size="small" onClick={() => vm.openEditComponent(c)} />
                  )}
                  {vm.perm.delete && (
                    c.usedIn.length > 0 ? (
                      <DeleteButton size="small" disabled title={t("recipes.deleteComponentBlocked")} />
                    ) : (
                      <ConfirmDeletePopup title={t("recipes.deleteComponentConfirm", { name: c.component_name })} onConfirm={() => vm.onDeleteComponent(c._id)}>
                        <DeleteButton size="small" />
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
  const recipeFormUsed = useOpenedOnce(vm.recipeFormOpen);
  const componentFormUsed = useOpenedOnce(vm.componentFormOpen);
  const drawerUsed = useOpenedOnce(vm.drawerOpen);
  const usedInUsed = useOpenedOnce(!!vm.usedInComponent);

  return (
    <>
      <TabbedPageLayout
        title={t("recipes.title")}
        actions={<RestoreDeletedButton menu="recipes" resources={["recipes", "components", "componentCategories"]} />}
        activeKey={vm.activeTab}
        onChange={(k) => vm.setActiveTab(k as VM["activeTab"])}
        items={[
          { key: "main", label: t("recipes.tabMain", { n: vm.mainStats.total }), children: <MainTab {...vm} /> },
          { key: "components", label: t("recipes.tabComponents", { n: vm.subStats.total }), children: <ComponentsTab {...vm} /> },
        ]}
      />

      {recipeFormUsed && (
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
      )}

      {componentFormUsed && (
        <ComponentFormModal
          key={vm.componentEditTarget?._id ?? "new-component"}
          open={vm.componentFormOpen}
          editTarget={vm.componentEditTarget}
          ingredientOptions={vm.ingredientOptions}
          yieldUnitOptions={vm.allUnitOptions}
          categoryOptions={vm.componentCategoryOptions}
          saving={vm.savingComponent}
          onClose={vm.closeComponentForm}
          onSubmit={vm.onSaveComponent}
        />
      )}

      {drawerUsed && (
        <DetailModal
          open={vm.drawerOpen}
          title={vm.detailRecipe?.recipe_name ?? ""}
          onClose={vm.closeDrawer}
        >
          {vm.detailRecipe && <RecipeDetail recipe={vm.detailRecipe} />}
        </DetailModal>
      )}

      {usedInUsed && (
        <DetailModal
          open={!!vm.usedInComponent}
          title={t("recipes.usedInModalTitle", { name: vm.usedInComponent?.component_name ?? "" })}
          onClose={vm.closeUsedIn}
          size={480}
        >
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {(vm.usedInComponent?.usedIn ?? []).map((name) => (
              <li key={name} className="rounded-lg border border-gray-200 px-3 py-2 text-brown-900">{name}</li>
            ))}
          </ul>
        </DetailModal>
      )}
    </>
  );
}
