"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Manage Orders — โหลดออเดอร์ทั้งหมด 1 ครั้ง แล้วกรอง/แบ่งหน้าฝั่ง client
// แท็บ delivery/takeaway = order_type จริงของ backend (orderModel.ts) — ไม่ใช่ ready/preorder
// (พรีออเดอร์เป็นคนละ collection ทั้งหมด ยังไม่เชื่อมกับหน้านี้ — ดู types/order.ts หัวไฟล์)
// การชำระเงิน (verify/reject) เป็นคนละ resource (Payments) ไม่ใช่ field ที่แก้ตรง ๆ บน order ได้
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { ordersService } from "@/services/orders";
import { paymentsService } from "@/services/payments";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { exportToCsv, forceText } from "@/lib/exportCsv";
import { formatDate } from "@/i18n/format";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";
import type { Order, OrderType } from "@/types/order";
import { isFinalStatus } from "./orderStatus";

export function useManageOrdersViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("orders");
  const paymentPerm = usePermission("payments");

  const [activeTab, setActiveTabState] = useState<OrderType>("delivery");
  const [search, setSearchState] = useState("");
  const [statusFilter, setStatusFilterState] = useState<OrderStatus | "all">("all");
  const [paymentFilter, setPaymentFilterState] = useState<PaymentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const ordersQ = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersService.list({ limit: 100 }),
  });

  const all = useMemo(() => ordersQ.data?.data ?? [], [ordersQ.data]);
  const deliveryCount = all.filter((o) => o.order_type === "delivery").length;
  const takeawayCount = all.filter((o) => o.order_type === "takeaway").length;
  const typeOrders = useMemo(
    () => all.filter((o) => o.order_type === activeTab),
    [all, activeTab],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return typeOrders.filter((o) => {
      const matchSearch = !q || o.order_no.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || o.order_status === statusFilter;
      const matchPayment = paymentFilter === "all" || o.payment_status === paymentFilter;
      return matchSearch && matchStatus && matchPayment;
    });
  }, [typeOrders, search, statusFilter, paymentFilter]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const unreviewedCount = typeOrders.filter((o) => o.payment_status === "pending").length;

  // รายละเอียดเต็ม (มี items จริง) + รายการชำระเงินที่ผูกไว้ — ดึงเฉพาะตอนเปิด drawer (กัน N+1 ในตาราง)
  const detailQ = useQuery({
    queryKey: ["orders", "detail", selectedId],
    queryFn: () => ordersService.get(selectedId as string),
    enabled: !!selectedId && drawerOpen,
  });
  const paymentQ = useQuery({
    queryKey: ["payments", "by-order", selectedId],
    queryFn: () => paymentsService.listByOrder(selectedId as string),
    enabled: !!selectedId && drawerOpen,
  });
  const selectedOrder = detailQ.data?.data ?? null;
  const selectedPayment = paymentQ.data?.data[0] ?? null;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["orders"] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) =>
      ordersService.updateStatus(id, status, reason),
    onSuccess: invalidate,
  });

  const onStatusChange = (order: Order, next: OrderStatus) => {
    if (next === order.order_status) return;
    statusMutation.mutate(
      { id: order._id, status: next },
      {
        onSuccess: () => alert.success(t("orders.statusChanged", { no: order.order_no, status: t(`enums.orderStatus.${next}`) })),
        onError: () => alert.error(t("orders.statusChangeFailed")),
      },
    );
  };

  const onCancel = (order: Order) => {
    statusMutation.mutate(
      { id: order._id, status: "cancelled" },
      {
        onSuccess: () => alert.success(t("orders.cancelled", { no: order.order_no })),
        onError: () => alert.error(t("orders.cancelFailed")),
      },
    );
  };

  // ตรวจสลิป — ผ่าน resource Payments จริง (verify: true=อนุมัติ→paid, false=ปฏิเสธ→failed)
  const verifyMutation = useMutation({
    mutationFn: ({ paymentId, approved }: { paymentId: string; approved: boolean }) =>
      paymentsService.verify(paymentId, approved),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["payments", "by-order", selectedId] });
    },
  });

  const onVerifyPayment = (paymentId: string) => {
    verifyMutation.mutate(
      { paymentId, approved: true },
      {
        onSuccess: () => alert.success(t("orders.paymentVerified", { no: selectedOrder?.order_no ?? "" })),
        onError: () => alert.error(t("orders.paymentVerifyFailed")),
      },
    );
  };

  const onExport = () => {
    if (filtered.length === 0) {
      alert.info(t("orders.exportEmpty"));
      return;
    }
    const headers = [
      t("orders.colOrder"), t("orders.orderedAt"), t("orders.colCustomer"),
      t("orders.colTotal"), t("orders.colStatus"), t("orders.colPayment"),
    ];
    const rows = filtered.map((o) => [
      o.order_no,
      forceText(formatDate(o.created_at, locale, { withTime: true })),
      o.customer_name,
      o.total_amount,
      t(`enums.orderStatus.${o.order_status}`),
      t(`enums.paymentStatus.${o.payment_status}`),
    ]);
    exportToCsv(`orders_${activeTab}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    alert.success(t("orders.exportSuccess", { n: filtered.length }));
  };

  return {
    perm,
    canApprovePayment: paymentPerm.approve,

    activeTab,
    setActiveTab: (v: OrderType) => { setActiveTabState(v); setPage(1); setStatusFilterState("all"); },
    search, setSearch: (v: string) => { setSearchState(v); setPage(1); },
    statusFilter, setStatusFilter: (v: OrderStatus | "all") => { setStatusFilterState(v); setPage(1); },
    paymentFilter, setPaymentFilter: (v: PaymentStatus | "all") => { setPaymentFilterState(v); setPage(1); },
    page, pageSize,
    setPagination: (p: number, ps: number) => { setPage(p); setPageSize(ps); },

    orders: paged,
    ordersForStats: typeOrders,
    total: filtered.length,
    deliveryCount, takeawayCount, unreviewedCount,

    isLoading: ordersQ.isLoading,
    isError: ordersQ.isError,
    refetch: () => ordersQ.refetch(),

    selectedOrder,
    selectedPayment,
    isDetailLoading: detailQ.isLoading || paymentQ.isLoading,
    drawerOpen,
    onView: (o: Order) => { setSelectedId(o._id); setDrawerOpen(true); },
    closeDrawer: () => setDrawerOpen(false),

    isFinalStatus,
    onStatusChange, onCancel, onVerifyPayment, onExport,
  };
}
