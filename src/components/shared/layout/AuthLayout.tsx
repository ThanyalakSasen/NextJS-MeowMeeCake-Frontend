// ─────────────────────────────────────────────────────────────
// src/components/shared/layout/AuthLayout.tsx
// เทมเพลตหน้า auth — กึ่งกลางจอ ไม่มี Sidebar/Navbar
// ครอบ /login (+ อนาคต /forgot-password, /reset-password)
// ─────────────────────────────────────────────────────────────

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brown-50 px-4">
      {children}
    </div>
  );
}
