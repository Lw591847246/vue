import chatRequest from '../index'

export interface ChatParams {
  text: string
  session_id: string
}

export interface ChatResultItem {
  type: 'text' | 'image'
  content?: string
  image_base64?: string
}

export interface ChatResponse {
  type: string
  content?: string
  image_base64?: string
  results?: ChatResultItem[]
}

export function sendChatMessage(data: ChatParams) {
  return chatRequest.post<ChatResponse>('/chat', data)
}
