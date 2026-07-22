import { AlertTriangle } from "lucide-react"

interface WarningBannerProps {
  message: string
}

export function WarningBanner({ message }: WarningBannerProps) {
  return (
    <div className="flex items-center gap-2 mx-4 mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <span className="text-[13px] text-amber-500">{message}</span>
    </div>
  )
}
