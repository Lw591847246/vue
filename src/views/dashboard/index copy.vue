<template>
  <div class="chat-page" :class="{ 'has-messages': messages.length > 0 }">
    <div v-if="messages.length > 0" ref="messageListRef" class="message-list">
      <div v-for="(msg, index) in messages" :key="index" class="message-item">
        <div class="user-message">{{ msg.user }}</div>
        <div class="bot-message">
          <!-- 思考区域标题 -->
          <div v-if="msg.thinking || msg.thinkingDone" class="thinking-header">
            {{ msg.thinkingDone ? '已思考' : '正在思考...' }}
          </div>
          <div v-if="msg.thinking" class="thinking-content">{{ msg.thinking }}</div>

          <div v-if="msg.imageUrl" class="image-content">
            <img :src="msg.imageUrl" alt="生成图片" style="max-width: 100%; border-radius: 8px" />
          </div>

          <div class="answer-content" v-html="renderBotContent(msg.bot)"></div>
          <div v-if="msg.duration" class="duration-info">总耗时：{{ msg.duration }} 秒</div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="4"
        placeholder="请输入你的问题或代码，按 Enter 发送，Shift+Enter 换行..."
        resize="none"
        @keydown.enter.exact.prevent="sendMessage"
      />
      <el-button type="primary" :loading="loading" class="send-btn" @click="sendMessage">
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { fetchWithAuth } from '@/utils/fetch'

const inputText = ref('')
const loading = ref(false)
const messageListRef = ref<HTMLElement | null>(null)

interface ChatMessage {
  user: string
  bot: string
  thinking?: string
  thinkingDone?: boolean
  duration?: string
  imageUrl?: string
}

const messages = ref<ChatMessage[]>([])

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderBotContent(text: string): string {
  const regex = /```(\w*)\n?([\s\S]*?)```/g
  let result = ''
  let lastIndex = 0
  let match: RegExpExecArray | null

  const escaped = escapeHtml(text)
  const regex2 = /```(\w*)\n?([\s\S]*?)```/g
  while ((match = regex2.exec(escaped)) !== null) {
    const language = match[1] || 'text'
    const code = match[2]
    result += escaped.slice(lastIndex, match.index)
    result += `<pre class="code-block"><code class="language-${language}">${code}</code></pre>`
    lastIndex = regex2.lastIndex
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

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  const startTime = Date.now()
  loading.value = true

  const newMsg: ChatMessage = {
    user: text,
    bot: '',
    thinking: '',
    thinkingDone: false,
    duration: '',
  }
  messages.value.push(newMsg)
  const currentMsg = messages.value[messages.value.length - 1]!

  inputText.value = ''
  await scrollToBottom()

  try {

  const response = await fetchWithAuth(
    '/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, session_id: 'user1' }),
    },
    // 可选：如果需要处理流式数据，传入回调；否则省略
    // (chunk) => { /* 处理流式块 */ }
  )

    if (!response.ok || !response.body) {
      throw new Error('网络响应错误')
    }

    const contentType = response.headers.get('Content-Type') || ''

    if (contentType.includes('application/json')) {
      const data = await response.json()
      if (data.type === 'image') {
        currentMsg.imageUrl = 'data:image/png;base64,' + data.image_base64
        currentMsg.bot = '[图片已生成]'
      } else if (data.type === 'multi') {
        // 处理多意图结果，简单方法：将文本结果拼接，图片结果分别显示
        let textParts: string[] = []
        for (const item of data.results) {
          if (item.type === 'text') {
            textParts.push(item.content)
          } else if (item.type === 'image') {
            // 可以添加多个图片，但当前 ChatMessage 只有一个 imageUrl，我们简化：只取第一张图片
            if (!currentMsg.imageUrl) {
              currentMsg.imageUrl = 'data:image/png;base64,' + item.image_base64
            }
            textParts.push('[图片已生成]')
          }
        }
        currentMsg.bot = textParts.join('\n\n')
      } else {
        currentMsg.bot = data.content || ''
      }
    } else {
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')

      let buffer = ''
      let thinkingActive = false
      let answerActive = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        while (buffer.length > 0) {
          const char = buffer[0]
          buffer = buffer.slice(1)

          if (!thinkingActive && !answerActive) {
            if (char === '<' && buffer.startsWith('think>')) {
              buffer = buffer.slice(6)
              thinkingActive = true
              // 进入思考状态，设置 thinkingDone 为 false
              currentMsg.thinkingDone = false
              continue
            } else {
              answerActive = true
              currentMsg.bot += char
            }
          } else if (thinkingActive) {
            if (char === '<' && buffer.startsWith('/think>')) {
              buffer = buffer.slice(7)
              thinkingActive = false
              // 思考结束，标记完成
              currentMsg.thinkingDone = true
              continue
            } else {
              currentMsg.thinking = (currentMsg.thinking || '') + char
            }
          } else {
            currentMsg.bot += char
          }

          await scrollToBottom()
        }
      }
      if (thinkingActive) {
        thinkingActive = false
        currentMsg.thinkingDone = true
      }
    }
  } catch (error) {
    console.error('请求失败', error)
    currentMsg.bot += '\n[请求失败，请稍后重试]'
  } finally {
    loading.value = false
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    currentMsg.duration = elapsed
    await scrollToBottom()
  }
}
</script>

<style scoped>
/* 省略已有样式，新增思考头部样式 */
.thinking-header {
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 4px;
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

.message-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  scroll-behavior: smooth;
}

.message-item {
  margin-bottom: 16px;
}

.user-message {
  background: #e3f2fd;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.bot-message {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
}

.thinking-content {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 8px;
  border-left: 3px solid #ccc;
  padding-left: 8px;
  white-space: pre-wrap;
}

.answer-content {
  white-space: pre-wrap;
  word-break: break-word;
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

.chat-page:not(.has-messages) .input-area {
  width: 60%;
  min-width: 300px;
}
</style>
