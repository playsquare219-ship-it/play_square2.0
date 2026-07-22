"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface DualButtonRowProps {
  primaryLabel: string
  secondaryLabel: string
  onPrimary: () => void
  onSecondary: () => void
  primaryDisabled?: boolean
  primaryLoading?: boolean
}

export function DualButtonRow({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryDisabled = false,
  primaryLoading = false,
}: DualButtonRowProps) {
  return (
    <div className="flex gap-3 px-[18px] mt-6 mb-8">
      <Button
        onClick={onPrimary}
        disabled={primaryDisabled || primaryLoading}
        className="flex-1 bg-[#e8352a] hover:bg-[#e8352a]/90 text-white rounded-[14px] py-3 h-auto text-[15px] font-semibold shadow-[0_4px_20px_rgba(232,53,42,0.25)] disabled:opacity-50 disabled:shadow-none"
      >
        {primaryLoading ? <Spinner className="w-5 h-5" /> : primaryLabel}
      </Button>
      <Button
        onClick={onSecondary}
        variant="outline"
        className="flex-1 border-[1.5px] border-[#2e2e2e] text-[#888888] rounded-[14px] py-3 h-auto text-[15px] font-semibold bg-transparent hover:bg-[#1a1a1a]"
      >
        {secondaryLabel}
      </Button>
    </div>
  )
}
