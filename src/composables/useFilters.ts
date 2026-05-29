import { reactive } from 'vue'
import type { FilterState } from '../types/archive'

export const DECADES = ['1920s', '1930s', '1940s', '1950s', '1960s', '1970s'] as const
export const GENRES = [
  'Jazz', 'Soul', 'Funk', 'Blues', 'R&B',
  'Gospel', 'Swing', 'Big Band',
  'Disco', 'Reggae', 'Latin',
  'Folk', 'Country', 'Classical',
] as const

const ALLOWED_DECADES = new Set<string>(DECADES)
const ALLOWED_GENRES = new Set<string>(GENRES)

// Maps display label → IA Solr subject tag (verified against live data)
const GENRE_TAGS: Record<string, string> = {
  'Jazz':       'jazz',
  'Soul':       'soul',
  'Funk':       'funk',
  'Blues':      'blues',
  'R&B':        'rhythm+and+blues',   // "r&b" returns 0 in Solr; this tag has 34k items
  'Gospel':     'gospel',
  'Swing':      'swing',
  'Big Band':   'big+band',
  'Disco':      'disco',
  'Reggae':     'reggae',
  'Latin':      'latin',
  'Folk':       'folk',
  'Country':    'country',
  'Classical':  'classical',
}

const DECADE_RANGES: Record<string, [number, number]> = {
  '1920s': [1920, 1929],
  '1930s': [1930, 1939],
  '1940s': [1940, 1949],
  '1950s': [1950, 1959],
  '1960s': [1960, 1969],
  '1970s': [1970, 1979],
}

// Collections curated for pre-1960 vinyl — too narrow for later decades
const VINYL_ERA_DECADES = new Set(['1920s', '1930s', '1940s', '1950s'])

export function useFilters() {
  const filters = reactive<FilterState>({ decade: null, genres: [] })

  function setDecade(decade: string | null): void {
    filters.decade = decade !== null && ALLOWED_DECADES.has(decade) ? decade : null
  }

  function toggleGenre(genre: string): void {
    if (!ALLOWED_GENRES.has(genre)) return
    const idx = filters.genres.indexOf(genre)
    if (idx === -1) {
      filters.genres.push(genre)
    } else {
      filters.genres.splice(idx, 1)
    }
  }

  function clearGenres(): void {
    filters.genres.splice(0)
  }

  function buildQuery(): string {
    const parts: string[] = ['mediatype:audio']

    const decadeIsVinylEra = filters.decade === null || VINYL_ERA_DECADES.has(filters.decade)
    if (decadeIsVinylEra && filters.genres.length === 0) {
      parts.push('collection:(georgeblood OR great78 OR 78rpm)')
    }

    if (filters.decade !== null && ALLOWED_DECADES.has(filters.decade)) {
      const [start, end] = DECADE_RANGES[filters.decade]!
      parts.push(`year:[${start} TO ${end}]`)
    }

    const validGenres = filters.genres.filter(g => ALLOWED_GENRES.has(g))
    if (validGenres.length === 1) {
      parts.push(`subject:${GENRE_TAGS[validGenres[0]!]}`)
    } else if (validGenres.length > 1) {
      const tags = validGenres.map(g => GENRE_TAGS[g]).join(' OR ')
      parts.push(`subject:(${tags})`)
    }

    return parts.join(' AND ')
  }

  return { filters, setDecade, toggleGenre, clearGenres, buildQuery }
}