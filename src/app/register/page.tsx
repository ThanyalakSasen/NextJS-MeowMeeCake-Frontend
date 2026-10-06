"use client";
import { useRegisterViewModel } from "./useRegisterViewModel";
import { RegisterView } from "./RegisterView";

// สมัครสมาชิก (ลูกค้า) — ลิงก์จากหน้า /login · BACKLOG3-merge B1
export default function RegisterPage() {
  const vm = useRegisterViewModel();
  return <RegisterView {...vm} />;
}
