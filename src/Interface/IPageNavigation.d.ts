export interface IPageNavigationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}
