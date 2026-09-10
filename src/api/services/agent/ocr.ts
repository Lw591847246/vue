import { fetchWithAuth } from '@/utils/fetch'
import type { OcrResponse } from '@/types/agent/agent'

export async function uploadImagesForOcr(files: File[],sessionId: string): Promise<OcrResponse> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  formData.append('session_id', sessionId)

  const response = await fetchWithAuth('/agent/v1/ocr', {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}