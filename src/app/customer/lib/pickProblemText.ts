// ข้อความของปัญหาตอนเลือกตัวเลือกสินค้า (src/lib/customizationSelection.ts checkPicked)
// POS ใช้ i18n pos.pick* · หน้าร้านใช้ shop.pick.* (ผู้เรียกส่ง t ของ namespace นั้นมา)
import type { useTranslations } from "next-intl";
import type { PickProblem } from "@/lib/customizationSelection";

export type PickT = ReturnType<typeof useTranslations<"shop.pick">>;

export function pickProblemText(p: PickProblem, t: PickT): string {
  const { group = "", option = "", n = 0 } = p.params;
  switch (p.key) {
    case "pickGroupRequired":
      return t("groupRequired", { group });
    case "pickGroupMin":
      return t("groupMin", { group, n });
    case "pickGroupMax":
      return t("groupMax", { group, n });
    case "pickOptionRequired":
      return t("optionRequired", { option });
    case "pickTextRequired":
      return t("textRequired", { option });
    case "pickTextTooLong":
      return t("textTooLong", { option, n });
  }
}
