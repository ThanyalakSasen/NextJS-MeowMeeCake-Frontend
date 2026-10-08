import Image from "next/image";

const DEFAULT_LOGO = "/pictures/logoMoewMeeCake.png";

/** โลโก้ร้าน — วงกลม + (ออปชัน) ชื่อ/subtitle ข้าง ๆ · src = โลโก้ที่ร้านอัปโหลด (ไม่ส่ง = โลโก้เริ่มต้นใน public/) */
export function Logo({
  size = 40,
  showText = false,
  name,
  subtitle,
  src = DEFAULT_LOGO,
}: {
  size?: number;
  showText?: boolean;
  name?: string;
  subtitle?: string;
  src?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="rounded-full overflow-hidden shrink-0 shadow-sm bg-white"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt="MeowMee Cake"
          width={size}
          height={size}
          className="w-full h-full object-cover"
          // รูปจาก backend (คนละ origin) ไม่ผ่าน image optimizer — ไม่ต้องตั้ง remotePatterns
          unoptimized={src !== DEFAULT_LOGO}
          priority
        />
      </span>
      {showText && (
        <span className="leading-tight">
          {name && <span className="block text-sm font-semibold text-brown-900">{name}</span>}
          {subtitle && <span className="block text-xs text-gray-500">{subtitle}</span>}
        </span>
      )}
    </div>
  );
}
