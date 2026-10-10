"use client";
// "ลองค้นหาแบบลูกค้า" — ผลจาก /catalog/products?search= ตัวเดียวกับช่องค้นหาหน้าร้าน (ViewModel ยิงให้)
// แสดงคำที่ใช้ค้นจริงหลังขยายคำพ้อง + สินค้าที่ลูกค้าไม่เห็นในรายการ (พรีออเดอร์/หมด/ซ่อน)
import { useTranslations } from "next-intl";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, Input, Tag } from "@/components/base";
import type { Product } from "@/types/product";
import { isProductCardVisible } from "@/components/customer/ProductCard";

export function SearchTester({ query, onQuery, result }: {
  query: string;
  onQuery: (q: string) => void;
  result: { words: string[]; usedGroups: string[]; loading: boolean; isError: boolean; products: Product[] } | null;
}) {
  const t = useTranslations();
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div>
        <p className="m-0 text-sm font-semibold text-brown-800">{t("searchSynonyms.tester.title")}</p>
        <p className="m-0 text-xs text-gray-500">{t("searchSynonyms.tester.hint")}</p>
      </div>
      <Input
        allowClear
        className="max-w-md"
        prefix={<MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />}
        value={query}
        placeholder={t("searchSynonyms.tester.placeholder")}
        onChange={(e) => onQuery(e.target.value)}
      />
      {result && (
        <div className="flex flex-col gap-2 text-xs text-gray-600">
          <p className="m-0 flex flex-wrap items-center gap-1">
            {t("searchSynonyms.tester.words")}
            {result.words.map((w) => (
              <Tag key={w} className="!m-0">{w}</Tag>
            ))}
            {result.usedGroups.length === 0 && <span className="text-gray-500">{t("searchSynonyms.tester.noGroup")}</span>}
          </p>
          {/* ไม่ใช้ <LoadFailed> — กล่องนี้เป็นตัวทดสอบค้นหาเล็ก ๆ ในหน้า ไม่ใช่สถานะของทั้งหน้า
              ไม่มีปุ่มลองใหม่ (พิมพ์คำใหม่ = ลองใหม่อยู่แล้ว) และใช้สีแดงเพื่อให้เห็นชัดในพื้นที่แคบ */}
          {result.isError ? (
            <p className="m-0 text-red-500">{t("common.loadFailed")}</p>
          ) : result.loading && result.products.length === 0 ? (
            <p className="m-0 text-gray-500">{t("searchSynonyms.tester.searching")}</p>
          ) : (
            <>
              <p className="m-0">{t("searchSynonyms.tester.found", { n: result.products.length })}</p>
              {result.products.length === 0 ? (
                <p className="m-0 text-gray-500">{t("searchSynonyms.tester.none")}</p>
              ) : (
                <ul className="m-0 max-h-72 list-none divide-y divide-gray-50 overflow-y-auto p-0">
                  {result.products.map((p) => (
                    <li key={p._id} className="flex items-center gap-2 py-1.5">
                      <span className="flex-1 text-brown-800">
                        {p.product_name_th}
                        {p.product_name_eng && <span className="text-gray-500"> · {p.product_name_eng}</span>}
                      </span>
                      {!isProductCardVisible(p) && (
                        <span className="rounded bg-gray-100 px-1.5 text-[10px] text-gray-500" title={t("searchSynonyms.tester.hiddenHint")}>
                          {t("searchSynonyms.tester.hidden")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
