import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getConversationList,
  createConversation,
  getConversationHistory,
} from '@/api/services/agent/conversation'
import { sendChatMessage } from '@/api/services/agent/chat'
import type { Conversation, ChatMessage,OcrResultItem  } from '@/types/agent/agent'

export function useChatConversation() {
  const conversations = ref<Conversation[]>([])
  const currentSessionId = ref('')
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const loadingHistory = ref(false)
  const messageListRef = ref<HTMLElement | null>(null)

  async function addOcrResult(results: OcrResultItem[]) {
    if (!results.length) return
    // 将 OCR 结果格式化为文本
    const content = results.map((item) => `**${item.filename}**\n${item.text}`).join('\n\n---\n\n')
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      bot: content,
      thinking: '',
      thinkingDone: false,
      duration: '', // 可设置识别耗时，这里简单留空
    }
    messages.value.push(assistantMsg)
    scrollToBottom()
  }

  async function scrollToBottom() {
    await nextTick()
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  }

  async function loadConversations() {
    try {
      conversations.value = await getConversationList()
      if (conversations.value.length > 0 && !currentSessionId.value) {
        const first = conversations.value[0]
        if (first) {
          currentSessionId.value = first.session_id
          await loadHistory(currentSessionId.value)
        }
      }
    } catch (error) {
      console.error('加载会话列表失败', error)
      ElMessage.error('加载会话列表失败')
    }
  }

  async function startNewConversation() {
    try {
      const data = await createConversation()
      currentSessionId.value = data.session_id
      messages.value = []
      await loadConversations()
    } catch (error) {
      console.error('新建会话失败', error)
      ElMessage.error('新建会话失败')
    }
  }

  async function selectConversation(sessionId: string) {
    currentSessionId.value = sessionId
    await loadHistory(sessionId)
  }

  async function loadHistory(sessionId: string) {
    if (!sessionId) return
    loadingHistory.value = true
    messages.value = []
    try {
      const data = await getConversationHistory(sessionId)
      const rawMessages = data.messages || []
      const history: ChatMessage[] = []
      for (const item of rawMessages) {
        if (item.role === 'user') {
          history.push({ role: 'user', user: item.content })
        } else if (item.role === 'assistant') {
          history.push({ role: 'assistant', bot: item.content || '' })
        }
      }
      messages.value = history
      await scrollToBottom()
    } catch (error) {
      console.error('加载历史消息失败', error)
      ElMessage.error('加载历史消息失败')
    } finally {
      loadingHistory.value = false
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading.value) return

    if (!currentSessionId.value) {
      await startNewConversation()
      if (!currentSessionId.value) return
    }

    const startTime = Date.now()
    loading.value = true

    const previousCount = messages.value.length

    messages.value.push({ role: 'user', user: trimmed })

    const assistantMsg: ChatMessage = {
      role: 'assistant',
      bot: '',
      thinking: '',
      thinkingDone: false,
      duration: '',
    }
    messages.value.push(assistantMsg)
    const currentMsg = messages.value[messages.value.length - 1]!
    await scrollToBottom()

    const isFirstMessage = previousCount === 0

    try {
      const response = await sendChatMessage(trimmed, currentSessionId.value)
      const contentType = response.headers.get('Content-Type') || ''

      if (contentType.includes('application/json')) {
        const data = await response.json()
        if (data.type === 'image') {
          currentMsg.imageUrl = 'data:image/png;base64,' + data.image_base64
          currentMsg.bot = '[图片已生成]'
        } else if (data.type === 'multi') {
          let textParts: string[] = []
          for (const item of data.results || []) {
            if (item.type === 'text' && item.content) {
              textParts.push(item.content)
            } else if (item.type === 'image') {
              if (!currentMsg.imageUrl && item.image_base64) {
                currentMsg.imageUrl = 'data:image/png;base64,' + item.image_base64
              }
              textParts.push('[图片已生成]')
            }
          }
          currentMsg.bot = textParts.join('\n\n')
        } else {
          currentMsg.bot = data.content || ''
        }
        await scrollToBottom()
      } else {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        let thinkingActive = false
        let answerActive = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          while (buffer.length > 0) {
            const char = buffer.charAt(0)
            buffer = buffer.slice(1)

            if (!thinkingActive && !answerActive) {
              if (char === '<' && buffer.startsWith('think>')) {
                buffer = buffer.slice(6)
                thinkingActive = true
                currentMsg.thinkingDone = false
                continue
              } else {
                answerActive = true
                currentMsg.bot = (currentMsg.bot || '') + char
              }
            } else if (thinkingActive) {
              if (char === '<' && buffer.startsWith('/think>')) {
                buffer = buffer.slice(7)
                thinkingActive = false
                currentMsg.thinkingDone = true
                continue
              } else {
                currentMsg.thinking = (currentMsg.thinking || '') + char
              }
            } else {
              currentMsg.bot = (currentMsg.bot || '') + char
            }
          }
          await scrollToBottom()
        }

        if (thinkingActive) {
          thinkingActive = false
          currentMsg.thinkingDone = true
        }
      }
    } catch (error) {
      console.error('请求失败', error)
      currentMsg.bot = (currentMsg.bot || '') + '\n[请求失败，请稍后重试]'
      await scrollToBottom()
    } finally {
      loading.value = false
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
      currentMsg.duration = elapsed
      await scrollToBottom()

      if (isFirstMessage) {
        setTimeout(() => {
          loadConversations()
        }, 3000)
      }
    }
  }

  return {
    conversations,
    currentSessionId,
    messages,
    loading,
    loadingHistory,
    messageListRef,
    loadConversations,
    startNewConversation,
    selectConversation,
    sendMessage,
    scrollToBottom,
    addOcrResult,
  }
}
