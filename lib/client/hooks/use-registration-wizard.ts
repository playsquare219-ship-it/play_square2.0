"use client"

import { useState, useEffect } from "react"
import type { Tournament } from "@/types"

interface WizardState {
  step: number
  teamName: string
  captainName: string
  players: string[]
  isSubmitting: boolean
}

export function useRegistrationWizard(
  tournament: Tournament,
  teamName: string,
  captainName: string,
  playerNames: string[]
) {
  const minPlayers = tournament.minPlayersPerTeam || 10
  const maxPlayers = tournament.maxPlayersPerTeam || 15

  const [state, setState] = useState<WizardState>({
    step: 1,
    teamName,
    captainName,
    players: Array.from({ length: maxPlayers }, (_, i) => playerNames[i] ?? ""),
    isSubmitting: false,
  })

  useEffect(() => {
    setState((prev) => {
      const incoming = Array.from({ length: maxPlayers }, (_, i) => playerNames[i] ?? "")
      const current = prev.players
      if (current.length === incoming.length && current.every((v, i) => v === incoming[i])) {
        return prev
      }
      return { ...prev, players: incoming }
    })
  }, [playerNames, maxPlayers])

  const filledPlayers = state.players.filter((p): p is string => typeof p === "string" && p.trim().length > 0)

  const canProceedStep1 = state.teamName.trim().length > 0 && state.captainName.trim().length > 0
  const canSubmit = filledPlayers.length >= minPlayers

  const setPlayer = (index: number, value: string) => {
    setState((prev) => {
      const players = [...prev.players]
      while (players.length <= index) players.push("")
      players[index] = value
      return { ...prev, players }
    })
  }

  const nextStep = () => {
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, 3) }))
  }

  const prevStep = () => {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 1) }))
  }

  const setSubmitting = (value: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting: value }))
  }

  return {
    step: state.step,
    teamName: state.teamName,
    captainName: state.captainName,
    players: state.players,
    filledCount: filledPlayers.length,
    minPlayers,
    maxPlayers,
    canProceedStep1,
    canSubmit,
    isSubmitting: state.isSubmitting,
    nextStep,
    prevStep,
    setSubmitting,
    setPlayer,
  }
}
