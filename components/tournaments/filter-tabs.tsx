"use client"

import { cn } from "@/lib/utils"

interface FilterTab {
  id: string
  label: string
}

interface FilterTabsProps {
  tabs: FilterTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function FilterTabs({ tabs, activeTab, onTabChange }: FilterTabsProps) {
  return (
    <div className="flex gap-2 px-[18px] overflow-x-auto scrollbar-hide" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-3 min-h-[44px] rounded-full text-[13px] font-medium whitespace-nowrap transition-all flex items-center",
            activeTab === tab.id
              ? "bg-[#e8352a] text-white"
              : "bg-[#1a1a1a] text-[#888888] border border-[#2e2e2e]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
