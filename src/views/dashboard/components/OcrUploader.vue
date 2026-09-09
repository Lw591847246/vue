<template>
  <div class="ocr-uploader">
    <el-upload
      multiple
      :show-file-list="false"
      accept="image/*"
      :before-upload="beforeUpload"
      :http-request="handleUpload"
    >
      <el-button type="primary" plain :loading="loading">
        <el-icon><upload /></el-icon>
        上传图片识别文字
      </el-button>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadImagesForOcr } from '@/api/services/agent/ocr'
import type { OcrResultItem } from '@/types/agent/agent'

const emit = defineEmits<{
  (e: 'ocr-results', results: OcrResultItem[]): void
}>()

const loading = ref(false)

function beforeUpload(file: File) {
  // 保持原有校验
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

async function handleUpload(options: any) {
  const rawFiles: File[] = []
  if (options.fileList) {
    options.fileList.forEach((uploadFile: any) => {
      if (uploadFile.raw) rawFiles.push(uploadFile.raw)
    })
  } else if (options.file instanceof File) {
    rawFiles.push(options.file)
  }
  if (!rawFiles.length) {
    ElMessage.error('未选择文件')
    return
  }

  loading.value = true
  try {
    const data = await uploadImagesForOcr(rawFiles)
    if (data.type === 'ocr' && Array.isArray(data.results)) {
      emit('ocr-results', data.results)
      ElMessage.success('识别完成，结果已加入对话')
    } else {
      throw new Error('返回数据格式错误')
    }
  } catch (error) {
    console.error('OCR 请求失败', error)
    ElMessage.error('OCR 识别失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ocr-uploader {
  display: flex;
  justify-content: flex-end; /* 按钮靠右，可根据需求调整 */
  margin-bottom: 8px;
}
</style>