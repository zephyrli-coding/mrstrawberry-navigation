import client from './client'

/**
 * 导出数据
 */
export async function exportData(): Promise<void> {
  // 使用 axios 请求带上认证头
  const response = await client.get('/export-import/export', {
    responseType: 'blob',
  })

  // 从响应头获取文件名，或使用默认名称
  const contentDisposition = response.headers['content-disposition']
  let filename = 'backup.json'
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/)
    if (match) filename = match[1]
  }

  // 创建下载链接
  const blob = new Blob([response.data], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 导入数据
 * @param file JSON 文件
 * @param mode 'merge' | 'replace'
 */
export async function importData(
  file: File,
  mode: 'merge' | 'replace' = 'merge',
): Promise<{
  success: boolean
  imported_categories: number
  imported_bookmarks: number
  errors: string[] | null
  version: string
}> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await client.post('/export-import/import', formData, {
    params: { mode },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}

/**
 * 验证导入文件
 * @param file JSON 文件
 */
export async function validateImportFile(file: File): Promise<{
  valid: boolean
  version?: string
  app?: string
  categories_count?: number
  bookmarks_count?: number
  error?: string
}> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await client.post('/export-import/validate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}
