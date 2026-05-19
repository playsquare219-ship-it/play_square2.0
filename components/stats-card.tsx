interface StatsCardProps {
  rating: string
  matches: string
  points: string
}

export default function StatsCard({ rating, matches, points }: StatsCardProps) {
  return (
    <div className="bg-[#1E1E1E] rounded-2xl p-6 shadow-xl border border-[#2C2C2C]">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-[#FF3B3F]">{rating}</div>
          <div className="text-sm text-[#A0A0A0] mt-1">Rating</div>
        </div>
        <div className="text-center border-x border-[#2C2C2C]">
          <div className="text-3xl font-bold text-white">{matches}</div>
          <div className="text-sm text-[#A0A0A0] mt-1">Matches</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{points}</div>
          <div className="text-sm text-[#A0A0A0] mt-1">Points</div>
        </div>
      </div>
    </div>
  )
}
