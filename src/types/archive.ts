export interface FilterState {
  decade: string | null
  genres: string[]
}

export interface Track {
  identifier: string
  title: string
  artist: string
  year: string
  audioUrl: string
}

export interface ArchiveSearchDoc {
  identifier: string
  title?: string
  creator?: string | string[]
  date?: string
  subject?: string | string[]
}

export interface ArchiveSearchResponse {
  response: {
    numFound: number
    start: number
    docs: ArchiveSearchDoc[]
  }
}

export interface ArchiveFile {
  name: string
  format: string
  size?: string
  source?: string
}

export interface ArchiveFilesResponse {
  files: ArchiveFile[]
  metadata?: {
    title?: string | string[]
    creator?: string | string[]
    date?: string | string[]
  }
}