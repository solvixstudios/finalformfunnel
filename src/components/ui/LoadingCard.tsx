const LoadingCard = () => {
  return (
    <div className="bg-white/50 backdrop-blur border border-slate-200 rounded-2xl p-6 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-xl" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
      </div>
    </div>
  );
};

export const LoadingGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <LoadingCard key={i} />
    ))}
  </div>
);

export default LoadingCard;
