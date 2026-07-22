"use client"

import { StatusBadge } from "./status-badge"
import type { Tournament } from "@/types"

interface TournamentHeroProps {
  tournament: Tournament
}

export function TournamentHero({ tournament }: TournamentHeroProps) {
  const getEmoji = (name: string) => {
    if (name.toLowerCase().includes("cup")) return "🏆"
    if (name.toLowerCase().includes("summer")) return "🏟️"
    return "⚽"
  }
  const emoji = tournament.emoji || getEmoji(tournament.name)

  return (
    <div className="relative h-[210px] bg-gradient-to-br from-[#e8352a]/30 to-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[64px]">{emoji}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      <div className="absolute top-4 left-4 z-10">
        <StatusBadge type={tournament.type} status={tournament.status} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h1 className="text-[24px] font-bold text-white">{tournament.name}</h1>
      </div>
    </div>
  )
}
