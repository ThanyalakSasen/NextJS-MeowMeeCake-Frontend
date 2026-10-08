"use client";
// ─────────────────────────────────────────────────────────────
// useFavorites — รายการโปรดของลูกค้าที่ login (BACKLOG3-merge D5 · ปุ่มหัวใจ U3)
// โหลด /shop/favorites ครั้งเดียวแล้วบัตรสินค้าทุกใบอ่านจาก cache เดียวกัน
// (FrontOffice ให้บัตรแต่ละใบยิงขอรายการเองตอน mount → หน้าสินค้า 20 ใบ = 20 คำขอ)
// กดหัวใจ: เปลี่ยนใน cache ทันที (optimistic) → บันทึก → ล้มเหลว = คืนค่าเดิม · guest = แจ้งเตือนแล้วพาไป login
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { shopFavoritesService, type FavoriteItem } from "@/services/shopFavorites";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { LOGIN_PATH } from "@/constants/auth";
import { shopFavoritesKey } from "../lib/shopQueries";

export function useFavorites() {
  const t = useTranslations("shop.cartActions");
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { status: authStatus } = useCustomerSession();
  const isLoggedIn = authStatus === "authenticated";
  const [pending, setPending] = useState<string | null>(null);

  const q = useQuery({ queryKey: shopFavoritesKey, queryFn: shopFavoritesService.list, enabled: isLoggedIn, staleTime: 60_000 });
  const items = isLoggedIn ? (q.data ?? []) : [];

  const isFavorite = (productId: string) => items.some((f) => f.id === productId);

  /** stub = ข้อมูลที่ใส่ใน cache ระหว่างรอ (เพิ่มจากบัตรสินค้า — รายละเอียดเต็มมากับการโหลดใหม่) */
  const toggle = async (productId: string, stub?: Partial<FavoriteItem>) => {
    if (!isLoggedIn) {
      alert.warning(t("loginToFavorite"));
      router.push(`${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (pending) return;
    const next = !isFavorite(productId);
    const before = qc.getQueryData<FavoriteItem[]>(shopFavoritesKey);
    await qc.cancelQueries({ queryKey: shopFavoritesKey });
    qc.setQueryData<FavoriteItem[]>(shopFavoritesKey, (list = []) =>
      next
        ? [{ name: "", nameeg: "", category: "", price: 0, originalPrice: null, image: "", inStock: true, rating: "-", is_preorder: false, ...stub, id: productId }, ...list]
        : list.filter((f) => f.id !== productId),
    );
    setPending(productId);
    try {
      await (next ? shopFavoritesService.add(productId) : shopFavoritesService.remove(productId));
      alert.success(next ? t("favoriteAdded") : t("favoriteRemoved"));
    } catch (e) {
      qc.setQueryData(shopFavoritesKey, before);
      alert.error(isApiError(e) ? e.message : t("favoriteFailed"));
    } finally {
      setPending(null);
      void qc.invalidateQueries({ queryKey: shopFavoritesKey });
    }
  };

  return { items, query: q, isLoggedIn, isFavorite, toggle, pendingId: pending };
}
