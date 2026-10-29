// components/StatsSkeleton.tsx
export function StatsSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Đang tải thống kê">
      <div className="h-36 rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-60 rounded-xl bg-muted" />
    </div>
  );
}