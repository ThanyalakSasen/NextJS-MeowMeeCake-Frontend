"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Manage Orders — โหลดออเดอร์ทั้งหมด 1 ครั้ง (mock data เล็ก) แล้วกรอง/แบ่งหน้าฝั่ง client
// เหมือนแพทเทิร์นของ Product Stock — ถ้าข้อมูลจริงเยอะขึ้นค่อยย้าย search/filter ไปเป็น query param
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { ordersService } from "@/services/orders";
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

  const [activeTab, setActiveTabState] = useState<OrderType>("ready");
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

  const all = ordersQ.data?.data ?? [];
  const readyCount = all.filter((o) => o.order_type === "ready").length;
  const preorderCount = all.filter((o) => o.order_type === "preorder").length;
  const typeOrders = useMemo(
    () => (ordersQ.data?.data ?? []).filter((o) => o.order_type === activeTab),
    [ordersQ.data, activeTab],
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
  const selectedOrder = all.find((o) => o._id === selectedId) ?? null;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["orders"] });

  const updateOrder = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Order> }) => ordersService.update(id, body),
    onSuccess: invalidate,
  });

  const onStatusChange = (order: Order, next: OrderStatus) => {
    if (next === order.order_status) return;
    updateOrder.mutate(
      { id: order._id, body: { order_status: next } },
      {
        onSuccess: () => alert.success(t("orders.statusChanged", { no: order.order_no, status: t(`enums.orderStatus.${next}`) })),
        onError: () => alert.error(t("orders.statusChangeFailed")),
      },
    );
  };

  const onPaymentStatusChange = (order: Order, next: PaymentStatus) => {
    if (next === order.payment_status) return;
    updateOrder.mutate(
      { id: order._id, body: { payment_status: next } },
      {
        onSuccess: () => alert.success(t("orders.paymentUpdated", { no: order.order_no })),
        onError: () => alert.error(t("orders.paymentUpdateFailed")),
      },
    );
  };

  const onCancel = (order: Order) => {
    updateOrder.mutate(
      { id: order._id, body: { order_status: "cancelled" } },
      {
        onSuccess: () => alert.success(t("orders.cancelled", { no: order.order_no })),
        onError: () => alert.error(t("orders.cancelFailed")),
      },
    );
  };

  const onVerifyPayment = (order: Order) => {
    updateOrder.mutate(
      { id: order._id, body: { payment_status: "paid", payment_verified_at: new Date().toISOString() } },
      {
        onSuccess: () => alert.success(t("orders.paymentVerified", { no: order.order_no })),
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
      t("orders.colItems"), t("orders.colTotal"), t("orders.colStatus"), t("orders.colPayment"),
      ...(activeTab === "preorder" ? [t("orders.leadTime")] : []),
    ];
    const rows = filtered.map((o) => [
      o.order_no,
      forceText(formatDate(o.created_at, locale, { withTime: true })),
      o.customer_name,
      o.items.map((it) => `${it.product_name} x${it.quantity}`).join(", "),
      o.total_amount,
      t(`enums.orderStatus.${o.order_status}`),
      t(`enums.paymentStatus.${o.payment_status}`),
      ...(activeTab === "preorder" ? [o.lead_time_days ?? ""] : []),
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
    readyCount, preorderCount, unreviewedCount,

    isLoading: ordersQ.isLoading,
    isError: ordersQ.isError,
    refetch: () => ordersQ.refetch(),

    selectedOrder,
    drawerOpen,
    onView: (o: Order) => { setSelectedId(o._id); setDrawerOpen(true); },
    closeDrawer: () => setDrawerOpen(false),

    isFinalStatus,
    onStatusChange, onPaymentStatusChange, onCancel, onVerifyPayment, onExport,
  };
}
