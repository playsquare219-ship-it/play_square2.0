import { db } from '@/lib/server/firebase/firestore'
import { Timestamp } from 'firebase-admin/firestore'
import type { TeamJoinRequest } from '@/types'

const TEAM_REQUESTS_COLLECTION = 'team_join_requests'

export async function createTeamJoinRequest(teamId: string, requesterId: string): Promise<TeamJoinRequest> {
  const now = Timestamp.now()
  const requestId = `team_request_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const newRequest: Omit<TeamJoinRequest, 'id'> = {
    teamId,
    requesterId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }

  const requestRef = db.collection(TEAM_REQUESTS_COLLECTION).doc(requestId)
  await requestRef.set(newRequest)

  return {
    id: requestId,
    teamId,
    requesterId,
    status: 'pending',
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  }
}

export async function getTeamJoinRequests(teamId: string): Promise<TeamJoinRequest[]> {
  const querySnapshot = await db
    .collection(TEAM_REQUESTS_COLLECTION)
    .where('teamId', '==', teamId)
    .orderBy('createdAt', 'desc')
    .get()

  const requests: TeamJoinRequest[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data() as any
    requests.push({
      id: doc.id,
      teamId: data.teamId,
      requesterId: data.requesterId,
      status: data.status,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || String(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || String(data.updatedAt),
    })
  })

  return requests
}

export async function findTeamJoinRequest(teamId: string, requesterId: string): Promise<TeamJoinRequest | null> {
  const querySnapshot = await db
    .collection(TEAM_REQUESTS_COLLECTION)
    .where('teamId', '==', teamId)
    .where('requesterId', '==', requesterId)
    .where('status', '==', 'pending')
    .get()

  if (querySnapshot.empty) {
    return null
  }

  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() } as TeamJoinRequest
}

export async function getTeamJoinRequestById(requestId: string): Promise<TeamJoinRequest | null> {
  const requestRef = db.collection(TEAM_REQUESTS_COLLECTION).doc(requestId)
  const requestDoc = await requestRef.get()

  if (!requestDoc.exists) {
    return null
  }

  const data = requestDoc.data() as any
  return {
    id: requestDoc.id,
    teamId: data.teamId,
    requesterId: data.requesterId,
    status: data.status,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || String(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || String(data.updatedAt),
  }
}

export async function updateTeamJoinRequestStatus(
  requestId: string,
  status: TeamJoinRequest['status']
): Promise<TeamJoinRequest> {
  const requestRef = db.collection(TEAM_REQUESTS_COLLECTION).doc(requestId)
  await requestRef.update({ status, updatedAt: Timestamp.now() })
  const updatedDoc = await requestRef.get()
  const data = updatedDoc.data() as any
  return {
    id: updatedDoc.id,
    teamId: data.teamId,
    requesterId: data.requesterId,
    status: data.status,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || String(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || String(data.updatedAt),
  }
}

export async function deleteTeamJoinRequest(requestId: string): Promise<void> {
  const requestRef = db.collection(TEAM_REQUESTS_COLLECTION).doc(requestId)
  await requestRef.delete()
}
