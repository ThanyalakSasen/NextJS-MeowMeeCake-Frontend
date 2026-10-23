"use client";
// ─────────────────────────────────────────────────────────────
// useAllergenWarnings — ป้ายเตือนแพ้อาหารบนบัตรสินค้าทุกหน้า
// โหลด /shop/allergen-warnings ครั้งเดียว (ล็อกอินอยู่เท่านั้น) แล้วบัตรทุกใบอ่านจาก cache เดียวกัน · guest = ไม่มีป้าย
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { shopAllergensService } from "@/services/shopAllergens";
import type { AllergenWarning } from "@/services/catalog";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { shopAllergenWarningsKey } from "../lib/shopQueries";

export function useAllergenWarnings() {
  const { status } = useCustomerSession();
  const isLoggedIn = status === "authenticated";
  const q = useQuery({
    queryKey: shopAllergenWarningsKey,
    queryFn: shopAllergensService.warnings,
    enabled: isLoggedIn,
    staleTime: 60_000,
  });
  const warnings = isLoggedIn ? (q.data ?? {}) : {};
  return (productId: string): AllergenWarning | null => warnings[productId] ?? null;
}
