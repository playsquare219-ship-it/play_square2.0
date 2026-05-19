"use client"

import { useState } from "react"

interface PlayerCardProps {
  name: string
  rating: number
  number: number
  position: string
  isActive?: boolean
  draggable?: boolean
}

export default function PlayerCard({
  name,
  rating,
  number,
  position,
  isActive = false,
  draggable = true,
}: PlayerCardProps) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div
      draggable={draggable}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      className={`
        relative bg-[#1E1E1E] rounded-lg p-3 border-2 cursor-move transition-all
        ${isActive ? "border-[#FF3B3F] shadow-lg shadow-[#FF3B3F]/30" : "border-[#2C2C2C]"}
        ${isDragging ? "opacity-50 scale-95" : "hover:scale-105"}
      `}
    >
      {/* Flag */}
      <div className="absolute -top-2 -right-2 text-xs">🇩🇿</div>

      {/* Rating Badge */}
      <div className="absolute -top-2 -left-2 bg-[#FF3B3F] text-white text-xs font-bold px-2 py-1 rounded">
        {rating}
      </div>

      {/* Player Info */}
      <div className="text-center mt-2">
        <div className="text-2xl font-bold text-[#A0A0A0] mb-1">{number}</div>
        <div className="text-xs font-semibold text-white mb-1">{name}</div>
        <div className="text-xs text-[#A0A0A0]">{position}</div>
      </div>
    </div>
  )
}
