"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface TournamentTopBarProps {
  title: string
  showBack?: boolean
}

export function TournamentTopBar({ title, showBack = false }: TournamentTopBarProps) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#2e2e2e]">
      <div className="px-4 py-4 flex items-center justify-center relative">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="absolute left-4 p-3 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
    </div>
  )
}
