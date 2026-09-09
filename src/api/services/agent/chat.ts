import { fetchWithAuth } from '@/utils/fetch'

export async function sendChatMessage(
  text: string,
  sessionId: string,
): Promise<Response> {
  const response = await fetchWithAuth('/agent/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, session_id: sessionId }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response
}