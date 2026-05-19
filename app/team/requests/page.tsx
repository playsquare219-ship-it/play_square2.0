"use client"

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { getTeamRequests, respondToTeamJoinRequest, getTeamById } from '@/lib/client/api'
import type { Team, TeamJoinRequest } from '@/types'

export default function TeamRequestsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [requests, setRequests] = useState<TeamJoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    const loadRequests = async () => {
      if (!user?.teamId) {
        router.push('/team')
        return
      }

      const teamData = await getTeamById(user.teamId)
      setTeam(teamData)
      const items = await getTeamRequests(user.teamId)
      setRequests(items)
      setLoading(false)
    }

    void loadRequests()
  }, [isAuthenticated, router, user?.teamId])

  const handleRequestUpdate = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await respondToTeamJoinRequest(requestId, status)
      setRequests((prev) => prev.map((request) => (request.id === requestId ? { ...request, status } : request)))
      toast({ title: `Request ${status}`, description: `Join request has been ${status}.` })
    } catch (error) {
      toast({ title: 'Error', description: 'Unable to update request', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-20">
      <div className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-sm border-b border-[#2C2C2C]">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Team Join Requests</h1>
            <p className="text-sm text-[#A0A0A0]">Manage pending requests for {team?.name || 'your team'}.</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-white">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 text-center text-[#A0A0A0]">
            No pending join requests at the moment.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-3xl border border-[#2C2C2C] bg-[#121212] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{request.requesterName || request.requesterId}</h2>
                    <p className="text-sm text-[#A0A0A0]">Requested at: {new Date(request.createdAt).toLocaleString()}</p>
                    <p className="text-sm mt-2 text-[#A0A0A0]">Status: {request.status}</p>
                  </div>
                  {request.status === 'pending' ? (
                    <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
                      <Button onClick={() => handleRequestUpdate(request.id, 'accepted')} className="bg-[#22c55e] hover:bg-[#16a34a]">
                        Accept
                      </Button>
                      <Button onClick={() => handleRequestUpdate(request.id, 'rejected')} className="bg-[#ef4444] hover:bg-[#dc2626]">
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-full px-3 py-1 text-xs font-semibold uppercase text-[#A0A0A0] bg-[#2C2C2C]">
                      {request.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
