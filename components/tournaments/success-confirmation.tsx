import { CheckCircle } from "lucide-react"

interface SuccessConfirmationProps {
  title: string
  subtitle?: string
}

export function SuccessConfirmation({ title, subtitle }: SuccessConfirmationProps) {
  return (
    <div className="flex flex-col items-center py-10 px-4">
      <div className="w-[72px] h-[72px] bg-[#2ecc71]/15 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="w-12 h-12 text-[#2ecc71]" />
      </div>
      <h2 className="text-[26px] font-bold text-white text-center mb-2">{title}</h2>
      {subtitle && (
        <p className="text-[14px] text-[#888888] text-center max-w-xs">{subtitle}</p>
      )}
    </div>
  )
}
