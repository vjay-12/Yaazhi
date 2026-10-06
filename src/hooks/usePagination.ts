import { useState, useEffect, useMemo, useRef } from 'react';

export interface UsePaginationOptions<T> {
  items: T[];
  initialPage?: number;
  initialPageSize?: number;
  resetDependencies?: any[];
}

export interface UsePaginationReturn<T> {
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  paginatedItems: T[];
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function usePagination<T>({
  items,
  initialPage = 1,
  initialPageSize = 20,
  resetDependencies = [],
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 whenever any resetDependency changes (e.g. search, filters, sorting)
  const isFirstMount = useRef(true);
  const prevDepsRef = useRef(resetDependencies);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevDepsRef.current = resetDependencies;
      return;
    }

    const hasChanged =
      resetDependencies.length !== prevDepsRef.current.length ||
      resetDependencies.some((dep, idx) => dep !== prevDepsRef.current[idx]);

    if (hasChanged) {
      prevDepsRef.current = resetDependencies;
      setCurrentPage(1);
    }
  }, [resetDependencies]);

  // Auto-clamp if currentPage > totalPages (e.g. after deleting or archiving records)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Safe current page within [1, totalPages]
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Range indices for 1-based display
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);

  // Slice paginated items
  const paginatedItems = useMemo(() => {
    const sliceStart = (safeCurrentPage - 1) * pageSize;
    return items.slice(sliceStart, sliceStart + pageSize);
  }, [items, safeCurrentPage, pageSize]);

  // Helper page navigation
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return {
    currentPage: safeCurrentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    paginatedItems,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage: safeCurrentPage < totalPages,
    hasPreviousPage: safeCurrentPage > 1,
  };
}
