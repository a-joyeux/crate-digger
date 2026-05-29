import {ref} from 'vue'
import {archiveUrl} from '../utils/cors'
import {randomInt, randomItem} from '../utils/random'
import type {ArchiveSearchDoc, ArchiveSearchResponse} from '../types/archive'

const MAX_RESULTS = 10_000
const PAGE_SIZE = 10
const RECENT_IDS_MAX = 50

const recentIds = new Set<string>()

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchJson<T>(url: string, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url)
    if (res.status === 429) {
      if (attempt < retries) {
        await sleep(attempt === 0 ? 1000 : 3000)
        continue
      }
      throw new Error('Rate limited')
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<T>
  }
  throw new Error('Max retries exceeded')
}

export function useArchiveSearch() {
  const status = ref<'idle' | 'loading' | 'error'>('idle')
  const error = ref<string | null>(null)

  async function fetchRandomIdentifier(query: string): Promise<string | null> {
    status.value = 'loading'
    error.value = null

    try {
      // Step 1: get total count
      const countUrl = archiveUrl(
        `/advancedsearch.php?q=${encodeURIComponent(query)}&rows=1&output=json&fl[]=identifier`,
      )
      const countData = await fetchJson<ArchiveSearchResponse>(countUrl)
      const numFound = Math.min(countData.response.numFound, MAX_RESULTS)

      if (numFound === 0) {
        status.value = 'idle'
        return null
      }

      // Step 2: pick a random page and fetch PAGE_SIZE results
      const maxPage = Math.max(0, Math.floor(numFound / PAGE_SIZE) - 1)
      const page = randomInt(0, maxPage)
      const pageUrl = archiveUrl(
        `/advancedsearch.php?q=${encodeURIComponent(query)}&rows=${PAGE_SIZE}&page=${page}&output=json&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=date`,
      )
      const pageData = await fetchJson<ArchiveSearchResponse>(pageUrl)
      const docs: ArchiveSearchDoc[] = pageData.response.docs

      if (docs.length === 0) {
        status.value = 'idle'
        return null
      }

      // Pick randomly, avoiding recently played
      const fresh = docs.filter(d => !recentIds.has(d.identifier))
      const pool = fresh.length > 0 ? fresh : docs
      const chosen = randomItem(pool)

      // Track recently played
      recentIds.add(chosen.identifier)
      if (recentIds.size > RECENT_IDS_MAX) {
        const first = recentIds.values().next().value
        if (first !== undefined) recentIds.delete(first)
      }

      status.value = 'idle'
      return chosen.identifier
    } catch (err) {
      status.value = 'error'
      error.value = err instanceof Error ? err.message : 'Unknown error'
      return null
    }
  }

  return { status, error, fetchRandomIdentifier }
}