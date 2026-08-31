/** grid responsive 2–4 คอลัมน์ ของ StatCard */
export function StatCardsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>;
}
