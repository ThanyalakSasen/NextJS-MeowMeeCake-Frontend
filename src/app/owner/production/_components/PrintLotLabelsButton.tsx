"use client";
// ปุ่มพิมพ์ฉลากล็อตต่อแถวในตารางประวัติการผลิต — ดึงล็อตของใบสั่งผลิตตอนกด (key เดียวกับ ProductionLots) แล้วเปิด LotLabelModal
// ใบที่ยังไม่ปิดงาน = ยังไม่มีล็อต → ผู้เรียกไม่แสดงปุ่ม · ใบที่ปิดก่อนมีระบบล็อต = แจ้งว่าไม่มีล็อต
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/base";
import { actionIcon } from "@/components/shared/actions";
import { LotLabelModal } from "@/components/shared/lots";
import { productLotsService } from "@/services/productLots";
import { alert } from "@/lib/alert";
import type { ProductLot } from "@/types/productLot";

export function PrintLotLabelsButton({ orderId }: { orderId: string }) {
  const t = useTranslations();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [lots, setLots] = useState<ProductLot[] | null>(null);

  const openLabels = async () => {
    setLoading(true);
    try {
      const res = await qc.fetchQuery({
        queryKey: ["product-lots", "by-order", orderId],
        queryFn: () => productLotsService.list({ production_order_id: orderId, limit: 100 }),
      });
      if (res.data.length === 0) alert.info(t("production.noLotsToPrint"));
      else setLots(res.data);
    } catch {
      alert.error(t("production.lotsLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    // แถวกดแล้วเปิดรายละเอียด — คลิกปุ่ม/ในหน้าต่างพิมพ์ (portal ส่ง event ขึ้นมาตาม React tree) ไม่ให้ทะลุไปถึงแถว
    <span onClick={(e) => e.stopPropagation()}>
      <Button size="small" icon={actionIcon("print", "small")} loading={loading} onClick={openLabels}>
        {t("lots.printLabels")}
      </Button>
      {lots && <LotLabelModal lots={lots} onClose={() => setLots(null)} />}
    </span>
  );
}
