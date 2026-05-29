import { archiveUrl } from '../utils/cors'
import type { Track, ArchiveFilesResponse, ArchiveFile } from '../types/archive'

const IDENTIFIER_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/

function pickAudioFile(files: ArchiveFile[]): ArchiveFile | null {
  const priority = [
    (f: ArchiveFile) => f.format === 'VBR MP3',
    (f: ArchiveFile) => f.format === '128Kbps MP3',
    (f: ArchiveFile) => f.format?.toLowerCase().includes('mp3'),
    (f: ArchiveFile) => f.name.toLowerCase().endsWith('.mp3'),
    (f: ArchiveFile) => f.name.toLowerCase().endsWith('.ogg'),
  ]
  for (const predicate of priority) {
    const match = files.find(predicate)
    if (match) return match
  }
  return null
}

function firstString(v: string | string[] | undefined): string {
  if (!v) return ''
  return Array.isArray(v) ? (v[0] ?? '') : v
}

export function useTrackMetadata() {
  async function fetchTrack(identifier: string): Promise<Track | null> {
    if (!IDENTIFIER_RE.test(identifier)) return null

    try {
      const url = archiveUrl(`/metadata/${encodeURIComponent(identifier)}`)
      const res = await fetch(url)
      if (!res.ok) return null

      const data = (await res.json()) as ArchiveFilesResponse
      const files: ArchiveFile[] = data.files ?? []
      const meta = data.metadata ?? {}

      const audioFile = pickAudioFile(files)
      if (!audioFile) return null

      const audioUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(audioFile.name)}`
      if (!audioUrl.startsWith('https://archive.org/download/')) return null

      return {
        identifier,
        title: firstString(meta.title) || identifier,
        artist: firstString(meta.creator) || 'Unknown',
        year: firstString(meta.date)?.slice(0, 4) || '',
        audioUrl,
      }
    } catch {
      return null
    }
  }

  return { fetchTrack }
}