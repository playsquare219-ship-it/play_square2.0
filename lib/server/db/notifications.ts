import { db } from '@/lib/server/firebase/firestore'
import { Timestamp } from 'firebase-admin/firestore'
import type { Notification } from '@/types'

const NOTIFICATIONS_COLLECTION = 'notifications'
const TEAM_REQUESTS_COLLECTION = 'team_join_requests'
const MATCH_REQUESTS_COLLECTION = 'match_requests'

export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
  const now = Timestamp.now()
  const notificationId = `notification_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  const newNotification: Omit<Notification, 'id' | 'createdAt'> & { createdAt: Timestamp } = {
    userId: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: false,
    createdAt: now,
    ...(notification.teamId !== undefined ? { teamId: notification.teamId } : {}),
    ...(notification.requestId !== undefined ? { requestId: notification.requestId } : {}),
    ...(notification.matchId !== undefined ? { matchId: notification.matchId } : {}),
  }

  const notificationRef = db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId)
  await notificationRef.set(newNotification)

  return {
    id: notificationId,
    userId: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: false,
    createdAt: now.toDate().toISOString(),
    ...(notification.teamId !== undefined ? { teamId: notification.teamId } : {}),
    ...(notification.requestId !== undefined ? { requestId: notification.requestId } : {}),
    ...(notification.matchId !== undefined ? { matchId: notification.matchId } : {}),
  }
}

interface NotificationPageResult {
  notifications: Notification[]
  hasMore: boolean
}

async function buildNotificationsFromSnapshot(querySnapshot: any): Promise<Notification[]> {
  const notifications: Notification[] = []

  for (const doc of querySnapshot.docs) {
    const data = doc.data() as any
    let requestStatus: Notification['requestStatus'] = undefined

    if (data.requestId && (data.type === 'team_request' || data.type === 'match_invite')) {
      try {
        const teamReqDoc = await db.collection(TEAM_REQUESTS_COLLECTION).doc(data.requestId).get()
        if (teamReqDoc.exists) {
          requestStatus = teamReqDoc.data()?.status as any
        } else {
          const matchReqDoc = await db.collection(MATCH_REQUESTS_COLLECTION).doc(data.requestId).get()
          if (matchReqDoc.exists) {
            requestStatus = matchReqDoc.data()?.status as any
          }
        }
      } catch (error) {
        console.error('Error fetching request status:', error)
      }
    }

    notifications.push({
      id: doc.id,
      userId: data.userId,
      teamId: data.teamId,
      requestId: data.requestId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: data.read,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || String(data.createdAt),
      requestStatus,
    })
  }

  return notifications
}

export async function getNotificationsForUser(userId: string, limit = 5, offset = 0): Promise<NotificationPageResult> {
  const querySnapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .offset(offset)
    .limit(limit + 1)
    .get()

  const notifications = await buildNotificationsFromSnapshot(querySnapshot)
  return {
    notifications: notifications.slice(0, limit),
    hasMore: notifications.length > limit,
  }
}

export async function getNotificationsForTeam(teamId: string, limit = 5, offset = 0): Promise<NotificationPageResult> {
  const querySnapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('teamId', '==', teamId)
    .orderBy('createdAt', 'desc')
    .offset(offset)
    .limit(limit + 1)
    .get()

  const notifications = await buildNotificationsFromSnapshot(querySnapshot)
  return {
    notifications: notifications.slice(0, limit),
    hasMore: notifications.length > limit,
  }
}

export async function markNotificationsReadForUser(userId: string): Promise<void> {
  const querySnapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get()

  const batch = db.batch()
  querySnapshot.forEach((doc) => {
    batch.update(doc.ref, { read: true })
  })

  await batch.commit()
}
