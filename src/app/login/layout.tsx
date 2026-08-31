import { AuthLayout } from "@/components/shared/layout/AuthLayout";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
