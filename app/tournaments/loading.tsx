export default function TournamentsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#2e2e2e]">
        <div className="px-4 py-4 flex items-center justify-center">
          <div className="h-5 bg-[#222222] rounded w-32" />
        </div>
      </div>

      <div className="px-[18px] pt-[22px] pb-2">
        <div className="h-8 bg-[#222222] rounded w-48" />
      </div>

      <div className="flex gap-2 px-[18px] mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 bg-[#222222] rounded-full w-20" />
        ))}
      </div>

      <div className="space-y-4 px-[14px]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse">
            <div className="h-[190px] bg-[#222222]" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-[#222222] rounded w-3/4" />
              <div className="h-4 bg-[#222222] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
