"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepsIndicatorProps {
  steps: string[]
  currentStep: number
}

export function StepsIndicator({ steps, currentStep }: StepsIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-4">
      {steps.map((label, index) => {
        const stepNum = index + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep

        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "w-[38px] h-[38px] rounded-full flex items-center justify-center text-[14px] font-semibold border-2 transition-all",
                isActive && "bg-[#e8352a] border-[#e8352a] text-white",
                isCompleted && "bg-transparent border-[#e8352a] text-[#e8352a]",
                !isActive && !isCompleted && "bg-[#222222] border-[#2e2e2e] text-[#888888]"
              )}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
            </div>
            <span
              className={cn(
                "text-[11px] font-medium",
                isActive ? "text-[#e8352a] font-bold" : "text-[#888888]"
              )}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
