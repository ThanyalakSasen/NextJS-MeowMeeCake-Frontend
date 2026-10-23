"use client";
import { useShippingZonesViewModel } from "./useShippingZonesViewModel";
import { ShippingZonesView } from "./ShippingZonesView";

export default function ShippingZonesPage() {
  const vm = useShippingZonesViewModel();
  return <ShippingZonesView {...vm} />;
}
