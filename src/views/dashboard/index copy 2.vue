<template>
  <div class="chat-dashboard">
    <!-- 左侧会话栏 -->
    <div class="chat-sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="sidebar-actions">
          <el-button type="primary" class="new-chat-btn" @click="handleNewConversation">
            <el-icon><plus /></el-icon>
            <span>新对话</span>
          </el-button>
          <!-- 桌面端折叠按钮 -->
          <el-icon class="collapse-btn" @click="toggleSidebar">
            <fold v-if="!sidebarCollapsed" />
            <expand v-else />
          </el-icon>
        </div>
      </div>
      <div class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.session_id"
          class="conversation-item"
          :class="{ active: conv.session_id === currentSessionId }"
          @click="handleSelectConversation(conv.session_id)"
        >
          <span class="conversation-title">{{ conv.title || '未命名对话' }}</span>
        </div>
        <div v-if="conversations.length === 0" class="empty-tip">
          暂无会话
        </div>
      </div>
    </div>

    <!-- 右侧聊天主区域 -->
    <div class="chat-main">
      <!-- 移动端悬浮折叠按钮 -->
      <div class="toggle-btn" @click="toggleSidebar">
        <el-icon>
          <expand v-if="sidebarCollapsed" />
          <fold v-else />
        </el-icon>
      </div>

      <!-- 聊天窗口 -->
      <div class="chat-page" :class="{ 'has-messages': messages.length > 0 }">
        <!-- 加载历史提示 -->
        <div v-if="loadingHistory" class="history-loading">
          <el-icon class="is-loading"><loading /></el-icon>
          <span>加载历史消息...</span>
        </div>

        <div v-else-if="messages.length > 0" ref="messageListRef" class="message-list">
          <div v-for="(msg, index) in messages" :key="index" class="message-item" :class="msg.role">
            <!-- 用户消息（右侧） -->
            <div v-if="msg.role === 'user'" class="user-message">
              <div class="user-content">{{ msg.user }}</div>
            </div>
            <!-- 机器人消息（左侧） -->
            <div v-else class="bot-message">
              <!-- 思考区域 -->
              <div v-if="msg.thinking || msg.thinkingDone" class="thinking-header">
                {{ msg.thinkingDone ? '已思考' : '正在思考...' }}
              </div>
              <div v-if="msg.thinking" class="thinking-content">{{ msg.thinking }}</div>

              <!-- 图片显示 -->
              <div v-if="msg.imageUrl" class="image-content">
                <img :src="msg.imageUrl" alt="生成图片" />
              </div>

              <!-- 文本/代码渲染 -->
              <div class="answer-content" v-html="renderBotContent(msg.bot || '')"></div>

              <div v-if="msg.duration" class="duration-info">
                耗时 {{ msg.duration }} 秒
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="input-area">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="4"
            placeholder="请输入消息，Enter 发送，Shift+Enter 换行"
            resize="none"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <el-button
            type="primary"
            :loading="loading"
            class="send-btn"
            @click="sendMessage"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchWithAuth } from '@/utils/fetch'

interface Conversation {
  session_id: string
  title: string
  created_at?: string
  updated_at?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  user?: string
  bot?: string
  thinking?: string
  thinkingDone?: boolean
  duration?: string
  imageUrl?: string
}

// ========== 响应式状态 ==========
const inputText = ref('')
const loading = ref(false)
const loadingHistory = ref(false)
const currentSessionId = ref('')
const conversations = ref<Conversation[]>([])
const messages = ref<ChatMessage[]>([])
const messageListRef = ref<HTMLElement | null>(null)

const sidebarCollapsed = ref(false)

// ========== 工具函数 ==========
function isMobile() {
  return window.innerWidth < 768
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderBotContent(text: string): string {
  const escaped = escapeHtml(text)
  const regex = /```(\w*)\n?([\s\S]*?)```/g
  let result = ''
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(escaped)) !== null) {
    const language = match[1] || 'text'
    const code = match[2]
    result += escaped.slice(lastIndex, match.index)
    result += `<pre class="code-block"><code class="language-${language}">${code}</code></pre>`
    lastIndex = regex.lastIndex
  }
  result += escaped.slice(lastIndex)
  return result
}

async function scrollToBottom() {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// ========== 会话管理 ==========
async function loadConversations() {
  try {
    const response = await fetchWithAuth('/agent/v1/conversations')
    if (!response.ok) throw new Error('加载会话失败')
    const data = await response.json()
    conversations.value = data || []
    if (conversations.value.length > 0 && !currentSessionId.value) {
      currentSessionId.value = conversations.value[0]!.session_id
      await loadHistory(currentSessionId.value)
    }
  } catch (error) {
    console.error('加载会话列表失败', error)
    ElMessage.error('加载会话列表失败')
  }
}

async function handleNewConversation() {
  try {
    const response = await fetchWithAuth('/agent/v1/conversation/new', { method: 'POST' })
    if (!response.ok) throw new Error('创建会话失败')
    const data = await response.json()
    currentSessionId.value = data.session_id
    messages.value = []
    inputText.value = ''
    await loadConversations()
    if (isMobile()) {
      sidebarCollapsed.value = true
    }
  } catch (error) {
    console.error('新建会话失败', error)
    ElMessage.error('新建会话失败')
  }
}

async function handleSelectConversation(sessionId: string) {
  currentSessionId.value = sessionId
  inputText.value = ''
  if (isMobile()) {
    sidebarCollapsed.value = true
  }
  await loadHistory(sessionId)
}

// 加载历史消息
async function loadHistory(sessionId: string) {
  if (!sessionId) return
  loadingHistory.value = true
  messages.value = []
  try {
    const response = await fetchWithAuth(`/agent/v1/conversation/${sessionId}/messages`)
    if (!response.ok) throw new Error('加载历史消息失败')
    const data = await response.json()
    // 后端返回格式：{ session_id: string, messages: [{role, content, created_at}] }
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

// ========== 消息发送 ==========
async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  if (!currentSessionId.value) {
    await handleNewConversation()
    if (!currentSessionId.value) return
  }

  const startTime = Date.now()
  loading.value = true

  // 记录发送前的消息数，用于判断是否为该会话第一条消息
  const previousMessageCount = messages.value.length

  // 添加用户消息
  messages.value.push({ role: 'user', user: text })
  // 添加机器人占位消息
  const assistantMsg: ChatMessage = {
    role: 'assistant',
    bot: '',
    thinking: '',
    thinkingDone: false,
    duration: '',
  }
  messages.value.push(assistantMsg)
  const currentMsg = messages.value[messages.value.length - 1]!

  inputText.value = ''
  await scrollToBottom()

  const isFirstMessage = previousMessageCount === 0

  try {
    const response = await fetchWithAuth('/agent/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, session_id: currentSessionId.value }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

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

onMounted(() => {
  loadConversations()
})
</script>

<style scoped>
.chat-dashboard {
  display: flex;
  height: 100%;
  background: #fff;
  overflow: hidden;
}

/* ========== 左侧会话栏 ========== */
.chat-sidebar {
  width: 260px;
  background: #f7f7f9;
  border-right: 1px solid #e5e5e8;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  overflow: hidden;
}

.chat-sidebar.sidebar-collapsed {
  width: 0;
  border-right: none;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e8;
}

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.new-chat-btn {
  flex: 1;
  justify-content: center;
}

.collapse-btn {
  cursor: pointer;
  font-size: 18px;
  color: #666;
  display: none; /* 默认隐藏，桌面端显示 */
}

@media (min-width: 769px) {
  .collapse-btn {
    display: inline-flex;
  }
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.conversation-item {
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  border-radius: 6px;
  margin: 0 8px 4px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.2s;
}

.conversation-item:hover {
  background: #ececf0;
}

.conversation-item.active {
  background: #e0e0e6;
  font-weight: 500;
}

.empty-tip {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 20px;
}

/* ========== 右侧聊天主区域 ========== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 移动端悬浮按钮：默认隐藏，移动端显示 */
.toggle-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  transition: all 0.3s;
}

.chat-page:not(.has-messages) {
  justify-content: center;
  align-items: center;
}

.chat-page.has-messages {
  justify-content: flex-end;
}

.history-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px;
  color: #666;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 8px;
  background: #fff;
  border-radius: 8px;
  scroll-behavior: smooth;
}

/* 消息条目左右布局 */
.message-item.user {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.message-item.assistant {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
}

/* 用户消息气泡 */
.user-message {
  max-width: 70%;
  background: #d9ecff;
  padding: 10px 14px;
  border-radius: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.user-content {
  font-size: 14px;
  line-height: 1.5;
}

/* 机器人消息气泡 */
.bot-message {
  max-width: 80%;
  background: #f7f7f7;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
}

.thinking-header {
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
}

.thinking-content {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 10px;
  border-left: 3px solid #ccc;
  padding-left: 8px;
  white-space: pre-wrap;
}

.image-content img {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}

.answer-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

.duration-info {
  font-size: 0.75rem;
  color: #aaa;
  margin-top: 8px;
  text-align: right;
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.send-btn {
  align-self: flex-end;
}

/* 初始状态输入区居中 */
.chat-page:not(.has-messages) .input-area {
  width: 60%;
  min-width: 300px;
}

/* ========== 移动端响应式 ========== */
@media (max-width: 768px) {
  .chat-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 999;
    width: 260px;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .chat-sidebar:not(.sidebar-collapsed) {
    transform: translateX(0);
  }

  .chat-sidebar.sidebar-collapsed {
    width: 260px;
    transform: translateX(-100%);
  }

  .toggle-btn {
    display: flex;
  }

  .chat-page {
    padding: 10px;
  }

  .input-area {
    max-width: 100%;
  }

  .user-message,
  .bot-message {
    max-width: 90%;
  }
}
</style>
