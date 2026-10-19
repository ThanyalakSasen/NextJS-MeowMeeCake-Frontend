"use client";
// ─────────────────────────────────────────────────────────────
// ShippingScopePanel — "จัดส่งนอกจังหวัด" หน้าเดียว (ในปุ่มจัดส่งนอกจังหวัด หน้าค่าจัดส่งหน้าร้านออนไลน์)
//   แต่ละหมวด = หัวข้อ + สวิตช์ · กดลูกศรลงเพื่อกางสินค้าในหมวด
//     สวิตช์หัวหมวดแสดง "เปิด" เมื่อมีสินค้าเปิดอย่างน้อย 1 ชิ้น (เปิดสินค้าชิ้นไหน หมวดเปิดตาม) · "เปิด x/n รายการ"
//     กดสวิตช์หัวหมวด = เปิด/ปิดทั้งหมวด (ตั้งค่าหมวด + ล้างค่ารายสินค้า — useCategoryShipping.onToggleWholeCategory)
//   แต่ละสินค้า = สวิตช์รายสินค้า กดแล้วบันทึกทันที (useProductShipping) — หมวดเปิดอยู่ ปิดบางชิ้นได้ = เปิดเฉพาะบางรายการ
// presentational · สิทธิ์ store_info (ไม่มี update = สวิตช์กดไม่ได้) · ค้นหาแล้วกางทุกหมวดที่มีสินค้าตรงคำค้น
// ─────────────────────────────────────────────────────────────
import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { EmptyState, Select, Switch } from "@/components/base";
import { SearchInput } from "@/components/shared/data";
import { LoadFailed, LoadingSpin } from "@/components/shared/feedback";
import type { useCategoryShipping } from "@/hooks/useCategoryShipping";
import type { useProductShipping } from "@/hooks/useProductShipping";
import type { CategoryShipping, ProductShipping } from "@/types/shippingZone";
import { CategoryShippingSwitch } from "./CategoryShippingSwitch";

type Cats = ReturnType<typeof useCategoryShipping>;
type Prods = ReturnType<typeof useProductShipping>;

interface Group {
  id: string;
  name: string;
  /** null = หมวดไม่อยู่ในรายการ (เช่น ถูกลบแล้ว) — ไม่มีสวิตช์ทั้งหมวด */
  cat: CategoryShipping | null;
  products: ProductShipping[];
}

function ProductRow({ p, prods }: { p: ProductShipping; prods: Prods }) {
  const t = useTranslations();
  return (
    <li className="flex items-center gap-2 py-2 pl-9 pr-3">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-gray-800">
          {p.product_name_th}
          {p.is_preorder && <span className="ml-1.5 text-xs text-gray-500">({t("shippingZones.products.preorder")})</span>}
        </span>
        {p.product_code && <span className="truncate text-xs text-gray-500">{p.product_code}</span>}
      </span>
      <label className="flex shrink-0 items-center gap-1.5 text-xs text-gray-600">
        <Switch
          size="small"
          checked={p.effective_ships_nationwide}
          disabled={!prods.perm.update}
          loading={prods.savingId === p._id}
          onChange={(v) => prods.onToggle(p, v)}
          aria-label={t("shippingZones.categories.toggleLabel", { name: p.product_name_th })}
        />
        {p.effective_ships_nationwide ? t("shippingZones.categories.nationwide") : t("shippingZones.categories.provinceOnly")}
      </label>
    </li>
  );
}

export function ShippingScopePanel({ cats, prods }: { cats: Cats; prods: Prods }) {
  const t = useTranslations();

  const known = new Set(cats.items.map((c) => c._id));
  const groups: Group[] = [
    ...cats.items.map((c) => ({ id: c._id, name: c.product_category_name, cat: c, products: prods.productsOf(c._id) })),
    ...prods.categoryIdsWithProducts
      .filter((id) => !known.has(id))
      .map((id) => ({
        id,
        name: prods.productsOf(id)[0]?.category_name || t("shippingZones.products.noCategory"),
        cat: null,
        products: prods.productsOf(id),
      })),
  ].filter((g) => (!prods.categoryId || g.id === prods.categoryId) && (!prods.searching || g.products.length > 0));

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-xs text-gray-500">{t("shippingZones.categories.hint")}</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput value={prods.search} onChange={prods.setSearch} placeholder={t("shippingZones.products.searchPlaceholder")} />
        <Select
          allowClear
          className="w-full sm:w-48"
          value={prods.categoryId}
          options={cats.items.map((c) => ({ value: c._id, label: c.product_category_name }))}
          placeholder={t("shippingZones.products.categoryFilter")}
          aria-label={t("shippingZones.products.categoryFilter")}
          onChange={(v?: string) => prods.setCategoryId(v)}
        />
      </div>

      {cats.isError || prods.isError ? (
        <LoadFailed
          className="flex flex-col items-center gap-3 py-6 text-center"
          onRetry={() => {
            void cats.refetch();
            void prods.refetch();
          }}
        />
      ) : cats.isLoading || prods.isLoading ? (
        <LoadingSpin className="py-8" />
      ) : groups.length === 0 ? (
        <EmptyState description={prods.searching ? t("shippingZones.products.empty") : t("shippingZones.categories.empty")} />
      ) : (
        <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
          {groups.map((g) => {
            const open = prods.isExpanded(g.id);
            // สถานะหัวหมวด = มีสินค้าเปิด (ส่งทั่วประเทศ) อย่างน้อย 1 ชิ้น — เปิดสินค้าชิ้นไหน หมวดเปิดตามทันที
            // หมวดที่ยังไม่มีสินค้า ใช้ค่าของหมวดเอง (สินค้าใหม่ในหมวดจะได้ค่านี้)
            const all = prods.allProductsOf(g.id);
            const onCount = all.filter((p) => p.effective_ships_nationwide).length;
            const groupOn = all.length > 0 ? onCount > 0 : g.cat?.ships_nationwide ?? false;
            return (
              // หัวหมวดใช้แถบสีน้ำตาลของแบรนด์ (ต่างจากแถวสินค้าสีขาวชัดเจน) · กรอบน้ำตาลครอบทั้งหมวด
              <div key={g.id} className="overflow-hidden rounded-xl border border-brown-200">
                <div className={`flex items-center gap-2 bg-brown-100 px-3 py-2.5 ${open ? "border-b border-brown-200" : ""}`}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => prods.toggleGroup(g.id)}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left"
                  >
                    <ChevronDownIcon
                      aria-hidden
                      className={`h-4 w-4 shrink-0 text-brown-700 transition-transform ${open ? "" : "-rotate-90"}`}
                    />
                    <span className="min-w-0 truncate text-sm font-bold text-brown-900">{g.name}</span>
                    <span className="shrink-0 text-xs font-medium text-brown-700">
                      {all.length === 0
                        ? t("shippingZones.products.groupSummary", { n: 0 })
                        : t("shippingZones.products.groupOnCount", { on: onCount, n: all.length })}
                    </span>
                  </button>
                  {g.cat && (
                    <CategoryShippingSwitch
                      item={g.cat}
                      checked={groupOn}
                      canUpdate={cats.perm.update}
                      saving={cats.savingId === g.cat._id}
                      onToggle={cats.onToggleWholeCategory}
                    />
                  )}
                </div>
                {open &&
                  (g.products.length === 0 ? (
                    <p className="m-0 bg-white py-2 pl-9 pr-3 text-xs text-gray-500">
                      {t("shippingZones.products.noProductsInCategory")}
                    </p>
                  ) : (
                    <ul className="m-0 flex list-none flex-col divide-y divide-gray-100 bg-white p-0">
                      {g.products.map((p) => (
                        <ProductRow key={p._id} p={p} prods={prods} />
                      ))}
                    </ul>
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
