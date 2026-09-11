import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getConversationList,
  createConversation,
  getConversationHistory,
} from '@/api/services/agent/conversation'
import { sendChatMessage } from '@/api/services/agent/chat'
import type { Conversation, ChatMessage, OcrResultItem } from '@/types/agent/agent'
import { fetchWithAuth } from '@/utils/fetch'

export function useChatConversation() {
  const conversations = ref<Conversation[]>([])
  const currentSessionId = ref('')
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const loadingHistory = ref(false)
  const messageListRef = ref<HTMLElement | null>(null)

  // ========== 工具函数 ==========
  async function scrollToBottom() {
    await nextTick()
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  }

  // ========== OCR 结果添加 ==========
  async function addOcrResult(results: OcrResultItem[]) {
    if (!results.length) return
    const content = results.map((item) => `**${item.filename}**\n${item.text}`).join('\n\n---\n\n')
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      bot: content,
      thinking: '',
      thinkingDone: false,
      duration: '',
    }
    messages.value.push(assistantMsg)
    scrollToBottom()
  }

  // ========== 会话管理 ==========
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

  // ========== 文件消息发送 ==========
  async function sendFileMessage(files: File[], text: string) {
    const trimmedText = text.trim()
    if (!files.length && !trimmedText) return
    if (!currentSessionId.value) {
      await startNewConversation()
      if (!currentSessionId.value) return
    }

    const startTime = Date.now()
    loading.value = true

    // 立即添加用户消息（包含提示词和文件名）
    const fileNames = files.map((f) => f.name)
    messages.value.push({
      role: 'user',
      user: trimmedText,
      files: fileNames,
    })

    // 添加助手占位消息
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

    // 构建 FormData
    const formData = new FormData()
    formData.append('session_id', currentSessionId.value)
    formData.append('text', trimmedText)
    files.forEach((file) => formData.append('files', file))

    try {
      const response = await fetchWithAuth('/agent/v1/process-file', {
        method: 'POST',
        body: formData,
        // 不设置 Content-Type，让浏览器自动处理 multipart
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const contentType = response.headers.get('Content-Type') || ''

      if (contentType.includes('application/json')) {
        const data = await response.json()
        if (data.type === 'text') {
          currentMsg.bot = data.content || ''
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
          currentMsg.bot = data.content || '[无返回内容]'
        }
        await scrollToBottom()
      } else {
        // 流式响应处理（与 sendMessage 中的流式解析一致）
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
      console.error('文件处理请求失败', error)
      currentMsg.bot = (currentMsg.bot || '') + '\n[请求失败，请稍后重试]'
      await scrollToBottom()
    } finally {
      loading.value = false
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
      currentMsg.duration = elapsed
      await scrollToBottom()

      // 如果是首条消息（只有一条用户和一条助手），延迟刷新会话列表
      if (messages.value.length === 2) {
        setTimeout(() => {
          loadConversations()
        }, 3000)
      }
    }
  }

  // ========== 复制消息 ==========
  async function copyMessage(index: number) {
    const msg = messages.value[index]
    if (!msg || msg.role !== 'user') return

    const textToCopy = msg.user || ''
    if (!textToCopy) return

    try {
      await navigator.clipboard.writeText(textToCopy)
      ElMessage.success('已复制到剪贴板')
    } catch (err) {
      const textarea = document.createElement('textarea')
      textarea.value = textToCopy
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        ElMessage.success('已复制到剪贴板')
      } catch (e) {
        ElMessage.error('复制失败，请手动复制')
      }
      document.body.removeChild(textarea)
    }
  }

  // ========== 重新生成 ==========
// ========== 重新生成（原位重置助手消息） ==========
async function regenerateMessage(index: number) {
  if (loading.value) return

  const userMsg = messages.value[index]
  if (!userMsg || userMsg.role !== 'user') return
  const text = userMsg.user || ''
  if (!text.trim()) return

  // 找到紧邻其后的助手消息
  const assistantIndex = index + 1
  const assistantMsg = messages.value[assistantIndex]
  if (!assistantMsg || assistantMsg.role !== 'assistant') return

  // 只重置这一条助手消息，用户消息和其他轮次不动
  assistantMsg.bot = ''
  assistantMsg.thinking = ''
  assistantMsg.thinkingDone = false
  assistantMsg.duration = ''
  assistantMsg.imageUrl = undefined

  const startTime = Date.now()
  loading.value = true
  await scrollToBottom()

  try {
    const response = await sendChatMessage(text, currentSessionId.value)
    const contentType = response.headers.get('Content-Type') || ''

    if (contentType.includes('application/json')) {
      const data = await response.json()
      if (data.type === 'image') {
        assistantMsg.imageUrl = 'data:image/png;base64,' + data.image_base64
        assistantMsg.bot = '[图片已生成]'
      } else if (data.type === 'multi') {
        let textParts: string[] = []
        for (const item of data.results || []) {
          if (item.type === 'text' && item.content) {
            textParts.push(item.content)
          } else if (item.type === 'image') {
            if (!assistantMsg.imageUrl && item.image_base64) {
              assistantMsg.imageUrl = 'data:image/png;base64,' + item.image_base64
            }
            textParts.push('[图片已生成]')
          }
        }
        assistantMsg.bot = textParts.join('\n\n')
      } else {
        assistantMsg.bot = data.content || ''
      }
      await scrollToBottom()
    } else {
      // 流式响应
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
              assistantMsg.thinkingDone = false
              continue
            } else {
              answerActive = true
              assistantMsg.bot = (assistantMsg.bot || '') + char
            }
          } else if (thinkingActive) {
            if (char === '<' && buffer.startsWith('/think>')) {
              buffer = buffer.slice(7)
              thinkingActive = false
              assistantMsg.thinkingDone = true
              continue
            } else {
              assistantMsg.thinking = (assistantMsg.thinking || '') + char
            }
          } else {
            assistantMsg.bot = (assistantMsg.bot || '') + char
          }
        }
        await scrollToBottom()
      }
      if (thinkingActive) {
        thinkingActive = false
        assistantMsg.thinkingDone = true
      }
    }
  } catch (error) {
    console.error('重新生成失败', error)
    assistantMsg.bot = (assistantMsg.bot || '') + '\n[重新生成失败，请稍后重试]'
    await scrollToBottom()
  } finally {
    loading.value = false
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    assistantMsg.duration = elapsed
    await scrollToBottom()
  }
}

  // ========== 普通文本消息发送 ==========
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
    sendFileMessage,
    loadConversations,
    startNewConversation,
    selectConversation,
    sendMessage,
    scrollToBottom,
    addOcrResult,
    copyMessage, // 新增
    regenerateMessage, // 新增
  }
}
