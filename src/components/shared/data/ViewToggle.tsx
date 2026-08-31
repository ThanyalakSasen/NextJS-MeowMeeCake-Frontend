"use client";
import { Segmented } from "antd";
import { Squares2X2Icon, TableCellsIcon } from "@heroicons/react/24/outline";
/** สลับมุมมอง Grid / Table */
export function ViewToggle({
  value,
  onChange,
}: {
  value: "grid" | "table";
  onChange: (v: "grid" | "table") => void;
}) {
  return (
    <Segmented
      value={value}
      onChange={(v) => onChange(v as "grid" | "table")}
      options={[
        { value: "grid", icon: <Squares2X2Icon className="w-4 h-4" /> },
        { value: "table", icon: <TableCellsIcon className="w-4 h-4" /> },
      ]}
    />
  );
}
