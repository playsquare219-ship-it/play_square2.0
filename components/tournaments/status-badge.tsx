"use client"

import { cn } from "@/lib/utils"
import type { TournamentStatus, TournamentType } from "@/types"

interface StatusBadgeProps {
  type?: TournamentType
  status?: TournamentStatus
  className?: string
}

const typeLabels: Record<TournamentType, string> = {
  knockout: "Knockout",
  league: "League",
  group_and_knockout: "Groups + KO",
}

const statusLabels: Partial<Record<TournamentStatus, string>> = {
  draft: "Draft",
  registration: "Open",
  registration_open: "Open",
  registration_closed: "Closed",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
  archived: "Archived",
}

const statusColors: Partial<Record<TournamentStatus, string>> = {
  draft: "bg-[#555555]/65",
  registration: "bg-emerald-500/65",
  registration_open: "bg-emerald-500/65",
  registration_closed: "bg-amber-500/65",
  ongoing: "bg-blue-500/65",
  completed: "bg-[#555555]/65",
  cancelled: "bg-red-500/65",
  archived: "bg-[#555555]/65",
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  return (
    <div className="flex gap-1.5">
      {type && (
        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-black/65 backdrop-blur-sm border border-white/15 text-white">
          {typeLabels[type]}
        </span>
      )}
      {status && (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold text-white",
            statusColors[status] || "bg-[#555555]/65",
            className
          )}
          aria-label={`Status: ${statusLabels[status] || status}`}
        >
          {statusLabels[status] || status}
        </span>
      )}
    </div>
  )
}
