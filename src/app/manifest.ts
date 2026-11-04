import type { MetadataRoute } from "next";

// Web App Manifest — iPhone/iPad รับแจ้งเตือนบนเครื่องได้เมื่อเพิ่มเว็บลงหน้าจอโฮม (iOS 16.4+) และเปิดจากไอคอนนั้น
// start_url = หน้าร้าน · display standalone = เปิดเหมือนแอป
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MeowMee Cake",
    short_name: "MeowMee",
    start_url: "/customer",
    scope: "/",
    display: "standalone",
    background_color: "#FAF6F0",
    theme_color: "#4A342E",
    icons: [{ src: "/pictures/logoMoewMeeCake.png", sizes: "200x200", type: "image/png", purpose: "any" }],
  };
}
