import type { ListParams } from "@/types/api";
/** usage_context: หน่วยใช้กับวัตถุดิบ / สินค้า / ทั้งคู่ */
export type UnitUsage = "Ingredient" | "Product" | "Both";
export interface Unit {
  _id: string;
  unit_name: string;
  unit_abbr: string;
  unit_type: string;
  usage_context: UnitUsage[];
  created_at: string;
  updated_at: string;
}
export interface UnitListParams extends ListParams {
  usage_context?: "Ingredient" | "Product";
}
