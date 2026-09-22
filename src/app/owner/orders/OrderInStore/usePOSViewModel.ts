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
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { productCategoriesService } from "@/services/productCategories";
import { ordersService } from "@/services/orders";
import { paymentsService } from "@/services/payments";
import { usersService } from "@/services/users";
import { posService } from "@/services/pos";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
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
  const [scanCode, setScanCode] = useState("");
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

  // ยิงบาร์โค้ด → GET /admin/pos/scan?code=... → เพิ่มลงตะกร้าทันที (แทนต้องหาในกริดเอง)
  // ยังไม่รองรับ variants (0 สินค้าในระบบจริงใช้ variant เลย — ดู backend docs/BACKLOG2.md §9)
  // เจอ variants ค่อยว่ากันทีหลังตอนมีสินค้าจริงใช้งาน ตอนนี้เพิ่มตัวสินค้าหลักตรง ๆ
  const scan = useMutation({
    mutationFn: (code: string) => posService.scan(code),
    onSuccess: (res) => {
      const stock = res.product.product_stock_quantity ?? 0;
      if (stock <= 0) {
        alert.error(t("pos.scanOutOfStock", { name: res.product.product_name_th }));
        return;
      }
      setCart((c) => addLine(c, res.product));
      alert.success(t("pos.scanAdded", { name: res.product.product_name_th }));
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("pos.scanFailed")),
    onSettled: () => setScanCode(""),
  });

  // scan.mutate เปลี่ยน reference ทุก render (useMutation ไม่การันตี stable identity) — เก็บผ่าน ref
  // ให้ effect ด้านล่าง mount แค่ครั้งเดียวได้จริง (ดูเหตุผลเต็มที่คอมเมนต์ของ effect นั้น) — ต้องอัปเดต
  // ref ใน effect เอง ห้ามเขียนตรงกลาง render (React จะ error "Cannot update ref during render")
  const scanMutateRef = useRef(scan.mutate);
  useEffect(() => {
    scanMutateRef.current = scan.mutate;
  }, [scan.mutate]);

  // ยิงบาร์โค้ดได้จากทุกที่ในหน้าโดยไม่ต้องคลิกช่องกรอกก่อน — เครื่องสแกนจริงพิมพ์เร็วมากแล้วปิดท้าย
  // ด้วย Enter เสมอ (จำลองคีย์บอร์ด) ถ้าตอนนั้น focus ไม่ได้อยู่ใน input/textarea อื่นจริง ๆ (เช่นแค่คลิก
  // การ์ดสินค้า/ปุ่มไปมา ไม่ได้ตั้งใจพิมพ์อะไรอยู่) capture คีย์เข้ามาเป็นบัฟเฟอร์เอง แล้วอัปเดต scanCode
  // ให้เห็นด้วย — แต่ถ้า focus อยู่ใน input จริง (ค้นหา/ชื่อลูกค้า/ช่องสแกนเอง) ปล่อยให้ input นั้นทำงาน
  // ตามปกติ ไม่ไปแทรก กัน hijack การพิมพ์จริงของผู้ใช้
  //
  // ⚠️ ต้อง mount effect นี้ "ครั้งเดียว" (dependency array ว่างเปล่า) ห้ามผูกกับ scan/scan.mutate ตรง ๆ
  // เพราะ reference เปลี่ยนทุก render — ถ้าผูกไว้ effect จะ cleanup+re-run ใหม่ทุกครั้งที่ setScanCode
  // ทำให้ re-render (คือทุกตัวอักษรที่พิมพ์เลย) แล้ว buffer ถูกรีเซ็ตเป็นค่าว่างใหม่ทุกครั้ง เหลือแค่
  // ตัวอักษรตัวสุดท้ายก่อนกด Enter เท่านั้น (เจอบั๊กนี้จริงตอนทดสอบเบราว์เซอร์ — ดู docs/BACKLOG.md)
  useEffect(() => {
    let buffer = "";
    // antd เอง (TypeTabBar/Segmented, Switch, Radio) ใช้ <input type="radio"/"checkbox"> ที่ซ่อนไว้
    // เป็นตัวรับ focus จริง — ไม่ใช่ input ที่ผู้ใช้ "พิมพ์" อะไร ต้องแยกออก ไม่งั้นแค่คลิก tab หมวดหมู่
    // จะทำให้ระบบคิดว่ามี input พิมพ์อยู่แล้ว แล้วไม่ capture การยิงบาร์โค้ดให้เลย
    const NON_TEXT_INPUT_TYPES = new Set(["radio", "checkbox", "button", "submit", "reset", "range", "file", "color", "hidden"]);
    const isTextEditable = (el: Element | null) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.tagName === "TEXTAREA" || el.isContentEditable) return true;
      if (el.tagName === "INPUT") return !NON_TEXT_INPUT_TYPES.has((el as HTMLInputElement).type);
      return false;
    };

    function handleKeyDown(e: KeyboardEvent) {
      if (isTextEditable(document.activeElement)) return;
      if (e.key === "Enter") {
        const code = buffer.trim();
        buffer = "";
        if (code) scanMutateRef.current(code);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer += e.key;
        setScanCode(buffer);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // ตั้งใจว่างเปล่า — mount ครั้งเดียวเท่านั้น (ดูคำอธิบายเต็มด้านบน)

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
    scanCode, setScanCode,
    onScan: (code: string) => { if (code.trim()) scan.mutate(code.trim()); },
    scanning: scan.isPending,
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
