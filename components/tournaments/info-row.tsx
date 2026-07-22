interface InfoRowProps {
  label: string
  value: string | number
  highlight?: boolean
}

export function InfoRow({ label, value, highlight = false }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e2e] last:border-b-0">
      <span className="text-[14px] text-[#888888]">{label}</span>
      <span className={`text-[14px] font-medium ${highlight ? "text-[#e8352a]" : "text-white"}`}>
        {value}
      </span>
    </div>
  )
}
