import { HydrationBoundary } from "@tanstack/react-query";
import { catalogService } from "@/services/catalog";
import { catalogProductKey } from "../../lib/catalogQueries";
import { prefetchPublic } from "../../lib/prefetchPublic";
import ProductDetailPage from "./_components/ProductDetailPage";

// รายละเอียดสินค้า — ดึงข้อมูลสินค้า (รูปหลัก = LCP) ฝั่ง server ก่อน · id ผิดรูปแบบ/ไม่พบ → หน้า client แสดงเหมือนเดิม
export default async function ProductDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const round = (await searchParams).round;
  const state = await prefetchPublic(
    /^[a-f0-9]{24}$/i.test(id) ? [{ queryKey: catalogProductKey(id), queryFn: () => catalogService.product(id) }] : [],
  );
  return (
    <HydrationBoundary state={state}>
      <ProductDetailPage roundParam={typeof round === "string" ? round : null} />
    </HydrationBoundary>
  );
}
