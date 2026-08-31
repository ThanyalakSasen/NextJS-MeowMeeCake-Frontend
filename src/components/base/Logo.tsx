import Image from "next/image";

/** โลโก้ร้าน — วงกลม + (ออปชัน) ชื่อ/subtitle ข้าง ๆ */
export function Logo({
  size = 40,
  showText = false,
  name,
  subtitle,
}: {
  size?: number;
  showText?: boolean;
  name?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="rounded-full overflow-hidden shrink-0 shadow-sm bg-white"
        style={{ width: size, height: size }}
      >
        <Image
          src="/pictures/logoMoewMeeCake.png"
          alt="MeowMee Cake"
          width={size}
          height={size}
          className="w-full h-full object-cover"
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
