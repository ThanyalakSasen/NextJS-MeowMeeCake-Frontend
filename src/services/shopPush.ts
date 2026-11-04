// ─────────────────────────────────────────────────────────────
// src/services/shopPush.ts — แจ้งเตือนบนเครื่องของลูกค้า (/shop/push · Web Push)
// backend pushService: GET = ตั้ง VAPID key แล้วหรือยัง + public key · POST = เปิดบนเครื่องนี้ · DELETE = ปิด
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";

export interface PushConfig {
  enabled: boolean;
  public_key: string | null;
}

export const shopPushService = {
  config: async (): Promise<PushConfig> => (await http.get<ItemResponse<PushConfig>>("/shop/push")).data,
  /** body = PushSubscription.toJSON() */
  subscribe: (sub: PushSubscriptionJSON) => http.post("/shop/push", { endpoint: sub.endpoint, keys: sub.keys }),
  unsubscribe: (endpoint: string) => http.delete("/shop/push", { data: { endpoint } }),
};
