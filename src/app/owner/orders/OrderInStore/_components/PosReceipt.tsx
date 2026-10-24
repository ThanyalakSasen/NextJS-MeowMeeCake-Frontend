"use client";
// ใบเสร็จหน้าร้าน — ซ่อนบนจอ แสดงเฉพาะตอนสั่งพิมพ์ (window.print) · ขนาดกระดาษเครื่องพิมพ์ใบเสร็จ 80 มม.
// render ผ่าน portal ไปที่ <body> โดยตรง: ตอนพิมพ์ซ่อนทุกอย่างในหน้า (รวมหน้าต่างชำระสำเร็จ) เหลือแค่ใบเสร็จนี้
// ตัวเลขทั้งหมดมาจาก PaymentDone (ยอดจริงของ backend) — ไม่คิดใหม่ฝั่งนี้
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency, formatDate } from "@/i18n/format";
import type { StoreInfo } from "@/services/storeInfo";
import type { PaymentDone } from "../usePOSViewModel";

export const RECEIPT_ID = "pos-receipt";

const PRINT_CSS = `
#${RECEIPT_ID} { display: none; }
@media print {
  @page { size: 80mm auto; margin: 4mm; }
  body > *:not(#${RECEIPT_ID}) { display: none !important; }
  #${RECEIPT_ID} { display: block; width: 72mm; color: #000; font-size: 12px; line-height: 1.4; }
}
`;

export function PosReceipt({ done, store }: { done: PaymentDone; store: StoreInfo | null }) {
  const t = useTranslations();
  const locale = useLocale();
  const money = (n: number) => formatCurrency(n, locale);
  const address = store
    ? [store.address.house_no, store.address.sub_district, store.address.district, store.address.province, store.address.zip_code]
        .filter(Boolean)
        .join(" ")
    : "";

  const row = (label: string, value: string, bold = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: bold ? 700 : 400 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
  const rule = <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />;

  return createPortal(
    <div id={RECEIPT_ID} aria-hidden="true">
      <style>{PRINT_CSS}</style>
      <div style={{ textAlign: "center" }}>
        {store?.store_name && <div style={{ fontSize: 15, fontWeight: 700 }}>{store.store_name}</div>}
        {address && <div>{address}</div>}
        {store?.phones?.length ? <div>{t("pos.receiptPhone", { phone: store.phones.join(", ") })}</div> : null}
        <div style={{ fontWeight: 700, marginTop: 4 }}>{t("pos.receiptTitle")}</div>
      </div>
      {rule}
      {row(t("pos.orderNo"), done.orderNo)}
      {row(t("pos.receiptDate"), formatDate(done.paidAt, locale, { withTime: true }))}
      {done.member && row(t("pos.memberLabel"), done.member.name)}
      {rule}
      {done.lines.map((l, i) => (
        <div key={i} style={{ marginBottom: 2 }}>
          <div>{l.name}</div>
          {l.detail && <div style={{ paddingLeft: 8 }}>{l.detail}</div>}
          {row(`  ${l.qty} × ${money(l.price)}`, money(l.qty * l.price))}
        </div>
      ))}
      {rule}
      {row(t("pos.subtotal"), money(done.subtotal))}
      {done.promotions.map((name) => (
        <div key={name} style={{ paddingLeft: 8 }}>{t("pos.receiptPromo", { name })}</div>
      ))}
      {done.discount > 0 && row(t("pos.promoDiscount"), `−${money(done.discount)}`)}
      {row(t("pos.payable"), money(done.total), true)}
      {row(t("pos.payMethod"), done.method === "cash" ? t("pos.cash") : t("pos.qr"))}
      {done.method === "cash" && row(t("pos.cashReceived"), money(done.received))}
      {done.method === "cash" && row(t("pos.cashChange"), money(done.change))}
      {done.member && row(t("pos.memberPointsEarned"), t("pos.memberPointsValue", { n: done.member.points }))}
      {rule}
      <div style={{ textAlign: "center" }}>{t("pos.receiptThanks")}</div>
    </div>,
    document.body,
  );
}
