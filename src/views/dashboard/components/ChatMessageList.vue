<template>
  <div class="message-list" ref="messageListRef">
    <div v-for="(msg, index) in messages" :key="index" class="message-item" :class="msg.role">
      <!-- 用户消息（右侧） -->
      <div v-if="msg.role === 'user'" class="user-message">
        <div class="user-content">{{ msg.user }}</div>
        <div v-if="msg.files && msg.files.length > 0" class="user-files">
          <div v-for="file in msg.files" :key="file" class="user-file-item">📄 {{ file }}</div>
        </div>

        <!-- 操作按钮（复制 / 重新生成） -->
        <div class="message-actions">
          <el-tooltip content="复制本次提问" placement="top">
            <el-icon class="action-icon" @click="handleCopy(index)">
              <CopyDocument />
            </el-icon>
          </el-tooltip>
          <el-tooltip content="重新生成" placement="top">
            <el-icon class="action-icon" @click="handleRegenerate(index)">
              <Refresh />
            </el-icon>
          </el-tooltip>
        </div>
      </div>
      <!-- 机器人消息（左侧） -->
      <div v-else class="bot-message">
        <div v-if="msg.thinking || msg.thinkingDone" class="thinking-header">
          {{ msg.thinkingDone ? '已思考' : '正在思考...' }}
        </div>
        <div v-if="msg.thinking" class="thinking-content">{{ msg.thinking }}</div>

        <div v-if="msg.imageUrl" class="image-content">
          <img :src="msg.imageUrl" alt="生成图片" />
        </div>

        <div class="answer-content" v-html="renderBotContent(msg.bot || '')"></div>
        <!-- 回答完成后才显示：复制按钮在左，耗时在右，整体右对齐 -->
        <div v-if="msg.duration" class="bot-footer">
          <el-tooltip content="复制回答内容" placement="top">
            <el-icon class="copy-answer-icon" @click="handleCopyAnswer(msg)">
              <CopyDocument />
            </el-icon>
          </el-tooltip>
          <span class="duration-info">耗时 {{ msg.duration }} 秒</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ChatMessage } from '@/types/agent/agent'
import { ElMessage } from 'element-plus'

const emit = defineEmits<{
  (e: 'copy', index: number): void
  (e: 'regenerate', index: number): void
}>()
const props = defineProps<{ messages: ChatMessage[] }>()

const messageListRef = ref<HTMLElement | null>(null)

// 复制机器人回答文本内容
async function handleCopyAnswer(msg: ChatMessage) {
  const text = msg.bot || ''
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制回答内容')
  } catch (err) {
    // 兼容 fallback
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('已复制回答内容')
    } catch (e) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textarea)
  }
}

function handleCopy(index: number) {
  emit('copy', index)
}

function handleRegenerate(index: number) {
  emit('regenerate', index)
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

  // 1. 提取代码块，用占位符替换
  const codeBlocks: string[] = []
  let processed = escaped.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const placeholder = `@@CODE_BLOCK_${codeBlocks.length}@@`
    codeBlocks.push(
      `<pre class="code-block"><code class="language-${lang || 'text'}" style="white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; max-width: 100%;">${code}</code></pre>`,
    )
    return placeholder
  })

  // 2. 处理标题（## 和 ###  ####等）
  processed = processed.replace(/^#{2}\s+(.*)$/gm, '<h2>$1</h2>')
  processed = processed.replace(/^#{3}\s+(.*)$/gm, '<h3>$1</h3>')
  processed = processed.replace(/^#{4}\s+(.*)$/gm, '<h4>$1</h4>')

  // 可根据需要继续添加 h4, h5

  // 3. 处理无序列表（* 或 - 开头）
  // 先将连续的列表项包裹在 <ul> 中
  processed = processed.replace(/((?:^[*\-]\s+.*(?:\n|$))+)/gm, (listBlock) => {
    const items = listBlock
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^[*\-]\s+/, ''))
      .map((item) => `<li>${item}</li>`)
      .join('')
    return `<ul>${items}</ul>`
  })

  // 4. 处理有序列表（数字加点开头）
  processed = processed.replace(/((?:^\d+\.\s+.*(?:\n|$))+)/gm, (listBlock) => {
    const items = listBlock
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s+/, ''))
      .map((item) => `<li>${item}</li>`)
      .join('')
    return `<ol>${items}</ol>`
  })

  // 5. 处理加粗（**text**）
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // 6. 恢复代码块
  processed = processed.replace(/@@CODE_BLOCK_(\d+)@@/g, (_, index) => {
    return codeBlocks[Number(index)] ?? ''
  })
  return processed
}

watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  },
)

// 暴露内部 ref，供父组件滚动控制
defineExpose({ messageListRef })
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 8px;
  background: #fff;
  border-radius: 8px;
  scroll-behavior: smooth;
  min-height: 0;
}

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

/* 操作按钮 */
.message-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}
.action-icon {
  cursor: pointer;
  font-size: 16px;
  color: #999;
  transition: color 0.2s;
}
.action-icon:hover {
  color: #409eff;
}

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
.user-files {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #666;
}
.user-file-item {
  background: rgba(255, 255, 255, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
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
  max-width: 100%; /* 确保不超出父容器 */
  white-space: pre-wrap; /* 保留空格和换行，但允许自动换行 */
  word-break: break-word; /* 在长单词内部断行 */
  overflow-wrap: anywhere; /* 在任意字符处断行，防止溢出 */
  max-width: 100%; /* 确保不超出父容器 */
}

.bot-footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.copy-answer-icon {
  cursor: pointer;
  font-size: 15px;
  color: #999;
  transition: color 0.2s;
}
.copy-answer-icon:hover {
  color: #409eff;
}

.duration-info {
  font-size: 0.75rem;
  color: #aaa;
}

.answer-content :deep(h2) {
  font-size: 1.3em;
  font-weight: bold;
  margin: 10px 0 6px;
  color: #333;
}

.answer-content :deep(h3) {
  font-size: 1.1em;
  font-weight: bold;
  margin: 8px 0 4px;
  color: #444;
}

.answer-content :deep(ul),
.answer-content :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}

.answer-content :deep(li) {
  margin-bottom: 4px;
}
</style>
