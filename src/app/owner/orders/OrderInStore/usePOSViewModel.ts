"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ POS หน้าร้าน — เลือกสินค้า → ตะกร้า → ชำระ (เงินสด / QR mock) → POST /orders
// สร้างออเดอร์ order_type "ready" สถานะ completed+paid ทันที (ลูกค้าจ่าย+รับของที่เคาน์เตอร์)
// bundle/promotion/ประวัติวันนี้/Omise QR จริง → นอกขอบเขต #8 (ดู SCREEN_MAP.md §4)
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { productCategoriesService } from "@/services/productCategories";
import { ordersService } from "@/services/orders";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import type { Product } from "@/types/product";
import { addLine, setLineQty, removeLine, cartSubtotal, buildOrderInput, type CartLine } from "./posCart";

const CATALOG_PARAMS = { product_type: "ready", limit: 100 } as const;

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

  const catalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (catalogQ.data?.data ?? []).filter(
      (p) =>
        (categoryId === "all" || p.category_id === categoryId) &&
        (!q || p.product_name_th.toLowerCase().includes(q)),
    );
  }, [catalogQ.data, search, categoryId]);

  const subtotal = cartSubtotal(cart);
  const discount = Math.min(Math.max(extraDiscount, 0), subtotal);
  const total = Math.max(subtotal - discount, 0);
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);

  const checkout = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const orderNo = `POS-${now.slice(11, 19).replace(/:/g, "")}`;
      const body = buildOrderInput({
        cart,
        customerName: customerName.trim() || t("pos.walkInCustomer"),
        total,
        orderNo,
        now,
      });
      const res = await ordersService.create(body);
      // best-effort ตัดสต็อกสินค้าที่ขายไป — backend จริงควรทำใน POST /orders (mock แยก resource)
      const source = catalogQ.data?.data ?? [];
      await Promise.all(
        cart.map((c) => {
          const p = source.find((x) => x._id === c.productId);
          if (!p) return Promise.resolve();
          const left = Math.max((p.product_stock_quantity ?? 0) - c.qty, 0);
          return productsService.update(c.productId, { product_stock_quantity: left }).catch(() => undefined);
        }),
      );
      return res.data.order_no;
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
