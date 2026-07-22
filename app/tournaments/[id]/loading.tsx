export default function TournamentDetailLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#2e2e2e]">
        <div className="px-4 py-4 flex items-center justify-center relative">
          <div className="absolute left-4 w-9 h-9" />
          <div className="h-5 bg-[#222222] rounded w-24" />
        </div>
      </div>

      <div className="h-[210px] bg-[#222222] animate-pulse" />

      <div className="px-[18px] mt-4 space-y-3">
        <div className="h-4 bg-[#222222] rounded w-full animate-pulse" />
        <div className="h-4 bg-[#222222] rounded w-5/6 animate-pulse" />
      </div>

      <div className="mx-[14px] mt-4 bg-[#1a1a1a] rounded-2xl animate-pulse">
        <div className="px-4 py-3 border-b border-[#2e2e2e]">
          <div className="h-5 bg-[#222222] rounded w-32" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e2e] last:border-b-0">
            <div className="h-4 bg-[#222222] rounded w-20" />
            <div className="h-4 bg-[#222222] rounded w-16" />
          </div>
        ))}
      </div>

      <div className="mx-[14px] mt-4 bg-[#1a1a1a] rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-[#222222] rounded w-40 mx-auto mb-3" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#222222] rounded-[10px] h-16" />
          ))}
        </div>
      </div>

      <div className="mx-[14px] mt-4 bg-[#1a1a1a] rounded-2xl p-4 animate-pulse">
        <div className="h-5 bg-[#222222] rounded w-40 mb-3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-5 bg-[#222222] rounded mb-2" />
        ))}
      </div>
    </div>
  )
}
