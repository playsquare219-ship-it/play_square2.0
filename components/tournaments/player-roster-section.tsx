"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface PlayerRosterSectionProps {
  teamNames: { teamId: string; teamName: string }[]
}

export function PlayerRosterSection({ teamNames }: PlayerRosterSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[15px] font-medium text-white">
            Registered Teams
            <span className="text-[#888888] ml-1">({teamNames.length})</span>
          </span>
          {open ? (
            <ChevronUp className="w-5 h-5 text-[#888888]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#888888]" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-[#2e2e2e]">
          {teamNames.map((team) => (
            <div
              key={team.teamId}
              className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e2e] last:border-b-0"
            >
              <span className="text-[14px] text-[#888888]">Team</span>
              <span className="text-[14px] font-medium text-white">{team.teamName}</span>
            </div>
          ))}
          {teamNames.length === 0 && (
            <div className="px-4 py-6 text-center text-[#888888] text-sm">
              No teams registered yet
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
