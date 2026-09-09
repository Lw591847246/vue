<template>
  <div class="input-area">
    <el-input
      v-model="text"
      type="textarea"
      :rows="4"
      placeholder="请输入消息，Enter 发送，Shift+Enter 换行"
      resize="none"
      @keydown.enter.exact.prevent="handleSend"
    />
    <div class="input-actions">
      <el-button text @click="$emit('toggle-ocr')">
        <el-icon><picture /></el-icon>
        图片识别
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        class="send-btn"
        @click="handleSend"
      >
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'send', text: string): void
  (e: 'toggle-ocr'): void
}>()

const text = ref('')

function handleSend() {
  const trimmed = text.value.trim()
  if (trimmed) {
    emit('send', trimmed)
    text.value = ''
  }
}
</script>

<style scoped>
.input-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  flex-shrink: 0;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.send-btn {
  align-self: flex-end;
}
</style>