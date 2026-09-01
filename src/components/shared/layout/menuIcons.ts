// ─────────────────────────────────────────────────────────────
// menuIcons.ts — map ชื่อ heroicon (string ใน src/constants/menu.ts) → คอมโพเนนต์
// ใช้ทั้งเมนูระดับบน (Sidebar) และซับเมนู (MenuGroupItem)
// ─────────────────────────────────────────────────────────────
import {
  // เมนูระดับบน / กลุ่ม
  PresentationChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  TagIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  BookOpenIcon,
  UserGroupIcon,
  PaintBrushIcon,
  // ซับเมนู
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  ReceiptPercentIcon,
  ChartPieIcon,
  TicketIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ArrowsRightLeftIcon,
  ScaleIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";

export const MENU_ICONS: Record<string, React.ElementType> = {
  PresentationChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  TagIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  BookOpenIcon,
  UserGroupIcon,
  PaintBrushIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  ReceiptPercentIcon,
  ChartPieIcon,
  TicketIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ArrowsRightLeftIcon,
  ScaleIcon,
  UsersIcon,
  ShieldCheckIcon,
};
