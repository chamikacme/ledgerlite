"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination" 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" 

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  disablePagination?: boolean
  pageCount?: number
  page?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  disablePagination = false,
  pageCount,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  // If pageCount is provided, we assume manual pagination
  const isManual = pageCount !== undefined;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: disablePagination ? undefined : getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: isManual,
    pageCount: pageCount,
    initialState: {
      pagination: {
        pageSize: pageSize || 10,
        pageIndex: page ? page - 1 : 0,
      },
    },
    state: {
      sorting,
      columnFilters,
      pagination: isManual && page !== undefined ? {
        pageIndex: page - 1,
        pageSize: pageSize || 10,
      } : undefined,
    },
    onPaginationChange: (updater) => {
        if (isManual) {
            // updater can be a value or function
            let newPageIndex = page ? page - 1 : 0;
            let newPageSize = pageSize || 10;

            if (typeof updater === 'function') {
                const newState = updater({
                    pageIndex: newPageIndex,
                    pageSize: newPageSize
                });
                newPageIndex = newState.pageIndex;
                newPageSize = newState.pageSize;
            } else {
                 newPageIndex = updater.pageIndex;
                 newPageSize = updater.pageSize;
            }
            
            // Output events
            if (onPageChange && (newPageIndex + 1) !== page) {
                onPageChange(newPageIndex + 1);
            }
            if (onPageSizeChange && newPageSize !== pageSize) {
                onPageSizeChange(newPageSize);
            }

        } else {
            // Internal state update handled by hook if not controlled
        }
    }
  })

  // Pagination Logic
  const pageIndex = table.getState().pagination.pageIndex
  const totalPageCount = table.getPageCount()
  
  // Calculate visible page numbers
  const getVisiblePages = () => {
    const delta = 1 // Number of pages to show on each side of current page
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 0; i < totalPageCount; i++) {
        if (i === 0 || i === totalPageCount - 1 || (i >= pageIndex - delta && i <= pageIndex + delta)) {
            range.push(i)
        }
    }

    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1)
            } else if (i - l !== 1) {
                rangeWithDots.push('...')
            }
        }
        rangeWithDots.push(i)
        l = i
    }

    return rangeWithDots
  }

  return (
    <div>
      {searchKey && (
        <div className="flex items-center py-4">
          <Input
            placeholder="Search..."
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!disablePagination && (
      <div className="flex flex-col-reverse items-center justify-between gap-4 py-4 md:flex-row">
        <div className="flex items-center space-x-2">
           {!isManual ? (
            <>
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
           ) : (
             <>
             <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${pageSize || 10}`}
                onValueChange={(value) => {
                  if(onPageSizeChange) onPageSizeChange(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize || 10} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 30, 40, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
             </>
           )}
        </div>

        <div className="flex-1">

          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => table.previousPage()} 
                  // @ts-ignore
                  disabled={!table.getCanPreviousPage()}
                  className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {getVisiblePages().map((page, i) => (
                  <PaginationItem key={i}>
                      {page === '...' ? (
                          <PaginationEllipsis />
                      ) : (
                          <PaginationLink 
                            isActive={pageIndex === page}
                            onClick={() => table.setPageIndex(page as number)}
                          >
                              {(page as number) + 1}
                          </PaginationLink>
                      )}
                  </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => table.nextPage()} 
                  // @ts-ignore
                  disabled={!table.getCanNextPage()}
                  className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      )}
    </div>
  )
}
