"use client"

import { useEffect, useState, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { getNotifications, markNotificationsRead, respondToTeamJoinRequest, deleteTeamJoinRequest, respondToMatchRequest, cancelMatchRequest, respondToMatchInvitation, generateBookingPDF, confirmBooking } from '@/lib/client/api'
import type { Notification } from '@/types'

export default function NotificationsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const loaderRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToast()

  const loadNotifications = async (nextPage = 0) => {
    if (nextPage === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const offset = nextPage * 5
      const result = await getNotifications(5, offset)
      setNotifications((prev) => (nextPage === 0 ? result.notifications : [...prev, ...result.notifications]))
      setHasMore(result.hasMore)
      setPage(nextPage)
    } catch (error) {
      toast({ title: 'Failed to load notifications', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    void loadNotifications(0)
  }, [isAuthenticated, router])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading) {
          void loadNotifications(page + 1)
        }
      },
      { rootMargin: '100px' }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, page])

  const [processingRequestIds, setProcessingRequestIds] = useState<string[]>([])

  const handleMarkRead = async () => {
    await markNotificationsRead()
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    toast({ title: 'Notifications marked read' })
  }

  const handleRequestResponse = async (notification: Notification, status: 'accepted' | 'rejected') => {
    if (!notification.requestId) {
      toast({ title: 'Invalid request', description: 'Unable to process this notification.', variant: 'destructive' })
      return
    }

    setProcessingRequestIds((prev) => [...prev, notification.requestId!])

    try {
      if (notification.type === 'team_request') {
        await respondToTeamJoinRequest(notification.requestId, status)
      } else {
        await respondToMatchRequest(notification.requestId, status)
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
                requestStatus: status,
                message: `تم ${status === 'accepted' ? 'قبول' : 'رفض'} الطلب.`,
              }
            : item
        )
      )
      toast({ title: `Request ${status === 'accepted' ? 'accepted' : 'rejected'}`, description: 'Response sent successfully.' })
    } catch (error) {
      toast({ title: 'Failed to respond', description: 'Try again later.', variant: 'destructive' })
    } finally {
      setProcessingRequestIds((prev) => prev.filter((id) => id !== notification.requestId))
    }
  }

  const handleDeleteRequest = async (notification: Notification) => {
    if (!notification.requestId) {
      toast({ title: 'Invalid request', description: 'Unable to delete this request.', variant: 'destructive' })
      return
    }

    setProcessingRequestIds((prev) => [...prev, notification.requestId!])

    try {
      await deleteTeamJoinRequest(notification.requestId)
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id))
      toast({ title: 'Request deleted', description: 'The join request has been removed.' })
    } catch (error) {
      toast({ title: 'Failed to delete', description: 'Try again later.', variant: 'destructive' })
    } finally {
      setProcessingRequestIds((prev) => prev.filter((id) => id !== notification.requestId))
    }
  }

  const handleCancelBooking = async (notification: Notification) => {
    if (!notification.requestId) {
      toast({ title: 'Invalid request', description: 'Unable to cancel booking.', variant: 'destructive' })
      return
    }

    setProcessingRequestIds((prev) => [...prev, notification.requestId!])

    try {
      await cancelMatchRequest(notification.requestId)
      setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item))
      toast({ title: 'Booking cancelled', description: 'The match request has been cancelled.' })
    } catch (error) {
      toast({ title: 'Failed to cancel', description: 'Try again later.', variant: 'destructive' })
    } finally {
      setProcessingRequestIds((prev) => prev.filter((id) => id !== notification.requestId))
    }
  }

  const handleMatchInvitationResponse = async (
    notification: Notification,
    action: 'accept' | 'reject' | 'change_court' | 'change_time' | 'cancel'
  ) => {
    if (!notification.invitationId) {
      toast({ title: 'Invalid invitation', description: 'Unable to process this invitation.', variant: 'destructive' })
      return
    }

    setProcessingRequestIds((prev) => [...prev, notification.invitationId!])

    try {
      const extraData: any = {}
      if (action === 'change_court') {
        extraData.suggestedValue = prompt('أدخل اسم الملعب الجديد:')
        if (!extraData.suggestedValue) {
          setProcessingRequestIds((prev) => prev.filter((id) => id !== notification.invitationId))
          return
        }
      } else if (action === 'change_time') {
        extraData.suggestedValue = prompt('أدخل التوقيت الجديد (مثال: 18:00):')
        if (!extraData.suggestedValue) {
          setProcessingRequestIds((prev) => prev.filter((id) => id !== notification.invitationId))
          return
        }
      }

      await respondToMatchInvitation(notification.invitationId, action, extraData)
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
                message: `تم ${
                  action === 'accept'
                    ? 'قبول'
                    : action === 'reject'
                      ? 'رفض'
                      : action === 'cancel'
                        ? 'إلغاء'
                        : 'طلب تغيير'
                } الدعوة.`,
              }
            : item
        )
      )
      toast({ title: 'تم التحديث', description: 'تم معالجة ردك على الدعوة بنجاح.' })
    } catch (error) {
      toast({ title: 'فشل التحديث', description: 'يرجى المحاولة لاحقاً.', variant: 'destructive' })
    } finally {
      setProcessingRequestIds((prev) => prev.filter((id) => id !== notification.invitationId))
    }
  }

  const handleDownloadPDF = async (notification: Notification) => {
    try {
      if (!notification.matchDetails) {
        toast({ title: 'خطأ', description: 'تفاصيل المباراة غير متاحة.', variant: 'destructive' })
        return
      }

      const matchDetails = notification.matchDetails
      const htmlContent = await generateBookingPDF({
        matchId: notification.matchId || 'unknown',
        stadium: matchDetails.stadium || '',
        dateTime: matchDetails.dateTime || new Date().toISOString(),
        team1Name: matchDetails.team1Name,
        team2Name: matchDetails.team2Name,
        wilaya: matchDetails.wilaya,
        commune: matchDetails.commune,
        bookingReference: notification.matchId,
        organizer: matchDetails.fromUser,
      })

      // Open PDF in new window
      const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) {
      toast({ title: 'فشل تحميل PDF', description: 'حدث خطأ عند محاولة تحميل ملف PDF.', variant: 'destructive' })
      console.error('Error generating PDF:', error)
    }
  }

  const handleConfirmBooking = async (notification: Notification) => {
    if (!notification.matchDetails?.bookingId) {
      toast({ title: 'خطأ', description: 'معرّف الحجز غير متاح.', variant: 'destructive' })
      return
    }

    setProcessingRequestIds((prev) => [...prev, notification.matchDetails!.bookingId])

    try {
      await confirmBooking(notification.matchDetails.bookingId, 'confirm')
      toast({ title: 'تم تأكيد الحجز', description: 'تم تأكيد الحجز بنجاح.' })
      
      // Reload notifications to show updated state
      loadNotifications(0)
    } catch (error) {
      toast({ title: 'فشل تأكيد الحجز', description: 'حدث خطأ عند محاولة تأكيد الحجز.', variant: 'destructive' })
      console.error('Error confirming booking:', error)
    } finally {
      setProcessingRequestIds((prev) => prev.filter((id) => id !== notification.matchDetails?.bookingId))
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
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-[#A0A0A0]">All notifications for your account.</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        <button
          onClick={handleMarkRead}
          className="rounded-2xl border border-[#2C2C2C] bg-[#1E1E1E] px-4 py-3 text-sm text-white hover:border-[#FF3B3F]"
        >
          Mark all as read
        </button>

        {loading ? (
          <div className="text-white">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 text-center text-[#A0A0A0]">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-3xl border p-4 ${notification.read ? 'border-[#2C2C2C] bg-[#121212]' : 'border-[#FF3B3F] bg-[#1E1E1E]'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-white font-semibold">{notification.title}</h2>
                    <p className="mt-1 text-sm text-[#A0A0A0]">{notification.message}</p>
                  </div>
                  <span className={`text-xs ${notification.read ? 'text-[#6B7280]' : 'text-[#FF3B3F]'}`}>
                    {notification.read ? 'Read' : 'New'}
                  </span>
                </div>
                {notification.requestId && notification.type === 'team_request' && notification.requestStatus === 'pending' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleRequestResponse(notification, 'accepted')}
                      disabled={processingRequestIds.includes(notification.requestId)}
                      className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                    >
                      قبول
                    </Button>
                    <Button
                      onClick={() => handleRequestResponse(notification, 'rejected')}
                      disabled={processingRequestIds.includes(notification.requestId)}
                      className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
                    >
                      رفض
                    </Button>
                    <Button
                      onClick={() => handleDeleteRequest(notification)}
                      disabled={processingRequestIds.includes(notification.requestId)}
                      className="bg-[#6b7280] hover:bg-[#4b5563] text-white"
                    >
                      حذف الطلب
                    </Button>
                  </div>
                )}
                {notification.requestId && notification.type === 'team_request' && notification.requestStatus !== 'pending' && (
                  <div className="mt-4 p-3 bg-[#2C2C2C] rounded-lg text-sm text-[#A0A0A0]">
                    تم {notification.requestStatus === 'accepted' ? 'قبول' : 'رفض'} هذا الطلب بالفعل ولا يمكن تغيير الرد
                  </div>
                )}
                {notification.requestId && notification.type === 'match_invite' && notification.requestStatus === 'pending' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleRequestResponse(notification, 'accepted')}
                      disabled={processingRequestIds.includes(notification.requestId)}
                      className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                    >
                      قبول العرض
                    </Button>
                    <Button
                      onClick={() => handleRequestResponse(notification, 'rejected')}
                      disabled={processingRequestIds.includes(notification.requestId)}
                      className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
                    >
                      رفض العرض
                    </Button>
                  </div>
                )}
                {notification.requestId && notification.type === 'match_invite' && notification.requestStatus !== 'pending' && (
                  <div className="mt-4 p-3 bg-[#2C2C2C] rounded-lg text-sm text-[#A0A0A0]">
                    تم {notification.requestStatus === 'accepted' ? 'قبول' : 'رفض'} هذا العرض بالفعل ولا يمكن تغيير الرد
                  </div>
                )}
                {notification.requestId && notification.type === 'match_invite_accepted' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleCancelBooking(notification)}
                      disabled={processingRequestIds.includes(notification.requestId)}
                      className="min-w-[140px] py-3 px-5 text-sm rounded-2xl bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-lg shadow-[#ef4444]/20 transition-all"
                    >
                      إلغاء الحجز
                    </Button>
                    <Button
                      onClick={() => {
                        // Redirect to bookings page with match details
                        const bookingParams = new URLSearchParams({
                          requestId: notification.requestId,
                          isTeamBooking: 'true',
                        });
                        router.push(`/bookings?${bookingParams.toString()}`);
                      }}
                      className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                    >
                      تأكيد الحجز
                    </Button>
                  </div>
                )}
                {notification.invitationId && notification.type === 'match_invitation' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleMatchInvitationResponse(notification, 'accept')}
                      disabled={processingRequestIds.includes(notification.invitationId!)}
                      className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                    >
                      الموافقة
                    </Button>
                    <Button
                      onClick={() => handleMatchInvitationResponse(notification, 'change_court')}
                      disabled={processingRequestIds.includes(notification.invitationId!)}
                      className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                    >
                      تغيير الملعب
                    </Button>
                    <Button
                      onClick={() => handleMatchInvitationResponse(notification, 'change_time')}
                      disabled={processingRequestIds.includes(notification.invitationId!)}
                      className="bg-[#f59e0b] hover:bg-[#d97706] text-white"
                    >
                      تغيير التوقيت
                    </Button>
                    <Button
                      onClick={() => handleMatchInvitationResponse(notification, 'reject')}
                      disabled={processingRequestIds.includes(notification.invitationId!)}
                      className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
                    >
                      الرفض
                    </Button>
                  </div>
                )}
                {notification.invitationId && notification.type === 'match_confirmed_both' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleDownloadPDF(notification)}
                      disabled={processingRequestIds.includes(notification.invitationId!)}
                      className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                    >
                      📥 تحميل PDF
                    </Button>
                    <Button
                      onClick={() => handleMatchInvitationResponse(notification, 'cancel')}
                      disabled={processingRequestIds.includes(notification.invitationId!)}
                      className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
                    >
                      إلغاء المباراة
                    </Button>
                  </div>
                )}
                {notification.type === 'match_confirmed_both' && notification.matchDetails?.bookingId && !notification.invitationId && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleDownloadPDF(notification)}
                      disabled={processingRequestIds.includes(notification.matchDetails?.bookingId)}
                      className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                    >
                      📥 تحميل معلومات الحجز PDF
                    </Button>
                  </div>
                )}
                {notification.invitationId && 
                  (notification.type === 'match_invitation_court_change_requested' || 
                   notification.type === 'match_invitation_time_change_requested') && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        const changeType = notification.type === 'match_invitation_court_change_requested' ? 'court' : 'time';
                        router.push(`/bookings?invitationId=${notification.invitationId}&changeType=${changeType}`);
                      }}
                      className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                    >
                      إجراء التغيير
                    </Button>
                  </div>
                )}
                <div className="mt-3 text-xs text-[#6B7280]">{new Date(notification.createdAt).toLocaleString()}</div>
              </div>
            ))}
            <div ref={loaderRef} className="h-12 flex items-center justify-center">
              {loadingMore ? (
                <div className="text-sm text-[#A0A0A0]">Loading more...</div>
              ) : hasMore ? (
                <div className="text-sm text-[#6B7280]">Scroll to load more notifications</div>
              ) : (
                <div className="text-sm text-[#6B7280]">No more notifications</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
