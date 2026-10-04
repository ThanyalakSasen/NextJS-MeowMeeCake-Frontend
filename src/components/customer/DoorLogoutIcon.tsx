"use client";
// ย้ายมาจาก FrontOffice (components/customer/DoorLogoutIcon.tsx) โดยไม่แก้

// ไอคอนประตูสำหรับปุ่ม Logout — ตอนชี้ (hover) บานประตูจะเปิดออกโดยหมุนจากบานพับด้านซ้าย
// ต้องใช้คู่กับปุ่มแม่ที่มี class "group" เพื่อให้ group-hover ทำงาน
export default function DoorLogoutIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      {/* ช่องประตูด้านใน — มืดลงตอนประตูเปิด */}
      <rect
        x="6"
        y="4"
        width="12"
        height="17"
        fill="currentColor"
        className="opacity-0 transition-opacity duration-300 group-hover:opacity-25 motion-reduce:transition-none"
      />
      {/* วงกบประตู + พื้น */}
      <path
        d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* บานประตู — หมุนจากบานพับซ้าย (transform-box/origin ใช้ arbitrary property เพราะ Tailwind ไม่มี utility ตรงตัว) */}
      <g className="[transform-box:fill-box] [transform-origin:0%_50%] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:[transform:scaleX(0.4)_skewY(-8deg)] motion-reduce:transition-none">
        <rect
          x="7"
          y="4.8"
          width="10"
          height="16.2"
          rx="0.6"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="14.6" cy="13" r="1" fill="currentColor" />
      </g>
    </svg>
  );
}
