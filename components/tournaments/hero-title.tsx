"use client"

interface HeroTitleProps {
  children: React.ReactNode
  className?: string
}

export function HeroTitle({ children, className = "" }: HeroTitleProps) {
  return (
    <h1 className={`text-[26px] font-bold text-white px-[18px] pt-[22px] pb-2 ${className}`}>
      {children}
    </h1>
  )
}
