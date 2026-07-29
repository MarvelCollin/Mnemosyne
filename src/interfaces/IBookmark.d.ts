export interface IBookmark {
  page: number
  label: string
  timestamp: number
}

export interface IBookmarkControls {
  bookmarks: IBookmark[]
  isBookmarked: (page: number) => boolean
  toggle: (page: number) => void
  remove: (index: number) => void
  clear: () => void
}
