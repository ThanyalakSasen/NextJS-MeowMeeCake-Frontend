"use client";
// ─────────────────────────────────────────────────────────────
// AntdProviders — theme/locale ของ antd + dayjs locale · ใช้เฉพาะส่วนที่ใช้ antd จริง
// (หลังร้าน · /profile · บัญชีลูกค้า · กล่อง alert แบบโหลดตามต้องการ)
// เดิมอยู่ใน providers.tsx ที่ครอบทุกหน้า → หน้าร้านสาธารณะ (Tailwind ล้วน) โหลด antd ~180 KB (gzip) ทุกหน้า
// ทำให้ Lighthouse Performance หน้าร้านต่ำ (JS เยอะ → LCP/TBT จำลองบนมือถือช้า)
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ConfigProvider } from "antd";
import { StyleProvider, createCache, extractStyle } from "@ant-design/cssinjs";
import thTH from "antd/locale/th_TH";
import enUS from "antd/locale/en_US";
import { useLocale } from "next-intl";
import dayjs from "dayjs";
import "dayjs/locale/th";
import "dayjs/locale/en";
import { antdTheme } from "@/theme";

// ตั้ง dayjs locale เริ่มต้นตรงนี้ (ก่อนคอมโพเนนต์ใน tree เรนเดอร์) กัน DatePicker/Calendar
// แสดงเดือน/วันเป็นภาษาผิดหลุดมาแวบหนึ่งตอนโหลดหน้าครั้งแรก — ค่าจริงถูกซิงก์กับ i18n ใน useEffect ด้านล่าง
dayjs.locale("th");

/** class ที่ @ant-design/cssinjs ใช้เก็บแผนที่สไตล์ที่ render ฝั่ง server แล้ว (ATTR_CACHE_MAP ใน util/cacheMapUtil) */
const CACHE_MAP_CLASS = "data-ant-cssinjs-cache-path";
const CACHE_MAP_RULE = /\.data-ant-cssinjs-cache-path\{content:"([^"]*)";\}/;

// antd ThemeConfig มาจาก theme system ของโปรเจกต์ — แก้ token ที่ src/theme/tokens.ts (ดู docs/THEME.md)
export function AntdProviders({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  // ดึง CSS ของ antd ที่สร้างระหว่าง render ฝั่ง server ใส่ลง HTML (แบบ @ant-design/nextjs-registry)
  // ไม่งั้นคอมโพเนนต์ antd ที่ render ฝั่ง server จะไม่มีสไตล์จนกว่า JS ทำงาน → หน้ากระโดด (CLS)
  // once: ส่งเฉพาะสไตล์ที่ยังไม่เคยส่ง (render แบบ streaming เรียกหลายรอบ)
  const [cache] = useState(() => createCache());
  const [cachePaths] = useState<string[]>(() => []);
  useServerInsertedHTML(() => {
    // แผนที่ "สไตล์ไหนส่งมากับ HTML แล้ว" (กฎ .data-ant-cssinjs-cache-path{content:"…"}) — browser อ่านด้วย getComputedStyle
    // = กฎตัวท้ายสุดชนะ · extractStyle แบบ once ให้แผนที่เฉพาะของรอบนั้น รอบหลัง ๆ เป็น "" จึงทับรอบแรกจนว่าง →
    // antd ฝั่ง browser คิดว่าไม่มีสไตล์จาก server เลย สร้าง CSS ใหม่ทุกคอมโพเนนต์ตอน hydrate (TBT มือถือ)
    // แก้: ตัดกฎของแต่ละรอบออก แล้วใส่กฎที่รวมแผนที่ทุกรอบไว้ท้ายเสมอ
    let css = extractStyle(cache, { plain: true, once: true });
    const map = css.match(CACHE_MAP_RULE)?.[1];
    css = css.replace(CACHE_MAP_RULE, "");
    if (map) cachePaths.push(map);
    if (!css && !map) return null;
    css += `.${CACHE_MAP_CLASS}{content:"${cachePaths.join(";")}";}`;
    return <style id="antd-ssr" dangerouslySetInnerHTML={{ __html: css }} />;
  });

  // ซิงก์ dayjs กับภาษาที่ผู้ใช้เลือก (i18n) — กระทบ DatePicker/Calendar/relativeTime
  useEffect(() => {
    dayjs.locale(locale === "en" ? "en" : "th");
  }, [locale]);

  return (
    // layer: style ของ antd อยู่ใน @layer antd — class Tailwind ชนะได้ (ลำดับ layer ประกาศใน globals.css · BACKLOG4 V9)
    <StyleProvider cache={cache} layer>
      {/* locale ของ antd (ชื่อเดือน/วัน, ปุ่ม "วันนี้"/"ตกลง", ข้อความแบ่งหน้า ฯลฯ) ตามภาษาที่เลือก */}
      {/* ไม่ครอบ antd <App> — ไม่มีที่ไหนใช้ App.useApp (popup ใช้ AlertHost ของแอปเอง) แต่ <App> ดึง modal/form/message/
          notification ติดมาทุกหน้าหลังร้าน (~35 KB gzip ก่อนหน้าแรกขึ้น · Lighthouse มือถือ LCP) · สไตล์ฐานของ .ant-app
          (สี/ขนาด/บรรทัด/ฟอนต์) ตรงกับ body ใน globals.css อยู่แล้ว */}
      <ConfigProvider theme={antdTheme} locale={locale === "en" ? enUS : thTH}>
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
