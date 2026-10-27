"use client";
// ─────────────────────────────────────────────────────────────
// ShippingScopePanel — "สินค้าไหนส่งไปจังหวัดอื่นได้บ้าง" (ปุ่มตั้งค่าพื้นที่จัดส่งของสินค้า หน้าค่าจัดส่ง)
//   บนสุด: สรุปทั้งร้าน (ส่งได้ทุกจังหวัด x · เฉพาะจังหวัดร้าน y) + ค้นหา · กรองหมวด (เอาตัวกรองขอบเขตจัดส่งออก 2026-10-26)
//   แต่ละหมวด = การ์ด: ชื่อ + จำนวน + ป้ายสถานะ (ทุกรายการ / บางรายการ x/n / เฉพาะจังหวัดร้าน) + สวิตช์ "ทั้งหมวด"
//     กดหัวการ์ดเพื่อกางสินค้า — กางได้ทีละหมวด (กางหมวดใหม่ หมวดเดิมย่อเอง) · สวิตช์ทั้งหมวด = ตั้งค่าหมวด + ล้างค่ารายสินค้า (useCategoryShipping.onToggleWholeCategory)
//   แต่ละสินค้า = สวิตช์รายสินค้า กดแล้วบันทึกทันที (useProductShipping) · ป้าย "ตั้งแยกจากหมวด" = ค่าต่างจากหมวด
//   ไม่แสดงหมวดที่ไม่มีสินค้า (ทั้งในรายการและตัวเลือกกรองหมวด)
// presentational · สิทธิ์ store_info (ไม่มี update = สวิตช์กดไม่ได้) · ค้นหา/กรองแล้วกางทุกหมวดที่มีสินค้าตรงเงื่อนไข
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
  /** สินค้าที่ตรงตัวกรอง */
  products: ProductShipping[];
  /** สินค้าทั้งหมดของหมวด (ไม่สนตัวกรอง) — ใช้คิดสถานะหัวการ์ด */
  all: ProductShipping[];
}

const PILL = "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";
const PILL_ON = "bg-emerald-50 text-emerald-700";
const PILL_SOME = "bg-amber-50 text-amber-700";
const PILL_OFF = "bg-gray-100 text-gray-600";

function ProductRow({ p, prods }: { p: ProductShipping; prods: Prods }) {
  const t = useTranslations();
  const custom = p.ships_nationwide !== null && p.ships_nationwide !== p.category_ships_nationwide;
  return (
    <li className="flex items-center gap-3 py-2.5 pl-10 pr-4">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="truncate text-sm text-gray-800">{p.product_name_th}</span>
          {p.is_preorder && (
            <span className={`${PILL} bg-brown-50 font-medium text-brown-700`}>{t("shippingZones.products.preorder")}</span>
          )}
          {custom && <span className={`${PILL} bg-sky-50 font-medium text-sky-700`}>{t("shippingZones.products.custom")}</span>}
        </span>
        {p.product_code && <span className="truncate text-xs text-gray-500">{p.product_code}</span>}
      </span>
      <label className="flex w-32 shrink-0 items-center justify-end gap-2 text-xs text-gray-600">
        <span className={p.effective_ships_nationwide ? "font-medium text-emerald-700" : ""}>
          {p.effective_ships_nationwide ? t("shippingZones.categories.nationwide") : t("shippingZones.categories.provinceOnly")}
        </span>
        <Switch
          size="small"
          checked={p.effective_ships_nationwide}
          disabled={!prods.perm.update}
          loading={prods.savingId === p._id}
          onChange={(v) => prods.onToggle(p, v)}
          aria-label={t("shippingZones.categories.toggleLabel", { name: p.product_name_th })}
        />
      </label>
    </li>
  );
}

function GroupCard({ g, cats, prods }: { g: Group; cats: Cats; prods: Prods }) {
  const t = useTranslations();
  const open = prods.isExpanded(g.id);
  const onCount = g.all.filter((p) => p.effective_ships_nationwide).length;
  // สถานะหัวการ์ด = มีสินค้าเปิด (ส่งทั่วประเทศ) อย่างน้อย 1 ชิ้น — เปิดสินค้าชิ้นไหน หมวดเปิดตามทันที
  const groupOn = onCount > 0;
  const pill =
    onCount === g.all.length
      ? { tone: PILL_ON, text: t("shippingZones.products.statusAll") }
      : onCount === 0
        ? { tone: PILL_OFF, text: t("shippingZones.products.statusNone") }
        : { tone: PILL_SOME, text: t("shippingZones.products.statusSome", { on: onCount, n: g.all.length }) };

  return (
    // shrink-0: การ์ดอยู่ในกล่องเลื่อน (flex-col + max-h) — ไม่ใส่ = หมวดที่กางยาวบีบการ์ดอื่นจนเหลือแถบว่าง (overflow-hidden ตัดหัวการ์ดทิ้ง)
    <div className="shrink-0 overflow-hidden rounded-xl border border-brown-200 bg-white">
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 bg-brown-50 px-4 py-3 ${open ? "border-b border-brown-200" : ""}`}>
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
          <span className="shrink-0 text-xs text-brown-700">{t("shippingZones.products.groupSummary", { n: g.all.length })}</span>
        </button>
        <span className={`${PILL} ${pill.tone}`}>{pill.text}</span>
        {g.cat && (
          <CategoryShippingSwitch
            item={g.cat}
            checked={groupOn}
            canUpdate={cats.perm.update}
            saving={cats.savingId === g.cat._id}
            onToggle={cats.onToggleWholeCategory}
            label={t("shippingZones.products.wholeCategory")}
          />
        )}
      </div>
      {open && (
        <ul className="m-0 flex list-none flex-col divide-y divide-gray-100 p-0">
          {g.products.map((p) => (
            <ProductRow key={p._id} p={p} prods={prods} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function ShippingScopePanel({ cats, prods }: { cats: Cats; prods: Prods }) {
  const t = useTranslations();

  // หมวดที่มีสินค้าเท่านั้น — หมวดว่างไม่แสดง (ทั้งรายการและตัวเลือกกรอง)
  const known = new Set(cats.items.map((c) => c._id));
  const withProducts: Group[] = [
    ...cats.items.map((c) => ({
      id: c._id,
      name: c.product_category_name,
      cat: c,
      products: prods.productsOf(c._id),
      all: prods.allProductsOf(c._id),
    })),
    ...prods.categoryIdsWithProducts
      .filter((id) => !known.has(id))
      .map((id) => ({
        id,
        name: prods.productsOf(id)[0]?.category_name || t("shippingZones.products.noCategory"),
        cat: null,
        products: prods.productsOf(id),
        all: prods.allProductsOf(id),
      })),
  ].filter((g) => g.all.length > 0);
  const groups = withProducts.filter(
    (g) => (!prods.categoryId || g.id === prods.categoryId) && (!prods.searching || g.products.length > 0),
  );
  const { on, n } = prods.totals;

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-xs text-gray-500">{t("shippingZones.categories.hint")}</p>

      {n > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">
            <p className="m-0 text-xs text-emerald-700">{t("shippingZones.categories.nationwide")}</p>
            <p className="m-0 text-lg font-bold text-emerald-800">{t("shippingZones.products.groupSummary", { n: on })}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
            <p className="m-0 text-xs text-gray-600">{t("shippingZones.categories.provinceOnly")}</p>
            <p className="m-0 text-lg font-bold text-gray-800">{t("shippingZones.products.groupSummary", { n: n - on })}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput value={prods.search} onChange={prods.setSearch} placeholder={t("shippingZones.products.searchPlaceholder")} />
        <Select
          allowClear
          className="w-full sm:w-44"
          value={prods.categoryId}
          options={withProducts.map((g) => ({ value: g.id, label: g.name }))}
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
        <EmptyState
          description={withProducts.length === 0 ? t("shippingZones.products.noProducts") : t("shippingZones.products.empty")}
        />
      ) : (
        <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
          {groups.map((g) => (
            <GroupCard key={g.id} g={g} cats={cats} prods={prods} />
          ))}
        </div>
      )}
    </div>
  );
}
