// Service worker ของหน้าร้าน — แจ้งเตือนบนเครื่อง (Web Push) อย่างเดียว ไม่แคชหน้าเว็บ (ไม่มี fetch handler)
// backend (pushService) ส่ง JSON { title, body, url, tag } → แสดงเป็นแจ้งเตือนของระบบ (แบบข้อความ SMS)
// กดแจ้งเตือน → เปิดแท็บเว็บเดิมที่ค้างอยู่แล้วพาไปหน้า url · ไม่มีแท็บเปิดอยู่ = เปิดหน้าต่างใหม่

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

const ICON = "/pictures/logoMoewMeeCake.png";

/** path ภายในเว็บเท่านั้น ("/…" ไม่ใช่ "//…") — กันพาออกไปเว็บอื่น */
function safePath(url) {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/customer/account/notifications";
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "MeowMee Cake";
  const options = {
    body: data.body || "",
    icon: ICON,
    badge: ICON,
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: safePath(data.url) },
  };
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // แท็บที่เปิดอยู่ → ให้กระดิ่งโหลดใหม่ทันที (ไม่ต้องรอรอบ 60 วิ)
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) =>
        list.forEach((c) => c.postMessage({ type: "push-notification" }))
      ),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(safePath(event.notification.data && event.notification.data.url), self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (list) => {
      const same = list.find((c) => new URL(c.url).origin === self.location.origin);
      if (same) {
        await same.focus();
        if ("navigate" in same) return same.navigate(target).catch(() => self.clients.openWindow(target));
      }
      return self.clients.openWindow(target);
    })
  );
});
