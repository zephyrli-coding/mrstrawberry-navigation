export function errorMessage(
  error: any,
  fallback = '操作失败，请重试',
): string {
  if (error?.response?.status === 403)
    return '当前操作未获允许。请刷新页面后重试，或检查账号状态。'
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail))
    return (
      detail
        .map((item) => item.msg)
        .filter(Boolean)
        .join('；') || fallback
    )
  return error?.code === 'ECONNABORTED' ? '请求超时，请稍后重试。' : fallback
}
export function safeWebUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
      ? parsed.href
      : undefined
  } catch {
    return undefined
  }
}
