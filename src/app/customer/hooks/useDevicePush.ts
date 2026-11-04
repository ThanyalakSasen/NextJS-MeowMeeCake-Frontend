"use client";
// ─────────────────────────────────────────────────────────────
// useDevicePush — เปิด/ปิดแจ้งเตือนบนเครื่อง (Web Push) ของลูกค้าที่ล็อกอินอยู่
// ขั้นตอน: ลงทะเบียน /sw.js → ขอสิทธิ์ (ต้องมาจากการกดปุ่ม) → subscribe ด้วย public key ของ backend → ส่งให้ backend เก็บ
// เปิดไว้แล้ว (สิทธิ์ granted) = ส่ง subscription ให้ backend ซ้ำตอนเข้าเว็บ (สลับบัญชีบนเครื่องเดียวกัน/ปลายทางเปลี่ยน)
// iPhone/iPad: ใช้ได้เฉพาะเว็บที่เพิ่มลงหน้าจอโฮมแล้วเปิดจากไอคอน (iOS 16.4+) → state "ios-install"
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { shopPushService } from "@/services/shopPush";
import { shopNotificationsKey } from "../lib/shopQueries";

export type DevicePushState =
  | "loading"
  | "unavailable" // เบราว์เซอร์ไม่รองรับ / backend ยังไม่ตั้ง key
  | "ios-install" // iPhone ที่ยังไม่ได้เพิ่มลงหน้าจอโฮม
  | "denied" // ผู้ใช้บล็อกสิทธิ์ไว้ — ต้องเปิดเองในการตั้งค่าเบราว์เซอร์
  | "off"
  | "on";

const SW_URL = "/sw.js";

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function supported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration(SW_URL);
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export function useDevicePush() {
  const qc = useQueryClient();
  const { status } = useCustomerSession();
  const authed = status === "authenticated";
  const [state, setState] = useState<DevicePushState>("loading");
  const [busy, setBusy] = useState(false);

  const configQ = useQuery({
    queryKey: ["shop", "push", "config"],
    queryFn: shopPushService.config,
    enabled: authed,
    staleTime: Infinity,
    retry: false,
  });
  const publicKey = configQ.data?.enabled ? configQ.data.public_key : null;

  // สถานะเริ่มต้น + ส่ง subscription เดิมให้ backend ซ้ำ (เป็นของบัญชีที่ล็อกอินอยู่)
  useEffect(() => {
    if (!authed || configQ.isLoading) return;
    let cancelled = false;
    const done = (s: DevicePushState) => !cancelled && setState(s);
    (async () => {
      if (!supported()) return done(isIos() && !isStandalone() ? "ios-install" : "unavailable");
      if (!publicKey) return done("unavailable");
      if (Notification.permission === "denied") return done("denied");
      const sub = Notification.permission === "granted" ? await currentSubscription().catch(() => null) : null;
      if (sub) await shopPushService.subscribe(sub.toJSON()).catch(() => undefined);
      done(sub ? "on" : "off");
    })();
    return () => {
      cancelled = true;
    };
  }, [authed, configQ.isLoading, publicKey]);

  // แจ้งเตือนเข้าขณะเปิดเว็บอยู่ → กระดิ่งโหลดใหม่ทันที
  useEffect(() => {
    if (!supported()) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "push-notification") void qc.invalidateQueries({ queryKey: shopNotificationsKey });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [qc]);

  /** เรียกจากการกดปุ่มเท่านั้น (เบราว์เซอร์ขอสิทธิ์ได้เฉพาะตอนผู้ใช้กด) · คืน false = ไม่ได้เปิด */
  const enable = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !supported()) return false;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return false;
      }
      const reg = await navigator.serviceWorker.register(SW_URL);
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      await shopPushService.subscribe(sub.toJSON());
      setState("on");
      return true;
    } catch {
      setState("off");
      return false;
    } finally {
      setBusy(false);
    }
  }, [publicKey]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const sub = await currentSubscription();
      if (sub) {
        await shopPushService.unsubscribe(sub.endpoint).catch(() => undefined);
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }, []);

  return { state: authed ? state : "unavailable", busy, enable, disable };
}
