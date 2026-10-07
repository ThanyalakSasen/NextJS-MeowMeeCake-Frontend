// ไอคอนของแง่มุมรีวิว — key ตาม ASPECT_ICON_KEYS ของ backend (src/lib/aspectIcons.ts)
// GET /catalog/review-aspects แปลงค่าเริ่มต้นให้แล้ว · key ที่ไม่รู้จัก = จุดสามจุด ("more")
// ย้ายมาจาก FrontOffice src/app/components/AspectIcon.tsx
import {
  Wallet, BadgePercent, Cookie, Cake, CakeSlice, Croissant, Candy, IceCreamCone, Coffee, Utensils,
  Package, Gift, Truck, Clock, Store, Smile, Heart, Star, Sparkles, Eye,
  Leaf, Flame, Snowflake, Scale, ShieldCheck, MessageCircle, Ellipsis,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  wallet: Wallet,
  "badge-percent": BadgePercent,
  cookie: Cookie,
  cake: Cake,
  "cake-slice": CakeSlice,
  croissant: Croissant,
  candy: Candy,
  "ice-cream": IceCreamCone,
  coffee: Coffee,
  utensils: Utensils,
  package: Package,
  gift: Gift,
  truck: Truck,
  clock: Clock,
  store: Store,
  smile: Smile,
  heart: Heart,
  star: Star,
  sparkles: Sparkles,
  eye: Eye,
  leaf: Leaf,
  flame: Flame,
  snowflake: Snowflake,
  scale: Scale,
  "shield-check": ShieldCheck,
  "message-circle": MessageCircle,
  more: Ellipsis,
};

export default function AspectIcon({ icon, size = 16, className }: { icon?: string | null; size?: number; className?: string }) {
  const Icon = (icon && ICONS[icon]) || Ellipsis;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
