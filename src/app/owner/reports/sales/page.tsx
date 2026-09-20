"use client";
import { useSalesReportViewModel } from "./useSalesReportViewModel";
import { SalesReportView } from "./SalesReportView";

export default function SalesReportPage() {
  const vm = useSalesReportViewModel();
  return <SalesReportView {...vm} />;
}
