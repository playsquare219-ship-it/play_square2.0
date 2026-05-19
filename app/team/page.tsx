"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getMyTeams, getTeamById, getUsersByIds, leaveTeam, deleteTeam, transferTeamCaptain } from '@/lib/client/api'
import type { Team, AppUser } from "@/types"
import { Shield, ShieldPlus, Search, UserPlus } from "lucide-react"

const TAB_OPTIONS = [
  { id: "my-teams", label: "My Teams", icon: Shield, desc: "View all your teams." },
  { id: "current-team", label: "Current Team", icon: ShieldPlus, desc: "View the currently active team." },
  { id: "new-team", label: "New Team", icon: UserPlus, desc: "Create a new team in the database." },
  { id: "join-team", label: "Join Team", icon: Search, desc: "Search for a team and join." },
]

export default function TeamPage() {
  const router = useRouter()
  const { user, isAuthenticated, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState<"my-teams" | "current-team" | "new-team" | "join-team">("my-teams")
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(false)
  const [leavingTeamIds, setLeavingTeamIds] = useState<string[]>([])
  const [deletingTeamIds, setDeletingTeamIds] = useState<string[]>([])
  const [showTransferCaptain, setShowTransferCaptain] = useState(false)
  const [transferringCaptainId, setTransferringCaptainId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleLeaveTeam = async (team: Team) => {
    if (!user?.id) return

    if (team.captainId === user.id) {
      toast({ title: 'Captain cannot leave the team', variant: 'destructive' })
      return
    }

    setLeavingTeamIds((prev) => [...prev, team.id])
    try {
      await leaveTeam(team.id)
      setMyTeams((prev) => prev.filter((item) => item.id !== team.id))
      if (currentTeam?.id === team.id) {
        setCurrentTeam(null)
        setActiveTab('my-teams')
      }
      toast({ title: 'Left Team', description: `You have left team ${team.name}` })
    } catch (error) {
      console.error('Leave team failed:', error)
      toast({ title: 'Failed to leave', description: 'Try again later', variant: 'destructive' })
    } finally {
      setLeavingTeamIds((prev) => prev.filter((id) => id !== team.id))
    }
  }

  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`Are you sure you want to delete team ${team.name} permanently?`)) {
      return
    }

    setDeletingTeamIds((prev) => [...prev, team.id])
    try {
      await deleteTeam(team.id)
      setMyTeams((prev) => prev.filter((item) => item.id !== team.id))
      if (currentTeam?.id === team.id) {
        setCurrentTeam(null)
        setActiveTab('my-teams')
      }
      if (user?.teamId === team.id) {
        updateUser({ teamId: undefined, isTeamCaptain: false })
      }
      toast({ title: 'Team Deleted', description: `${team.name} has been deleted permanently.` })
    } catch (error) {
      console.error('Delete team failed:', error)
      toast({ title: 'Delete Failed', description: 'Try again later', variant: 'destructive' })
    } finally {
      setDeletingTeamIds((prev) => prev.filter((id) => id !== team.id))
    }
  }

  const handleTransferCaptain = async (team: Team, newCaptainId: string) => {
    if (!confirm('Do you want to assign this member as the new captain?')) {
      return
    }

    setTransferringCaptainId(newCaptainId)
    try {
      await transferTeamCaptain(team.id, newCaptainId)
      setCurrentTeam((prev) => prev ? { ...prev, captainId: newCaptainId } : prev)
      if (user?.id === team.captainId) {
        updateUser({ isTeamCaptain: false })
      }
      toast({ title: 'Captain Changed', description: 'A new captain has been assigned for the team.' })
      setShowTransferCaptain(false)
    } catch (error) {
      console.error('Transfer captain failed:', error)
      toast({ title: 'Failed to change', description: 'Try again later', variant: 'destructive' })
    } finally {
      setTransferringCaptainId(null)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
      return
    }

    const loadTeams = async () => {
      setLoading(true)
      const [teams, primaryTeam] = await Promise.all([
        getMyTeams(),
        user?.teamId ? getTeamById(user.teamId) : Promise.resolve(null),
      ])

      setMyTeams(teams)
      setCurrentTeam(primaryTeam)
      setLoading(false)
    }

    loadTeams()
  }, [isAuthenticated, router, user?.teamId])

  const activeTeam = activeTab === "current-team" ? currentTeam : null

  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!activeTeam?.players?.length) {
        setTeamMembers([])
        return
      }
      const members = await getUsersByIds(activeTeam.players)
      setTeamMembers(members)
    }

    void loadTeamMembers()
  }, [activeTeam])

  return (
    <div className="min-h-screen bg-[#121212] pb-20">
      <div className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-sm border-b border-[#2C2C2C]">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Team Hub</h1>
          <p className="text-sm text-[#A0A0A0] mt-1">Manage your teams, create a new team, or join an existing team.</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          {TAB_OPTIONS.map((tab, idx) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "new-team") {
                    router.push("/team/create")
                    return
                  }
                  if (tab.id === "join-team") {
                    router.push("/team/join")
                    return
                  }
                  setActiveTab(tab.id as any)
                }}
                className={`group relative h-auto flex flex-col items-start p-5 rounded-3xl overflow-hidden transition-all duration-300 border hover:scale-[1.02] ${
                  isActive 
                  ? "border-[#FF3B3F] bg-gradient-to-br from-[#FF3B3F]/20 to-[#121212] shadow-[0_0_20px_rgba(255,59,63,0.15)]" 
                  : "border-white/5 bg-[#1E1E1E]/80 backdrop-blur-sm hover:border-white/20 hover:bg-[#2C2C2C]"
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF3B3F]/20 blur-3xl rounded-full" />
                )}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isActive ? 'bg-[#FF3B3F] text-white shadow-lg shadow-[#FF3B3F]/30' : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`font-bold text-lg mb-1 transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                  {tab.label}
                </div>
                <div className="text-xs text-left text-gray-500 whitespace-normal leading-relaxed">
                  {tab.desc}
                </div>
              </Button>
            )
          })}
        </div>

        <div className="bg-[#1E1E1E]/50 rounded-3xl border border-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#A0A0A0] animate-pulse">
               <div className="w-12 h-12 rounded-full border-4 border-[#FF3B3F]/30 border-t-[#FF3B3F] animate-spin mb-4" />
               <p>Loading your profile...</p>
            </div>
          ) : activeTab === "my-teams" ? (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">My Teams Portfolio</h2>
              {myTeams.length > 0 ? (
                <div className="grid gap-4">
                  {myTeams.map((team, idx) => (
                    <div key={team.id} className="group relative rounded-2xl border border-white/5 bg-[#121212] p-5 sm:p-6 transition-all hover:border-[#FF3B3F]/30 hover:shadow-[0_4px_20px_rgba(255,59,63,0.1)] overflow-hidden" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF3B3F]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2C2C2C] to-[#121212] border border-white/10 flex items-center justify-center font-black text-white text-xl">
                              {team.name.substring(0, 2).toUpperCase()}
                           </div>
                           <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-[#FF3B3F] transition-colors">{team.name}</h3>
                            <p className="text-sm text-[#A0A0A0] flex items-center gap-1.5 mt-0.5">
                               <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                               {team.wilaya || team.baladia || "Location not set"}
                            </p>
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:items-center">
                          <Button
                            onClick={() => {
                              setCurrentTeam(team)
                              setActiveTab("current-team")
                            }}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all font-semibold rounded-xl"
                          >
                            View Details
                          </Button>
                          {user?.id !== team.captainId && (
                            <Button
                              onClick={() => handleLeaveTeam(team)}
                              disabled={leavingTeamIds.includes(team.id)}
                              className="bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-transparent rounded-xl"
                            >
                              {leavingTeamIds.includes(team.id) ? 'Leaving...' : 'Leave'}
                            </Button>
                          )}
                          {user?.id === team.captainId && (
                            <Button
                              onClick={() => handleDeleteTeam(team)}
                              disabled={deletingTeamIds.includes(team.id)}
                              className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 hover:border-red-900/60 rounded-xl"
                            >
                              {deletingTeamIds.includes(team.id) ? 'Deleting...' : 'Delete'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4 rounded-3xl border border-white/5 bg-white/[0.01]">
                   <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
                   <h3 className="text-lg font-bold text-white mb-2">No teams found</h3>
                   <p className="text-sm text-gray-400 mb-6">Create a new team or join an existing one to get started.</p>
                   <Button onClick={() => setActiveTab("new-team")} className="bg-[#FF3B3F] hover:bg-[#FF3B3F]/90 text-white rounded-xl">Create Your Team</Button>
                </div>
              )}
            </div>
          ) : activeTab === "current-team" ? (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF3B3F] to-red-600 bg-clip-text text-transparent">Current Active Team</h2>
              {activeTeam ? (
                <div className="rounded-3xl border border-[#FF3B3F]/20 bg-gradient-to-b from-[#FF3B3F]/5 to-transparent p-6 sm:p-8 relative overflow-hidden shadow-[0_0_40px_rgba(255,59,63,0.05)]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF3B3F]/10 blur-[80px] rounded-full pointer-events-none" />
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between relative z-10">
                    <div className="flex items-center gap-5">
                       <div className="w-20 h-20 rounded-2xl bg-[#121212] border-2 border-[#FF3B3F]/50 flex items-center justify-center font-black text-white text-3xl shadow-xl">
                          {activeTeam.name.substring(0, 2).toUpperCase()}
                       </div>
                       <div>
                         <h3 className="text-3xl font-black text-white tracking-tight">{activeTeam.name}</h3>
                         <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                            {activeTeam.wilaya || activeTeam.baladia || "Location not set"}
                         </p>
                       </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end mt-4 sm:mt-0">
                      <Button
                        onClick={() => router.push("/team")}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl"
                      >
                        Refresh
                      </Button>
                      <div className="flex flex-wrap gap-2 sm:items-center">
                        {user?.isTeamCaptain && (
                          <>
                            <Button
                              onClick={() => router.push('/team/requests')}
                              className="bg-gradient-to-r from-[#FF3B3F] to-red-600 hover:from-red-500 hover:to-red-700 text-white shadow-lg shadow-[#FF3B3F]/20 hover:shadow-[#FF3B3F]/40 border-none rounded-xl"
                            >
                              Manage Requests
                            </Button>
                            <Button
                              onClick={() => setShowTransferCaptain((prev) => !prev)}
                              className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 rounded-xl"
                            >
                              Change Captain
                            </Button>
                            <Button
                              onClick={() => activeTeam && handleDeleteTeam(activeTeam)}
                              disabled={activeTeam ? deletingTeamIds.includes(activeTeam.id) : false}
                              className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/30 rounded-xl"
                            >
                              {activeTeam && deletingTeamIds.includes(activeTeam.id) ? 'Deleting...' : 'Delete Team'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                    <div className="rounded-2xl bg-white/[0.02] backdrop-blur-sm p-5 border border-white/5 flex flex-col justify-center items-center">
                      <div className="text-xs uppercase tracking-widest text-[#A0A0A0] mb-2 font-semibold">Total Players</div>
                      <div className="text-4xl font-black text-white">{activeTeam.players.length}</div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.02] backdrop-blur-sm p-5 border border-[#FF3B3F]/20 flex flex-col justify-center items-center shadow-[inset_0_0_20px_rgba(255,59,63,0.05)]">
                      <div className="text-xs uppercase tracking-widest text-[#FF3B3F] mb-2 font-semibold">Team Rating</div>
                      <div className="text-4xl font-black text-[#FF3B3F]">{activeTeam.rating?.toFixed(1) ?? "N/A"}</div>
                    </div>
                  </div>

                  {teamMembers.length > 0 && (
                    <div className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 overflow-hidden">
                      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <h3 className="text-xl font-bold text-white">Team Members</h3>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#FF3B3F] bg-[#FF3B3F]/10 px-3 py-1 rounded-full border border-[#FF3B3F]/20">{teamMembers.length} ACTIVE</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm text-white border-collapse">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email/Phone</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {teamMembers.map((member) => (
                              <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-4 py-4 font-medium text-white group-hover:text-gray-200">{member.firstName} {member.lastName}</td>
                                <td className="px-4 py-4 text-gray-400 font-mono text-xs">{member.phoneOrEmail}</td>
                                <td className="px-4 py-4">
                                  {member.id === activeTeam.captainId ? (
                                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#FF3B3F]/10 text-[#FF3B3F] border border-[#FF3B3F]/20 shadow-[0_0_10px_rgba(255,59,63,0.1)]">Captain</span>
                                  ) : (
                                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-gray-300 border border-white/10">Player</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {showTransferCaptain && user?.isTeamCaptain && teamMembers.length > 1 && (
                    <div className="mt-6 rounded-3xl border border-blue-500/20 bg-blue-900/10 p-6 animate-slide-up backdrop-blur-md">
                      <div className="mb-6 flex items-center justify-between gap-3 border-b border-blue-500/20 pb-4">
                        <h3 className="text-lg font-bold text-blue-400">Choose a New Captain</h3>
                        <Button
                          onClick={() => setShowTransferCaptain(false)}
                          className="bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10"
                        >
                          Cancel
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        {teamMembers
                          .filter((member) => member.id !== activeTeam.captainId)
                          .map((member) => (
                            <div key={member.id} className="flex flex-col gap-4 rounded-2xl border border-white/5 hover:border-blue-500/30 bg-[#121212]/80 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors">
                              <div>
                                <div className="font-bold text-white text-lg">{member.firstName} {member.lastName}</div>
                                <div className="text-xs text-blue-300 font-mono mt-1 opacity-80">{member.phoneOrEmail}</div>
                              </div>
                              <Button
                                onClick={() => handleTransferCaptain(activeTeam, member.id)}
                                disabled={transferringCaptainId === member.id}
                                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20"
                              >
                                {transferringCaptainId === member.id ? 'Assigning...' : 'Assign New Captain'}
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[#A0A0A0]">No active team selected. Choose a team from My Teams or create/join a new one.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">
                {activeTab === "new-team" ? "Create a New Team" : "Join a Team"}
              </h2>
              <p className="text-[#A0A0A0]">Use the buttons above to open the form for creating or joining a team.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
