<template>
  <div class="chat-dashboard">
    <!-- 左侧会话栏 -->
    <ConversationSidebar
      :collapsed="sidebarCollapsed"
      :conversations="conversations"
      :current-session-id="currentSessionId"
      @new-conversation="handleNewConversation"
      @select-conversation="handleSelectConversation"
    />

    <!-- 右侧聊天主区域 -->
    <div class="chat-main">
      <!-- 折叠/展开按钮（所有设备显示） -->
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

        <!-- 消息列表 -->
        <ChatMessageList
          v-else-if="messages.length > 0"
          ref="messageListRef"
          :messages="messages"
        />

        <!-- OCR 组件（可切换显示） -->
        <OcrUploader
          v-if="showOcr"
          @ocr-results="handleOcrResults"
        />

        <!-- 输入区 -->
        <ChatInput
          :loading="loading"
          @send="handleSend"
          @toggle-ocr="showOcr = !showOcr"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ConversationSidebar from './components/ConversationSidebar.vue'
import ChatMessageList from './components/ChatMessageList.vue'
import ChatInput from './components/ChatInput.vue'
import OcrUploader from './components/OcrUploader.vue'
import { useChatConversation } from '@/composables/useChatConversation'
import type { OcrResultItem } from '@/types/agent/agent'

const {
  conversations,
  currentSessionId,
  messages,
  loading,
  loadingHistory,
  loadConversations,
  startNewConversation,
  selectConversation,
  sendMessage,
  addOcrResult,
} = useChatConversation()

const sidebarCollapsed = ref(false)
const showOcr = ref(false)
const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null)

function isMobile() {
  return window.innerWidth < 768
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

async function handleNewConversation() {
  await startNewConversation()
  if (isMobile()) {
    sidebarCollapsed.value = true
  }
}

async function handleSelectConversation(sessionId: string) {
  await selectConversation(sessionId)
  if (isMobile()) {
    sidebarCollapsed.value = true
  }
}

async function handleSend(text: string) {
  await sendMessage(text)
}

function handleResize() {
  if (isMobile()) {
    sidebarCollapsed.value = true
  } else {
    sidebarCollapsed.value = false
  }
}

function handleOcrResults(results: OcrResultItem[]) {
  addOcrResult(results)
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  loadConversations()
})


onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.chat-dashboard {
  display: flex;
  height: 100%;
  background: #fff;
  overflow: hidden;
  box-sizing: border-box;
}
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  min-width: 0;
}

.toggle-btn {
  display: flex;
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
  transition: background 0.2s;
}
.toggle-btn:hover {
  background: #f0f0f0;
}
.chat-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 20px;
  overflow: hidden;
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

/* 移动端样式 */
@media (max-width: 768px) {
  .chat-page {
    padding: 10px;
  }
}
</style>