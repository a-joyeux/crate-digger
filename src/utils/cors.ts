const PROXY_URL = import.meta.env.VITE_PROXY_URL as string | undefined

export function archiveUrl(path: string): string {
  if (PROXY_URL) {
    return `${PROXY_URL}?url=${encodeURIComponent(`https://archive.org${path}`)}`
  }
  return `https://archive.org${path}`
}