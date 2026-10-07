"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ POS หน้าร้าน — สแกน/ค้นหา → บิล → โปรโมชัน → ชำระ (เงินสด: รับเงิน+ทอน / QR mock) → POST /admin/orders
// สร้างออเดอร์ order_type "takeaway" แล้วจ่าย+ปิดงานทันที (ลูกค้าจ่าย+รับของที่เคาน์เตอร์):
//   1) POST /admin/orders (backend ตัดสต็อก + คิดส่วนลดโปรโมชันเอง — ห้ามตัดซ้ำ/คิดเองฝั่ง client)
//   2) POST /admin/payments (สร้างรายการชำระเงินผูกกับออเดอร์)
//   3) POST /admin/payments/[id]/verify {approved:true} (ยืนยันจ่ายทันที)
//   4) PATCH /admin/orders/[id]/status {order_status:"completed"}
// backend บังคับทุกออเดอร์ต้องมี user_id จริง — ไม่มีแนวคิด "ลูกค้าไม่ระบุตัวตน" จึงผูกกับบัญชี
// "ลูกค้าทั่วไป" ตายตัว (สร้างไว้แล้วผ่าน scripts/seed.ts, ดูค่าคงที่ GUEST_CUSTOMER_EMAIL ที่นั่น)
//
// หน้าจอตามดีไซน์ใหม่ (BACKLOG2 §14): ช่อง "สแกน / ค้นหา" ช่องเดียว (บาร์โค้ด + รหัส/ชื่อ) · บิล (ปุ่ม −/+) ·
// การ์ดโปรโมชัน · ปุ่มชำระเงินสด/QR · หน้าต่างรับเงินสด (คีย์แพด + ทอน) / QR / ชำระสำเร็จ
// โปรโมชัน: พรีวิวด้วย posPromotion.ts แต่ตัวเลขจริง backend คิดเองจาก promotion_id · ใช้ได้ทีละ 1 โปร
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
import { alert, confirmAlert } from "@/lib/alert";
import { refId } from "@/lib/refId";
import { isApiError } from "@/types/api";
import type { Product } from "@/types/product";
import type { Promotion } from "@/types/promotion";
import type { ProductCustomization } from "@/types/productCustomization";
import { nextRawInput, thaiLayoutToQwerty } from "@/constants/thaiKeyboard";
import {
  addLine, setLineQty, removeLine, cartSubtotal, buildOrderInput, isAtStock, toPromoLines, type CartLine,
} from "./posCart";
import { posPromotions, promotionsForProduct, evaluateAll, isScoped } from "./posPromotion";
import { EMPTY_SELECTION, hasCustomization, toSelection, type CartSelection, type Picked } from "@/lib/customizationSelection";
import { LIST_ALL } from "@/lib/http";

// POS ขายเฉพาะสินค้าปกติ (พร้อมขาย มีสต็อก) — พรีออเดอร์ขายผ่านรอบพรีออเดอร์เท่านั้น
// ใช้เป็นแหล่งของคำแนะนำในช่อง "สแกน / ค้นหา" (ไม่ได้แสดงเป็นกริดแล้ว)
const CATALOG_PARAMS = { limit: LIST_ALL, is_preorder: false } as const;
const PROMO_PARAMS = { activeNow: true, limit: LIST_ALL } as const;
/** คำแนะนำสูงสุดใต้ช่องค้นหา */
const MAX_SUGGESTIONS = 6;
/** หลักสูงสุดของ "รับเงินมา" (999,999 บาท) */
const MAX_RECEIVED_DIGITS = 6;

/** ต้องตรงกับ GUEST_CUSTOMER_EMAIL ใน backend scripts/seed.ts */
const GUEST_CUSTOMER_EMAIL = "guest@meowmeecake.local";

/** cache กลุ่มตัวเลือกต่อสินค้า — ดึงผ่าน /admin/pos/scan (สิทธิ์ orders.view เหมือน POS) ไม่ใช่ /admin/products/:id/customization
 *  (ต้อง products.view ซึ่งพนักงานหน้าร้านอาจไม่มี) */
const customizationKey = (productId: string) => ["pos", "customization", productId] as const;
const CUSTOMIZATION_STALE_MS = 5 * 60_000;

export type PaymentMethod = "cash" | "qr";
export type PayDialog = null | PaymentMethod | "done";

export interface PaymentDone {
  orderNo: string;
  method: PaymentMethod;
  /** ยอดจริงจาก backend (order.total_amount) */
  total: number;
  discount: number;
  received: number;
  change: number;
}

export function usePOSViewModel() {
  const t = useTranslations();
  const qc = useQueryClient();
  const perm = usePermission("orders");
  const promoPerm = usePermission("promotions");

  const [cart, setCart] = useState<CartLine[]>([]);
  // ช่อง "สแกน / ค้นหา" — เก็บ "ข้อความดิบ" ตามปุ่มที่กดจริง แล้วแปลงแป้นไทย→QWERTY รอบเดียวตอนโชว์ (query) —
  // ห้ามเก็บค่าที่แปลงแล้วแล้วแปลงซ้ำ: "-"/"/" จะถูกตีความเป็นปุ่ม 3/2 ของแป้นไทยอีกรอบ (ดู nextRawInput)
  const [queryRaw, setQueryRaw] = useState("");
  const query = thaiLayoutToQwerty(queryRaw);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [payDialog, setPayDialog] = useState<PayDialog>(null);
  /** "รับเงินมา" (เงินสด) — เก็บเป็นตัวเลขหลักแบบคีย์แพด */
  const [receivedDigits, setReceivedDigits] = useState("");
  const [done, setDone] = useState<PaymentDone | null>(null);
  /** หน้าต่างเลือกตัวเลือกของสินค้าที่กำลังจะลงบิล (BACKLOG3-merge I4) */
  const [picker, setPicker] = useState<{ product: Product; customization: ProductCustomization } | null>(null);
  /** กำลังดึงกลุ่มตัวเลือกของสินค้านี้ก่อนลงบิล */
  const [preparingId, setPreparingId] = useState<string | null>(null);

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
  const promotionsEnabled = promoPerm.view && !promotionsQ.isError;

  const promosOf = (productId: string, categoryId: string | null): Promotion[] =>
    promotionEnabledList(promotionsEnabled, promotionsForProduct(promotions, productId, categoryId));

  // ── คำแนะนำใต้ช่อง "สแกน / ค้นหา" — ตามรหัสสินค้าหรือชื่อ ──
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter((p) => (p.product_id ?? "").toLowerCase().includes(q) || p.product_name_th.toLowerCase().includes(q))
      .slice(0, MAX_SUGGESTIONS);
  }, [catalog, query]);

  /** ลงบิลจริง (หลังเลือกตัวเลือกแล้ว ถ้ามี) — แจ้งโปรโมชันของสินค้านั้น */
  const commitAdd = (p: Product, sel: CartSelection) => {
    if (isAtStock(cart, p._id)) {
      alert.warning(t("pos.atStockLimit", { name: p.product_name_th, n: p.product_stock_quantity ?? 0 }));
      return;
    }
    setCart((c) => addLine(c, p, sel));
    const promos = promosOf(p._id, refId(p.category_id) || null);
    // สแกนต่อเนื่องได้โดยไม่ต้องปิด popup ทุกชิ้น — แจ้งเฉพาะสินค้าที่มีโปรโมชัน
    if (promos.length) {
      alert.info(t("pos.productHasPromotion", { names: promos.map((x) => x.promotion_name).join(", ") }), {
        title: p.product_name_th,
      });
    }
  };

  /** เพิ่มสินค้าลงบิล (สแกน / เลือกคำแนะนำ / Enter) — แจ้งหมดสต็อก/เต็มสต็อก · มีกลุ่มตัวเลือก/ออปชัน = เปิดหน้าต่างเลือกก่อน
   *  known = customization ที่ได้มากับผลสแกนแล้ว (ไม่ต้องถามซ้ำ) */
  const addProduct = async (p: Product, known?: ProductCustomization) => {
    const stock = p.product_stock_quantity ?? 0;
    if (stock <= 0) {
      alert.warning(t("pos.scanOutOfStock", { name: p.product_name_th }));
      return;
    }
    if (isAtStock(cart, p._id)) {
      alert.warning(t("pos.atStockLimit", { name: p.product_name_th, n: stock }));
      return;
    }
    let customization = known;
    if (!customization) {
      setPreparingId(p._id);
      try {
        customization = await qc.fetchQuery({
          queryKey: customizationKey(p._id),
          queryFn: async () => (await posService.scan(p._id)).customization,
          staleTime: CUSTOMIZATION_STALE_MS,
        });
      } catch (e) {
        // ไม่รู้ว่าต้องเลือกอะไร → ไม่ลงบิล (ลงไปก็โดน backend ปฏิเสธถ้ามีกลุ่มบังคับ)
        alert.error(isApiError(e) ? e.message : t("pos.customizationLoadFailed"));
        return;
      } finally {
        setPreparingId(null);
      }
    }
    if (customization && hasCustomization(customization)) setPicker({ product: p, customization });
    else commitAdd(p, EMPTY_SELECTION);
  };

  // รหัสที่ไม่อยู่ในรายการที่โหลดไว้ (เกิน 200 รายการ / ยิงด้วย _id) → ถาม backend ทีละรหัส
  // ผลสแกนมี customization มาด้วย — เก็บลง cache แล้วส่งต่อ (ไม่ต้องถามซ้ำ)
  const scan = useMutation({
    // + lowercase กัน Caps Lock (รหัส pos-/pre- เป็นตัวเล็ก, _id เป็น hex ไม่สนตัวพิมพ์)
    mutationFn: (code: string) => posService.scan(thaiLayoutToQwerty(code).trim().toLowerCase()),
    onSuccess: (res) => {
      qc.setQueryData(customizationKey(res.product._id), res.customization);
      void addProduct(res.product, res.customization);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("pos.scanFailed")),
    onSettled: () => setQueryRaw(""),
  });

  /** Enter ในช่อง "สแกน / ค้นหา" (หรือเครื่องสแกนที่ปิดท้ายด้วย Enter):
   *  รหัสตรงกับสินค้าในรายการ หรือคำแนะนำเหลือตัวเดียว → เพิ่มทันที · ไม่งั้นถาม backend (/admin/pos/scan) */
  const submitQuery = (rawText: string) => {
    const code = thaiLayoutToQwerty(rawText).trim().toLowerCase();
    if (!code) return;
    const exact = catalog.find((p) => (p.product_id ?? "").toLowerCase() === code || p._id === code);
    const matches = catalog.filter(
      (p) => (p.product_id ?? "").toLowerCase().includes(code) || p.product_name_th.toLowerCase().includes(code),
    );
    const local = exact ?? (matches.length === 1 ? matches[0] : null);
    if (local) {
      void addProduct(local);
      setQueryRaw("");
      return;
    }
    scan.mutate(code);
  };

  // ── โปรโมชันกับบิลปัจจุบัน ──
  const subtotal = cartSubtotal(cart);
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);
  const promoEvals = useMemo(
    () => (promotionsEnabled ? evaluateAll(promotions, toPromoLines(cart)) : []),
    [promotionsEnabled, promotions, cart],
  );
  const selectedEval = promoEvals.find((e) => e.promotion._id === selectedPromoId) ?? null;
  // เลือกไว้แต่บิลเปลี่ยนจนใช้ไม่ได้แล้ว (ลบสินค้า/ลดจำนวน) → ไม่ใช้โปร + แจ้งในการ์ด
  const appliedPromo = selectedEval?.eligible ? selectedEval : null;
  const bestPromo = promoEvals.find((e) => e.eligible) ?? null;
  const discount = appliedPromo?.discount ?? 0;
  const total = Math.max(subtotal - discount, 0);

  const received = Number(receivedDigits || "0");
  const receivedShort = received < total;

  const resetBill = () => {
    setCart([]);
    setSelectedPromoId(null);
    setReceivedDigits("");
    setQueryRaw("");
    setPicker(null);
  };

  const checkout = useMutation({
    mutationFn: async ({ method, received: cash }: { method: PaymentMethod; received: number }): Promise<PaymentDone> => {
      // ข้อความนี้ไม่โชว์ผู้ใช้ตรง ๆ (onError ใช้ t("pos.saveFailed") แทน) — ไว้ debug ใน console เท่านั้น
      if (!guestUserId) throw new Error("Guest customer account not found — run `npm run seed` on the backend");

      // 1) สร้างออเดอร์ — backend ตัดสต็อก + คำนวณ subtotal/ส่วนลดโปรโมชัน/total_amount ให้เองทั้งหมด
      const orderRes = await ordersService.create(
        buildOrderInput({ cart, guestUserId, discount: 0, promotionId: appliedPromo?.promotion._id ?? null }),
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

      const paid = method === "cash" ? cash : order.total_amount;
      return {
        orderNo: order.order_no,
        method,
        total: order.total_amount,
        discount: order.discount_amount ?? 0,
        received: paid,
        change: Math.max(paid - order.total_amount, 0),
      };
    },
    onSuccess: (result) => {
      setDone(result);
      setPayDialog("done");
      resetBill();
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      // used_count ของโปรเปลี่ยน (usage_limit)
      qc.invalidateQueries({ queryKey: ["promotions"] });
      // ยอดขายหน้าร้าน (POS-) เข้ารายรับทันที — หน้าสรุปการเงินที่เปิดค้างไว้ต้องดึงใหม่
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : t("pos.saveFailed")),
  });

  // ── คีย์แพด "รับเงินมา" ──
  const pressKey = (k: string) => {
    if (k === "back") setReceivedDigits((v) => v.slice(0, -1));
    else setReceivedDigits((v) => (v.length >= MAX_RECEIVED_DIGITS ? v : (v === "0" ? "" : v) + k));
  };
  const confirmCash = () => {
    if (receivedShort || checkout.isPending) return;
    checkout.mutate({ method: "cash", received });
  };

  // ── คีย์บอร์ด: ยิงบาร์โค้ดได้จากทุกที่ + พิมพ์ตัวเลขในหน้าต่างรับเงินสด ──
  // ฟังก์ชันพวกนี้เปลี่ยน reference ทุก render — เก็บผ่าน ref ให้ effect ด้านล่าง mount แค่ครั้งเดียวได้จริง
  // (อัปเดต ref ใน effect เอง ห้ามเขียนตรงกลาง render — React จะ error "Cannot update ref during render")
  const handlersRef = useRef({ submitQuery, pressKey, confirmCash, payDialog });
  useEffect(() => {
    handlersRef.current = { submitQuery, pressKey, confirmCash, payDialog };
  });

  // ยิงบาร์โค้ดได้จากทุกที่ในหน้าโดยไม่ต้องคลิกช่องกรอกก่อน — เครื่องสแกนจริงพิมพ์เร็วมากแล้วปิดท้ายด้วย Enter เสมอ
  // ถ้า focus ไม่ได้อยู่ใน input จริง ๆ capture คีย์เป็นบัฟเฟอร์เอง แล้วโชว์ในช่อง "สแกน / ค้นหา" ด้วย — แต่ถ้า focus
  // อยู่ใน input จริง ปล่อยให้ input นั้นทำงานตามปกติ กัน hijack การพิมพ์จริงของผู้ใช้
  // หน้าต่างรับเงินสดเปิดอยู่ → ตัวเลข/Backspace/Enter ใช้กับ "รับเงินมา" แทน · หน้าต่างอื่นเปิดอยู่ → ไม่ capture
  //
  // ⚠️ ต้อง mount effect นี้ "ครั้งเดียว" (dependency array ว่างเปล่า) — ถ้าผูกกับ state/ฟังก์ชันที่เปลี่ยนทุก render
  // effect จะ cleanup+re-run ทุกตัวอักษรที่พิมพ์ แล้ว buffer ถูกรีเซ็ตเหลือแค่ตัวสุดท้าย (เจอบั๊กนี้จริง — ดู docs/BACKLOG.md)
  useEffect(() => {
    let buffer = "";
    // antd (Segmented, Switch, Radio, Checkbox) ใช้ <input type="radio"/"checkbox"> ที่ซ่อนไว้เป็นตัวรับ focus จริง —
    // ไม่ใช่ input ที่ผู้ใช้ "พิมพ์" ต้องแยกออก ไม่งั้นแค่คลิกปุ่มพวกนั้น ระบบจะไม่ capture การยิงบาร์โค้ดให้เลย
    const NON_TEXT_INPUT_TYPES = new Set(["radio", "checkbox", "button", "submit", "reset", "range", "file", "color", "hidden"]);
    const isTextEditable = (el: Element | null) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.tagName === "TEXTAREA" || el.isContentEditable) return true;
      if (el.tagName === "INPUT") return !NON_TEXT_INPUT_TYPES.has((el as HTMLInputElement).type);
      return false;
    };

    function handleKeyDown(e: KeyboardEvent) {
      const h = handlersRef.current;
      if (h.payDialog === "cash") {
        if (/^\d$/.test(e.key)) { e.preventDefault(); h.pressKey(e.key); }
        else if (e.key === "Backspace") { e.preventDefault(); h.pressKey("back"); }
        else if (e.key === "Enter") { e.preventDefault(); h.confirmCash(); }
        return;
      }
      if (h.payDialog) return;
      if (isTextEditable(document.activeElement)) return;
      if (e.key === "Enter") {
        const code = buffer;
        buffer = "";
        if (code.trim()) h.submitQuery(code);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer += e.key;
        setQueryRaw(buffer); // buffer = ข้อความดิบอยู่แล้ว
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // ตั้งใจว่างเปล่า — mount ครั้งเดียวเท่านั้น (ดูคำอธิบายเต็มด้านบน)

  const canPay = perm.create && cart.length > 0 && !checkout.isPending;

  return {
    perm,
    isCatalogError: catalogQ.isError,
    refetchCatalog: () => catalogQ.refetch(),

    // ช่อง "สแกน / ค้นหา" (controlled) — onChange ได้ค่าแปลงแล้ว + ตัวใหม่ดิบ → ต่อเข้าข้อความดิบเดิม
    query,
    setQuery: (v: string) => setQueryRaw((raw) => nextRawInput(raw, thaiLayoutToQwerty(raw), v)),
    onSubmitQuery: () => submitQuery(queryRaw),
    scanning: scan.isPending,
    suggestions,
    onPickSuggestion: (p: Product) => { void addProduct(p); setQueryRaw(""); },
    preparingId,

    // หน้าต่างเลือกตัวเลือก
    picker,
    onPickConfirm: (picked: Picked) => {
      if (!picker) return;
      commitAdd(picker.product, toSelection(picker.customization, picked));
      setPicker(null);
    },
    onPickCancel: () => setPicker(null),

    // บิล
    cart, itemCount, subtotal, discount, total,
    promosOf,
    increaseQty: (line: CartLine) => setCart((c) => setLineQty(c, line.lineKey, line.qty + 1)),
    /** สินค้านี้ในบิล (ทุกบรรทัด) เต็มสต็อกแล้ว */
    isProductAtStock: (productId: string) => isAtStock(cart, productId),
    // ลดจนเหลือ 0 = เอาออกจากบิล (ตามดีไซน์ — ไม่มีปุ่มลบแยก)
    decreaseQty: (line: CartLine) =>
      setCart((c) => (line.qty <= 1 ? removeLine(c, line.lineKey) : setLineQty(c, line.lineKey, line.qty - 1))),
    onClearBill: async () => {
      if (cart.length === 0) return;
      const ok = await confirmAlert(t("pos.clearBillConfirm"), { title: t("pos.clearBill"), danger: true });
      if (ok) resetBill();
    },

    // โปรโมชัน (ใช้ได้ทีละ 1 — backend รับ promotion_id เดียว)
    promotionsEnabled,
    promoEvals,
    billPromotions: promotions.filter((p) => !isScoped(p)),
    bestPromoId: bestPromo?.promotion._id ?? null,
    selectedPromoId,
    appliedPromo,
    selectedPromoInvalid: !!selectedPromoId && !appliedPromo,
    togglePromo: (id: string) => setSelectedPromoId((cur) => (cur === id ? null : id)),

    // ชำระเงิน
    canPay,
    payDialog,
    openCash: () => { if (canPay) { setReceivedDigits(""); setPayDialog("cash"); } },
    openQr: () => { if (canPay) setPayDialog("qr"); },
    closeDialog: () => { if (!checkout.isPending) setPayDialog(null); },
    received, receivedShort,
    pressKey,
    pickCash: (amount: number) => setReceivedDigits(String(Math.ceil(amount))),
    confirmCash,
    confirmQr: () => checkout.mutate({ method: "qr", received: total }),
    submitting: checkout.isPending,
    done,
  };
}

/** ไม่มีสิทธิ์ดูโปรโมชัน → ไม่ติดป้าย/แจ้งเตือนโปรของสินค้า */
function promotionEnabledList(enabled: boolean, list: Promotion[]): Promotion[] {
  return enabled ? list : [];
}
