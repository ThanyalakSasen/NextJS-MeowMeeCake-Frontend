"use client";
// รูปสินค้าในประวัติ/รายละเอียดออเดอร์ (BACKLOG4 U7) — snapshot ในออเดอร์ไม่มีรูป (Q-BE13)
// → ดึงรูปแรกของสินค้าจาก /catalog/products/:id (cache เดียวกับหน้าสินค้า/ตะกร้า) แบบเดียวกับ FrontOffice
// สินค้าถูกซ่อน/ลบ (404) หรือไม่มีรูป = ไอคอนเค้กแทน
import { useQuery } from "@tanstack/react-query";
import { CakeSlice } from "lucide-react";
import { catalogService } from "@/services/catalog";
import { resolveUploadUrl } from "@/lib/uploads";
import { isApiError } from "@/types/api";
import { catalogProductKey } from "../../lib/catalogQueries";

export default function OrderItemThumb({ productId, alt, className = "h-14 w-14" }: { productId: string; alt: string; className?: string }) {
  const q = useQuery({
    queryKey: catalogProductKey(productId),
    queryFn: () => catalogService.product(productId),
    enabled: !!productId,
    retry: (n, e) => !(isApiError(e) && e.status === 404) && n < 1,
    staleTime: 5 * 60_000,
  });
  const src = resolveUploadUrl(q.data?.product_img?.[0]);
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#FAF6F0] text-[#8C5A3C] ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- รูปจาก backend (คนละ origin)
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <CakeSlice className="h-6 w-6" aria-hidden="true" />
      )}
    </div>
  );
}
