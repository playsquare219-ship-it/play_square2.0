interface ProgressBarProps {
  label: string
  value: number
  max?: number
  displayValue?: string
}

export default function ProgressBar({ label, value, max = 100, displayValue }: ProgressBarProps) {
  const percentage = (value / max) * 100

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#A0A0A0]">{label}</span>
        <span className="text-sm font-semibold text-white">{displayValue || `${value.toFixed(1)}%`}</span>
      </div>
      <div className="h-2 bg-[#2C2C2C] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FF3B3F] rounded-full transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
