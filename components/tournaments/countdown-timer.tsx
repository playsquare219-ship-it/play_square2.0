"use client"

import { useCountdown } from "@/lib/client/hooks/use-countdown"

interface CountdownTimerProps {
  targetDate: string
  label?: string
}

export function CountdownTimer({ targetDate, label = "Time left to register" }: CountdownTimerProps) {
  const { days, hours, minutes, seconds } = useCountdown(targetDate)

  return (
    <div className="bg-[#1a1a1a] rounded-2xl mx-[14px] p-4">
      <p className="text-[13px] text-[#888888] text-center mb-3">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#222222] rounded-[10px] py-3 text-center">
          <div className="text-[24px] font-bold text-[#e8352a]">{String(days).padStart(2, "0")}</div>
          <div className="text-[11px] text-[#888888]">Days</div>
        </div>
        <div className="bg-[#222222] rounded-[10px] py-3 text-center">
          <div className="text-[24px] font-bold text-[#e8352a]">{String(hours).padStart(2, "0")}</div>
          <div className="text-[11px] text-[#888888]">Hours</div>
        </div>
        <div className="bg-[#222222] rounded-[10px] py-3 text-center">
          <div className="text-[24px] font-bold text-[#e8352a]">{String(minutes).padStart(2, "0")}</div>
          <div className="text-[11px] text-[#888888]">Mins</div>
        </div>
        <div className="bg-[#222222] rounded-[10px] py-3 text-center">
          <div className="text-[24px] font-bold text-[#e8352a]">{String(seconds).padStart(2, "0")}</div>
          <div className="text-[11px] text-[#888888]">Secs</div>
        </div>
      </div>
    </div>
  )
}
