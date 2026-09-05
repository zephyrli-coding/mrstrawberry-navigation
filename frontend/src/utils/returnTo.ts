const key = 'navigation_return_to'
function valid(path: string | null): path is string {
  return (
    !!path &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.startsWith('/auth/') &&
    !path.startsWith('/login') &&
    !path.includes('\\')
  )
}
export function rememberReturnTo(path: string) {
  if (valid(path)) sessionStorage.setItem(key, path)
}
export function consumeReturnTo() {
  const path = sessionStorage.getItem(key)
  sessionStorage.removeItem(key)
  return valid(path) ? path : '/'
}
