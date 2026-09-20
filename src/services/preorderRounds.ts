// ─────────────────────────────────────────────────────────────
// src/services/preorderRounds.ts — เรียก /admin/preorder-rounds* + /admin/preorder-round-items/[id]
// (preorderRoundModel/preorderRoundItemModel จริงฝั่ง backend) — backend populate product_id เป็น
// object เต็มตอน get/listItems — แปลงเป็น product_name/product_img ที่นี่จุดเดียว (แพทเทิร์นเดียวกับ
// services/orders.ts toOrder())
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse, EmptyResponse } from "@/types/api";
import type {
  PreorderRound, PreorderRoundItem, CreateRoundInput, UpdateRoundInput,
  RoundItemInput, UpdateRoundItemInput, RoundListParams,
} from "@/types/preorderRound";
import { refId } from "@/lib/refId";

const ROUNDS_BASE = "/admin/preorder-rounds";
const ROUND_ITEMS_BASE = "/admin/preorder-round-items";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toRoundItem(raw: any): PreorderRoundItem {
  const product = typeof raw.product_id === "string" ? null : raw.product_id;
  return {
    _id: raw._id,
    round_id: raw.round_id,
    product_id: refId(raw.product_id),
    product_name: product?.product_name_th ?? "",
    product_img: product?.product_img,
    price_override: raw.price_override ?? null,
    min_order_qty: raw.min_order_qty,
    max_qty_total: raw.max_qty_total,
    current_qty: raw.current_qty,
    is_active: raw.is_active,
    current_price: raw.current_price,
    remaining_qty: raw.remaining_qty,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function toRound(raw: any): PreorderRound {
  return {
    _id: raw._id,
    round_name: raw.round_name,
    open_date: raw.open_date,
    close_date: raw.close_date,
    pickup_date: raw.pickup_date,
    round_status: raw.round_status,
    created_by: refId(raw.created_by),
    item_count: raw.item_count,
    items: Array.isArray(raw.items) ? raw.items.map(toRoundItem) : undefined,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export const preorderRoundsService = {
  list: async (params: RoundListParams = {}) => {
    const res = await http.getList<any>(ROUNDS_BASE, { params });
    return { ...res, data: res.data.map(toRound) };
  },

  get: async (id: string) => {
    const res = await http.get<ItemResponse<any>>(`${ROUNDS_BASE}/${id}`);
    return { data: toRound(res.data) };
  },

  create: async (body: CreateRoundInput) => {
    const res = await http.post<ItemResponse<any>>(ROUNDS_BASE, body);
    return { data: toRound(res.data) };
  },

  update: async (id: string, body: UpdateRoundInput) => {
    const res = await http.patch<ItemResponse<any>>(`${ROUNDS_BASE}/${id}`, body);
    return { data: toRound(res.data) };
  },

  updateStatus: async (id: string, round_status: string) => {
    const res = await http.patch<ItemResponse<any>>(`${ROUNDS_BASE}/${id}/status`, { round_status });
    return { data: toRound(res.data) };
  },

  remove: (id: string) => http.delete<EmptyResponse>(`${ROUNDS_BASE}/${id}`),

  listItems: async (roundId: string) => {
    const res = await http.getList<any>(`${ROUNDS_BASE}/${roundId}/items`);
    return { ...res, data: res.data.map(toRoundItem) };
  },

  addItem: async (roundId: string, body: RoundItemInput) => {
    const res = await http.post<ItemResponse<any>>(`${ROUNDS_BASE}/${roundId}/items`, body);
    return { data: toRoundItem(res.data) };
  },

  updateItem: async (itemId: string, body: UpdateRoundItemInput) => {
    const res = await http.patch<ItemResponse<any>>(`${ROUND_ITEMS_BASE}/${itemId}`, body);
    return { data: toRoundItem(res.data) };
  },

  removeItem: (itemId: string) => http.delete<EmptyResponse>(`${ROUND_ITEMS_BASE}/${itemId}`),
};
