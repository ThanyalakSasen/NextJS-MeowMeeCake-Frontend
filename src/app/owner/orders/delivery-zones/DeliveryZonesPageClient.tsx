"use client";
import { useDeliveryZonesViewModel } from "./useDeliveryZonesViewModel";
import { DeliveryZonesView } from "./DeliveryZonesView";

export default function DeliveryZonesPage() {
  const vm = useDeliveryZonesViewModel();
  return <DeliveryZonesView {...vm} />;
}
