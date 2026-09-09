<template>
  <div class="chat-sidebar" :class="{ 'sidebar-collapsed': collapsed }">
    <div class="sidebar-header">
      <el-button type="primary" class="new-chat-btn" @click="$emit('new-conversation')">
        <el-icon><plus /></el-icon>
        <span>新对话</span>
      </el-button>
    </div>
    <div class="conversation-list">
      <div
        v-for="conv in conversations"
        :key="conv.session_id"
        class="conversation-item"
        :class="{ active: conv.session_id === currentSessionId }"
        @click="$emit('select-conversation', conv.session_id)"
      >
        <span class="conversation-title">{{ conv.title || '未命名对话' }}</span>
      </div>
      <div v-if="conversations.length === 0" class="empty-tip">
        暂无会话
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Conversation } from '@/types/agent/agent'

defineProps<{
  collapsed: boolean
  conversations: Conversation[]
  currentSessionId: string
}>()

defineEmits<{
  (e: 'new-conversation'): void
  (e: 'toggle-sidebar'): void
  (e: 'select-conversation', sessionId: string): void
}>()
</script>

<style scoped>
.chat-sidebar {
  width: 260px;
  background: #f7f7f9;
  border-right: 1px solid #e5e5e8;
  display: flex;
  flex-direction: column;
  transition: width 0.3s, transform 0.3s;
  overflow: hidden;
  flex-shrink: 0;
}

.chat-sidebar.sidebar-collapsed {
  width: 0;
  border-right: none;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e8;
}

.new-chat-btn {
  width: 100%;
  justify-content: center;
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

/* 移动端抽屉模式 */
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
    border-right: 1px solid #e5e5e8;
  }

  /* 展开状态 */
  .chat-sidebar:not(.sidebar-collapsed) {
    transform: translateX(0);
  }

  /* 折叠状态：保持宽度，但隐藏 */
  .chat-sidebar.sidebar-collapsed {
    width: 260px;
    transform: translateX(-100%);
    border-right: none;
  }
}
</style>