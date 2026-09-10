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
      <!-- 折叠/展开按钮 -->
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

        <div class="input-area">
          <!-- 隐藏的文件输入 -->
          <input
            type="file"
            multiple
            style="display: none"
            ref="fileInput"
            accept="image/*,.pdf,.doc,.docx"
            @change="handleFileChange"
          />

          <!-- 已选文件列表（文本框上方） -->
          <div v-if="attachedFiles.length > 0" class="file-list">
            <div v-for="(file, index) in attachedFiles" :key="file.name + index" class="file-item">
              <span class="file-name">{{ file.name }}</span>
              <el-icon class="file-remove" @click="removeFile(index)"><close /></el-icon>
            </div>
          </div>

          <!-- 带内部按钮的输入容器 -->
          <div class="input-wrapper">
            <el-input
              v-model="inputText"
              type="textarea"
              :rows="4"
              placeholder="请输入消息，Enter 发送，Shift+Enter 换行；可附加文件一起发送"
              resize="none"
              @keydown.enter.exact.prevent="handleSend"
            />
            <div class="input-actions">
              <el-button class="attach-btn" :icon="Paperclip" circle @click="fileInput?.click()" />
              <el-button
                class="send-btn"
                :class="{ 'is-loading': loading }"
                :disabled="loading"
                @click="handleSend"
              >
                <el-icon v-if="!loading"><ArrowUp /></el-icon>
                <span v-else class="stop-icon"></span>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import ConversationSidebar from './components/ConversationSidebar.vue'
import ChatMessageList from './components/ChatMessageList.vue'
import { useChatConversation } from '@/composables/useChatConversation'
import { ElMessage } from 'element-plus'
import { Paperclip, ArrowUp } from '@element-plus/icons-vue'

const {
  conversations,
  currentSessionId,
  messages,
  loading,
  sendFileMessage, // 新增方法
  loadingHistory,
  loadConversations,
  startNewConversation,
  selectConversation,
  sendMessage,
} = useChatConversation()

const sidebarCollapsed = ref(false)
const inputText = ref('')
const attachedFiles = ref<File[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null)

function isMobile() {
  return window.innerWidth < 768
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

async function handleNewConversation() {
  await startNewConversation()
  if (isMobile()) sidebarCollapsed.value = true
}

async function handleSelectConversation(sessionId: string) {
  await selectConversation(sessionId)
  if (isMobile()) sidebarCollapsed.value = true
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (files && files.length > 0) {
    // 追加文件，并简单去重（按文件名+大小）
    const newFiles = Array.from(files)
    for (const file of newFiles) {
      const exists = attachedFiles.value.some((f) => f.name === file.name && f.size === file.size)
      if (!exists) {
        attachedFiles.value.push(file)
      }
    }
  }
  // 重置输入框值，允许再次选择相同文件
  input.value = ''
}

function removeFile(index: number) {
  attachedFiles.value.splice(index, 1)
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text && attachedFiles.value.length === 0) return

  // 立即清空输入框
  inputText.value = ''
  if (attachedFiles.value.length > 0) {
    try {
      await sendFileMessage(attachedFiles.value, text)
    } finally {
      attachedFiles.value = [] // 确保清空
    }
  } else {
    // 普通文本消息
    await sendMessage(text)
  }
}

function handleResize() {
  if (isMobile()) sidebarCollapsed.value = true
  else sidebarCollapsed.value = false
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

.input-area {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.input-wrapper {
  position: relative;
}

.input-wrapper :deep(.el-textarea__inner) {
  padding-bottom: 50px; /* 为按钮留出空间 */
}

.input-actions {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: flex;
  gap: 8px;
}

.attach-btn,
.send-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid #409eff;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn.is-loading {
  background: #fff;
  color: #409eff;
  border-color: #409eff;
  cursor: not-allowed;
}

.stop-icon {
  width: 12px;
  height: 12px;
  background: #409eff;
  border-radius: 2px;
  display: inline-block;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.file-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 12px;
  color: #333;
}

.file-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-remove {
  cursor: pointer;
  color: #999;
  font-size: 14px;
}
.file-remove:hover {
  color: #f56c6c;
}
/* 移动端不改变布局，只调整间距 */
@media (max-width: 768px) {
  .input-area {
    padding: 0 10px;
  }
  .input-actions {
    right: 8px;
    bottom: 8px;
  }
  .attach-btn,
  .send-btn {
    width: 34px;
    height: 34px;
  }
  .stop-icon {
    width: 10px;
    height: 10px;
  }
}
</style>
