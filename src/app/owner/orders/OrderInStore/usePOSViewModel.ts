"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ POS หน้าร้าน — สแกน/ค้นหาสินค้า → รายการที่สแกน → (โปรโมชัน) → ชำระ (เงินสด / QR mock) → POST /admin/orders
// สร้างออเดอร์ order_type "takeaway" แล้วจ่าย+ปิดงานทันที (ลูกค้าจ่าย+รับของที่เคาน์เตอร์):
//   1) POST /admin/orders (backend ตัดสต็อก + คิดส่วนลดโปรโมชันเอง — ห้ามตัดซ้ำ/คิดเองฝั่ง client)
//   2) POST /admin/payments (สร้างรายการชำระเงินผูกกับออเดอร์)
//   3) POST /admin/payments/[id]/verify {approved:true} (ยืนยันจ่ายทันที)
//   4) PATCH /admin/orders/[id]/status {order_status:"completed"}
// backend บังคับทุกออเดอร์ต้องมี user_id จริง — ไม่มีแนวคิด "ลูกค้าไม่ระบุตัวตน" จึงผูกกับบัญชี
// "ลูกค้าทั่วไป" ตายตัว (สร้างไว้แล้วผ่าน scripts/seed.ts, ดูค่าคงที่ GUEST_CUSTOMER_EMAIL ที่นั่น)
//
// ไม่มีกริดเมนูสินค้าแล้ว (BACKLOG2 §13) — เพิ่มสินค้าได้ 2 ทาง: ยิงบาร์โค้ด / ช่องค้นหาตามรหัสหรือชื่อสินค้า
// โปรโมชัน: โหลดที่ใช้ได้ตอนนี้ (activeNow) เฉพาะช่องทางหน้าร้าน · พรีวิวส่วนลดด้วย posPromotion.ts แต่ตัวเลขจริง
// backend คิดเองจาก promotion_id · ใช้ได้ทีละ 1 โปร และใช้คู่กับส่วนลดกรอกมือไม่ได้ (backend รับอย่างใดอย่างหนึ่ง)
// bundle/ประวัติวันนี้/Omise QR จริง → นอกขอบเขต #8 (ดู SCREEN_MAP.md §4)
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { productsService } from "@/services/products";
import { promotionsService } from "@/services/promotions";
import { ordersService } from "@/services/orders";
import { paymentsService } from "@/services/payments";
import { usersService } from "@/services/users";
import { posService } from "@/services/pos";
import { usePermission } from "@/context/PermissionsContext";
import { alert } from "@/lib/alert";
import { refId } from "@/lib/refId";
import { isApiError } from "@/types/api";
import type { Product } from "@/types/product";
import type { Promotion } from "@/types/promotion";
import { nextRawInput, thaiLayoutToQwerty } from "@/constants/thaiKeyboard";
import {
  addLine, setLineQty, removeLine, cartSubtotal, buildOrderInput, isAtStock, toPromoLines, type CartLine,
} from "./posCart";
import { posPromotions, promotionsForProduct, evaluateAll, isScoped } from "./posPromotion";

// POS ขายเฉพาะสินค้าปกติ (พร้อมขาย มีสต็อก) — พรีออเดอร์ขายผ่านรอบพรีออเดอร์เท่านั้น
// ใช้เป็นแหล่งของช่องค้นหาตามรหัส/ชื่อ (ไม่ได้แสดงเป็นกริดแล้ว)
const CATALOG_PARAMS = { limit: 200, is_preorder: false } as const;
const PROMO_PARAMS = { activeNow: true, limit: 100 } as const;
/** ผลค้นหาสูงสุดที่โชว์ใน dropdown */
const MAX_SEARCH_RESULTS = 8;

/** ต้องตรงกับ GUEST_CUSTOMER_EMAIL ใน backend scripts/seed.ts */
const GUEST_CUSTOMER_EMAIL = "guest@meowmeecake.local";

export type PaymentMethod = "cash" | "qr";

export function usePOSViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("orders");
  const promoPerm = usePermission("promotions");

  const [cart, setCart] = useState<CartLine[]>([]);
  // เก็บ "ข้อความดิบ" ตามปุ่มที่กดจริง แล้วแปลงแป้นไทย→QWERTY รอบเดียวตอนโชว์ (scanCode) — ห้ามเก็บค่าที่แปลงแล้ว
  // แล้วแปลงซ้ำ: "-"/"/" ที่แปลงไปแล้วจะถูกตีความเป็นปุ่ม 3/2 ของแป้นไทยอีกรอบ (ดู nextRawInput)
  const [scanRaw, setScanRaw] = useState("");
  const scanCode = thaiLayoutToQwerty(scanRaw);
  const [filter, setFilter] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [extraDiscount, setExtraDiscount] = useState(0);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [qrOpen, setQrOpen] = useState(false);

  const catalogQ = useQuery({
    queryKey: ["products", CATALOG_PARAMS],
    queryFn: () => productsService.list(CATALOG_PARAMS),
  });
  // backend เช็คสิทธิ์ promotions.view — พนักงานที่ไม่มีสิทธิ์ขายได้ตามปกติ แค่ไม่เห็น/ใช้โปรโมชัน
  const promotionsQ = useQuery({
    queryKey: ["promotions", PROMO_PARAMS],
    queryFn: () => promotionsService.list(PROMO_PARAMS),
    enabled: promoPerm.view,
    retry: false,
  });
  // บัญชี "ลูกค้าทั่วไป" ตายตัว — หา id ครั้งเดียวตอนเปิดหน้า (cache ยาว ไม่มีวันเปลี่ยน)
  const guestQ = useQuery({
    queryKey: ["users", "guest-customer"],
    queryFn: () => usersService.list({ search: GUEST_CUSTOMER_EMAIL, limit: 1 }),
    staleTime: Infinity,
  });
  const guestUserId = guestQ.data?.data[0]?._id ?? null;

  const catalog = useMemo(
    // กันซ้ำเผื่อ backend รุ่นเก่าที่ยังไม่รู้จัก ?is_preorder=
    () => (catalogQ.data?.data ?? []).filter((p) => !p.is_preorder),
    [catalogQ.data],
  );
  const promotions = useMemo(() => posPromotions(promotionsQ.data?.data ?? []), [promotionsQ.data]);
  /** โปรโมชันลดทั้งบิล (ไม่จำกัดสินค้า/หมวด) — โชว์แยกเป็นแถบแจ้ง ไม่ผูกกับสินค้าตัวไหน */
  const billPromotions = useMemo(() => promotions.filter((p) => !isScoped(p)), [promotions]);

  const promosOf = (productId: string, categoryId: string | null): Promotion[] =>
    promotionsForProduct(promotions, productId, categoryId);

  // ── ค้นหาตามรหัสสินค้าหรือชื่อ (แทนกริดเมนูเดิม) ──
  const searchResults = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter((p) => (p.product_id ?? "").toLowerCase().includes(q) || p.product_name_th.toLowerCase().includes(q))
      .slice(0, MAX_SEARCH_RESULTS);
  }, [catalog, filter]);

  /** เพิ่มสินค้าลงรายการ (ใช้ทั้งสแกนและเลือกจากผลค้นหา) — แจ้งหมดสต็อก/เต็มสต็อก และแจ้งโปรโมชันของสินค้านั้น */
  const addProduct = (p: Product) => {
    const stock = p.product_stock_quantity ?? 0;
    if (stock <= 0) {
      alert.warning(t("pos.scanOutOfStock", { name: p.product_name_th }));
      return;
    }
    if (isAtStock(cart, p._id)) {
      alert.warning(t("pos.atStockLimit", { name: p.product_name_th, n: stock }));
      return;
    }
    setCart((c) => addLine(c, p));
    const promos = promosOf(p._id, refId(p.category_id) || null);
    alert.success(t("pos.scanAdded", { name: p.product_name_th }), {
      note: promos.length ? t("pos.productHasPromotion", { names: promos.map((x) => x.promotion_name).join(", ") }) : undefined,
    });
  };

  // ยิงบาร์โค้ด → GET /admin/pos/scan?code=... → เพิ่มลงรายการทันที
  // ยังไม่รองรับ variants (0 สินค้าในระบบจริงใช้ variant เลย — ดู BACKLOG2 §6)
  const scan = useMutation({
    // แป้นพิมพ์ OS เป็นไทยตอนยิง → เครื่องสแกนส่ง "ยนหขจ..." แทน "pos-0..." (ดู constants/thaiKeyboard.ts)
    // + lowercase กัน Caps Lock (รหัส pos-/pre- เป็นตัวเล็ก, _id เป็น hex ไม่สนตัวพิมพ์)
    mutationFn: (code: string) => posService.scan(thaiLayoutToQwerty(code).trim().toLowerCase()),
    onSuccess: (res) => addProduct(res.product),
    onError: (e) => alert.error(isApiError(e) ? e.message : t("pos.scanFailed")),
    onSettled: () => setScanRaw(""),
  });

  // scan.mutate เปลี่ยน reference ทุก render (useMutation ไม่การันตี stable identity) — เก็บผ่าน ref
  // ให้ effect ด้านล่าง mount แค่ครั้งเดียวได้จริง (ดูเหตุผลเต็มที่คอมเมนต์ของ effect นั้น) — ต้องอัปเดต
  // ref ใน effect เอง ห้ามเขียนตรงกลาง render (React จะ error "Cannot update ref during render")
  const scanMutateRef = useRef(scan.mutate);
  useEffect(() => {
    scanMutateRef.current = scan.mutate;
  }, [scan.mutate]);

  // ยิงบาร์โค้ดได้จากทุกที่ในหน้าโดยไม่ต้องคลิกช่องกรอกก่อน — เครื่องสแกนจริงพิมพ์เร็วมากแล้วปิดท้าย
  // ด้วย Enter เสมอ (จำลองคีย์บอร์ด) ถ้าตอนนั้น focus ไม่ได้อยู่ใน input/textarea อื่นจริง ๆ capture คีย์เข้ามา
  // เป็นบัฟเฟอร์เอง แล้วอัปเดต scanCode ให้เห็นด้วย — แต่ถ้า focus อยู่ใน input จริง (ค้นหา/ชื่อลูกค้า/ช่องสแกนเอง)
  // ปล่อยให้ input นั้นทำงานตามปกติ ไม่ไปแทรก กัน hijack การพิมพ์จริงของผู้ใช้
  //
  // ⚠️ ต้อง mount effect นี้ "ครั้งเดียว" (dependency array ว่างเปล่า) ห้ามผูกกับ scan/scan.mutate ตรง ๆ
  // เพราะ reference เปลี่ยนทุก render — ถ้าผูกไว้ effect จะ cleanup+re-run ใหม่ทุกครั้งที่ setScanRaw
  // ทำให้ re-render (คือทุกตัวอักษรที่พิมพ์เลย) แล้ว buffer ถูกรีเซ็ตเป็นค่าว่างใหม่ทุกครั้ง เหลือแค่
  // ตัวอักษรตัวสุดท้ายก่อนกด Enter เท่านั้น (เจอบั๊กนี้จริงตอนทดสอบเบราว์เซอร์ — ดู docs/BACKLOG.md)
  useEffect(() => {
    let buffer = "";
    // antd เอง (Segmented, Switch, Radio) ใช้ <input type="radio"/"checkbox"> ที่ซ่อนไว้เป็นตัวรับ focus จริง —
    // ไม่ใช่ input ที่ผู้ใช้ "พิมพ์" อะไร ต้องแยกออก ไม่งั้นแค่คลิกเลือกโปรโมชัน/วิธีชำระ ระบบจะคิดว่ามี input
    // พิมพ์อยู่แล้ว แล้วไม่ capture การยิงบาร์โค้ดให้เลย
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
        setScanRaw(buffer); // buffer = ข้อความดิบอยู่แล้ว
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // ตั้งใจว่างเปล่า — mount ครั้งเดียวเท่านั้น (ดูคำอธิบายเต็มด้านบน)

  const subtotal = cartSubtotal(cart);
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);

  // ── โปรโมชันกับบิลปัจจุบัน ──
  const promoEvals = useMemo(() => evaluateAll(promotions, toPromoLines(cart)), [promotions, cart]);
  const selectedEval = promoEvals.find((e) => e.promotion._id === selectedPromoId) ?? null;
  // เลือกไว้แต่บิลเปลี่ยนจนใช้ไม่ได้แล้ว (ลบสินค้า/ลดจำนวน) → ไม่ใช้โปร (ส่วนลดกรอกมือกลับมาใช้ได้) + แจ้งในแผง
  const appliedPromo = selectedEval?.eligible ? selectedEval : null;
  const bestPromo = promoEvals.find((e) => e.eligible) ?? null;

  const manualDiscount = Math.min(Math.max(extraDiscount, 0), subtotal);
  const discount = appliedPromo ? appliedPromo.discount : manualDiscount;
  const total = Math.max(subtotal - discount, 0);

  const checkout = useMutation({
    mutationFn: async () => {
      // ข้อความนี้ไม่โชว์ผู้ใช้ตรง ๆ (onError ใช้ t("pos.saveFailed") แทน) — ไว้ debug ใน console เท่านั้น
      if (!guestUserId) throw new Error("Guest customer account not found — run `npm run seed` on the backend");

      // 1) สร้างออเดอร์ — backend ตัดสต็อก + คำนวณ subtotal/ส่วนลดโปรโมชัน/total_amount ให้เองทั้งหมด
      const orderRes = await ordersService.create(
        buildOrderInput({ cart, guestUserId, discount: manualDiscount, promotionId: appliedPromo?.promotion._id ?? null }),
      );
      const order = orderRes.data;

      // 2) สร้างรายการชำระเงิน + 3) ยืนยันจ่ายทันที (เงินสด/QR ที่เคาน์เตอร์ = จ่ายจริงแล้ว)
      //    ยอดใช้ order.total_amount ของ backend เสมอ (ไม่ใช่ total ที่พรีวิวฝั่ง client)
      //    verify(paid) ตอน order ยัง pending จะขยับ order_status → "confirmed" ให้อัตโนมัติ
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
      setSelectedPromoId(null);
      setPaymentMethod("cash");
      setQrOpen(false);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      // used_count ของโปรเปลี่ยน (usage_limit)
      qc.invalidateQueries({ queryKey: ["promotions"] });
      // ยอดขายหน้าร้าน (POS-) เข้ารายรับทันที — หน้าสรุปการเงินที่เปิดค้างไว้ต้องดึงใหม่
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("pos.saveFailed")),
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
    isLoading: catalogQ.isLoading,
    isError: catalogQ.isError,
    refetch: () => catalogQ.refetch(),

    cart, itemCount, subtotal, discount, total,
    // ช่องสแกน (controlled) โชว์ scanCode ที่แปลงแล้ว — onChange ได้ค่าแปลงแล้ว + ตัวใหม่ดิบ → ต่อเข้าข้อความดิบเดิม
    scanCode,
    setScanCode: (v: string) => setScanRaw((raw) => nextRawInput(raw, thaiLayoutToQwerty(raw), v)),
    onScan: (code: string) => { if (code.trim()) scan.mutate(code.trim()); },
    scanning: scan.isPending,

    // ค้นหาตามรหัส/ชื่อ
    filter, setFilter,
    searchResults,
    onPickProduct: (id: string) => {
      const p = catalog.find((x) => x._id === id);
      if (p) addProduct(p);
      setFilter("");
    },

    // โปรโมชัน
    promotionsEnabled: promoPerm.view && !promotionsQ.isError,
    promoEvals,
    billPromotions,
    bestPromo,
    selectedPromoId,
    appliedPromo,
    selectedPromoInvalid: !!selectedPromoId && !appliedPromo,
    setSelectedPromoId,
    promosOf,

    customerName, setCustomerName,
    extraDiscount, setExtraDiscount,
    paymentMethod, setPaymentMethod,

    changeQty: (id: string, qty: number) => setCart((c) => setLineQty(c, id, qty)),
    removeFromCart: (id: string) => setCart((c) => removeLine(c, id)),
    clearCart: () => { setCart([]); setSelectedPromoId(null); },

    qrOpen,
    closeQr: () => setQrOpen(false),
    onConfirm,
    confirmPaid: () => checkout.mutate(),
    submitting: checkout.isPending,
  };
}
