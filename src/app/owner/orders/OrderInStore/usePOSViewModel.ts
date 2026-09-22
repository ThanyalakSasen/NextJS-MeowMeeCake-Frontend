"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ POS หน้าร้าน — เลือกสินค้า → ตะกร้า → ชำระ (เงินสด / QR mock) → POST /admin/orders
// สร้างออเดอร์ order_type "takeaway" แล้วจ่าย+ปิดงานทันที (ลูกค้าจ่าย+รับของที่เคาน์เตอร์):
//   1) POST /admin/orders (backend ตัดสต็อกให้เองแล้ว — ห้ามตัดซ้ำฝั่ง client)
//   2) POST /admin/payments (สร้างรายการชำระเงินผูกกับออเดอร์)
//   3) POST /admin/payments/[id]/verify {approved:true} (ยืนยันจ่ายทันที)
//   4) PATCH /admin/orders/[id]/status {order_status:"completed"}
// backend บังคับทุกออเดอร์ต้องมี user_id จริง — ไม่มีแนวคิด "ลูกค้าไม่ระบุตัวตน" จึงผูกกับบัญชี
// "ลูกค้าทั่วไป" ตายตัว (สร้างไว้แล้วผ่าน scripts/seed.ts, ดูค่าคงที่ GUEST_CUSTOMER_EMAIL ที่นั่น)
// bundle/promotion/ประวัติวันนี้/Omise QR จริง → นอกขอบเขต #8 (ดู SCREEN_MAP.md §4)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { productCategoriesService } from "@/services/productCategories";
import { ordersService } from "@/services/orders";
import { paymentsService } from "@/services/payments";
import { usersService } from "@/services/users";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import type { Product } from "@/types/product";
import { refId } from "@/lib/refId";
import { addLine, setLineQty, removeLine, cartSubtotal, buildOrderInput, type CartLine } from "./posCart";

// backend ไม่มี product_type "ready" (จริง ๆ คือ "inStore"/"online") และ filter ใช้ค่าเดียวไม่ได้
// สองค่าพร้อมกัน — โหลดทั้งหมดมาแล้วตัด "preorder" ออกฝั่ง client แทน (POS ขายเฉพาะของพร้อมขาย)
const CATALOG_PARAMS = { limit: 200 } as const;

/** ต้องตรงกับ GUEST_CUSTOMER_EMAIL ใน backend scripts/seed.ts */
const GUEST_CUSTOMER_EMAIL = "guest@meowmeecake.local";

export type PaymentMethod = "cash" | "qr";

export function usePOSViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("orders");

  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [customerName, setCustomerName] = useState("");
  const [extraDiscount, setExtraDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [qrOpen, setQrOpen] = useState(false);

  const catalogQ = useQuery({
    queryKey: ["products", CATALOG_PARAMS],
    queryFn: () => productsService.list(CATALOG_PARAMS),
  });
  const categoriesQ = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => productCategoriesService.list(),
  });
  // บัญชี "ลูกค้าทั่วไป" ตายตัว — หา id ครั้งเดียวตอนเปิดหน้า (cache ยาว ไม่มีวันเปลี่ยน)
  const guestQ = useQuery({
    queryKey: ["users", "guest-customer"],
    queryFn: () => usersService.list({ search: GUEST_CUSTOMER_EMAIL, limit: 1 }),
    staleTime: Infinity,
  });
  const guestUserId = guestQ.data?.data[0]?._id ?? null;

  const catalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (catalogQ.data?.data ?? []).filter(
      (p) =>
        p.product_type !== "preorder" &&
        (categoryId === "all" || refId(p.category_id) === categoryId) &&
        (!q || p.product_name_th.toLowerCase().includes(q)),
    );
  }, [catalogQ.data, search, categoryId]);

  const subtotal = cartSubtotal(cart);
  const discount = Math.min(Math.max(extraDiscount, 0), subtotal);
  const total = Math.max(subtotal - discount, 0);
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);

  const checkout = useMutation({
    mutationFn: async () => {
      // ข้อความนี้ไม่โชว์ผู้ใช้ตรง ๆ (onError ใช้ t("pos.saveFailed") แทน) — ไว้ debug ใน console เท่านั้น
      if (!guestUserId) throw new Error("Guest customer account not found — run `npm run seed` on the backend");

      // 1) สร้างออเดอร์ — backend ตัดสต็อก + คำนวณ subtotal/total_amount ให้เองทั้งหมด
      const orderRes = await ordersService.create(buildOrderInput({ cart, guestUserId, discount }));
      const order = orderRes.data;

      // 2) สร้างรายการชำระเงิน + 3) ยืนยันจ่ายทันที (เงินสด/QR ที่เคาน์เตอร์ = จ่ายจริงแล้ว)
      //    verify(paid) ตอน order ยัง pending จะขยับ order_status → "confirmed" ให้อัตโนมัติ
      //    (ดู orderService.setPaymentStatus ฝั่ง backend)
      const paymentRes = await paymentsService.create({
        user_id: guestUserId,
        order_id: order._id,
        amount: order.total_amount,
      });
      await paymentsService.verify(paymentRes.data._id, true);

      // 4) ปิดงานทันที — backend เป็น state machine เดินทีละสถานะเท่านั้น (ห้ามข้าม):
      //    pending→confirmed (ทำให้แล้วตอน verify)→preparing→ready→completed
      await ordersService.updateStatus(order._id, "preparing");
      await ordersService.updateStatus(order._id, "ready");
      await ordersService.updateStatus(order._id, "completed");

      return order.order_no;
    },
    onSuccess: (orderNo) => {
      alert.success(t("pos.saved", { no: orderNo }));
      setCart([]);
      setCustomerName("");
      setExtraDiscount(0);
      setPaymentMethod("cash");
      setQrOpen(false);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => alert.error(t("pos.saveFailed")),
  });

  const onConfirm = () => {
    if (cart.length === 0) return;
    if (paymentMethod === "qr") {
      setQrOpen(true);
      return;
    }
    checkout.mutate();
  };

  return {
    perm,
    catalog,
    categories: categoriesQ.data?.data ?? [],
    isLoading: catalogQ.isLoading || categoriesQ.isLoading,
    isError: catalogQ.isError,
    refetch: () => catalogQ.refetch(),

    cart, itemCount, subtotal, discount, total,
    search, setSearch,
    categoryId, setCategoryId,
    customerName, setCustomerName,
    extraDiscount, setExtraDiscount,
    paymentMethod, setPaymentMethod,

    addToCart: (p: Product) => setCart((c) => addLine(c, p)),
    changeQty: (id: string, qty: number) => setCart((c) => setLineQty(c, id, qty)),
    removeFromCart: (id: string) => setCart((c) => removeLine(c, id)),
    clearCart: () => setCart([]),

    qrOpen,
    closeQr: () => setQrOpen(false),
    onConfirm,
    confirmPaid: () => checkout.mutate(),
    submitting: checkout.isPending,
  };
}
