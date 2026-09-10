export interface Conversation {
  session_id: string
  title: string
  created_at?: string
  updated_at?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  user?: string
  bot?: string
  thinking?: string
  thinkingDone?: boolean
  duration?: string
  imageUrl?: string
  files?: string[]   // 用户消息附带的文件名列表
}

export interface ChatResponse {
  type: string
  content?: string
  image_base64?: string
  results?: ChatResultItem[]
}

export interface ChatResultItem {
  type: 'text' | 'image'
  content?: string
  image_base64?: string
}

export interface OcrResultItem {
  filename: string
  text: string
}

export interface OcrResponse {
  type: 'ocr'
  results: OcrResultItem[]
}

export interface ConversationHistoryResponse {
  session_id: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    created_at: string
  }>
}