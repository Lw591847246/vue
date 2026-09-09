import { fetchWithAuth } from '@/utils/fetch'
import type { Conversation, ConversationHistoryResponse } from '@/types/agent/agent'

const BASE = '/agent/v1'

export async function getConversationList(): Promise<Conversation[]> {
  const response = await fetchWithAuth(`${BASE}/conversations`)
  if (!response.ok) throw new Error('加载会话列表失败')
  return response.json()
}

export async function createConversation(): Promise<{ session_id: string }> {
  const response = await fetchWithAuth(`${BASE}/conversation/new`, { method: 'POST' })
  if (!response.ok) throw new Error('创建会话失败')
  return response.json()
}

export async function getConversationHistory(sessionId: string): Promise<ConversationHistoryResponse> {
  const response = await fetchWithAuth(`${BASE}/conversation/${sessionId}/messages`)
  if (!response.ok) throw new Error('加载历史消息失败')
  return response.json()
}