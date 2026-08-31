/** จุดสีเล็ก ๆ บ่งบอกสถานะ/หมวดหมู่ */
export function DotIndicator({ color, size = 8, className = "" }: { color: string; size?: number; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: color }}
      aria-hidden="true"
    />
  );
}
