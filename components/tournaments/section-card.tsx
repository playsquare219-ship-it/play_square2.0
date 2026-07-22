import { Trophy } from "lucide-react"
import type { ReactNode } from "react"

interface SectionCardProps {
  title?: string
  icon?: ReactNode
  children: ReactNode
}

export function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl mx-[14px] overflow-hidden">
      {title && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2e2e2e]">
          {icon || <Trophy className="w-5 h-5 text-[#e8352a]" />}
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
        </div>
      )}
      {children}
    </div>
  )
}
