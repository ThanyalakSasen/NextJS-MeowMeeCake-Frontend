"use client";
// ─────────────────────────────────────────────────────────────
// ViewModel ของ POS หน้าร้าน — สแกน/ค้นหา → บิล → โปรโมชัน → ชำระ (เงินสด: รับเงิน+ทอน / QR mock) → POST /admin/orders
// สร้างออเดอร์ order_type "takeaway" แล้วจ่าย+ปิดงานทันที (ลูกค้าจ่าย+รับของที่เคาน์เตอร์):
//   1) POST /admin/orders (backend ตัดสต็อก + คิดส่วนลดโปรโมชันเอง — ห้ามตัดซ้ำ/คิดเองฝั่ง client)
//   2) POST /admin/pos/orders/[id]/checkout — สร้างรายการชำระ + ยืนยันจ่าย (ผู้ขาย = ผู้ยืนยัน) + ปิดงาน completed
//      ใช้สิทธิ์ orders.create (ขายที่ POS ได้) — นโยบายร้าน: คนที่ขายหน้าร้านได้ รับเงินแล้วอนุมัติการชำระอัตโนมัติ
//      ไม่ต้องมี payments.approve (ซึ่งยืนยันสลิปออเดอร์เว็บได้ด้วย)
// backend บังคับทุกออเดอร์ต้องมี user_id จริง — ไม่มีแนวคิด "ลูกค้าไม่ระบุตัวตน" จึงผูกกับบัญชี
// "ลูกค้าทั่วไป" ตายตัว (backend scripts/seed.ts สร้างไว้ · หา id ผ่าน GET /admin/pos/guest-customer ใต้ orders.view)
// กรอกเบอร์มือถือสมาชิก (GET /admin/pos/member) → ผูกออเดอร์กับสมาชิกแทน → ปิดงาน completed แล้ว backend ให้แต้มสะสมเอง
//
// หน้าจอตามดีไซน์ใหม่ (BACKLOG2 §14): ช่อง "สแกน / ค้นหา" ช่องเดียว (บาร์โค้ด + รหัส/ชื่อ) · บิล (ปุ่ม −/+) ·
// การ์ดโปรโมชัน · ปุ่มชำระเงินสด/QR · หน้าต่างรับเงินสด (คีย์แพด + ทอน) / QR / ชำระสำเร็จ
// โปรโมชัน: พรีวิวด้วย posPromotion.ts แต่ตัวเลขจริง backend คิดเองจาก promotion_id(s) · ซ้อนได้เมื่อทุกโปรตั้ง stackable
// พักบิล (posHeldBills.ts — เก็บในเครื่อง) · พิมพ์ใบเสร็จหลังชำระ (PaymentDone มีรายการ + ยอดครบสำหรับใบเสร็จ)
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/i18n/format";
import { promotionsService } from "@/services/promotions";
import { storeInfoService } from "@/services/storeInfo";
import { storeInfoKey } from "@/app/customer/lib/catalogQueries";
import { ordersService } from "@/services/orders";
import { posService } from "@/services/pos";
import { usePermission } from "@/context/PermissionsContext";
import { alert, confirmAlert } from "@/lib/alert";
import { refId } from "@/lib/refId";
import { isApiError } from "@/types/api";
import type { Product } from "@/types/product";
import type { Promotion } from "@/types/promotion";
import type { ProductCustomization } from "@/types/productCustomization";
import type { PosMember, PosProduct } from "@/types/pos";
import type { Order } from "@/types/order";
import { nextRawInput, thaiLayoutToQwerty } from "@/constants/thaiKeyboard";
import {
  addLine, setLineQty, removeLine, cartSubtotal, buildOrderInput, isAtStock, toPromoLines, type CartLine,
} from "./posCart";
import { posPromotions, promotionsForProduct, evaluateAll, isScoped, togglePromoSelection } from "./posPromotion";
import {
  useHeldBills, saveHeldBills, newHeldBillId, MAX_HELD_BILLS, type HeldBill,
} from "./posHeldBills";
import { EMPTY_SELECTION, hasCustomization, toSelection, type CartSelection, type Picked } from "@/lib/customizationSelection";
import { LIST_ALL } from "@/lib/http";

// POS ขายเฉพาะสินค้าปกติ — /admin/pos/products กรองพรีออเดอร์ (ขายผ่านรอบพรีออเดอร์เท่านั้น) และสินค้าที่ลบแล้วให้เอง
// ใช้เป็นแหล่งของคำแนะนำในช่อง "สแกน / ค้นหา" (ไม่ได้แสดงเป็นกริดแล้ว) · สิทธิ์ orders.view (I15)
const CATALOG_PARAMS = { limit: LIST_ALL } as const;
const PROMO_PARAMS = { activeNow: true, limit: LIST_ALL } as const;
/** คำแนะนำสูงสุดใต้ช่องค้นหา */
const MAX_SUGGESTIONS = 6;
/** หลักสูงสุดของ "รับเงินมา" (999,999 บาท) */
const MAX_RECEIVED_DIGITS = 6;

/** cache กลุ่มตัวเลือกต่อสินค้า — ดึงผ่าน /admin/pos/scan (สิทธิ์ orders.view เหมือน POS) ไม่ใช่ /admin/products/:id/customization
 *  (ต้อง products.view ซึ่งพนักงานหน้าร้านอาจไม่มี) */
const customizationKey = (productId: string) => ["pos", "customization", productId] as const;
const CUSTOMIZATION_STALE_MS = 5 * 60_000;

export type PaymentMethod = "cash" | "qr";
export type PayDialog = null | PaymentMethod | "done";

/** 1 บรรทัดบนใบเสร็จ */
export interface ReceiptLine {
  name: string;
  detail: string | null;
  qty: number;
  price: number;
}

export interface PaymentDone {
  orderNo: string;
  /** ISO time ตอนชำระสำเร็จ */
  paidAt: string;
  lines: ReceiptLine[];
  /** ยอดก่อนส่วนลดจาก backend (order.subtotal) */
  subtotal: number;
  /** ชื่อโปรที่ใช้ในบิลนี้ */
  promotions: string[];
  method: PaymentMethod;
  /** ยอดจริงจาก backend (order.total_amount) */
  total: number;
  discount: number;
  received: number;
  change: number;
  /** สมาชิกที่ได้แต้มจากบิลนี้ (null = ลูกค้าทั่วไป) */
  member: { name: string; points: number } | null;
}

/** ผลค้นสมาชิกล่าสุด — idle = ยังไม่ค้น · many = เบอร์ซ้ำหลายบัญชี ให้เลือก */
export type MemberLookup =
  | { state: "idle" }
  | { state: "notFound"; phone: string }
  | { state: "many"; members: PosMember[] }
  | { state: "error"; message: string };

/** เบอร์ไทย 10 หลักขึ้นต้น 0 (ตัดขีด/ช่องว่างแล้ว) — ตรงกับที่ backend ตรวจ */
const MEMBER_PHONE = /^0\d{9}$/;
const normalizePhone = (v: string) => v.replace(/[\s-]/g, "");

/** ยอดที่ backend คิดไม่ตรงกับยอดที่แคชเชียร์รับเงินไว้ — หยุดก่อนรับเงิน */
class TotalMismatchError extends Error {
  constructor(readonly signature: string, readonly actual: number, readonly expected: number) {
    super("POS total mismatch");
  }
}

export function usePOSViewModel() {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const perm = usePermission("pos");

  const [cart, setCart] = useState<CartLine[]>([]);
  // ช่อง "สแกน / ค้นหา" — เก็บ "ข้อความดิบ" ตามปุ่มที่กดจริง แล้วแปลงแป้นไทย→QWERTY รอบเดียวตอนโชว์ (query) —
  // ห้ามเก็บค่าที่แปลงแล้วแล้วแปลงซ้ำ: "-"/"/" จะถูกตีความเป็นปุ่ม 3/2 ของแป้นไทยอีกรอบ (ดู nextRawInput)
  const [queryRaw, setQueryRaw] = useState("");
  /** โปรที่เลือก — หลายตัวได้เมื่อทุกตัว stackable (togglePromoSelection) */
  const [selectedPromoIds, setSelectedPromoIds] = useState<string[]>([]);
  /** บิลที่พักไว้ในเครื่องนี้ (localStorage — ฝั่ง server ว่าง) */
  const heldBills = useHeldBills();
  const [heldOpen, setHeldOpen] = useState(false);
  const [payDialog, setPayDialog] = useState<PayDialog>(null);
  /** "รับเงินมา" (เงินสด) — เก็บเป็นตัวเลขหลักแบบคีย์แพด */
  const [receivedDigits, setReceivedDigits] = useState("");
  const [done, setDone] = useState<PaymentDone | null>(null);
  /** หน้าต่างเลือกตัวเลือกของสินค้าที่กำลังจะลงบิล (BACKLOG3-merge I4) */
  const [picker, setPicker] = useState<{ product: Product; customization: ProductCustomization } | null>(null);
  /** กำลังดึงกลุ่มตัวเลือกของสินค้านี้ก่อนลงบิล */
  const [preparingId, setPreparingId] = useState<string | null>(null);
  // สมาชิกสะสมแต้ม — ช่องเบอร์ · ผลค้น · สมาชิกที่ผูกกับบิลนี้
  const [memberPhone, setMemberPhone] = useState("");
  const [memberLookup, setMemberLookup] = useState<MemberLookup>({ state: "idle" });
  const [member, setMember] = useState<PosMember | null>(null);
  /** ซื้อทุกกี่บาทได้ 1 แต้ม — มากับผลค้นสมาชิก (backend เป็นเจ้าของกติกา) */
  const [bahtPerPoint, setBahtPerPoint] = useState<number | null>(null);

  const catalogQ = useQuery({
    // ขึ้นต้นด้วย "products" — ขายเสร็จ invalidate ["products"] แล้วสต็อกในคำแนะนำรีเฟรชตาม
    queryKey: ["products", "pos", CATALOG_PARAMS],
    queryFn: () => posService.listProducts(CATALOG_PARAMS),
  });
  // backend ให้อ่านรายการโปรโมชันด้วยสิทธิ์ pos.view (หรือ promotions.view) — คนที่เปิด POS ได้เห็นโปรเสมอ
  const promotionsQ = useQuery({
    queryKey: ["promotions", PROMO_PARAMS],
    queryFn: () => promotionsService.list(PROMO_PARAMS),
    enabled: perm.view,
    retry: false,
  });
  // บัญชี "ลูกค้าทั่วไป" ตายตัว — หา id ครั้งเดียวตอนเปิดหน้า (cache ยาว ไม่มีวันเปลี่ยน)
  // ใช้ /admin/pos/guest-customer (orders.view) — พนักงานเคาน์เตอร์ไม่ต้องมีสิทธิ์ employees (Final-Backlog P3)
  const guestQ = useQuery({
    queryKey: ["pos", "guest-customer"],
    queryFn: () => posService.guestCustomer(),
    staleTime: Infinity,
    retry: false,
  });
  const guestUserId = guestQ.data?._id ?? null;
  // หัวใบเสร็จ (ชื่อร้าน/ที่อยู่/เบอร์) — endpoint สาธารณะ ไม่ต้องมีสิทธิ์ store_info · โหลดไม่ได้ = ใบเสร็จไม่มีหัวร้าน
  const storeQ = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000, retry: false });

  const catalog = useMemo<PosProduct[]>(() => catalogQ.data?.data ?? [], [catalogQ.data]);
  const promotions = useMemo(() => posPromotions(promotionsQ.data?.data ?? []), [promotionsQ.data]);
  const promotionsEnabled = perm.view && !promotionsQ.isError;

  const promosOf = (productId: string, categoryId: string | null): Promotion[] =>
    promotionEnabledList(promotionsEnabled, promotionsForProduct(promotions, productId, categoryId));

  // ── ข้อความในช่อง: พิมพ์ชื่อสินค้าภาษาไทย หรือ สแกน/พิมพ์รหัสตอนแป้นเป็นภาษาไทย ──
  // เครื่องสแกนส่ง "ตำแหน่งปุ่ม" → ตอนแป้นไทยรหัสกลายเป็นอักษรไทย ต้องแปลงกลับเป็น QWERTY (code)
  // แต่คนพิมพ์ชื่อสินค้าภาษาไทยตั้งใจพิมพ์ไทย — ถ้าข้อความดิบตรงกับชื่อสินค้าในรายการ = ค้นหาด้วยชื่อ (โชว์ตามที่พิมพ์)
  // ไม่ตรงชื่อไหนเลย = ถือเป็นรหัส (โชว์แบบแปลงแล้วเหมือนเดิม) · ข้อความไม่มีอักษรไทย ทั้งสองแบบเหมือนกัน
  const queryCode = thaiLayoutToQwerty(queryRaw);
  const nameTerm = queryRaw.trim().toLowerCase();
  const codeTerm = queryCode.trim().toLowerCase();
  const nameHits = useMemo(
    () => (nameTerm ? catalog.filter((p) => p.product_name_th.toLowerCase().includes(nameTerm)) : []),
    [catalog, nameTerm],
  );
  const searchingByName = nameHits.length > 0;
  const query = searchingByName ? queryRaw : queryCode;

  // ── คำแนะนำใต้ช่อง "สแกน / ค้นหา" — ตามชื่อ (ข้อความที่พิมพ์) หรือรหัส/ชื่ออังกฤษ (ข้อความที่แปลงแล้ว) ──
  const suggestions = useMemo(() => {
    if (!codeTerm) return [];
    if (searchingByName) return nameHits.slice(0, MAX_SUGGESTIONS);
    return catalog
      .filter((p) => (p.product_id ?? "").toLowerCase().includes(codeTerm) || p.product_name_th.toLowerCase().includes(codeTerm))
      .slice(0, MAX_SUGGESTIONS);
  }, [catalog, codeTerm, searchingByName, nameHits]);

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
   *  known = customization ที่ได้มากับผลสแกนแล้ว (ไม่ต้องถามซ้ำ)
   *  สินค้าจากรายการ POS ที่ has_customization = false → ลงบิลเลย ไม่ต้องยิง /pos/scan (Q-BE9) */
  const addProduct = async (p: Product | PosProduct, known?: ProductCustomization) => {
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
    const noOptions = "has_customization" in p && !p.has_customization;
    if (!customization && !noOptions) {
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
    const name = rawText.trim().toLowerCase();
    if (!code) return;
    const exact = catalog.find((p) => (p.product_id ?? "").toLowerCase() === code || p._id === code);
    // ชื่อภาษาไทยตามที่พิมพ์ (name) มาก่อน · ไม่ตรงชื่อไหน → รหัส/ชื่ออังกฤษจากข้อความที่แปลงแล้ว (code)
    const byName = catalog.filter((p) => p.product_name_th.toLowerCase().includes(name));
    const matches =
      byName.length > 0
        ? byName
        : catalog.filter((p) => (p.product_id ?? "").toLowerCase().includes(code) || p.product_name_th.toLowerCase().includes(code));
    const local = exact ?? (matches.length === 1 ? matches[0] : null);
    if (local) {
      void addProduct(local);
      setQueryRaw("");
      return;
    }
    // ชื่อตรงหลายรายการ = ให้เลือกจากคำแนะนำ (ไม่ส่งไป /admin/pos/scan — ชื่อไม่ใช่รหัส ส่งไปก็ไม่เจอ)
    if (byName.length > 1) return;
    scan.mutate(code);
  };

  // ── โปรโมชันกับบิลปัจจุบัน ──
  const subtotal = cartSubtotal(cart);
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);
  const promoEvals = useMemo(
    () => (promotionsEnabled ? evaluateAll(promotions, toPromoLines(cart), member != null) : []),
    [promotionsEnabled, promotions, cart, member],
  );
  const selectedEvals = selectedPromoIds
    .map((id) => promoEvals.find((e) => e.promotion._id === id))
    .filter((e): e is NonNullable<typeof e> => !!e);
  // เลือกไว้แต่บิลเปลี่ยนจนใช้ไม่ได้แล้ว (ลบสินค้า/ลดจำนวน/ถอดสมาชิก) → ไม่ใช้โปรนั้น + แจ้งในการ์ด
  const appliedPromos = selectedEvals.filter((e) => e.eligible);
  const bestPromo = promoEvals.find((e) => e.eligible) ?? null;
  const promoDiscount = Math.round(appliedPromos.reduce((s, e) => s + e.discount, 0) * 100) / 100;
  // ซ้อนโปรจนส่วนลดรวมเกินยอดบิล — backend ปฏิเสธ (400) จึงไม่ให้กดชำระ
  const discountExceeds = promoDiscount > subtotal;
  const discount = Math.min(promoDiscount, subtotal);
  const total = Math.max(subtotal - discount, 0);

  // ── สมาชิกสะสมแต้ม ──
  const findMember = useMutation({
    mutationFn: (phone: string) => posService.findMember(phone),
    onSuccess: (res, phone) => {
      setBahtPerPoint(res.baht_per_point);
      if (res.members.length === 1) {
        setMember(res.members[0]);
        setMemberLookup({ state: "idle" });
      } else if (res.members.length === 0) {
        setMemberLookup({ state: "notFound", phone });
      } else {
        setMemberLookup({ state: "many", members: res.members });
      }
    },
    onError: (e) => setMemberLookup({ state: "error", message: isApiError(e) ? e.message : t("pos.memberLookupFailed") }),
  });
  const submitMemberPhone = () => {
    const phone = normalizePhone(memberPhone);
    if (!MEMBER_PHONE.test(phone)) {
      setMemberLookup({ state: "error", message: t("pos.memberPhoneInvalid") });
      return;
    }
    findMember.mutate(phone);
  };
  const clearMember = () => {
    setMember(null);
    setMemberPhone("");
    setMemberLookup({ state: "idle" });
  };
  /** แต้มโดยประมาณจากบิลนี้ — backend ให้จริงจากยอดหลังหักส่วนลด (ปัดเศษทิ้ง) */
  const pointsFor = (amount: number) => (bahtPerPoint ? Math.floor(Math.max(amount, 0) / bahtPerPoint) : 0);

  // body ที่จะสร้างออเดอร์จากบิลนี้ — signature ใช้จับคู่ใบที่ค้างรับเงิน/ยอดจริงจาก backend กับบิลปัจจุบัน
  const buildInput = () =>
    buildOrderInput({ cart, userId: member?._id ?? guestUserId ?? "", discount: 0, promotionIds: appliedPromos.map((e) => e.promotion._id) });
  const billSignature = JSON.stringify(buildInput());

  // ยอดจริงจาก backend (order.total_amount) ของบิลนี้ เมื่อไม่ตรงกับที่หน้าจอคิด (ราคา/โปรเปลี่ยนหลังโหลดหน้า)
  // — ใช้แทน total ตอนรับเงิน · บิลเปลี่ยนแล้ว signature ไม่ตรง = กลับไปใช้ยอดที่หน้าจอคิด
  const [serverTotal, setServerTotal] = useState<{ signature: string; amount: number } | null>(null);
  const payable = serverTotal?.signature === billSignature ? serverTotal.amount : total;

  const received = Number(receivedDigits || "0");
  const receivedShort = received < payable;

  // ── ออเดอร์ที่สร้างแล้วแต่รับเงินไม่สำเร็จ (ขั้น 1 ผ่าน ขั้น 2 ล้ม เช่นเน็ตหลุด) ──
  // ออเดอร์นี้ตัดสต็อกไปแล้ว — กดยืนยันอีกครั้งต้องรับเงินใบเดิม ห้ามสร้างใบใหม่ (เดิมได้ออเดอร์ซ้ำ + ตัดสต็อกสองรอบ)
  // signature = body ที่ใช้สร้าง → บิลถูกแก้ระหว่างนั้น (สินค้า/โปร/สมาชิก) ใบเดิมไม่ตรงกับบิลแล้ว ยกเลิกทิ้งแล้วสร้างใหม่
  const pendingOrderRef = useRef<{ order: Order; signature: string } | null>(null);
  /** ทิ้งออเดอร์ที่ค้างรับเงิน — ยกเลิกที่ backend (คืนสต็อก) · ยกเลิกไม่ได้ (ไม่มีสิทธิ์ orders.update ฯลฯ) = บอกเลขออเดอร์ให้ไปยกเลิกเอง */
  const abandonPendingOrder = async () => {
    const pending = pendingOrderRef.current;
    pendingOrderRef.current = null;
    if (!pending) return;
    try {
      await ordersService.updateStatus(pending.order._id, "cancelled", t("pos.abandonedOrderReason"));
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch {
      alert.warning(t("pos.abandonedOrderCancelFailed", { no: pending.order.order_no }));
    }
  };

  const resetBill = () => {
    void abandonPendingOrder();
    setCart([]);
    setSelectedPromoIds([]);
    setReceivedDigits("");
    setQueryRaw("");
    setPicker(null);
    setServerTotal(null);
    clearMember();
  };

  const checkout = useMutation({
    mutationFn: async ({ method, received: cash, expected }: { method: PaymentMethod; received: number; expected: number }): Promise<PaymentDone> => {
      // ข้อความนี้ไม่โชว์ผู้ใช้ตรง ๆ (onError ใช้ t("pos.saveFailed") แทน) — ไว้ debug ใน console เท่านั้น
      const userId = member?._id ?? guestUserId;
      if (!userId) throw new Error("Guest customer account not found — run `npm run seed` on the backend");

      // 1) สร้างออเดอร์ — backend ตัดสต็อก + คำนวณ subtotal/ส่วนลดโปรโมชัน/total_amount ให้เองทั้งหมด
      //    มีใบที่สร้างค้างไว้จากรอบก่อน (รับเงินไม่สำเร็จ) และบิลยังเหมือนเดิม → ใช้ใบเดิม
      const input = buildInput();
      const signature = JSON.stringify(input);
      if (pendingOrderRef.current && pendingOrderRef.current.signature !== signature) await abandonPendingOrder();
      const order = pendingOrderRef.current?.order ?? (await ordersService.create(input)).data;
      pendingOrderRef.current = { order, signature };

      // ยอดจริงไม่ตรงกับยอดที่แคชเชียร์รับเงิน/แสดง QR ไว้ → หยุดก่อนรับเงิน (ใบยังค้างไว้ กดอีกครั้งใช้ใบเดิม)
      // เดิมรับเงินผ่านไปเลย — ยอดจริงสูงกว่า = เงินขาดโดยไม่มีใครรู้ (เงินทอนถูกปัดเป็น 0)
      if (Math.abs(order.total_amount - expected) >= 0.01) throw new TotalMismatchError(signature, order.total_amount, expected);

      // 2) รับเงิน + ปิดงานในคำขอเดียว (เงินสด/QR ที่เคาน์เตอร์ = จ่ายจริงแล้ว) — ยอดใช้ order.total_amount ของ backend
      try {
        await posService.checkout(order._id);
      } catch (e) {
        // รอบก่อนรับเงินสำเร็จแล้วแต่คำตอบหาย → ยิงซ้ำได้ 409 "ชำระเงินแล้ว" — ดูสถานะจริงก่อนตัดสินว่าล้ม
        const fresh = await ordersService.get(order._id).catch(() => null);
        if (fresh?.data.payment_status !== "paid") throw e;
      }
      pendingOrderRef.current = null;

      const paid = method === "cash" ? cash : order.total_amount;
      return {
        orderNo: order.order_no,
        paidAt: new Date().toISOString(),
        lines: cart.map((c) => ({
          name: c.name,
          detail:
            [c.variantLabel, ...c.options.map((o) => (o.text_value ? `${o.option_name}: ${o.text_value}` : o.option_name))]
              .filter(Boolean)
              .join(" · ") || null,
          qty: c.qty,
          price: c.price,
        })),
        subtotal: order.subtotal,
        promotions: appliedPromos.map((e) => e.promotion.promotion_name),
        method,
        total: order.total_amount,
        discount: order.discount_amount ?? 0,
        received: paid,
        change: Math.max(paid - order.total_amount, 0),
        member: member ? { name: member.user_fullname, points: pointsFor(order.total_amount) } : null,
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
    onError: (e) => {
      if (e instanceof TotalMismatchError) {
        setServerTotal({ signature: e.signature, amount: e.actual });
        alert.warning(t("pos.totalChanged", { total: formatCurrency(e.actual, locale), shown: formatCurrency(e.expected, locale) }));
        return;
      }
      const reason = isApiError(e) ? e.message : t("pos.saveFailed");
      const pending = pendingOrderRef.current;
      // สร้างออเดอร์แล้วแต่รับเงินไม่สำเร็จ — บอกว่ากดอีกครั้งได้โดยไม่สร้างออเดอร์ซ้ำ
      if (pending) alert.error(t("pos.paymentPendingRetry", { no: pending.order.order_no, reason }));
      else alert.error(reason);
    },
  });

  // ── คีย์แพด "รับเงินมา" ──
  const pressKey = (k: string) => {
    if (k === "back") setReceivedDigits((v) => v.slice(0, -1));
    else setReceivedDigits((v) => (v.length >= MAX_RECEIVED_DIGITS ? v : (v === "0" ? "" : v) + k));
  };
  const confirmCash = () => {
    if (receivedShort || checkout.isPending) return;
    checkout.mutate({ method: "cash", received, expected: payable });
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

  const canPay = perm.create && cart.length > 0 && !checkout.isPending && !discountExceeds;

  // ── พักบิล ──
  const persistHeld = (bills: HeldBill[]) => {
    if (saveHeldBills(bills)) return true;
    alert.error(t("pos.holdSaveFailed"));
    return false;
  };
  const snapshotBill = (): HeldBill => ({
    id: newHeldBillId(),
    heldAt: new Date().toISOString(),
    cart,
    member,
    bahtPerPoint,
    promoIds: selectedPromoIds,
  });
  const holdBill = () => {
    if (cart.length === 0) return;
    if (heldBills.length >= MAX_HELD_BILLS) {
      alert.warning(t("pos.holdLimit", { n: MAX_HELD_BILLS }));
      return;
    }
    // ไม่เด้งแจ้งสำเร็จ — บิลว่างลง + ตัวนับ "บิลที่พักไว้" เพิ่มให้เห็นอยู่แล้ว (ไม่ต้องกดปิด popup ระหว่างคิวลูกค้า)
    if (persistHeld([snapshotBill(), ...heldBills])) resetBill();
  };
  const resumeBill = async (bill: HeldBill) => {
    const rest = heldBills.filter((b) => b.id !== bill.id);
    // บิลปัจจุบันมีของอยู่ → ถามก่อน แล้วพักบิลปัจจุบันแทนที่ (สลับกัน ไม่ทิ้งของในบิลไหน)
    if (cart.length > 0) {
      const ok = await confirmAlert(t("pos.resumeSwapConfirm"), { title: t("pos.resumeBill") });
      if (!ok) return;
      if (!persistHeld([snapshotBill(), ...rest])) return;
    } else if (!persistHeld(rest)) {
      return;
    }
    resetBill();
    setCart(bill.cart);
    setMember(bill.member);
    setBahtPerPoint(bill.bahtPerPoint);
    setSelectedPromoIds(bill.promoIds);
    setHeldOpen(false);
  };
  const deleteHeldBill = async (bill: HeldBill) => {
    const ok = await confirmAlert(t("pos.deleteHeldConfirm"), { title: t("pos.deleteHeld"), danger: true });
    if (ok) persistHeld(heldBills.filter((b) => b.id !== bill.id));
  };

  return {
    perm,
    isCatalogError: catalogQ.isError,
    refetchCatalog: () => catalogQ.refetch(),

    // ช่อง "สแกน / ค้นหา" (controlled) — onChange ได้ค่าแปลงแล้ว + ตัวใหม่ดิบ → ต่อเข้าข้อความดิบเดิม
    query,
    // nextRawInput ต้องได้ "ข้อความที่โชว์อยู่" — ตอนค้นชื่อโชว์ข้อความดิบ (แปลง 1:1 แบบไม่เปลี่ยน) ตอนรหัสโชว์แบบแปลงแล้ว
    setQuery: (v: string) => setQueryRaw((raw) => nextRawInput(raw, query, v)),
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
    /** ยอดที่ต้องรับจริง — ปกติ = total · ต่างเมื่อ backend คิดยอดบิลนี้ไม่ตรง (ดู serverTotal) */
    payable,
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

    // โปรโมชัน — ซ้อนได้เมื่อทุกตัวตั้ง stackable (backend รับ promotion_ids)
    promotionsEnabled,
    promoEvals,
    billPromotions: promotions.filter((p) => !isScoped(p)),
    bestPromoId: bestPromo?.promotion._id ?? null,
    selectedPromoIds,
    selectedPromoInvalid: selectedEvals.length < selectedPromoIds.length || selectedEvals.some((e) => !e.eligible),
    discountExceeds,
    togglePromo: (id: string) => {
      const promo = promotions.find((p) => p._id === id);
      if (promo) setSelectedPromoIds((cur) => togglePromoSelection(cur, promo, promotions));
    },

    // พักบิล
    heldBills,
    heldOpen,
    openHeld: () => setHeldOpen(true),
    closeHeld: () => setHeldOpen(false),
    holdBill,
    resumeBill,
    deleteHeldBill,

    // สมาชิกสะสมแต้ม
    memberPhone,
    setMemberPhone: (v: string) => { setMemberPhone(v); if (memberLookup.state !== "idle") setMemberLookup({ state: "idle" }); },
    submitMemberPhone,
    memberSearching: findMember.isPending,
    memberLookup,
    member,
    pickMember: (m: PosMember) => { setMember(m); setMemberLookup({ state: "idle" }); },
    clearMember,
    memberPoints: pointsFor(payable),

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
    confirmQr: () => checkout.mutate({ method: "qr", received: payable, expected: payable }),
    submitting: checkout.isPending,
    done,
    store: storeQ.data ?? null,
  };
}

/** ไม่มีสิทธิ์ดูโปรโมชัน → ไม่ติดป้าย/แจ้งเตือนโปรของสินค้า */
function promotionEnabledList(enabled: boolean, list: Promotion[]): Promotion[] {
  return enabled ? list : [];
}
