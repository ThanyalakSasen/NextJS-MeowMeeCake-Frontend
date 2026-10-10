"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของแท็บ "สรุปรอบ" (BACKLOG4 F4 · ต้นแบบ FrontOffice owner/preorders/rounds · backend Q-BE5 · Q-OWN3)
//   - ตารางสรุปต่อรอบจาก /admin/preorder-rounds/dashboard (โหลดทุกรอบครั้งเดียว · กรอง/แบ่งหน้าฝั่ง client เหมือนแท็บรอบ)
//   - กดรอบ → drawer: ยอดจอง/โควตาต่อสินค้า + รายชื่อลูกค้า (/admin/preorder-rounds/:id/customers — กรอง/ค้นหาที่ server)
//     + ส่งออก CSV (1 แถวต่อ 1 รายการสินค้า)
// สิทธิ์ preorder.view เหมือนทั้งหน้า · ประกอบเข้า usePreOrderRoundViewModel เป็น vm.dashboard
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { preorderRoundsService } from "@/services/preorderRounds";
import { exportToCsv, forceText } from "@/lib/exportCsv";
import { LIST_ALL } from "@/lib/http";
import { formatDate } from "@/i18n/format";
import type { RoundStatus } from "@/constants/enumConfig";
import type { OrderType } from "@/types/order";
import type { PaymentGroup, RoundCustomerLine, RoundCustomerOrder, RoundDashboardRow } from "@/types/preorderRoundDashboard";

const PAGE_SIZE = 10;

/** ตัวเลือก + ข้อความพิเศษของรายการ เป็นบรรทัดสั้น ๆ */
export function lineExtras(l: RoundCustomerLine): string[] {
  const variants = l.selected_variants.length
    ? l.selected_variants.map((v) => (v.group_name ? `${v.group_name}: ${v.variant_name}` : v.variant_name))
    : l.variant_name
      ? [l.variant_name]
      : [];
  const options = l.selected_options.map((o) => (o.text_value ? `${o.option_name}: ${o.text_value}` : o.option_name));
  return [...variants, ...options, ...(l.special_request ? [l.special_request] : [])];
}

/** ที่อยู่จัดส่งเป็นบรรทัดเดียว */
export function addressText(o: RoundCustomerOrder): string {
  const a = o.delivery_address;
  return a ? [a.recipient_name, a.recipient_phone, a.house_no, a.sub_district, a.district, a.province, a.zip_code].filter(Boolean).join(" ") : "";
}

export function useRoundDashboardViewModel(enabled: boolean) {
  const t = useTranslations();
  const locale = useLocale();

  const q = useQuery({
    queryKey: ["preorder-rounds", "dashboard"],
    queryFn: () => preorderRoundsService.dashboard({ limit: LIST_ALL }),
    enabled,
  });
  const rounds = useMemo(() => q.data?.data ?? [], [q.data]);

  // ── ตัวกรอง + แบ่งหน้า (client) ──
  const [search, setSearchState] = useState("");
  const [statusFilter, setStatusFilterState] = useState<RoundStatus | "all">("all");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rounds.filter(
      (r) => (statusFilter === "all" || r.round_status === statusFilter) && (!term || r.round_name.toLowerCase().includes(term)),
    );
  }, [rounds, search, statusFilter]);

  const stats = useMemo(
    () => ({
      rounds: rounds.length,
      open: rounds.filter((r) => r.round_status === "open").length,
      revenue: rounds.reduce((s, r) => s + r.total_revenue, 0),
      paid: rounds.reduce((s, r) => s + r.payment.paid.amount, 0),
      avgFill: rounds.length ? Math.round(rounds.reduce((s, r) => s + r.fill_rate, 0) / rounds.length) : 0,
    }),
    [rounds],
  );

  // ── drawer ของรอบที่เลือก ──
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rounds.find((r) => r._id === selectedId) ?? null;
  const [customerSearch, setCustomerSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentGroup | "all">("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const customerParams = {
    search: customerSearch.trim() || undefined,
    payment: paymentFilter === "all" ? undefined : paymentFilter,
    order_type: typeFilter === "all" ? undefined : typeFilter,
  };
  const customersQ = useQuery({
    queryKey: ["preorder-rounds", "customers", selectedId, customerParams],
    queryFn: () => preorderRoundsService.customers(selectedId as string, customerParams),
    enabled: !!selectedId,
    // พิมพ์ค้นหาแล้วยิงใหม่ทุกครั้ง — คงรายการเดิมไว้ระหว่างรอ (ไม่กระพริบเป็น loading) · เปลี่ยนรอบแล้วไม่ใช้ของรอบก่อน
    placeholderData: (prev) => (prev?.round._id === selectedId ? prev : undefined),
  });

  const openRound = (r: RoundDashboardRow) => {
    setCustomerSearch("");
    setPaymentFilter("all");
    setTypeFilter("all");
    setSelectedId(r._id);
  };

  const receiveText = (o: RoundCustomerOrder) =>
    o.order_type === "delivery"
      ? addressText(o)
      : [o.pickup_point?.point_name, o.pickup_date ? formatDate(o.pickup_date, locale) : null].filter(Boolean).join(" · ");

  const onExportCustomers = () => {
    const data = customersQ.data;
    if (!data) return;
    const headers = [
      t("preorderRound.dashboard.csv.preorderNo"), t("preorderRound.dashboard.csv.customer"), t("preorderRound.dashboard.csv.phone"),
      t("preorderRound.dashboard.csv.email"), t("preorderRound.dashboard.csv.orderType"), t("preorderRound.dashboard.csv.receive"),
      t("preorderRound.dashboard.csv.payment"), t("preorderRound.dashboard.csv.orderStatus"), t("preorderRound.dashboard.csv.product"),
      t("preorderRound.dashboard.csv.options"), t("preorderRound.dashboard.csv.qty"), t("preorderRound.dashboard.csv.lineTotal"),
      t("preorderRound.dashboard.csv.orderTotal"),
    ];
    const rows = data.customers.flatMap((c) =>
      c.orders.flatMap((o) =>
        (o.items.length ? o.items : [null]).map((l) => [
          o.preorder_no, c.user_fullname, c.user_phone ? forceText(c.user_phone) : "", c.email,
          t(`enums.orderType.${o.order_type}`), receiveText(o),
          t(`preorderRound.dashboard.payment.${o.payment_group}`), t(`enums.orderStatus.${o.order_status}`),
          l?.product_name_th ?? "", l ? lineExtras(l).join(" / ") : "", l?.quantity ?? "", l?.total_price ?? "", o.total_amount,
        ]),
      ),
    );
    const date = new Date().toISOString().slice(0, 10);
    exportToCsv(`preorder-round_${data.round.round_name.replace(/[\\/:*?"<>|\s]+/g, "-")}_${date}`, headers, rows);
  };

  return {
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => void q.refetch(),
    stats,
    rows: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: filtered.length,
    page,
    pageSize: PAGE_SIZE,
    setPage: (p: number) => setPage(p),
    search,
    setSearch: (v: string) => {
      setSearchState(v);
      setPage(1);
    },
    statusFilter,
    setStatusFilter: (v: RoundStatus | "all") => {
      setStatusFilterState(v);
      setPage(1);
    },

    selected,
    openRound,
    closeRound: () => setSelectedId(null),
    customers: customersQ.data ?? null,
    isCustomersLoading: customersQ.isLoading,
    isCustomersError: customersQ.isError,
    refetchCustomers: () => void customersQ.refetch(),
    customerSearch,
    setCustomerSearch,
    paymentFilter,
    setPaymentFilter,
    typeFilter,
    setTypeFilter,
    receiveText,
    onExportCustomers,
  };
}
