"use client"

interface PlayerRosterInputProps {
  index: number
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
}

export function PlayerRosterInput({ index, value, onChange, readOnly = true }: PlayerRosterInputProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="w-8 h-8 rounded-full bg-[#e8352a] flex items-center justify-center flex-shrink-0">
        <span className="text-[13px] font-bold text-white">{index + 1}</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        className={`flex-1 bg-[#1a1a1a] border-[1.5px] border-[#2e2e2e] rounded-xl px-4 py-3 text-[14px] text-right focus:border-[#e8352a] outline-none transition-colors ${
          value ? "text-white" : "text-[#555555]"
        } ${readOnly ? "cursor-default" : ""}`}
        placeholder={readOnly ? "" : "Player name"}
      />
    </div>
  )
}
