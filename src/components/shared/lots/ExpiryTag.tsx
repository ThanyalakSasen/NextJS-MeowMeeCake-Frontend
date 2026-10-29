"use client";
// ป้ายสถานะวันหมดอายุของล็อต (expiry_state จาก backend — คำนวณตามวันไทยวันนี้)
import { useTranslations } from "next-intl";
import { Tag } from "@/components/base";
import type { ExpiryState } from "@/types/productLot";

const COLOR: Record<ExpiryState, string | undefined> = { expired: "red", expiring: "orange", ok: "green", none: undefined };

export function ExpiryTag({ state }: { state: ExpiryState }) {
  const t = useTranslations();
  return <Tag color={COLOR[state]}>{t(`lots.expiryState.${state}`)}</Tag>;
}
