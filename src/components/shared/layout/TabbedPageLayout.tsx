"use client";
// ─────────────────────────────────────────────────────────────
// TabbedPageLayout — เทมเพลตหน้าที่แบ่งเนื้อหาเป็นแท็บใต้หัวข้อเดียว
// ใช้กับ Production (สถานะ/แผนการผลิต/ประวัติ — ?tab= sync กับ URL ที่ ViewModel ของ consumer)
// เทมเพลตนี้ไม่รู้เรื่อง query string เอง — consumer ส่ง activeKey/onChange มาจาก ViewModel
//
// ── ทำไมเลิกใช้ antd <Tabs> ──────────────────────────────────
// เดิมใช้ <Tabs> ซึ่งเป็นแท็บแบบ "ขีดเส้นใต้" ส่วนอีก 7 หน้าใช้ <TypeTabBar> (Segmented)
// ซึ่งเป็นแท็บแบบ "ปุ่มน้ำตาลทึบ" — แอปเดียวกันจึงมีแท็บ 2 หน้าตาที่ทำงานเหมือนกันเป๊ะ
// ตอนนี้ทุกหน้าใช้ TypeTabBar ตัวเดียวกัน · สูง 36px เท่าปุ่มและช่องกรอก
//
// ── render เฉพาะแท็บที่เปิดอยู่ (antd เก็บแท็บเก่าไว้ เราไม่เก็บ) ──
// ตรวจแล้วว่าปลอดภัยสำหรับทั้ง 4 หน้าที่ใช้: ทุกหน้าส่ง {...vm} ลงมา
// ตัวแท็บไม่มี useQuery และไม่มี useState ของตัวเองเลย (ข้อมูลกับ state อยู่ที่ ViewModel
// ของ parent ทั้งหมด) สลับแท็บจึงไม่ยิง API ซ้ำและไม่มี state อะไรหาย
// ข้อยกเว้นเดียวคือ StatusBoard ที่เก็บ state ระหว่าง "กำลังลาก" ซึ่งเป็นของชั่วคราว
// ระหว่างนิ้วยังกดอยู่ — สลับแท็บกลางคันไม่ได้อยู่แล้ว
//
// ⚠️ ถ้าวันหลังมีแท็บที่ถือ state ของตัวเอง (ตัวกรอง/เลขหน้า/แถวที่กางไว้) ต้องกลับมาทำ
// ให้จำว่าแท็บไหนเคยเปิดแล้วคาไว้ด้วย hidden ไม่งั้นค่าจะรีเซ็ตทุกครั้งที่สลับไปกลับ
// ─────────────────────────────────────────────────────────────
import { TypeTabBar } from "@/components/shared/data";

export interface TabbedPageLayoutItem {
  key: string;
  label: string;
  children: React.ReactNode;
  /** ตัวควบคุมของแท็บนี้ (เช่น ช่วงเวลา) — วางแถวเดียวกับแท็บ ฝั่งซ้าย */
  toolbar?: React.ReactNode;
}

export function TabbedPageLayout({
  title,
  actions,
  activeKey,
  onChange,
  items,
  tabsAlign = "start",
  hideTabBar = false,
}: {
  title: string;
  actions?: React.ReactNode;
  activeKey: string;
  onChange: (key: string) => void;
  items: TabbedPageLayoutItem[];
  /** "end" = แท็บชิดขวา (แบบหน้ารายงานยอดขาย: ตัวกรองซ้าย · สวิตช์ขวา) */
  tabsAlign?: "start" | "end";
  /** ซ่อนแถบแท็บ — เมื่อสลับแท็บจากที่อื่นแทน (เช่น เมนูย่อยใน Sidebar ของหน้ารอบพรีออเดอร์) */
  hideTabBar?: boolean;
}) {
  const showTabs = items.length > 1 && !hideTabBar;
  const active = items.find((i) => i.key === activeKey);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-brown-900">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* ครอบด้วย flex row — ถ้าวาง Segmented เป็นลูกของ flex-col ตรง ๆ มันจะถูกยืดเต็มความกว้าง
          (align-items ของ flex column คือ stretch) ผิดจากหน้าอื่นที่แท็บหดตามเนื้อหา */}
      {/* แท็บเดียว = ไม่มีอะไรให้สลับ → ไม่แสดงแถบแท็บ (เหลือแค่ toolbar ถ้ามี) */}
      {(showTabs || active?.toolbar) && (
        tabsAlign === "end" ? (
          // แท็บชิดขวา: ที่พอ = แถวเดียว (toolbar ซ้าย · แท็บขวา) · ที่ไม่พอ (มือถือ / จอใหญ่ที่ถูกบีบ) = แท็บขึ้นไปบรรทัดบนสุด ชิดซ้าย
          // flex-wrap-reverse = บรรทัดที่ตกลงมา (แท็บ) ขึ้นไปอยู่ด้านบนแทนด้านล่าง · toolbar ครอบ div เดียวกัน ข้างในยังขึ้นบรรทัดปกติ
          <div className="flex flex-wrap-reverse items-center gap-3">
            {active?.toolbar && <div className="flex flex-wrap items-center gap-3">{active.toolbar}</div>}
            {/* ตัวดันแท็บไปขวา — เฉพาะจอใหญ่ (มือถือ/ขนาดกลาง แท็บชิดซ้ายเสมอ) */}
            <div className="hidden flex-1 lg:block" />
            {showTabs && (
              <TypeTabBar
                value={activeKey}
                onChange={onChange}
                options={items.map((i) => ({ value: i.key, label: i.label }))}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {active?.toolbar}
            {showTabs && (
              <TypeTabBar
                value={activeKey}
                onChange={onChange}
                options={items.map((i) => ({ value: i.key, label: i.label }))}
              />
            )}
          </div>
        )
      )}

      {active?.children}
    </div>
  );
}
