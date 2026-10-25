"use client";
// ─────────────────────────────────────────────────────────────
// สินค้าที่คล้ายกัน — ยกจาก FrontOffice ProductDetailClient (บล็อกที่ 3)
// GET /catalog/products/{id}/similar — login อยู่ = ปรับตามผู้ใช้ + ป้ายแพ้อาหารจากที่ลูกค้าบันทึกไว้ (U3)
// ProductCard ซ่อนสินค้าหมด/พรีออเดอร์เอง → นับเฉพาะที่แสดงจริง · ไม่มีเลย = ไม่แสดงบล็อก
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { catalogService } from "@/services/catalog";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import ProductCard, { isProductCardVisible } from "@/components/customer/ProductCard";
import { PRODUCT_GRID, PRODUCT_GRID_BLEED } from "../../../lib/productGrid";

export default function SimilarProducts({ productId }: { productId: string }) {
  const t = useTranslations("shop.similar");
  const { status } = useCustomerSession();
  // key รวมสถานะ login — ผลต่างกัน (ป้ายแพ้อาหารมีเฉพาะตอน login)
  const q = useQuery({
    queryKey: ["catalog", "product", productId, "similar", status === "authenticated"],
    queryFn: () => catalogService.similar(productId, 10),
    enabled: status !== "loading",
  });
  const items = (q.data ?? []).filter((r) => isProductCardVisible(r.product));

  if (q.isError || (q.isSuccess && items.length === 0)) return null;

  return (
    <section className="pt-4" aria-labelledby="similar-title">
      <div className="mb-4">
        <span className="block text-xs font-bold uppercase tracking-wider text-[#8C5A3C]">{t("eyebrow")}</span>
        <h2 id="similar-title" className="m-0 text-xl font-extrabold text-[#4A342E] sm:text-2xl">{t("title")}</h2>
      </div>
      {!q.isSuccess ? (
        <p className="animate-pulse py-8 text-center text-xs text-[#8C5A3C] sm:text-sm">{t("loading")}</p>
      ) : (
        <div className={`${PRODUCT_GRID} ${PRODUCT_GRID_BLEED}`}>
          {items.map((r) => (
            <ProductCard key={r.product._id} product={r.product} allergenWarning={r.allergenWarning} />
          ))}
        </div>
      )}
    </section>
  );
}
