interface MatchCardProps {
  team1: string
  team2: string
  score1: number
  score2: number
  stadium: string
  date: string
  status?: "completed" | "upcoming" | "live"
}

export default function MatchCard({ team1, team2, score1, score2, stadium, date, status }: MatchCardProps) {
  return (
    <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2C2C2C] hover:border-[#FF3B3F] transition-all cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 text-right pr-4">
          <div className="font-semibold text-white">{team1}</div>
        </div>
        <div className="flex items-center gap-3 bg-[#2C2C2C] px-4 py-2 rounded-lg min-w-[80px] justify-center">
          {status === "upcoming" ? (
            <span className="text-xl font-bold text-[#FF3B3F]">VS</span>
          ) : (
            <>
              <span className="text-xl font-bold text-white">{score1}</span>
              <span className="text-[#A0A0A0]">-</span>
              <span className="text-xl font-bold text-white">{score2}</span>
            </>
          )}
        </div>
        <div className="flex-1 pl-4">
          <div className="font-semibold text-white">{team2}</div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-[#A0A0A0]">
        <span>{stadium}</span>
        <span>•</span>
        <span>{date}</span>
        {status === "live" && (
          <>
            <span>•</span>
            <span className="text-[#FF3B3F] font-bold animate-pulse">LIVE</span>
          </>
        )}
      </div>
    </div>
  )
}
