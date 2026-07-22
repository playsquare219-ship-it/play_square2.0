"use client"

import Link from "next/link"
import { Calendar, Users, Trophy } from "lucide-react"
import { StatusBadge } from "./status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Tournament } from "@/types"

interface TournamentCardProps {
  tournament: Tournament
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const getEmoji = (name: string) => {
    if (name.toLowerCase().includes("cup")) return "🏆"
    if (name.toLowerCase().includes("summer")) return "🏟️"
    return "⚽"
  }
  const emoji = tournament.emoji || getEmoji(tournament.name)

  return (
    <Link href={`/tournaments/${tournament.id}`} className="block">
      <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden active:scale-[0.98] transition-transform border border-[#2e2e2e]">
        <div className="h-[190px] bg-gradient-to-br from-[#e8352a]/20 to-[#0a0a0a] flex items-center justify-center relative">
          <span className="text-[52px]">{emoji}</span>
          <div className="absolute top-3 left-3">
            <StatusBadge type={tournament.type} status={tournament.status} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-[18px] font-bold text-white mb-2 line-clamp-1">
            {tournament.name}
          </h3>
          <div className="flex items-center gap-4 text-[13px] text-[#888888]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(tournament.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {(tournament.teams || []).length}/{tournament.maxTeams || 0}
            </span>
            {tournament.prize && (
              <span className="flex items-center gap-1 text-[#e8352a] font-medium">
                <Trophy className="w-3.5 h-3.5" />
                {formatCurrency(tournament.prize)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
