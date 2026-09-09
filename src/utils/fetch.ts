// 封装带认证的 fetch 请求
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  onChunk?: (chunk: string) => void
): Promise<Response> {
  const token = localStorage.getItem('authorization')
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', token)
  }
    // 只有当 body 存在且不是 FormData 时，才自动设置 JSON 头
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // 统一处理 401
  if (response.status === 401) {
    localStorage.removeItem('authorization')
    window.location.href = '/login'
    throw new Error('登录已过期，请重新登录')
  }

  // 如果提供了 onChunk 回调且响应体是流，则逐步读取并调用回调
  if (onChunk && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // 按行或按分隔符处理，这里简单地将每次读取到的块传给回调
      onChunk(buffer)
      buffer = ''
    }
  }

  return response
}