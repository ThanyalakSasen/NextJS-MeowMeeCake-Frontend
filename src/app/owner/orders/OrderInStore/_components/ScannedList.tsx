"use client";
// รายการสินค้าที่สแกน/เพิ่มแล้ว (ฝั่งซ้ายของ POS — แทนกริดเมนูสินค้าเดิม) — แก้จำนวน/ลบ + ป้ายโปรโมชันของสินค้า
import { useTranslations, useLocale } from "next-intl";
import { ShoppingCartIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, InputNumber, Tag } from "@/components/base";
import { DataTable, type Column } from "@/components/shared/data";
import { formatCurrency } from "@/i18n/format";
import type { Promotion } from "@/types/promotion";
import type { CartLine } from "../posCart";

export function ScannedList({
  cart,
  itemCount,
  promosOf,
  onChangeQty,
  onRemove,
  onClear,
}: {
  cart: CartLine[];
  itemCount: number;
  promosOf: (productId: string, categoryId: string | null) => Promotion[];
  onChangeQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const columns: Column<CartLine>[] = [
    {
      key: "name",
      title: t("pos.colProduct"),
      render: (c) => {
        const promos = promosOf(c.productId, c.categoryId);
        return (
          <div className="min-w-0">
            <p className="font-medium text-brown-800">{c.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {c.code && <span className="font-mono text-xs text-gray-500">{c.code}</span>}
              {promos.map((p) => (
                <Tag key={p._id} color="magenta" className="!m-0" title={p.promotion_desc ?? undefined}>
                  {t("pos.promoTag", { name: p.promotion_name })}
                </Tag>
              ))}
            </div>
          </div>
        );
      },
    },
    { key: "price", title: t("pos.colPrice"), align: "right", render: (c) => formatCurrency(c.price, locale) },
    {
      key: "qty",
      title: t("pos.colQty"),
      align: "center",
      render: (c) => (
        <InputNumber
          size="small"
          min={1}
          max={c.stock}
          precision={0}
          value={c.qty}
          onChange={(v) => onChangeQty(c.productId, Number(v) || 1)}
          style={{ width: 72 }}
          aria-label={t("pos.colQty")}
        />
      ),
    },
    {
      key: "total",
      title: t("pos.colTotal"),
      align: "right",
      render: (c) => <span className="font-semibold text-gray-800">{formatCurrency(c.price * c.qty, locale)}</span>,
    },
  ];

  return (
    <section className="section-card">
      <div className="section-card-header">
        <span className="section-card-title flex items-center gap-2">
          <ShoppingCartIcon className="h-5 w-5 text-gray-500" />
          {t("pos.scannedTitle")}
          {itemCount > 0 && <span className="badge badge-info">{t("pos.itemCount", { n: itemCount })}</span>}
        </span>
        {cart.length > 0 && (
          <button type="button" className="section-card-link" onClick={onClear}>
            {t("pos.clearCart")}
          </button>
        )}
      </div>
      <DataTable
        inCard
        columns={columns}
        rows={cart}
        rowKey={(c) => c.productId}
        emptyText={t("pos.scannedEmpty")}
        actions={(c) => (
          <Button
            size="small"
            type="text"
            danger
            aria-label={t("common.delete")}
            icon={<TrashIcon className="h-4 w-4" />}
            onClick={() => onRemove(c.productId)}
          />
        )}
      />
    </section>
  );
}
