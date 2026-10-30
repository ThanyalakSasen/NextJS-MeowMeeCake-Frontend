"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ Manage Orders — โหลดออเดอร์ (ที่ยังไม่ปิดงานครบทุกรายการ + ประวัติล่าสุด — ดู ordersQuery.ts) แล้วกรอง/แบ่งหน้าฝั่ง client
// แท็บ delivery/takeaway = order_type จริงของ backend (orderModel.ts) — ไม่ใช่ ready/preorder
// (พรีออเดอร์เป็นคนละ collection ทั้งหมด ยังไม่เชื่อมกับหน้านี้ — ดู types/order.ts หัวไฟล์)
// การชำระเงิน (verify/reject) เป็นคนละ resource (Payments) ไม่ใช่ field ที่แก้ตรง ๆ บน order ได้
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { ordersService } from "@/services/orders";
import { paymentsService } from "@/services/payments";
import { usePermission } from "@/context/PermissionsContext";
import { alert, confirmAlert } from "@/lib/alert";
import { exportToCsv, forceText } from "@/lib/exportCsv";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { OrderStatus, PaymentStatus } from "@/constants/enumConfig";
import { isAwaitingRefund, type DeliveryUpdateInput, type Order, type OrderType } from "@/types/order";
import { isApiError } from "@/types/api";
import { STATUS_SELECT_OPTIONS, isFinalStatus } from "./orderStatus";
import { ORDERS_KEY, fetchManageOrders, orderSearchKey } from "./ordersQuery";
import { useMarkShipped } from "@/components/shared/orders";
import dayjs from "dayjs";

export function useManageOrdersViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("orders");
  const paymentPerm = usePermission("payments");

  // ?tab= / ?status= ตั้งค่าเริ่มต้นของตัวกรอง (E5 — ลิงก์ตรงไปออเดอร์พร้อมส่งมอบ เช่น ?tab=takeaway&status=ready)
  const initialParams = useSearchParams();
  const [activeTab, setActiveTabState] = useState<OrderType>(() =>
    initialParams.get("tab") === "takeaway" ? "takeaway" : "delivery",
  );
  const [search, setSearchState] = useState("");
  const [statusFilter, setStatusFilterState] = useState<OrderStatus | "all">(() => {
    const st = initialParams.get("status");
    return st && (STATUS_SELECT_OPTIONS as string[]).includes(st) ? (st as OrderStatus) : "all";
  });
  const [paymentFilter, setPaymentFilterState] = useState<PaymentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // drawer รายละเอียดผูกกับ ?id= ใน URL (BACKLOG2 §5) — ลิงก์จาก LINE / แจ้งเตือนในเว็บ
  // (`/owner/orders/manageOrders?id=<orderId>`) เปิดออเดอร์นั้นทันที แม้ไม่อยู่ในหน้าแรกของตาราง (ดึงรายตัวด้วย id)
  // · กดดูจากตาราง = ใส่ ?id= (แชร์ลิงก์ได้) · ปิด drawer = ลบ ?id= ออก
  const router = useRouter();
  const pathname = usePathname();
  const urlId = useSearchParams().get("id");
  const drawerOpen = !!urlId;
  // จำ id ล่าสุดไว้แม้ปิด drawer แล้ว — เนื้อหาไม่หายวูบระหว่าง animation ปิด
  // (ปรับ state ระหว่าง render ตอน urlId เปลี่ยน — แพทเทิร์นของ React แทน effect)
  const [selectedId, setSelectedId] = useState<string | null>(urlId);
  if (urlId && urlId !== selectedId) setSelectedId(urlId);
  const openDetail = (id: string) => router.replace(`${pathname}?id=${encodeURIComponent(id)}`, { scroll: false });
  const closeDrawer = () => router.replace(pathname, { scroll: false });

  const ordersQ = useQuery({
    queryKey: ORDERS_KEY,
    queryFn: () => fetchManageOrders(),
  });
  const olderHidden = ordersQ.data?.olderHidden ?? false;

  // ออเดอร์ปิดงานแล้วที่เก่ากว่ารายการที่โหลดไว้ — ค้นเลขออเดอร์ที่ backend แล้วรวมเข้าตาราง (backend ค้นได้แค่เลขออเดอร์)
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setSearchTerm(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);
  const remoteSearchQ = useQuery({
    queryKey: orderSearchKey(activeTab, searchTerm),
    queryFn: () => ordersService.list({ search: searchTerm, order_type: activeTab, limit: 50 }),
    enabled: olderHidden && searchTerm.length >= 3,
  });

  const all = useMemo(() => {
    const loaded = ordersQ.data?.data ?? [];
    const extra = (remoteSearchQ.data?.data ?? []).filter((o) => !loaded.some((x) => x._id === o._id));
    return extra.length ? [...loaded, ...extra] : loaded;
  }, [ordersQ.data, remoteSearchQ.data]);
  // ตัวเลขบนแท็บ = ออเดอร์ที่ยังต้องจัดการ (ไม่นับยกเลิก/สำเร็จ) · ยอดรวมทุกสถานะดูได้จาก "ทั้งหมด" ในตัวกรองสถานะ
  const isOpen = (o: Order) => o.order_status !== "cancelled" && o.order_status !== "completed";
  const deliveryCount = all.filter((o) => o.order_type === "delivery" && isOpen(o)).length;
  const takeawayCount = all.filter((o) => o.order_type === "takeaway" && isOpen(o)).length;
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

  // กล่องแจ้งเตือนเหนือตาราง (แบบหน้าสต็อก) — คิดจากออเดอร์ของแท็บปัจจุบัน ไม่ขึ้นกับตัวกรอง/ค้นหา · ออเดอร์ที่ยกเลิกไม่นับ
  // payment_status "pending" มีทั้งแนบสลิปแล้วรอตรวจ และยังไม่แนบ — แยกด้วย slip_pending_review (backend listOrders)
  const alerts = useMemo(() => {
    const open = typeOrders.filter((o) => o.order_status !== "cancelled");
    // ยังไม่ได้จัดส่ง = จัดส่งถึงบ้าน + ชำระแล้ว + สถานะจัดส่ง "รอจัดส่ง" หรือ "จัดส่งไม่สำเร็จ" (ต้องส่งใหม่ — ไม่ใช่งานปกติ
    // ที่ควรไปอยู่กล่องกำลังดำเนินการ) · แท็บรับเองไม่มีการจัดส่ง
    const isNotShipped = (o: Order) =>
      activeTab === "delivery" && o.payment_status === "paid" && o.order_status !== "completed" &&
      (o.delivery_status === "pending" || o.delivery_status === "failed");
    return {
      notShipped: open.filter(isNotShipped),
      // กำลังดำเนินการ = ชำระแล้ว ยังไม่สำเร็จ และไม่อยู่ในกล่องยังไม่ได้จัดส่ง (เช่น รอลูกค้ามารับ / ส่งแล้วรอปิดงาน)
      // · กล่องนี้ + ยังไม่ได้จัดส่ง = ออเดอร์ชำระแล้วที่ยังไม่สำเร็จทั้งหมด (แบ่งกันไม่ซ้ำ) · กล่องสลิปนับออเดอร์ที่ยังไม่ชำระ
      //   รวมถึงที่สำเร็จแล้ว จึงไม่ได้รวมเท่ากับตัวเลขบนแท็บพอดี
      inProgress: open.filter((o) => o.payment_status === "paid" && o.order_status !== "completed" && !isNotShipped(o)),
      unverified: open.filter((o) => o.payment_status === "pending" && o.slip_pending_review),
      // ยังไม่แนบสลิป — รวมสลิปที่ถูกปฏิเสธ (failed) เพราะต้องรอลูกค้าแนบใหม่เหมือนกัน
      noSlip: open.filter(
        (o) => o.payment_status === "failed" || (o.payment_status === "pending" && !o.slip_pending_review),
      ),
    };
  }, [typeOrders, activeTab]);
  const awaitingRefundCount = typeOrders.filter(isAwaitingRefund).length;
  // E5 ออเดอร์พร้อมส่งมอบ — เดิมมีแถบ "พร้อมส่งมอบ" แยก แต่ซ้ำกับกล่อง (delivery = ยังไม่ได้จัดส่ง / กำลังดำเนินการ ·
  // takeaway = กำลังดำเนินการ) จึงเอาออก · ลิงก์ ?status=ready ยังกรองได้เหมือนเดิม

  // รายละเอียดเต็ม (มี items จริง) + รายการชำระเงินที่ผูกไว้ — ดึงเฉพาะตอนเปิด drawer (กัน N+1 ในตาราง)
  const detailQ = useQuery({
    queryKey: ["orders", "detail", selectedId],
    queryFn: () => ordersService.get(selectedId as string),
    enabled: !!selectedId && drawerOpen,
  });
  const paymentQ = useQuery({
    queryKey: ["payments", "by-order", selectedId],
    queryFn: () => paymentsService.listByOrder(selectedId as string),
    // GET /admin/payments = payments.view — ไม่มีสิทธิ์ไม่ยิง (ได้ 403 แล้วส่วนสลิปขึ้น "ยังไม่มีสลิป" ผิด ๆ)
    enabled: !!selectedId && drawerOpen && paymentPerm.view,
  });
  const selectedOrder = detailQ.data?.data ?? null;
  const selectedPayment = paymentQ.data?.data[0] ?? null;
  // รายการที่ชำระแล้ว (ตัวที่ต้องคืนเงิน) — อาจไม่ใช่ใบล่าสุด
  const paidPayment = paymentQ.data?.data.find((p) => p.status === "paid") ?? null;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["orders"] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) =>
      ordersService.updateStatus(id, status, reason),
    onSuccess: invalidate,
  });

  // ยกเลิกต้องยืนยัน + กรอกเหตุผลก่อนเสมอ (CancelOrderModal) — ทั้งปุ่มในตารางและการเลือก "ยกเลิก" จาก dropdown
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const onCancel = (order: Order) => setCancelTarget(order);

  const onConfirmCancel = (reason: string) => {
    const order = cancelTarget;
    if (!order) return;
    statusMutation.mutate(
      { id: order._id, status: "cancelled", reason },
      {
        onSuccess: () => {
          alert.success(t("orders.cancelled", { no: order.order_no }));
          setCancelTarget(null);
        },
        onError: (e) => alert.error(isApiError(e) ? e.message : t("orders.cancelFailed")),
      },
    );
  };

  const onStatusChange = (order: Order, next: OrderStatus) => {
    if (next === order.order_status) return;
    if (next === "cancelled") return onCancel(order);
    statusMutation.mutate(
      { id: order._id, status: next },
      {
        onSuccess: () => alert.success(t("orders.statusChanged", { no: order.order_no, status: t(`enums.orderStatus.${next}`) })),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("orders.statusChangeFailed")),
      },
    );
  };

  // ยืนยันสลิปแล้ว backend เลื่อนเป็น preparing ให้เอง — เหลือปุ่มเดียว "พร้อมจัดส่ง" / "พร้อมรับที่หน้าร้าน" → ready
  const canMarkReady = (order: Order) =>
    perm.update && order.order_status === "preparing" && order.payment_status === "paid";
  const onMarkReady = (order: Order) => onStatusChange(order, "ready");

  // ตรวจสลิป — ผ่าน resource Payments จริง (verify: true=อนุมัติ→paid, false=ปฏิเสธ→failed)
  const verifyMutation = useMutation({
    mutationFn: ({ paymentId, approved }: { paymentId: string; approved: boolean }) =>
      paymentsService.verify(paymentId, approved),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["payments", "by-order", selectedId] });
      qc.invalidateQueries({ queryKey: ["reports"] }); // ชำระแล้ว/ไม่ผ่าน เปลี่ยนรายรับในหน้าสรุปการเงิน
    },
  });

  const onVerifyPayment = (paymentId: string) => {
    verifyMutation.mutate(
      { paymentId, approved: true },
      {
        onSuccess: () => alert.success(t("orders.paymentVerified", { no: selectedOrder?.order_no ?? "" })),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("orders.paymentVerifyFailed")),
      },
    );
  };

  // ปฏิเสธสลิป = payment "failed" (backend propagate ไป order.payment_status) — ลูกค้าแนบสลิปใหม่ได้ (กลับเป็น pending)
  const onRejectPayment = async (paymentId: string) => {
    const ok = await confirmAlert(t("orders.rejectPaymentConfirm"), {
      title: t("orders.rejectPayment"),
      confirmText: t("orders.rejectPayment"),
      danger: true,
    });
    if (!ok) return;
    verifyMutation.mutate(
      { paymentId, approved: false },
      {
        onSuccess: () => alert.success(t("orders.paymentRejected", { no: selectedOrder?.order_no ?? "" })),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("orders.paymentRejectFailed")),
      },
    );
  };

  // คืนเงิน — ออเดอร์ "ยกเลิก + ชำระแล้ว" (ลูกค้ายกเลิกเอง · backend ไม่คืนอัตโนมัติ — customer-backend-merge.md §8.8)
  // ร้านโอนคืนนอกระบบแล้วกดยืนยัน → payment refunded + order.payment_status refunded
  const refundMutation = useMutation({
    mutationFn: (paymentId: string) => paymentsService.refund(paymentId),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["payments", "by-order", selectedId] });
      qc.invalidateQueries({ queryKey: ["reports"] }); // คืนเงิน = รายรับลดในหน้าสรุปการเงิน
    },
  });

  const onRefund = async (paymentId: string) => {
    if (!selectedOrder) return;
    const no = selectedOrder.order_no;
    const ok = await confirmAlert(
      t("orders.refundConfirm", { amount: formatCurrency(selectedOrder.total_amount, locale), no }),
      { title: t("orders.confirmRefund"), confirmText: t("orders.confirmRefund"), cancelText: t("common.cancel") },
    );
    if (!ok) return;
    refundMutation.mutate(paymentId, {
      onSuccess: () => alert.success(t("orders.refunded", { no })),
      onError: (e) => alert.error(isApiError(e) ? e.message : t("orders.refundFailed")),
    });
  };

  // สถานะจัดส่ง/เลขพัสดุ (BACKLOG2 §15.2 ข้อ 3) — เฉพาะออเดอร์จัดส่ง · backend แจ้งลูกค้าเองเมื่อสถานะเปลี่ยน
  const deliveryMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: DeliveryUpdateInput }) => ordersService.updateDelivery(id, input),
    onSuccess: invalidate,
  });

  const onSaveDelivery = (input: DeliveryUpdateInput) => {
    if (!selectedOrder) return;
    const no = selectedOrder.order_no;
    deliveryMutation.mutate(
      { id: selectedOrder._id, input },
      {
        onSuccess: () => alert.success(t("orders.deliverySaved", { no })),
        onError: (e) => alert.error(isApiError(e) ? e.message : t("orders.deliverySaveFailed")),
      },
    );
  };

  // "จัดส่งเรียบร้อยแล้ว" — ออเดอร์จัดส่งที่พร้อมส่งมอบ + บันทึกขนส่ง (และเลขพัสดุ) แล้ว · ออเดอร์จัดส่งไม่ปิดงานทางอื่น (ดู statusSelectOptions)
  const { markShippedFor, markingShipped } = useMarkShipped(ordersService, invalidate);
  const canMarkShipped = (order: Order) =>
    perm.update && order.order_type === "delivery" && order.order_status === "ready";
  const onMarkShipped = () => selectedOrder && markShippedFor(selectedOrder, selectedOrder.order_no);

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
    exportToCsv(`orders_${activeTab}_${dayjs().format("YYYY-MM-DD")}`, headers, rows);
    alert.success(t("orders.exportSuccess", { n: filtered.length }));
  };

  return {
    perm,
    canViewPayment: paymentPerm.view,
    canApprovePayment: paymentPerm.approve,
    /** คืนเงิน = payments.delete (ไม่ใช่ approve — คนยืนยันสลิปได้จะไม่ได้คืนเงินไปด้วย · Final-Backlog P7) */
    canRefundPayment: paymentPerm.delete,

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
    /** มีออเดอร์ปิดงานแล้วที่เก่ากว่าที่โหลดไว้ — บอกผู้ใช้ว่าค้นด้วยเลขออเดอร์ได้ */
    olderHidden,
    deliveryCount, takeawayCount, awaitingRefundCount,
    alerts,

    // isPending (ไม่ใช่ isLoading) — หน้านี้ render ฝั่ง server ด้วย (OwnerLayout SSR_PAGES) ตอนนั้น isLoading = false
    isLoading: ordersQ.isPending,
    isError: ordersQ.isError,
    refetch: () => ordersQ.refetch(),

    selectedOrder,
    selectedPayment,
    paidPayment,
    isDetailLoading: detailQ.isLoading || paymentQ.isLoading,
    drawerOpen,
    onView: (o: Order) => openDetail(o._id),
    closeDrawer,
    // id ใน URL ผิด/ไม่มีออเดอร์นี้ (404/400) — drawer ต้องบอก ไม่ใช่ว่างเปล่า
    isDetailError: detailQ.isError,

    isFinalStatus,
    onStatusChange, onCancel, onVerifyPayment, onRejectPayment, onExport,
    canMarkReady, onMarkReady,
    cancelTarget, onConfirmCancel,
    closeCancel: () => setCancelTarget(null),
    cancelling: statusMutation.isPending,
    changingStatus: statusMutation.isPending,
    verifyingPayment: verifyMutation.isPending,
    onRefund,
    refunding: refundMutation.isPending,
    onSaveDelivery,
    savingDelivery: deliveryMutation.isPending,
    canMarkShipped, onMarkShipped, markingShipped,
  };
}
